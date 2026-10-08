"""Post-interview report generation."""

import logging
import os
import re
from datetime import datetime
from pathlib import Path

import httpx
from openai import AsyncOpenAI

from prompts import CV_SUMMARY_PROMPT, REPORT_PROMPT

logger = logging.getLogger("report")

REPORTS_DIR = Path(__file__).parent / "reports"

# One-page length backstop for the concise evaluation (FR-001, FR-007, SC-003).
# ~800 tokens ≈ 600 words — a safe ceiling just above the 300–500 word target, so the
# report cannot balloon back to the previous multi-page format while leaving headroom
# for the structured sections. The prompt drives the word target; this cap is the hard
# upper bound (down from the previous 3000).
MAX_REPORT_TOKENS = 800

# Low, explicit temperature for a scoring/evaluation task: keeps verdicts reproducible
# and comparable across candidates rather than relying on the API default (Principle III).
REPORT_TEMPERATURE = 0.3

# The prompt emits these literal tokens in the Summary; the overall score and the pass/fail
# result are computed deterministically here (LLMs are unreliable at arithmetic and at applying
# an exact threshold) and substituted in. Keeping the math in code makes the verdict reproducible
# and unit-testable (Principle III, IV).
OVERALL_SCORE_PLACEHOLDER = "[[OVERALL_SCORE]]"
RESULT_PLACEHOLDER = "[[RESULT]]"

# Pass mark: strictly above 5.00 succeeds, strictly below does not, exactly 5.00 is borderline.
PASS_THRESHOLD = 5.0

# Canned body for the QUICK_INTERVIEW smoke-test mode. The agent only greets the candidate,
# then this fixed report is written to disk and uploaded — exercising the disk-write + upload
# pipeline end to end without running a real interview or calling the LLM.
QUICK_INTERVIEW_REPORT = "Test Passed"

# Matches a dimension score line such as "- **Communication:** 7/10 — clear and concise".
# Tolerates optional bold markers around the number (`**7/10**`, `**7**/10`); lines marked
# "N/A" simply don't match and are therefore excluded from the average (per the prompt's N/A rule).
_SCORE_LINE_RE = re.compile(
    r"\*\*(?:Communication|Technical Foundations|Problem Solving|Cultural Fit|Non-Verbal)"
    r":\*\*\s*\*{0,2}\s*(\d+(?:\.\d+)?)\s*\*{0,2}\s*/\s*\*{0,2}\s*10",
)

# When set, the generated report is also POSTed to the PathGuide .NET API so
# it gets persisted into internship_applications.mock_interview_report.
# Both env vars must be set for the upload to be attempted.
#
# IMPORTANT: these are read at CALL time (see _pathguide_config), not at import time.
# Reading them at import time was a latent bug — report.py is imported before
# load_dotenv() runs in agent.py, so the values were captured as empty strings and the
# upload was silently skipped regardless of what .env contained.
DEFAULT_REPORT_UPLOAD_TIMEOUT_SECONDS = 20.0


def _pathguide_config() -> tuple[str, str, float]:
    """Read PathGuide upload settings from the environment at call time.

    Returns ``(api_url, api_key, timeout_seconds)``. Resolving these lazily means the
    upload works regardless of whether ``.env`` was loaded before this module was imported.
    """
    api_url = os.getenv("PATHGUIDE_API_URL", "").rstrip("/")
    api_key = os.getenv("PATHGUIDE_AGENT_API_KEY", "")
    try:
        timeout = float(os.getenv("PATHGUIDE_REPORT_TIMEOUT", "20"))
    except ValueError:
        logger.warning(
            "PATHGUIDE_REPORT_TIMEOUT is not a number; falling back to %.1fs.",
            DEFAULT_REPORT_UPLOAD_TIMEOUT_SECONDS,
        )
        timeout = DEFAULT_REPORT_UPLOAD_TIMEOUT_SECONDS
    return api_url, api_key, timeout


# CV summary budget: short enough to inject into every stage prompt cheaply, long enough for a
# few bullet points of education/skills/projects/experience. Low temperature keeps it extractive.
MAX_CV_SUMMARY_TOKENS = 400
CV_SUMMARY_TEMPERATURE = 0.2


async def summarize_cv(openai_client: AsyncOpenAI, cv_text: str) -> str:
    """Compress a raw CV into a short, factual brief for the interviewer.

    Returns "" for empty input or on any failure — the interview then proceeds generically,
    exactly as it did before CVs were available. The CV text and the summary are never logged
    in full (only lengths), per candidate-data protection (Principle V).
    """
    if not cv_text or not cv_text.strip():
        return ""

    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4.1",
            messages=[{"role": "user", "content": CV_SUMMARY_PROMPT.format(cv_text=cv_text)}],
            max_tokens=MAX_CV_SUMMARY_TOKENS,
            temperature=CV_SUMMARY_TEMPERATURE,
        )
        summary = (response.choices[0].message.content or "").strip()
        logger.info("CV summary generated (%d chars from a %d-char CV).", len(summary), len(cv_text))
        return summary
    except Exception as exc:  # noqa: BLE001 - never let CV handling break the interview
        logger.error("CV summarization failed (%s: %s); proceeding without CV context.", type(exc).__name__, exc)
        return ""


