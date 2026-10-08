"""
DQN Career Path Planner
Finds the optimal sequence of skills to learn to reach a target role.
"""

import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from collections import deque
import random
import os


# ============================================================
# DATA LOADING
# ============================================================

def load_data():
    """Load role requirements, skill prerequisites, and time estimates."""
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')

    # Role -> required skills
    roles_df = pd.read_csv(os.path.join(data_dir, 'role_skill_requirements.csv'))
    role_skills = {}
    for _, row in roles_df.iterrows():
        role_skills[row['role']] = set(s.strip() for s in row['skills'].split(','))

    # Skill -> list of prerequisites (order matters)
    prereq_df = pd.read_csv(os.path.join(data_dir, 'skill_prerequisites.csv'),
                            skipinitialspace=True, quotechar='"')
    skill_prereqs = {}
    for _, row in prereq_df.iterrows():
        skill = row.iloc[0].strip()
        prereqs_str = str(row.iloc[1]).strip()
        if prereqs_str and prereqs_str != 'nan':
            skill_prereqs[skill] = [p.strip() for p in prereqs_str.split(',') if p.strip()]
        else:
            skill_prereqs[skill] = []

    # Skill -> hours to learn (using top reviewed course time)
    time_df = pd.read_csv(os.path.join(data_dir, 'skill_time_estimates_v3.csv'))
    skill_times = {}
    for _, row in time_df.iterrows():
        skill = row['Skill']
        hours = row['top_reviewed_course_hours']
        # Use 20 as default if no course hours available
        skill_times[skill] = hours if pd.notna(hours) else 20

    # Skill -> course info (title, link)
    skill_courses = {}
    for _, row in time_df.iterrows():
        skill = row['Skill']
        title = row['top_reviewed_course_title']
        link = row['top_reviewed_course_link']

        # Handle NaN/empty values
        if pd.isna(title) or str(title).strip() == '':
            title = 'no course'
        if pd.isna(link) or str(link).strip() == '':
            link = 'no link'

        skill_courses[skill] = {'title': title, 'link': link}

    # Collect all skills mentioned anywhere
    all_skills = set()
    for skills in role_skills.values():
        all_skills.update(skills)
    for skill, prereqs in skill_prereqs.items():
        all_skills.add(skill)
        all_skills.update(prereqs)

    return role_skills, skill_prereqs, skill_times, skill_courses, sorted(all_skills)


# ============================================================
# ENVIRONMENT
# ============================================================

class CareerEnvironment:
    """
    RL Environment for learning skills.
    State: which skills you have (binary vector)
    Actions: learn a skill (if prerequisites are met)
    Goal: acquire all skills required for target role
    """

    def __init__(self, skill_prereqs, skill_times, all_skills, target_skills):
        self.skill_prereqs = skill_prereqs
        self.skill_times = skill_times
        self.all_skills = all_skills
        self.target_skills = target_skills

        # Mappings between skill names and indices
        self.skill_to_idx = {skill: i for i, skill in enumerate(all_skills)}
        self.num_skills = len(all_skills)

        # Find all skills we need to consider (target skills + their prerequisites)
        self.relevant_skills = self._find_relevant_skills()

        # Build dependency map: skill -> set of skills that must be learned first
        self.must_learn_before = self._build_dependencies()

        self.reset()

    def _find_relevant_skills(self):
        """Find target skills and all their prerequisites (recursively)."""
        relevant = set(self.target_skills)
        to_check = list(self.target_skills)

        while to_check:
            skill = to_check.pop()
            for prereq in self.skill_prereqs.get(skill, []):
                if prereq not in relevant:
                    relevant.add(prereq)
                    to_check.append(prereq)

        return relevant

    def _build_dependencies(self):
        """
        Build map of what must be learned before each skill.
        Includes: direct prerequisites AND ordering within prerequisite lists.
        Example: if skill X has prereqs [A, B, C], then:
          - X requires A, B, C
          - B requires A (must learn A before B)
          - C requires B (must learn B before C)
        """
        deps = {skill: set() for skill in self.relevant_skills}

        for skill in self.relevant_skills:
            prereqs = self.skill_prereqs.get(skill, [])

            # Direct prerequisites
            deps[skill].update(prereqs)

            # Order within the prerequisite list
            for i in range(1, len(prereqs)):
                if prereqs[i] not in deps:
                    deps[prereqs[i]] = set()
                deps[prereqs[i]].add(prereqs[i - 1])

        return deps

    def reset(self, initial_skills=None):
        """Start fresh (or with some skills already known)."""
        self.current_skills = set(initial_skills) if initial_skills else set()
        self.total_time = 0
        return self._get_state()

    def _get_state(self):
        """Current state as binary vector: 1 if skill is known, 0 otherwise."""
        state = np.zeros(self.num_skills, dtype=np.float32)
        for skill in self.current_skills:
            if skill in self.skill_to_idx:
                state[self.skill_to_idx[skill]] = 1.0
        return state

    def can_learn(self, skill):
        """Can we learn this skill? (don't have it yet + all prerequisites met)"""
        if skill in self.current_skills:
            return False
        required = self.must_learn_before.get(skill, set())
        return required.issubset(self.current_skills)

    def get_valid_actions(self):
        """Which skills can be learned right now?"""
        return [i for i, skill in enumerate(self.all_skills)
                if skill in self.relevant_skills and self.can_learn(skill)]

    def step(self, action):
        """Learn a skill. Returns (new_state, reward, done)."""
        skill = self.all_skills[action]

        # Invalid action
        if not self.can_learn(skill) or skill not in self.relevant_skills:
            return self._get_state(), -100, False

        # Learn the skill
        self.current_skills.add(skill)
        time_cost = self.skill_times.get(skill, 20)
        self.total_time += time_cost

        # Check if we've reached the goal
        done = self.target_skills.issubset(self.current_skills)

        # Reward: big bonus for goal, medium for target skills, small for prerequisites
        if done:
            reward = 100.0
        elif skill in self.target_skills:
            reward = 10.0
        else:
            reward = 5.0

        return self._get_state(), reward, done

    def is_goal_reached(self):
        """Have we acquired all target skills?"""
        return self.target_skills.issubset(self.current_skills)


