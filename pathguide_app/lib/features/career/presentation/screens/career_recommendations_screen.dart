import 'package:flutter/material.dart';
import 'package:pathguide_app/core/theme/app_colors.dart';

class CareerRecommendationsScreen extends StatelessWidget {
  const CareerRecommendationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Career Path'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Your Recommended Path',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Based on your profile and skills, we suggest:',
              style: TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 24),
            _buildCareerHeroCard(),
            const SizedBox(height: 32),
            const Text(
              'Roadmap to Success',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            _buildRoadmapStep(1, 'Master Flutter & Dart', 'Complete Advanced UI and State Management', true),
            _buildRoadmapStep(2, 'Backend Integration', 'Learn Dio, REST APIs and Firebase', true),
            _buildRoadmapStep(3, 'Portfolio Building', 'Build 3 production-level apps', false),
            _buildRoadmapStep(4, 'Internship', 'Apply for Junior Flutter roles', false),
            const SizedBox(height: 32),
            const Text(
              'Skill Gaps',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            _buildSkillGapItem('Unit Testing', 0.4),
            _buildSkillGapItem('CI/CD Pipelines', 0.2),
            _buildSkillGapItem('System Design', 0.6),
          ],
        ),
      ),
    );
  }

  Widget _buildCareerHeroCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryBlue.withValues(alpha: 0.3),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Senior Mobile Engineer',
            style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 8),
          Text(
            '85% Match with your current skills',
            style: TextStyle(color: Colors.white70, fontSize: 14),
          ),
          SizedBox(height: 20),
          Row(
            children: [
              Icon(Icons.payments_outlined, color: Colors.white, size: 20),
              SizedBox(width: 8),
              Text('\$80k - \$120k / year', style: TextStyle(color: Colors.white)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRoadmapStep(int step, String title, String description, bool isCompleted) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                color: isCompleted ? AppColors.success : Colors.grey[300],
                shape: BoxShape.circle,
              ),
              child: isCompleted 
                ? const Icon(Icons.check, color: Colors.white, size: 18)
                : Center(child: Text('$step', style: const TextStyle(color: Colors.white))),
            ),
            if (step != 4)
              Container(
                width: 2,
                height: 50,
                color: isCompleted ? AppColors.success : Colors.grey[300],
              ),
          ],
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              Text(description, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSkillGapItem(String skill, double progress) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(skill, style: const TextStyle(fontWeight: FontWeight.w500)),
            Text('${(progress * 100).toInt()}%', style: const TextStyle(color: AppColors.textSecondary)),
          ],
        ),
        const SizedBox(height: 8),
        LinearProgressIndicator(
          value: progress,
          backgroundColor: Colors.grey[200],
          valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primaryBlue),
          borderRadius: BorderRadius.circular(10),
          minHeight: 8,
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}