async def generate_report(
    openai_client: AsyncOpenAI,
    candidate_name: str,
    position: str,
    company_name: str,
    transcript: list[dict],
    video_observations: list[str],
    application_id: int | None = None,
    cv_summary: str = "",
) -> str:
    """Generate a concise, one-page interview evaluation report.

    The report is always written to disk under ``reports/``. When
    ``application_id`` is provided AND ``PATHGUIDE_API_URL`` /
    ``PATHGUIDE_AGENT_API_KEY`` are configured, the report is also POSTed to
    the .NET API for persistence. Upload failures are logged but never raise —
    the on-disk copy is the source of truth.
    """

    transcript_text = "\n".join(
        f"**{entry['role'].title()}**: {entry['content']}" for entry in transcript
    )

    if video_observations:
        observations_text = "\n".join(
            f"- Observation {i + 1}: {obs}"
            for i, obs in enumerate(video_observations)
        )
    else:
        observations_text = "No video observations were captured."

    prompt = REPORT_PROMPT.format(
        candidate_name=candidate_name,
        position=position,
        company_name=company_name,
        cv_summary=cv_summary or "No candidate background was available.",
        transcript=transcript_text,
        video_observations=observations_text,
    )

    response = await openai_client.chat.completions.create(
        model="gpt-4.1",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=MAX_REPORT_TOKENS,
        # Low temperature keeps the evaluation reproducible and comparable across
        # candidates (Principle III; SC-001). Kept explicit, not left to the default.
        temperature=REPORT_TEMPERATURE,
    )

    choice = response.choices[0]
    report_content = choice.message.content or "Report generation failed."

    # Compute the overall score (average of the dimension subscores) and the pass/fail result
    # deterministically, then fill the prompt's placeholders. No-op when the content has no
    # scores/placeholders (e.g. the failure fallback above), so it is always safe to call.
    report_content = _finalize_overall_score(report_content)

    # If the model hit the token cap, the report is returned truncated-but-non-empty
    # (so the fallback above does NOT fire). Surface that explicitly rather than
    # silently shipping a report that may be missing trailing sections (FR-002).
    if choice.finish_reason == "length":
        logger.warning(
            "Report truncated at the %d-token cap (finish_reason=length); "
            "trailing sections may be incomplete.",
            MAX_REPORT_TOKENS,
        )

    # Observability for the conciseness budget (SC-003). Log the word count only —
    # never the report content itself, per Constitution Principle V.
    if choice.message.content:
        logger.info("Generated report word count: %d", len(report_content.split()))
    else:
        logger.error("Report generation returned empty content.")

    _write_report_to_disk(candidate_name, report_content)
    await _persist_report(application_id, report_content)

    return report_content


async def generate_quick_report(
    candidate_name: str,
    application_id: int | None = None,
    report_content: str = QUICK_INTERVIEW_REPORT,
) -> str:
    """Produce the canned QUICK_INTERVIEW smoke-test report (no LLM call).

    Used when QUICK_INTERVIEW is enabled: the agent just greets the candidate and this
    writes a fixed one-line report (default ``"Test Passed"``) to disk and, when
    ``application_id`` is provided and the PathGuide vars are configured, uploads it to the
    API. This exercises the disk-write + upload path end to end without a real interview.
    Mirrors ``generate_report``'s persistence behavior (on-disk copy is the source of truth;
    upload failures are logged but never raise).
    """
    logger.info("QUICK_INTERVIEW: emitting canned smoke-test report (%r).", report_content)
    _write_report_to_disk(candidate_name, report_content)
    await _persist_report(application_id, report_content)
    return report_content


async def _persist_report(application_id: int | None, report_content: str) -> None:
    """Upload the report to the PathGuide API, or log why it is being skipped."""
    if application_id is not None:
        logger.info(
            "Report upload requested for application_id=%s; attempting PathGuide API call.",
            application_id,
        )
        await _upload_report(application_id, report_content)
    else:
        logger.warning(
            "Skipping report upload: no application_id was provided "
            "(LiveKit room metadata had no integer 'applicationId'). The report is saved "
            "to disk but will NOT be persisted to the database."
        )


