import pyodbc
import csv
import os
from typing import Dict, Set, List, Optional, Tuple
from models import StudentProfile, CareerPathInfo


class DataLoader:
    def __init__(self, connection_string: str = None):
        if connection_string is None:
            connection_string = os.environ.get(
                "DB_CONNECTION_STRING",
                "DRIVER={ODBC Driver 17 for SQL Server};"
                "SERVER=localhost;"
                "DATABASE=pathguide;"
                "Trusted_Connection=yes;"
            )
        self.connection_string = connection_string
        self._conn = None

        self.career_paths: Dict[int, CareerPathInfo] = {}
        self.skill_names: Dict[int, str] = {}
        self.skill_ids_by_name: Dict[str, int] = {}
        self.all_interest_ids: List[int] = []
        self.all_skill_ids: List[int] = []
        self.skill_prerequisites: Dict[int, Set[int]] = {}
        self.skill_time_estimates: Dict[int, float] = {}

        self._load_all()

    @property
    def conn(self):
        if self._conn is None:
            try:
                self._conn = pyodbc.connect(self.connection_string)
            except pyodbc.Error as e:
                raise ConnectionError(
                    f"Database connection failed: {e}\n"
                    f"Connection string: {self.connection_string}\n"
                    f"Available ODBC drivers: {pyodbc.drivers()}"
                )
        return self._conn

    def _load_all(self):
        self._load_skills()
        self._load_interests()
        self._load_career_paths()
        self._load_career_path_interests()
        self._load_career_path_skills()
        self._load_skill_prerequisites()
        self._load_skill_time_estimates()

    def _load_skills(self):
        cursor = self.conn.cursor()
        cursor.execute("SELECT skill_id, skill_name FROM skills WHERE is_active = 1")
        for row in cursor.fetchall():
            self.skill_names[row.skill_id] = row.skill_name
            self.skill_ids_by_name[row.skill_name] = row.skill_id
        self.all_skill_ids = sorted(self.skill_names.keys())

    def _load_interests(self):
        cursor = self.conn.cursor()
        cursor.execute("SELECT interest_id FROM interests")
        self.all_interest_ids = sorted([row.interest_id for row in cursor.fetchall()])

    def _load_career_paths(self):
        cursor = self.conn.cursor()
        cursor.execute("SELECT career_path_id, career_path FROM career_paths")
        for row in cursor.fetchall():
            self.career_paths[row.career_path_id] = CareerPathInfo(
                career_path_id=row.career_path_id,
                career_path=row.career_path
            )

    def _load_career_path_interests(self):
        cursor = self.conn.cursor()
        cursor.execute("SELECT career_path_id, interest_id FROM career_path_interests")
        for row in cursor.fetchall():
            if row.career_path_id in self.career_paths:
                self.career_paths[row.career_path_id].interest_ids.add(row.interest_id)

    def _load_career_path_skills(self):
        cursor = self.conn.cursor()
        cursor.execute("SELECT career_path_id, skill_id FROM career_path_skills")
        for row in cursor.fetchall():
            if row.career_path_id in self.career_paths:
                self.career_paths[row.career_path_id].required_skill_ids.add(row.skill_id)

    def _load_skill_prerequisites(self):
        cursor = self.conn.cursor()
        cursor.execute("SELECT skill_id, prerequisite_skill_id FROM skill_prerequisites")
        for row in cursor.fetchall():
            if row.skill_id not in self.skill_prerequisites:
                self.skill_prerequisites[row.skill_id] = set()
            self.skill_prerequisites[row.skill_id].add(row.prerequisite_skill_id)

    def _load_skill_time_estimates(self):
        csv_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'data', 'skill_time_estimates_v3.csv'
        )
        if not os.path.exists(csv_path):
            return
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                skill_name = row.get('Skill', '').strip()
                avg_hours = row.get('Average_Hours', '30')
                if skill_name in self.skill_ids_by_name:
                    try:
                        self.skill_time_estimates[self.skill_ids_by_name[skill_name]] = float(avg_hours)
                    except (ValueError, TypeError):
                        self.skill_time_estimates[self.skill_ids_by_name[skill_name]] = 30.0

    def get_student(self, student_profile_id: int) -> StudentProfile:
        cursor = self.conn.cursor()
        cursor.execute(
            "SELECT student_profile_id, user_id, career_path_id "
            "FROM student_profiles WHERE student_profile_id = ?",
            student_profile_id
        )
        row = cursor.fetchone()
        if not row:
            raise ValueError(f"Student profile {student_profile_id} not found")

        student = StudentProfile(
            student_profile_id=row.student_profile_id,
            user_id=row.user_id,
            career_path_id=row.career_path_id
        )

        cursor.execute(
            "SELECT interest_id FROM students_interests WHERE student_id = ?",
            student_profile_id
        )
        student.interest_ids = {r.interest_id for r in cursor.fetchall()}

        cursor.execute(
            "SELECT skill_id FROM students_skills WHERE student_id = ?",
            student_profile_id
        )
        student.skill_ids = {r.skill_id for r in cursor.fetchall()}

        return student

    def get_all_students_with_profiles(self) -> List[StudentProfile]:
        cursor = self.conn.cursor()
        cursor.execute(
            "SELECT student_profile_id, user_id, career_path_id FROM student_profiles"
        )
        students = []
        for row in cursor.fetchall():
            student = StudentProfile(
                student_profile_id=row.student_profile_id,
                user_id=row.user_id,
                career_path_id=row.career_path_id
            )
            students.append(student)

        for student in students:
            cursor.execute(
                "SELECT interest_id FROM students_interests WHERE student_id = ?",
                student.student_profile_id
            )
            student.interest_ids = {r.interest_id for r in cursor.fetchall()}

            cursor.execute(
                "SELECT skill_id FROM students_skills WHERE student_id = ?",
                student.student_profile_id
            )
            student.skill_ids = {r.skill_id for r in cursor.fetchall()}

        return students

    def get_student_count(self) -> int:
        cursor = self.conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM student_profiles")
        return cursor.fetchone()[0]

    def get_interaction_count(self) -> int:
        cursor = self.conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM student_career_interactions")
        return cursor.fetchone()[0]

    def get_skill_name(self, skill_id: int) -> str:
        return self.skill_names.get(skill_id, f"Unknown({skill_id})")

    def save_recommendations(self, student_profile_id: int, recommendations):
        cursor = self.conn.cursor()
        cursor.execute(
            "DELETE FROM career_recommendations WHERE student_profile_id = ?",
            student_profile_id
        )
        for rec in recommendations:
            import json
            cursor.execute(
                "INSERT INTO career_recommendations "
                "(student_profile_id, career_path_id, interest_score, skill_score, "
                "collaborative_score, final_score, skills_matched, skills_required, "
                "missing_skills, algorithm_used) VALUES (?,?,?,?,?,?,?,?,?,?)",
                student_profile_id,
                rec.career_path_id,
                rec.interest_score,
                rec.skill_score,
                rec.collaborative_score,
                rec.final_score,
                rec.skills_matched,
                rec.skills_required,
                json.dumps(rec.missing_skills),
                rec.collaborative_score > 0 and 'hybrid' or 'content'
            )
        self.conn.commit()

    def close(self):
        if self._conn:
            self._conn.close()
            self._conn = None
