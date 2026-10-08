import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pathguide_app/core/theme/app_colors.dart';
import 'package:pathguide_app/core/widgets/reusable_widgets.dart';

class AppFooter extends StatelessWidget {
  const AppFooter({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(24, 60, 24, 40),
      child: Column(
        children: [
          const PathGuideLogo(showTagline: true),
          const SizedBox(height: 32),
          const Text(
            'Empowering computer science students to bridge the gap between academia and industry.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.mutedText, fontSize: 14, height: 1.6),
          ),
          const SizedBox(height: 32),
          Wrap(
            alignment: WrapAlignment.center,
            spacing: 12,
            runSpacing: 8,
            children: [
              _footerLink(context, 'About Us', '/about'),
              _divider(),
              _footerLink(context, 'Contact Us', '/contact'),
            ],
          ),
          const SizedBox(height: 40),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _socialIcon(Icons.facebook),
              const SizedBox(width: 24),
              _socialIcon(Icons.camera_alt),
              const SizedBox(width: 24),
              _socialIcon(Icons.business),
            ],
          ),
          const SizedBox(height: 48),
          const Divider(color: AppColors.cardBorder),
          const SizedBox(height: 32),
          const Text(
            '© 2026 PathGuide. All rights reserved.',
            style: TextStyle(color: AppColors.mutedText, fontSize: 12),
          ),
          const SizedBox(height: 8),
          const Text(
            'Built with ❤️ for CS students.',
            style: TextStyle(color: AppColors.mutedText, fontSize: 12, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _footerLink(BuildContext context, String text, String route) {
    return InkWell(
      onTap: () {
        if (route != '#') {
          context.push(route);
        }
      },
      child: Text(
        text,
        style: const TextStyle(
          color: AppColors.primaryBlue,
          fontSize: 13,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Widget _divider() {
    return const Text(
      '|',
      style: TextStyle(color: AppColors.cardBorder, fontSize: 13),
    );
  }

  Widget _socialIcon(IconData icon) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: const BoxDecoration(
        color: AppColors.lightBlue,
        shape: BoxShape.circle,
      ),
      child: Icon(icon, color: AppColors.primaryBlue, size: 20),
    );
  }
}
