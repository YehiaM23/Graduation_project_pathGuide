"""Main entry point: LiveKit agent server for the mock interview."""
import os, certifi

import asyncio
import io
import json
import logging

import httpx
from PIL import Image
from dotenv import load_dotenv
from livekit import agents, rtc
from livekit.agents import Agent, AgentSession, JobContext, cli, WorkerOptions, llm
from livekit.plugins import openai, silero
from openai import AsyncOpenAI

# Load .env BEFORE importing local modules so any module-level os.getenv(...) in them sees
# the configured values. (report.py now reads PathGuide settings lazily, but keeping this
# ordering avoids reintroducing the class of bug where env is read before .env is loaded.)
load_dotenv()

# Local imports come after load_dotenv() on purpose (see comment above); silence E402 for the
# block so a future flake8/ruff config won't flag this deliberate ordering.
from interview_graph import (  # noqa: E402
    InterviewState,
    advance_interview,
    create_initial_state,
    get_instructions,
)
from rag import CompanyRAG  # noqa: E402
from report import generate_quick_report, generate_report, summarize_cv  # noqa: E402
from video_analysis import VideoAnalyzer  # noqa: E402

os.environ.setdefault("SSL_CERT_FILE", certifi.where())
os.environ.setdefault("SSL_CERT_DIR", "")

logger = logging.getLogger("mock-interview")

# Lazy-initialized RAG
company_rag: CompanyRAG | None = None


def get_rag() -> CompanyRAG:
    """Lazily initialize the RAG module."""
    global company_rag
    if company_rag is None:
        company_rag = CompanyRAG()
    return company_rag


def quick_interview_enabled() -> bool:
    """Whether the QUICK_INTERVIEW smoke-test mode is turned on via the environment.

    When enabled, the agent skips the real interview: it greets the candidate and then emits
    a canned "Test Passed" report (saved to disk and uploaded to the API). Truthy values are
    1/true/yes/on (case-insensitive); anything else — including unset — means disabled.
    """
    return os.getenv("QUICK_INTERVIEW", "").strip().lower() in ("1", "true", "yes", "on")


class InterviewerAgent(Agent):
    """AI Interviewer agent that conducts mock interviews."""

    def __init__(
        self,
        state: InterviewState,
        rag: CompanyRAG,
        application_id: int | None = None,
        quick_interview: bool = False,
    ):
        self._state = state
        self._rag = rag
        self._application_id = application_id
        self._quick_interview = quick_interview
        instructions = get_instructions(state)
        super().__init__(instructions=instructions)
        self._openai_client = AsyncOpenAI()
        self._video_analyzer = VideoAnalyzer(self._openai_client, interval_seconds=30)
        self._video_stream: rtc.VideoStream | None = None
        self._video_task: asyncio.Task | None = None

    async def on_enter(self):
        """Called when the agent joins the room. Set up video stream."""
        # In smoke-test mode the agent only greets and emits a canned report, so skip the
        # video pipeline (and its per-frame Vision calls) entirely.
        if self._quick_interview:
            logger.info("QUICK_INTERVIEW enabled — skipping video stream setup.")
            return

        ctx = agents.get_job_context()
        room = ctx.room

        # Subscribe to video tracks from participants
        @room.on("track_subscribed")
        def on_track_subscribed(
            track: rtc.Track,
            publication: rtc.RemoteTrackPublication,
            participant: rtc.RemoteParticipant,
        ):
            if track.kind == rtc.TrackKind.KIND_VIDEO:
                self._start_video_stream(track)

        # Check for existing video tracks
        for participant in room.remote_participants.values():
            for publication in participant.track_publications.values():
                if (
                    publication.track
                    and publication.track.kind == rtc.TrackKind.KIND_VIDEO
                ):
                    self._start_video_stream(publication.track)

        self._video_analyzer.start()

    def _start_video_stream(self, track: rtc.Track):
        """Start reading a video stream, cancelling any existing one."""
        if self._video_task and not self._video_task.done():
            self._video_task.cancel()
        if self._video_stream:
            asyncio.create_task(self._video_stream.aclose())
        self._video_task = asyncio.create_task(self._read_video_stream(track))

    async def _read_video_stream(self, track: rtc.Track):
        """Read video frames from a track and feed them to the analyzer."""
        self._video_stream = rtc.VideoStream(track)
        async for event in self._video_stream:
            # Convert frame to JPEG bytes for analysis
            frame = event.frame
            try:
                # Convert frame to actual JPEG bytes for Vision API
                argb_frame = frame.convert(rtc.VideoBufferType.RGBA)
                raw_bytes = argb_frame.data.tobytes()
                img = Image.frombytes(
                    "RGBA", (argb_frame.width, argb_frame.height), raw_bytes
                )
                buf = io.BytesIO()
                img.convert("RGB").save(buf, format="JPEG", quality=75)
                self._video_analyzer.update_frame(buf.getvalue())
            except Exception as e:
                logger.debug(f"Frame processing error: {e}")

    async def on_user_turn_completed(self, turn_ctx, new_message):
        """Called after the user finishes speaking. Advance the interview."""
        for item in reversed(turn_ctx.items):
            if isinstance(item, llm.ChatMessage) and item.role == "assistant":
                agent_text = item.text_content
                if agent_text:
                    self._state["transcript"].append(
                        {
                            "role": "interviewer",
                            "content": agent_text,
                            "stage": self._state["current_stage"],
                        }
                    )
                break

        user_text = new_message.text_content
        if user_text:
            self._state["transcript"].append(
                {
                    "role": "candidate",
                    "content": user_text,
                    "stage": self._state["current_stage"],
                }
            )

        # Increment turn count and check for stage advancement
        self._state["turn_count"] += 1
        old_stage = self._state["current_stage"]
        self._state = advance_interview(self._state)
        new_stage = self._state["current_stage"]

        # If stage changed, update instructions
        if new_stage != old_stage:
            logger.info(f"Interview advancing: {old_stage} -> {new_stage}")

            if new_stage == "report":
                # Interview is over - generate the report
                self._video_analyzer.stop()
                self._state["video_observations"] = (
                    self._video_analyzer.observations
                )
                await self._generate_final_report()
                return

            # Update instructions for the new stage
            # If candidate asks questions, retrieve specific context
            if new_stage == "candidate_questions":
                extra_context = self._rag.get_company_overview()
                self._state["company_context"] = extra_context

            new_instructions = get_instructions(self._state)
            self.update_instructions(new_instructions)

    async def _generate_final_report(self):
        """Generate and save the final interview report."""
        logger.info("Generating final interview report...")
        await generate_report(
            openai_client=self._openai_client,
            candidate_name=self._state["candidate_name"],
            position=self._state["position"],
            company_name=self._state["company_name"],
            transcript=self._state["transcript"],
            video_observations=self._state["video_observations"],
            application_id=self._application_id,
            cv_summary=self._state.get("cv_summary", ""),
        )
        logger.info("Interview report generated successfully.")


