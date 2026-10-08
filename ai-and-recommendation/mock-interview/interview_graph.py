"""LangGraph state machine for managing interview stages."""

from typing import TypedDict
from langgraph.graph import StateGraph, END

from prompts import (
    GREETING_PROMPT,
    COMPANY_INTRO_PROMPT,
    EXPERIENCE_PROMPT,
    TECHNICAL_PROMPT,
    BEHAVIORAL_PROMPT,
    CANDIDATE_QUESTIONS_PROMPT,
    CLOSING_PROMPT,
)

# Interview stages in order
STAGES = [
    "greeting",
    "company_intro",
    "experience",
    "technical",
    "behavioral",
    "candidate_questions",
    "closing",
    "report",
]

# How many interviewer turns per stage before auto-advancing
MAX_TURNS_PER_STAGE = {
    "greeting": 2,
    "company_intro": 1,
    "experience": 3,
    "technical": 3,
    "behavioral": 3,
    "candidate_questions": 3,
    "closing": 1,
}

# Map stage -> prompt template
STAGE_PROMPTS = {
    "greeting": GREETING_PROMPT,
    "company_intro": COMPANY_INTRO_PROMPT,
    "experience": EXPERIENCE_PROMPT,
    "technical": TECHNICAL_PROMPT,
    "behavioral": BEHAVIORAL_PROMPT,
    "candidate_questions": CANDIDATE_QUESTIONS_PROMPT,
    "closing": CLOSING_PROMPT,
}


class InterviewState(TypedDict):
    current_stage: str
    turn_count: int  # turns in the current stage
    transcript: list[dict]  # [{"role": "interviewer"|"candidate", "content": "..."}]
    video_observations: list[str]
    candidate_name: str
    position: str
    company_name: str
    company_context: str
    cv_summary: str  # short factual brief from the candidate's CV; "" when none on file
    should_advance: bool


def get_instructions(state: InterviewState) -> str:
    """Get the system prompt for the current interview stage."""
    stage = state["current_stage"]
    template = STAGE_PROMPTS.get(stage, CLOSING_PROMPT)

    # Build a summary of questions asked in this stage
    stage_transcript = []
    in_current_stage = False
    for entry in state["transcript"]:
        if entry.get("stage") == stage:
            in_current_stage = True
            stage_transcript.append(f"{entry['role']}: {entry['content']}")

    questions_asked = "\n".join(stage_transcript) if stage_transcript else "None yet"

    cv_summary = state.get("cv_summary") or "No candidate background was available."

    return template.format(
        company_name=state["company_name"],
        position=state["position"],
        company_context=state["company_context"],
        cv_summary=cv_summary,
        questions_asked=questions_asked,
    )


def check_advance(state: InterviewState) -> InterviewState:
    """Check if the interview should advance to the next stage."""
    stage = state["current_stage"]
    max_turns = MAX_TURNS_PER_STAGE.get(stage, 2)

    should_advance = state["turn_count"] >= max_turns
    return {**state, "should_advance": should_advance}


def advance_stage(state: InterviewState) -> InterviewState:
    """Move to the next interview stage."""
    current_idx = STAGES.index(state["current_stage"])
    next_stage = STAGES[min(current_idx + 1, len(STAGES) - 1)]
    return {
        **state,
        "current_stage": next_stage,
        "turn_count": 0,
        "should_advance": False,
    }


def stay_in_stage(state: InterviewState) -> InterviewState:
    """Remain in the current stage."""
    return {**state, "should_advance": False}


def route_after_check(state: InterviewState) -> str:
    """Route based on whether we should advance."""
    if state["should_advance"]:
        return "advance"
    return "stay"


# Build the graph
def build_interview_graph() -> StateGraph:
    """Build and compile the interview state machine."""
    graph = StateGraph(InterviewState)

    graph.add_node("check_advance", check_advance)
    graph.add_node("advance_stage", advance_stage)
    graph.add_node("stay_in_stage", stay_in_stage)

    graph.set_entry_point("check_advance")

    graph.add_conditional_edges(
        "check_advance",
        route_after_check,
        {"advance": "advance_stage", "stay": "stay_in_stage"},
    )

    graph.add_edge("advance_stage", END)
    graph.add_edge("stay_in_stage", END)

    return graph.compile()


# Singleton compiled graph
interview_graph = build_interview_graph()


def create_initial_state(
    candidate_name: str,
    position: str,
    company_name: str,
    company_context: str,
    cv_summary: str = "",
) -> InterviewState:
    """Create the initial interview state."""
    return InterviewState(
        current_stage="greeting",
        turn_count=0,
        transcript=[],
        video_observations=[],
        candidate_name=candidate_name,
        position=position,
        company_name=company_name,
        company_context=company_context,
        cv_summary=cv_summary,
        should_advance=False,
    )


def advance_interview(state: InterviewState) -> InterviewState:
    """Run the graph to potentially advance the interview stage.

    Call this after each conversational turn to check if the stage should change.
    Returns the updated state.
    """
    result = interview_graph.invoke(state)
    return result
