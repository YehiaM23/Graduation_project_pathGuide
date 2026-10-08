from typing import Set, Tuple, List
from models import StudentProfile, CareerPathInfo


class ContentBasedEngine:
    def __init__(self, data_loader):
        self.data = data_loader

    def interest_score(self, student: StudentProfile, career_path: CareerPathInfo) -> float:
        student_interests = student.interest_ids
        career_interests = career_path.interest_ids

        if not student_interests and not career_interests:
            return 0.0

        intersection = student_interests & career_interests
        union = student_interests | career_interests

        if len(union) == 0:
            return 0.0

        return len(intersection) / len(union)

    def skill_score(self, student: StudentProfile, career_path: CareerPathInfo) -> Tuple[float, int, int, Set[int]]:
        required = career_path.required_skill_ids
        student_skills = student.skill_ids

        if not required:
            return (0.0, 0, 0, set())

        matched = student_skills & required
        missing = required - student_skills
        score = len(matched) / len(required)

        return (score, len(matched), len(required), missing)

    def combined_score(self, student: StudentProfile, career_path: CareerPathInfo) -> Tuple[float, float, float, int, int, Set[int]]:
        i_score = self.interest_score(student, career_path)
        s_score, matched, total, missing = self.skill_score(student, career_path)

        num_skills = len(student.skill_ids)
        if num_skills <= 2:
            alpha = 0.7
        elif num_skills <= 5:
            alpha = 0.5
        else:
            alpha = 0.3

        combined = alpha * i_score + (1 - alpha) * s_score
        return (combined, i_score, s_score, matched, total, missing)