def _finalize_overall_score(report_content: str) -> str:
    """Fill the Overall Score / Result placeholders from the dimension subscores.

    The overall score is the average of the present dimension scores (N/A dimensions are
    excluded), formatted to two decimals as ``X.XX/10.00``. The result is derived from a
    fixed threshold applied to that rounded average: above 5.00 → "Succeeded", below →
    "Not Succeeded", exactly 5.00 → "Consider". Scores outside the 0–10 range are treated as
    malformed and dropped. Returns the content unchanged when no scores can be parsed.
    """
    scores = []
    for match in _SCORE_LINE_RE.findall(report_content):
        value = float(match)
        if 0.0 <= value <= 10.0:
            scores.append(value)
        else:
            logger.warning("Ignoring out-of-range dimension score %.2f (expected 0–10).", value)

    if not scores:
        if OVERALL_SCORE_PLACEHOLDER in report_content or RESULT_PLACEHOLDER in report_content:
            logger.warning(
                "Could not parse any dimension scores; leaving overall-score placeholders as-is."
            )
        return report_content

    overall = round(sum(scores) / len(scores), 2)
    if overall > PASS_THRESHOLD:
        result = "Succeeded"
    elif overall < PASS_THRESHOLD:
        result = "Not Succeeded"
    else:
        result = "Consider"

    logger.info("Overall score: %.2f/10.00 — %s", overall, result)

    return (
        report_content
        .replace(OVERALL_SCORE_PLACEHOLDER, f"{overall:.2f}/10.00")
        .replace(RESULT_PLACEHOLDER, result)
    )


def _write_report_to_disk(candidate_name: str, report_content: str) -> Path:
    """Persist the report markdown under reports/, with a path-traversal guard."""
    REPORTS_DIR.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_name = re.sub(r"[^a-zA-Z0-9_-]", "", candidate_name.replace(" ", "_")).lower()
    if not safe_name:
        safe_name = "unknown"
    report_path = (REPORTS_DIR / f"report_{safe_name}_{timestamp}.md").resolve()
    if not str(report_path).startswith(str(REPORTS_DIR.resolve())):
        raise ValueError("Invalid candidate name: path traversal detected")
    report_path.write_text(report_content, encoding="utf-8")
    logger.info("Report saved to %s", report_path)
    return report_path


def _mask_secret(secret: str) -> str:
    """Render an API key for logs without leaking it (Principle V).

    Shows the length, plus the last 4 characters only for reasonably long keys (>= 12 chars)
    so the masking can't expose most of a short key.
    """
    if not secret:
        return "<empty>"
    if len(secret) < 12:
        return f"<set, {len(secret)} chars>"
    return f"<set, {len(secret)} chars, ...{secret[-4:]}>"


async def _upload_report(application_id: int, report_content: str) -> None:
    """POST the report to the PathGuide .NET API. Errors are swallowed."""
    api_url, api_key, timeout = _pathguide_config()

    # Config state at DEBUG (the comprehensive request line below logs the same fields at INFO
    # when the call actually fires; this covers the skip path and verbose troubleshooting).
    logger.debug(
        "PathGuide upload config: PATHGUIDE_API_URL=%r, PATHGUIDE_AGENT_API_KEY=%s, timeout=%.1fs",
        api_url or "<empty>",
        _mask_secret(api_key),
        timeout,
    )

    if not api_url or not api_key:
        logger.warning(
            "Skipping report upload: %s not set. The report is saved to disk but NOT persisted "
            "to the database.",
            " and ".join(
                name for name, value in (
                    ("PATHGUIDE_API_URL", api_url),
                    ("PATHGUIDE_AGENT_API_KEY", api_key),
                ) if not value
            ),
        )
        return

    url = f"{api_url}/api/mockinterview/report"
    payload = {"applicationId": application_id, "report": report_content}
    headers = {"X-Agent-Api-Key": api_key}

    # Log the full request options (method, URL, headers, body shape, timeout) so the call is
    # reproducible from the logs. The API key is masked and the report body is summarized by
    # length only — never logged in full (Principle V: candidate-data protection).
    logger.info(
        "PathGuide API call -> POST %s | timeout=%.1fs | headers={'X-Agent-Api-Key': %s} | "
        "json={'applicationId': %s, 'report': <%d chars>}",
        url,
        timeout,
        _mask_secret(api_key),
        application_id,
        len(report_content),
    )

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(url, json=payload, headers=headers)
            logger.info(
                "PathGuide API response: %s %s (%d bytes) for application %s.",
                response.status_code,
                response.reason_phrase,
                len(response.content),
                application_id,
            )
            response.raise_for_status()
        logger.info(
            "Report uploaded and persisted for application %s (%d chars sent).",
            application_id,
            len(report_content),
        )
    except httpx.HTTPStatusError as exc:
        logger.error(
            "Report upload rejected by API for application %s: %s %s | response body: %s",
            application_id,
            exc.response.status_code,
            exc.response.reason_phrase,
            exc.response.text[:300],
        )
    except httpx.HTTPError as exc:
        logger.error(
            "Report upload failed for application %s (POST %s): %s: %s",
            application_id,
            url,
            type(exc).__name__,
            exc,
        )
