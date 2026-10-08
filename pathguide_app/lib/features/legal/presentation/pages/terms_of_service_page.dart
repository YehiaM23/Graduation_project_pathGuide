import 'package:flutter/material.dart';
import 'package:pathguide_app/core/theme/app_colors.dart';
import 'package:pathguide_app/core/widgets/reusable_widgets.dart';
import 'package:pathguide_app/core/widgets/app_footer.dart';

class TermsOfServicePage extends StatelessWidget {
  const TermsOfServicePage({super.key});

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Terms of Service',
      padding: EdgeInsets.zero,
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SectionHeader(
                  title: 'Terms of Service',
                  subtitle: 'Last updated: May 2026',
                ),
                const SizedBox(height: 24),
                _buildSection('1. Acceptance of Terms', 'By accessing and using PathGuide, you agree to be bound by these Terms of Service.'),
                _buildSection('2. User Accounts', 'You are responsible for maintaining the confidentiality of your account credentials.'),
                _buildSection('3. Prohibited Conduct', 'Users may not use the platform for any illegal activities or to harass others.'),
                _buildSection('4. Limitation of Liability', 'PathGuide is provided "as is" without any warranties.'),
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