# ============================================================
# NEURAL NETWORK
# ============================================================

class DQN(nn.Module):
    """Neural network that estimates Q-values for each action."""

    def __init__(self, state_size, action_size):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Linear(state_size, 128),
            nn.ReLU(),
            nn.Linear(128, 128),
            nn.ReLU(),
            nn.Linear(128, action_size)
        )

    def forward(self, state):
        return self.layers(state)


# ============================================================
# AGENT
# ============================================================

class DQNAgent:
    """
    DQN Agent with experience replay and target network.
    - Explores randomly at first (high epsilon)
    - Gradually shifts to exploiting learned Q-values (low epsilon)
    """

    def __init__(self, state_size, action_size):
        # Networks
        self.policy_net = DQN(state_size, action_size)
        self.target_net = DQN(state_size, action_size)
        self.target_net.load_state_dict(self.policy_net.state_dict())

        # Training
        self.optimizer = optim.Adam(self.policy_net.parameters(), lr=0.001)
        self.gamma = 0.99  # discount factor
        self.memory = deque(maxlen=10000)
        self.batch_size = 64

        # Exploration
        self.epsilon = 1.0       # start with full exploration
        self.epsilon_min = 0.01  # minimum exploration
        self.epsilon_decay = 0.995

    def choose_action(self, state, valid_actions):
        """Pick an action: random (explore) or best Q-value (exploit)."""
        if not valid_actions:
            return None

        # Explore: random action
        if random.random() < self.epsilon:
            return random.choice(valid_actions)

        # Exploit: best Q-value among valid actions
        with torch.no_grad():
            q_values = self.policy_net(torch.FloatTensor(state)).numpy()
        return max(valid_actions, key=lambda a: q_values[a])

    def remember(self, state, action, reward, next_state, done):
        """Store experience for replay."""
        self.memory.append((state, action, reward, next_state, done))

    def learn(self):
        """Train on a batch of past experiences."""
        if len(self.memory) < self.batch_size:
            return

        batch = random.sample(self.memory, self.batch_size)
        states, actions, rewards, next_states, dones = zip(*batch)

        # Stack state arrays into batches
        states = torch.FloatTensor(np.stack(states))
        next_states = torch.FloatTensor(np.stack(next_states))

        # Convert scalar lists to tensors
        actions = torch.LongTensor(actions)
        rewards = torch.FloatTensor(rewards)
        dones = torch.FloatTensor(dones)

        # Current Q-values for actions taken
        current_q = self.policy_net(states).gather(1, actions.unsqueeze(1)).squeeze()

        # Target Q-values (what we want to move towards)
        with torch.no_grad():
            next_q = self.target_net(next_states).max(1)[0]
            target_q = rewards + (1 - dones) * self.gamma * next_q

        # Update network
        loss = nn.MSELoss()(current_q, target_q)
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()

        # Decay exploration rate
        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay

    def update_target_network(self):
        """Sync target network with policy network."""
        self.target_net.load_state_dict(self.policy_net.state_dict())


