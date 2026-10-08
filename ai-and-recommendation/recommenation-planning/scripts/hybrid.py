from typing import List
from models import StudentProfile, Recommendation
from data_loader import DataLoader
from content_based import ContentBasedEngine
from collaborative import CollaborativeEngine
from gap_analysis import GapAnalyzer


class CareerRecommender:
    def __init__(self, connection_string: str = None):
        self.data = DataLoader(connection_string)
        self.content_engine = ContentBasedEngine(self.data)
        self.collab_engine = CollaborativeEngine(self.data)
        self.gap_analyzer = GapAnalyzer(self.data)

    def recommend(self, student_profile_id: int, top_n: int = 5) -> List[Recommendation]:
        student = self.data.get_student(student_profile_id)
        num_students = self.data.get_student_count()
        num_interactions = self.data.get_interaction_count()

        recommendations = []

        for cp in self.data.career_paths.values():
            content_score, i_score, s_score, matched, total, missing = (
                self.content_engine.combined_score(student, cp)
            )

            collab_score = self.collab_engine.predict(
                student_profile_id, cp.career_path_id
            )

            final = self._blend(content_score, collab_score, num_students, num_interactions)

            missing_names = [self.data.get_skill_name(sid) for sid in missing]
            learning_path = self.gap_analyzer.compute_learning_path(missing, student.skill_ids)

            recommendations.append(Recommendation(
                career_path_id=cp.career_path_id,
                career_path_name=cp.career_path,
                interest_score=round(i_score, 4),
                skill_score=round(s_score, 4),
                collaborative_score=round(collab_score, 4),
                final_score=round(final, 4),
                skills_matched=matched,
                skills_required=total,
                missing_skills=missing_names,
                learning_path=learning_path
            ))

        recommendations.sort(key=lambda r: r.final_score, reverse=True)
        return recommendations[:top_n]

    def recommend_and_save(self, student_profile_id: int, top_n: int = 5) -> List[Recommendation]:
        recs = self.recommend(student_profile_id, top_n)
        self.data.save_recommendations(student_profile_id, recs)
        return recs

    def _blend(self, content_score: float, collab_score: float,
               num_students: int, num_interactions: int) -> float:
        if num_students < 30 or num_interactions < 100:
            return content_score

        if num_students < 200:
            beta = 0.1 + (num_students - 30) / 170.0 * 0.4
        else:
            beta = 0.6

        if collab_score == 0.0:
            return content_score

        return (1 - beta) * content_score + beta * collab_score

    def close(self):
        self.data.close()