async def entrypoint(ctx: JobContext):
    """LiveKit agent entry point."""
    await ctx.connect()

    # Wait for the candidate to join so room metadata + participant identity
    # are populated before we use them.
    participant = await ctx.wait_for_participant()
    candidate_name = (
        (participant.name or "").strip()
        or (participant.identity or "").strip()
        or "Candidate"
    )

    # The .NET token endpoint embeds {"applicationId": <int>} in room metadata
    # so we can save the generated report against the right application row.
    # Anything we can't parse, we ignore — the interview itself still works.
    # Log structure (presence + top-level keys), not values, at INFO — the metadata channel
    # should only carry applicationId, but avoid dumping values in case it ever carries more
    # (Principle V). The full raw payload is available at DEBUG for active troubleshooting.
    _raw_metadata = ctx.room.metadata
    logger.info(
        "LiveKit room metadata present: %s (%d chars)",
        bool(_raw_metadata),
        len(_raw_metadata or ""),
    )
    logger.debug("Raw LiveKit room metadata: %r", _raw_metadata)
    application_id = _extract_application_id(_raw_metadata)
    if application_id is None:
        logger.warning(
            "No application_id extracted from room metadata — the report will be saved to disk "
            "but NOT uploaded to the PathGuide API / database. Enable DEBUG logging to see the "
            "raw metadata payload."
        )
    else:
        logger.info("Extracted application_id=%s from room metadata.", application_id)

    # Pull the real internship, company, and candidate background from the PathGuide API using
    # the application_id (server-to-server, authenticated by the agent api key). Falls back to
    # the generic defaults below when there is no application_id, the call fails, or fields are
    # empty.
    context = await _fetch_interview_context(application_id)
    position = (context.get("position") or "").strip() or "Software Engineering Intern"
    company_name = (context.get("companyName") or "").strip() or "TechVision Inc."

    # Accumulate the candidate background passed to the interview LLM: primarily the structured
    # PathGuide profile (skills, interests, education, etc. — always available from the DB), plus
    # a summary of the uploaded CV file when one exists. Empty string => generic interview.
    cv_summary = await _build_candidate_brief(
        context.get("profileSummary") or "",
        context.get("cvText") or "",
    )

    rag = get_rag()
    company_context = rag.get_company_overview()

    state = create_initial_state(
        candidate_name=candidate_name,
        position=position,
        company_name=company_name,
        company_context=company_context,
        cv_summary=cv_summary,
    )

    quick_interview = quick_interview_enabled()
    interviewer = InterviewerAgent(
        state=state,
        rag=rag,
        application_id=application_id,
        quick_interview=quick_interview,
    )

    session = AgentSession(
        stt=openai.STT(model="whisper-1"),
        llm=openai.LLM(model="gpt-4.1"),
        tts=openai.TTS(voice="alloy"),
        vad=silero.VAD.load(),
    )

    await session.start(room=ctx.room, agent=interviewer)

    if quick_interview:
        # Smoke-test path: greet, emit the canned report, and stop — no interview is run.
        logger.info(
            "QUICK_INTERVIEW enabled — greeting candidate then emitting a canned report."
        )
        await session.generate_reply(
            instructions="Say a brief hello as Alex, the AI interviewer. One sentence only."
        )
        await generate_quick_report(
            candidate_name=candidate_name,
            application_id=application_id,
        )
        return

    await session.generate_reply(
        instructions="Greet the candidate and introduce yourself as Alex, the AI interviewer."
    )


