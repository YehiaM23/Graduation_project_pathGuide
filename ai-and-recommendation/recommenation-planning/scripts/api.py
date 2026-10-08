"""
FastAPI Career Path Planner Service
Wraps the DQN career planner as a REST API.

Run locally: uvicorn api:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager
from typing import Optional
import sys
import os

# Add parent directory for imports if needed
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from hybrid import CareerRecommender

# Import from rl-dqn.py (handle hyphen in filename)
import importlib.util
spec = importlib.util.spec_from_file_location("rl_dqn", os.path.join(os.path.dirname(__file__), "rl-dqn.py"))
rl_dqn = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rl_dqn)

# Extract classes and functions
load_data = rl_dqn.load_data
CareerEnvironment = rl_dqn.CareerEnvironment
DQNAgent = rl_dqn.DQNAgent
train = rl_dqn.train
find_path = rl_dqn.find_path


# ============================================================
# PYDANTIC MODELS
# ============================================================

class PlanRequest(BaseModel):
    target_role: str
    current_skills: list[str] = []

class LearningStep(BaseModel):
    step: int
    skill: str
    hours: float
    cumulative_hours: float
    prerequisites: list[str]
    course_title: str
    course_link: str

class PlanResponse(BaseModel):
    target_role: str
    skills_needed: list[str]
    steps: list[LearningStep]
    total_hours: float
    weeks_at_10h: float

class RoleInfo(BaseModel):
    role: str
    required_skills: list[str]

class HealthResponse(BaseModel):
    status: str
    roles_loaded: int
    skills_loaded: int


# --- Recommendation models ---

class RecommendRequest(BaseModel):
    student_profile_id: int
    top_n: int = 5

class CareerRecommendation(BaseModel):
    career_path_id: int
    career_path_name: str
    final_score: float
    interest_score: float
    skill_score: float
    collaborative_score: float
    skills_matched: int
    skills_required: int
    missing_skills: list[str]

class RecommendResponse(BaseModel):
    student_profile_id: int
    algorithm_used: str
    recommendations: list[CareerRecommendation]


# ============================================================
# GLOBAL STATE
# ============================================================

app_state = {
    "role_skills": None,
    "skill_prereqs": None,
    "skill_times": None,
    "skill_courses": None,
    "all_skills": None,
    "initialized": False,
    "recommender": None,
}


# ============================================================
# STARTUP/SHUTDOWN
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load data
    print("Loading career data...")
    (
        app_state["role_skills"],
        app_state["skill_prereqs"],
        app_state["skill_times"],
        app_state["skill_courses"],
        app_state["all_skills"]
    ) = load_data()
    app_state["initialized"] = True
    print(f"Loaded {len(app_state['role_skills'])} roles, {len(app_state['all_skills'])} skills")

    # Load recommendation engine
    print("Loading recommendation engine...")
    try:
        app_state["recommender"] = CareerRecommender()
        print(f"Recommender loaded: {len(app_state['recommender'].data.career_paths)} career paths")
    except Exception as e:
        import traceback
        print(f"ERROR: Recommender failed to load: {e}")
        traceback.print_exc()
        app_state["recommender"] = None

    yield
    # Shutdown
    if app_state["recommender"]:
        app_state["recommender"].close()
    print("Shutting down...")


app = FastAPI(
    title="Career Path Planner API",
    description="DQN-based career planning service that finds optimal skill learning paths",
    version="1.0.0",
    lifespan=lifespan
)


# ============================================================
# ENDPOINTS
# ============================================================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for service monitoring."""
    return HealthResponse(
        status="healthy" if app_state["initialized"] else "initializing",
        roles_loaded=len(app_state["role_skills"]) if app_state["role_skills"] else 0,
        skills_loaded=len(app_state["all_skills"]) if app_state["all_skills"] else 0
    )


@app.get("/roles", response_model=list[RoleInfo])
async def list_roles():
    """List all available career roles and their required skills."""
    if not app_state["initialized"]:
        raise HTTPException(status_code=503, detail="Service initializing")

    return [
        RoleInfo(role=role, required_skills=sorted(skills))
        for role, skills in app_state["role_skills"].items()
    ]


@app.get("/skills", response_model=list[str])
async def list_skills():
    """List all available skills."""
    if not app_state["initialized"]:
        raise HTTPException(status_code=503, detail="Service initializing")

    return app_state["all_skills"]


