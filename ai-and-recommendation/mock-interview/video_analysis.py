"""Video frame capture and analysis using OpenAI Vision."""

import asyncio
import base64
import io
import logging

from openai import AsyncOpenAI

from prompts import VIDEO_ANALYSIS_PROMPT

logger = logging.getLogger("video-analysis")


async def analyze_frame(frame_data: bytes, openai_client: AsyncOpenAI) -> str:
    """Send a video frame to GPT-4.1 Vision for body language analysis."""
    base64_image = base64.b64encode(frame_data).decode("utf-8")

    response = await openai_client.chat.completions.create(
        model="gpt-4.1",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": VIDEO_ANALYSIS_PROMPT},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}",
                            "detail": "low",
                        },
                    },
                ],
            }
        ],
        max_tokens=150,
    )
    return response.choices[0].message.content or ""


class VideoAnalyzer:
    """Periodically captures and analyzes video frames from a LiveKit video track."""

    MAX_OBSERVATIONS = 50  # Cap to avoid exceeding LLM context window

    def __init__(self, openai_client: AsyncOpenAI, interval_seconds: int = 30):
        self.openai_client = openai_client
        self.interval_seconds = interval_seconds
        self.observations: list[str] = []
        self._task: asyncio.Task | None = None
        self._latest_frame: bytes | None = None
        self._running = False

    def update_frame(self, frame_data: bytes):
        """Update the latest frame (called from video stream reader)."""
        self._latest_frame = frame_data

    def start(self):
        """Start periodic video analysis."""
        self._running = True
        self._task = asyncio.create_task(self._analysis_loop())

    def stop(self):
        """Stop periodic video analysis."""
        self._running = False
        if self._task:
            self._task.cancel()

    async def _analysis_loop(self):
        """Periodically analyze the latest video frame."""
        while self._running:
            await asyncio.sleep(self.interval_seconds)
            if self._latest_frame:
                try:
                    if len(self.observations) < self.MAX_OBSERVATIONS:
                        observation = await analyze_frame(
                            self._latest_frame, self.openai_client
                        )
                        self.observations.append(observation)
                        logger.info(f"Video observation: {observation}")
                    else:
                        logger.debug("Max observations reached, skipping analysis")
                except Exception as e:
                    logger.error(f"Video analysis failed: {e}")