async def _fetch_interview_context(application_id: int | None) -> dict:
    """Fetch candidate/internship context from the PathGuide .NET API.

    Returns a dict with ``candidateName``, ``position``, ``companyName``, and ``cvText`` keys
    (as produced by ``GET /api/mockinterview/context``). Returns ``{}`` when there is no
    application_id, the PathGuide env vars are not set, or the call fails — the caller then
    falls back to the generic defaults. Reuses the same ``PATHGUIDE_API_URL`` /
    ``PATHGUIDE_AGENT_API_KEY`` settings as the report upload. The CV text is never logged in
    full (only its length), per candidate-data protection.
    """
    if application_id is None:
        return {}

    api_url = os.getenv("PATHGUIDE_API_URL", "").rstrip("/")
    api_key = os.getenv("PATHGUIDE_AGENT_API_KEY", "")
    if not api_url or not api_key:
        logger.warning(
            "Skipping interview-context fetch: PATHGUIDE_API_URL/PATHGUIDE_AGENT_API_KEY not set. "
            "The interview will use the generic position/company and no CV."
        )
        return {}

    url = f"{api_url}/api/mockinterview/context"
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(
                url,
                params={"applicationId": application_id},
                headers={"X-Agent-Api-Key": api_key},
            )
            response.raise_for_status()
            data = response.json()
        logger.info(
            "Fetched interview context for application %s: position=%r company=%r cv_chars=%d.",
            application_id,
            data.get("position"),
            data.get("companyName"),
            len(data.get("cvText") or ""),
        )
        return data if isinstance(data, dict) else {}
    except httpx.HTTPError as exc:
        logger.error(
            "Failed to fetch interview context for application %s (GET %s): %s: %s. "
            "Falling back to the generic interview.",
            application_id,
            url,
            type(exc).__name__,
            exc,
        )
        return {}


async def _build_candidate_brief(profile_summary: str, cv_text: str) -> str:
    """Accumulate the candidate background that is passed to the interview LLM.

    The structured PathGuide profile is the primary source and is used as-is (it is already
    short and labelled). When an uploaded CV file is also present, its text is summarized and
    appended. Returns "" when neither is available, so the interview proceeds generically.
    Neither the profile nor the CV is logged in full here (summarize_cv logs lengths only).
    """
    parts: list[str] = []

    profile_summary = (profile_summary or "").strip()
    if profile_summary:
        parts.append("From their PathGuide profile:\n" + profile_summary)

    if cv_text and cv_text.strip():
        cv_brief = await summarize_cv(AsyncOpenAI(), cv_text)
        if cv_brief:
            parts.append("From their uploaded CV:\n" + cv_brief)

    return "\n\n".join(parts)


def _extract_application_id(raw_metadata: str | None) -> int | None:
    """Pull `applicationId` out of the LiveKit room metadata if present."""
    if not raw_metadata:
        return None
    try:
        parsed = json.loads(raw_metadata)
    except (json.JSONDecodeError, ValueError):
        logger.warning("Room metadata is not valid JSON: %r", raw_metadata)
        return None
    if not isinstance(parsed, dict):
        return None
    value = parsed.get("applicationId")
    if isinstance(value, bool):
        # bool is a subclass of int in Python — exclude it explicitly.
        return None
    if isinstance(value, int):
        return value
    return None


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, agent_name="interviewer"))
