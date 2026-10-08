import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pathguide_app/core/theme/app_colors.dart';
import 'package:pathguide_app/core/widgets/reusable_widgets.dart';
import 'package:pathguide_app/core/data/models.dart';

class InternshipDetailsPage extends StatelessWidget {
  const InternshipDetailsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final internship = GoRouterState.of(context).extra as InternshipModel;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, color: Colors.white, size: 20),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.bookmark_border_rounded, color: Colors.white),
            onPressed: () {},
          ),
        ],
      ),
      extendBodyBehindAppBar: true,
      body: Column(
        children: [
          _HeroHeader(internship: internship),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _OverviewGrid(internship: internship),
                  const SizedBox(height: 22),
                  const SectionRow(title: 'About the Role'),
                  const SizedBox(height: 12),
                  AppCard(
                    child: Text(internship.description,
                        style: const TextStyle(color: AppColors.mutedText, fontSize: 14, height: 1.7)),
                  ),
                  const SizedBox(height: 22),
                  const SectionRow(title: 'Required Skills'),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      SkillChip(label: internship.requiredSkill, isSelected: true),
                      const SkillChip(label: 'Communication'),
                      const SkillChip(label: 'Teamwork'),
                    ],
                  ),
                  const SizedBox(height: 32),
                  GradientButton(
                    text: 'Apply Now',
                    onPressed: () => _showApplyDialog(context, internship),
                  ),
                  const SizedBox(height: 12),
                  Center(
                    child: TextButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.bookmark_border_rounded, size: 18),
                      label: const Text('Save for Later'),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showApplyDialog(BuildContext context, InternshipModel internship) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text('Confirm Application'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('You are about to apply for:'),
            const SizedBox(height: 8),
            Text(internship.title, style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryBlue)),
            Text('at ${internship.company}'),
            const SizedBox(height: 16),
            const Text('Your profile details and CV will be shared with the recruiter.'),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: AppColors.mutedText))),
          ElevatedButton(
            onPressed: () { Navigator.pop(ctx); _showSuccessDialog(context); },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryBlue, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: const Text('Confirm', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showSuccessDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [AppColors.successGreen, Color(0xFF059669)]),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_rounded, color: Colors.white, size: 40),
            ),
            const SizedBox(height: 20),
            const Text('Applied Successfully!', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            const Text('Track it in My Applications.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.mutedText)),
            const SizedBox(height: 28),
            GradientButton(
              text: 'View Applications',
              onPressed: () { Navigator.pop(ctx); context.pushReplacement('/student/applications'); },
            ),
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Back', style: TextStyle(color: AppColors.mutedText)),
            ),
          ],
        ),
      ),
    );
  }
}

class _HeroHeader extends StatelessWidget {
  final InternshipModel internship;
  const _HeroHeader({required this.internship});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 100, 20, 28),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(Icons.business_rounded, color: Colors.white, size: 30),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(internship.title,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 4),
                Text(internship.company,
                    style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.85), fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.successGreen.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
                  ),
                  child: const Text('Active Opportunity',
                      style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _OverviewGrid extends StatelessWidget {
  final InternshipModel internship;
  const _OverviewGrid({required this.internship});

  @override
  Widget build(BuildContext context) {
    final items = [
      (Icons.location_on_outlined, 'Location', internship.location, const [AppColors.primaryBlue, AppColors.teal]),
      (Icons.access_time_rounded, 'Duration', internship.duration, const [Color(0xFF6366F1), Color(0xFF8B5CF6)]),
      (Icons.payments_outlined, 'Stipend', internship.stipend, const [AppColors.teal, Color(0xFF06B6D4)]),
      (Icons.event_available_rounded, 'Start Date', internship.startDate, const [Color(0xFFF59E0B), Color(0xFFF97316)]),
    ];

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 2.2,
      children: items.map((item) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: item.$4, begin: Alignment.topLeft, end: Alignment.bottomRight),
            borderRadius: BorderRadius.circular(14),
            boxShadow: [BoxShadow(color: item.$4.first.withValues(alpha: 0.25), blurRadius: 8, offset: const Offset(0, 3))],
          ),
          child: Row(
            children: [
              Icon(item.$1, color: Colors.white, size: 18),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(item.$2, style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 10)),
                    Text(item.$3,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                        overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