@app.post("/plan", response_model=PlanResponse)
async def create_plan(request: PlanRequest):
    """
    Generate an optimal learning path to reach a target role.

    Uses a trained DQN agent to find the best sequence of skills to learn,
    considering prerequisites and time requirements.
    """
    if not app_state["initialized"]:
        raise HTTPException(status_code=503, detail="Service initializing")

    # Validate target role
    if request.target_role not in app_state["role_skills"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown role: '{request.target_role}'. Use GET /roles to see available roles."
        )

    target_skills = app_state["role_skills"][request.target_role]
    current_skills = set(request.current_skills)

    # Check what's still needed
    needed = target_skills - current_skills
    if not needed:
        return PlanResponse(
            target_role=request.target_role,
            skills_needed=[],
            steps=[],
            total_hours=0,
            weeks_at_10h=0
        )

    # Create environment and train agent
    env = CareerEnvironment(
        app_state["skill_prereqs"],
        app_state["skill_times"],
        app_state["all_skills"],
        target_skills
    )

    agent = DQNAgent(
        state_size=len(app_state["all_skills"]),
        action_size=len(app_state["all_skills"])
    )

    # Train (silently)
    import io
    import contextlib
    with contextlib.redirect_stdout(io.StringIO()):
        train(env, agent, episodes=300)

    # Find optimal path
    path, total_time = find_path(env, agent, current_skills)

    if not path:
        raise HTTPException(
            status_code=500,
            detail="Could not find a learning path. This may be a data issue."
        )

    # Build response
    steps = []
    cumulative = 0
    for i, (skill, hours) in enumerate(path, 1):
        cumulative += hours
        prereqs = app_state["skill_prereqs"].get(skill, [])
        course_info = app_state["skill_courses"].get(skill, {"title": "no course", "link": "no link"})

        steps.append(LearningStep(
            step=i,
            skill=skill,
            hours=hours,
            cumulative_hours=cumulative,
            prerequisites=prereqs,
            course_title=course_info["title"],
            course_link=course_info["link"]
        ))

    return PlanResponse(
        target_role=request.target_role,
        skills_needed=sorted(needed),
        steps=steps,
        total_hours=total_time,
        weeks_at_10h=round(total_time / 10, 1)
    )


# ============================================================
# RECOMMENDATION ENDPOINTS
# ============================================================

@app.post("/recommend", response_model=RecommendResponse)
async def recommend_career_paths(request: RecommendRequest):
    """
    Recommend career paths for a student using hybrid filtering.

    Uses content-based filtering (interest + skill matching) for cold start,
    and blends in collaborative filtering as user base grows.
    """
    if not app_state["recommender"]:
        raise HTTPException(status_code=503, detail="Recommendation engine not available")

    try:
        recs = app_state["recommender"].recommend(request.student_profile_id, request.top_n)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    collab_active = app_state["recommender"].collab_engine.is_active()
    algorithm = "hybrid" if collab_active else "content_based"

    return RecommendResponse(
        student_profile_id=request.student_profile_id,
        algorithm_used=algorithm,
        recommendations=[
            CareerRecommendation(
                career_path_id=r.career_path_id,
                career_path_name=r.career_path_name,
                final_score=r.final_score,
                interest_score=r.interest_score,
                skill_score=r.skill_score,
                collaborative_score=r.collaborative_score,
                skills_matched=r.skills_matched,
                skills_required=r.skills_required,
                missing_skills=r.missing_skills,
            ) for r in recs
        ]
    )


@app.post("/recommend/save", response_model=RecommendResponse)
async def recommend_and_save(request: RecommendRequest):
    """
    Recommend career paths and save results to the database.
    """
    if not app_state["recommender"]:
        raise HTTPException(status_code=503, detail="Recommendation engine not available")

    try:
        recs = app_state["recommender"].recommend_and_save(request.student_profile_id, request.top_n)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    collab_active = app_state["recommender"].collab_engine.is_active()
    algorithm = "hybrid" if collab_active else "content_based"

    return RecommendResponse(
        student_profile_id=request.student_profile_id,
        algorithm_used=algorithm,
        recommendations=[
            CareerRecommendation(
                career_path_id=r.career_path_id,
                career_path_name=r.career_path_name,
                final_score=r.final_score,
                interest_score=r.interest_score,
                skill_score=r.skill_score,
                collaborative_score=r.collaborative_score,
                skills_matched=r.skills_matched,
                skills_required=r.skills_required,
                missing_skills=r.missing_skills,
            ) for r in recs
        ]
    )


@app.get("/")
async def root():
    """API root - redirect to docs."""
    return {
        "message": "Career Path Planner API",
        "docs": "/docs",
        "health": "/health"
    }


# ============================================================
# MAIN (for direct execution)
# ============================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
