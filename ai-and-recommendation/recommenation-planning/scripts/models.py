from dataclasses import dataclass, field
from typing import Set, List, Optional, Dict


@dataclass
class StudentProfile:
    student_profile_id: int
    user_id: int
    interest_ids: Set[int] = field(default_factory=set)
    skill_ids: Set[int] = field(default_factory=set)
    career_path_id: Optional[int] = None


@dataclass
class CareerPathInfo:
    career_path_id: int
    career_path: str
    interest_ids: Set[int] = field(default_factory=set)
    required_skill_ids: Set[int] = field(default_factory=set)


@dataclass
class LearningStep:
    skill_id: int
    skill_name: str
    hours: float
    cumulative_hours: float
    prerequisites: List[str]


@dataclass
class Recommendation:
    career_path_id: int
    career_path_name: str
    interest_score: float
    skill_score: float
    collaborative_score: float
    final_score: float
    skills_matched: int
    skills_required: int
    missing_skills: List[str]
    learning_path: List[LearningStep] = field(default_factory=list)
