import 'package:flutter/material.dart';
import 'package:pathguide_app/core/theme/app_colors.dart';
import 'package:pathguide_app/core/widgets/reusable_widgets.dart';
import 'package:pathguide_app/core/widgets/app_footer.dart';

class CookiePolicyPage extends StatelessWidget {
  const CookiePolicyPage({super.key});

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: 'Cookie Policy',
      padding: EdgeInsets.zero,
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SectionHeader(
                  title: 'Cookie Policy',
                  subtitle: 'Last updated: May 2026',
                ),
                const SizedBox(height: 24),
                _buildSection('1. What are Cookies?', 'Cookies are small text files stored on your device that help us improve your experience.'),
                _buildSection('2. How We Use Cookies', 'We use cookies to remember your login status and analyze how our platform is being used.'),
                _buildSection('3. Managing Cookies', 'You can control or reset your cookies through your web browser settings.'),
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
