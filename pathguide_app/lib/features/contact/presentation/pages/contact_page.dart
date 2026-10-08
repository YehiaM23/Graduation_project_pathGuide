import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pathguide_app/core/theme/app_colors.dart';
import 'package:pathguide_app/core/widgets/reusable_widgets.dart';

class ContactPage extends StatelessWidget {
  const ContactPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, color: AppColors.darkNavy, size: 20),
          onPressed: () => context.pop(),
        ),
        title: const Text('Contact Us', style: TextStyle(color: AppColors.darkNavy, fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const PageHeroBanner(
                tag: 'We\'d love to hear from you',
                tagIcon: Icons.mail_outline_rounded,
                title: 'Get in Touch',
                subtitle: 'Send us a message and we\'ll respond as soon as possible.',
                colors: [Color(0xFFEC4899), Color(0xFFF43F5E)],
              ),
              const SizedBox(height: 24),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SectionRow(title: 'Send a Message'),
                    const SizedBox(height: 14),
                    _MessageForm(),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}


class _MessageForm extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 12, offset: const Offset(0, 4))],
      ),
      child: Column(
        children: [
          Container(
            height: 5,
            decoration: const BoxDecoration(
              gradient: LinearGradient(colors: [Color(0xFFEC4899), Color(0xFFF43F5E)]),
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
          ),
          const Padding(
            padding: EdgeInsets.all(20),
            child: Column(
              children: [
                AppTextField(label: 'Full Name', hint: 'Enter your name', prefixIcon: Icons.person_outline_rounded),
                SizedBox(height: 16),
                AppTextField(label: 'Email Address', hint: 'Enter your email', prefixIcon: Icons.email_outlined, keyboardType: TextInputType.emailAddress),
                SizedBox(height: 16),
                AppTextField(label: 'Message', hint: 'How can we help you?', maxLines: 4),
                SizedBox(height: 20),
                GradientButton(text: 'Send Message', onPressed: null),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
