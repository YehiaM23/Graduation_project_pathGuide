from typing import Set, List, Dict
from collections import defaultdict
from models import LearningStep


class GapAnalyzer:
    def __init__(self, data_loader):
        self.data = data_loader

    def _get_all_prerequisites(self, skill_id: int, visited: Set[int] = None) -> Set[int]:
        if visited is None:
            visited = set()

        if skill_id in visited:
            return set()

        visited.add(skill_id)
        prereqs = set()

        if skill_id in self.data.skill_prerequisites:
            for prereq_id in self.data.skill_prerequisites[skill_id]:
                prereqs.add(prereq_id)
                prereqs.update(self._get_all_prerequisites(prereq_id, visited.copy()))

        return prereqs

    def compute_learning_path(self, missing_skill_ids: Set[int], student_skill_ids: Set[int]) -> List[LearningStep]:
        if not missing_skill_ids:
            return []

        all_needed = set()
        for skill_id in missing_skill_ids:
            all_needed.add(skill_id)
            prereqs = self._get_all_prerequisites(skill_id)
            all_needed.update(prereqs - student_skill_ids)

        all_needed -= student_skill_ids

        if not all_needed:
            return []

        ordered = self._topological_sort(all_needed)

        steps = []
        cumulative = 0.0
        learned = set(student_skill_ids)

        for skill_id in ordered:
            hours = self.data.skill_time_estimates.get(skill_id, 30.0)
            cumulative += hours

            prereq_names = []
            if skill_id in self.data.skill_prerequisites:
                prereq_names = [
                    self.data.get_skill_name(pid)
                    for pid in self.data.skill_prerequisites[skill_id]
                    if pid in learned
                ]

            steps.append(LearningStep(
                skill_id=skill_id,
                skill_name=self.data.get_skill_name(skill_id),
                hours=hours,
                cumulative_hours=cumulative,
                prerequisites=prereq_names
            ))
            learned.add(skill_id)

        return steps

    def _topological_sort(self, skills: Set[int]) -> List[int]:
        in_degree = defaultdict(int)
        adj = defaultdict(list)

        for skill_id in skills:
            if skill_id not in in_degree:
                in_degree[skill_id] = 0

            if skill_id in self.data.skill_prerequisites:
                for prereq_id in self.data.skill_prerequisites[skill_id]:
                    if prereq_id in skills:
                        adj[prereq_id].append(skill_id)
                        in_degree[skill_id] += 1

        queue = []
        for skill_id in skills:
            if in_degree[skill_id] == 0:
                time = self.data.skill_time_estimates.get(skill_id, float('inf'))
                queue.append((time, skill_id))

        queue.sort()
        result = []

        while queue:
            _, current = queue.pop(0)
            result.append(current)

            new_available = []
            for neighbor in adj[current]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    time = self.data.skill_time_estimates.get(neighbor, float('inf'))
                    new_available.append((time, neighbor))

            queue.extend(new_available)
            queue.sort()

        if len(result) != len(skills):
            unprocessed = skills - set(result)
            for skill_id in unprocessed:
                if skill_id not in result:
                    result.append(skill_id)

        return result
