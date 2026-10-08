import 'package:flutter/material.dart';
import 'package:pathguide_app/core/theme/app_colors.dart';
import 'package:pathguide_app/core/widgets/reusable_widgets.dart';
import 'package:pathguide_app/core/widgets/app_footer.dart';

class PrivacyPolicyPage extends StatelessWidget {
  const PrivacyPolicyPage({super.key});

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Privacy Policy',
      padding: EdgeInsets.zero,
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SectionHeader(
                  title: 'Privacy Policy',
                  subtitle: 'Last updated: May 2026',
                ),
                const SizedBox(height: 24),
                _buildSection('1. Introduction', 'Welcome to PathGuide. We respect your privacy and are committed to protecting your personal data.'),
                _buildSection('2. Data We Collect', 'We collect information you provide directly to us when you create an account, such as your name, email address, university, and professional interests.'),
                _buildSection('3. How We Use Your Data', 'We use your data to provide personalized career recommendations, connect you with recruiters, and improve our services.'),
                _buildSection('4. Data Sharing', 'We share your professional profile with recruiters only when you apply for an internship or express interest in a company.'),
              ],
            ),
          ),
          const AppFooter(),
        ],
      ),
    );
  }

  Widget _buildSection(String title, String content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.darkNavy)),
          const SizedBox(height: 12),
          Text(content, style: const TextStyle(color: AppColors.mutedText, height: 1.6)),
        ],
      ),
    );
  }
}
