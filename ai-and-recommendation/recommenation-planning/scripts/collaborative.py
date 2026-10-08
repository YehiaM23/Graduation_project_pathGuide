import numpy as np
from typing import Dict, List, Optional
from models import StudentProfile


INTERACTION_WEIGHTS = {
    'view': 0.5,
    'save': 2.0,
    'select': 5.0,
    'complete': 5.0,
}

MIN_STUDENTS_THRESHOLD = 30
MIN_INTERACTIONS_THRESHOLD = 100


class CollaborativeEngine:
    def __init__(self, data_loader):
        self.data = data_loader
        self._student_vectors: Dict[int, np.ndarray] = {}

    def is_active(self) -> bool:
        return (
            self.data.get_student_count() >= MIN_STUDENTS_THRESHOLD
            and self.data.get_interaction_count() >= MIN_INTERACTIONS_THRESHOLD
        )

    def _build_feature_vector(self, student: StudentProfile) -> np.ndarray:
        interest_dim = len(self.data.all_interest_ids)
        skill_dim = len(self.data.all_skill_ids)

        interest_index = {iid: i for i, iid in enumerate(self.data.all_interest_ids)}
        skill_index = {sid: i for i, sid in enumerate(self.data.all_skill_ids)}

        vec = np.zeros(interest_dim + skill_dim)

        for iid in student.interest_ids:
            if iid in interest_index:
                vec[interest_index[iid]] = 1.0

        for sid in student.skill_ids:
            if sid in skill_index:
                vec[interest_dim + skill_index[sid]] = 1.0

        return vec

    def _cosine_similarity(self, vec_a: np.ndarray, vec_b: np.ndarray) -> float:
        dot = np.dot(vec_a, vec_b)
        norm_a = np.linalg.norm(vec_a)
        norm_b = np.linalg.norm(vec_b)

        if norm_a == 0 or norm_b == 0:
            return 0.0

        return float(dot / (norm_a * norm_b))

    def _get_implicit_rating(self, student_profile_id: int, career_path_id: int) -> Optional[float]:
        cursor = self.data.conn.cursor()
        cursor.execute(
            "SELECT interaction_type, rating FROM student_career_interactions "
            "WHERE student_profile_id = ? AND career_path_id = ?",
            student_profile_id, career_path_id
        )
        rows = cursor.fetchall()

        if not rows:
            return None

        total = 0.0
        for row in rows:
            if row.rating is not None:
                total += row.rating
            else:
                total += INTERACTION_WEIGHTS.get(row.interaction_type, 0.5)

        return min(total, 5.0)

    def predict(self, target_student_id: int, career_path_id: int, k: int = 10) -> float:
        if not self.is_active():
            return 0.0

        all_students = self.data.get_all_students_with_profiles()
        target = None
        others = []

        for s in all_students:
            if s.student_profile_id == target_student_id:
                target = s
            else:
                others.append(s)

        if target is None:
            return 0.0

        target_vec = self._build_feature_vector(target)

        similarities = []
        for other in others:
            rating = self._get_implicit_rating(other.student_profile_id, career_path_id)
            if rating is None:
                if other.career_path_id == career_path_id:
                    rating = 5.0
                else:
                    continue

            other_vec = self._build_feature_vector(other)
            sim = self._cosine_similarity(target_vec, other_vec)

            if sim > 0:
                similarities.append((sim, rating))

        similarities.sort(key=lambda x: x[0], reverse=True)
        top_k = similarities[:k]

        if not top_k:
            return 0.0

        numerator = sum(sim * rating for sim, rating in top_k)
        denominator = sum(abs(sim) for sim, _ in top_k)

        if denominator == 0:
            return 0.0

        return numerator / denominator / 5.0