# ============================================================
# TRAINING
# ============================================================

def train(env, agent, episodes=500):
    """Train the agent through repeated episodes."""
    print(f"\nTraining for {episodes} episodes...")

    for episode in range(episodes):
        state = env.reset()

        for _ in range(50):  # max steps per episode
            valid_actions = env.get_valid_actions()
            if not valid_actions or env.is_goal_reached():
                break

            action = agent.choose_action(state, valid_actions)
            next_state, reward, done = env.step(action)

            agent.remember(state, action, reward, next_state, done)
            agent.learn()
            state = next_state

            if done:
                break

        # Sync target network periodically
        if episode % 10 == 0:
            agent.update_target_network()

        if episode % 100 == 0:
            print(f"  Episode {episode}, Exploration: {agent.epsilon:.1%}")

    print("Training complete!")


# ============================================================
# PLANNING (use trained agent)
# ============================================================

def find_path(env, agent, initial_skills):
    """Use the trained agent to find the best learning path."""
    state = env.reset(initial_skills)
    path = []

    # Disable exploration - use learned policy only
    saved_epsilon = agent.epsilon
    agent.epsilon = 0

    for _ in range(50):
        valid_actions = env.get_valid_actions()
        if not valid_actions or env.is_goal_reached():
            break

        action = agent.choose_action(state, valid_actions)
        skill = env.all_skills[action]
        hours = env.skill_times.get(skill, 20)
        path.append((skill, hours))

        state, _, _ = env.step(action)

    agent.epsilon = saved_epsilon
    return path, env.total_time


# ============================================================
# MAIN
# ============================================================

def main():
    print("Loading data...")
    role_skills, skill_prereqs, skill_times, skill_courses, all_skills = load_data()

    # Show available roles
    print("\nAvailable Roles:")
    print("-" * 50)
    for role, skills in role_skills.items():
        print(f"  {role}")
        print(f"    Requires: {', '.join(sorted(skills))}")
    print()

    # Get target role
    target_role = input("Enter target role: ").strip()
    if target_role not in role_skills:
        print(f"Error: '{target_role}' not found!")
        return

    # Get current skills
    print(f"\nSkills needed for {target_role}: {', '.join(sorted(role_skills[target_role]))}")
    current_input = input("Your current skills (comma-separated, or Enter for none): ").strip()
    current_skills = set(s.strip() for s in current_input.split(',')) if current_input else set()

    # Check what's still needed
    needed = role_skills[target_role] - current_skills
    if not needed:
        print("\nYou already have all required skills!")
        return

    print(f"\nSkills you need to learn: {', '.join(sorted(needed))}")

    # Train agent
    env = CareerEnvironment(skill_prereqs, skill_times, all_skills, role_skills[target_role])
    agent = DQNAgent(state_size=len(all_skills), action_size=len(all_skills))
    train(env, agent)

    # Find optimal path
    path, total_time = find_path(env, agent, current_skills)

    if not path:
        print("\nNo learning path found!")
        return

    # Display results
    print(f"\n{'=' * 50}")
    print(f"LEARNING PATH TO: {target_role}")
    print(f"{'=' * 50}")

    cumulative = 0
    for i, (skill, hours) in enumerate(path, 1):
        cumulative += hours
        prereqs = skill_prereqs.get(skill, [])
        prereq_note = f" (requires: {', '.join(prereqs)})" if prereqs else ""

        # Get course info
        course_info = skill_courses.get(skill, {'title': 'no course', 'link': 'no link'})
        course_title = course_info['title']
        course_link = course_info['link']

        print(f"{i}. {skill}{prereq_note}")
        print(f"   Time: {hours:.0f}h | Running total: {cumulative:.0f}h")
        print(f"   Course: {course_title}")
        print(f"   Link: {course_link}")

    print(f"\n{'=' * 50}")
    print(f"TOTAL: {total_time:.0f} hours ({total_time/10:.1f} weeks at 10h/week)")
    print(f"{'=' * 50}")


if __name__ == "__main__":
    main()