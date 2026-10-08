import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:pathguide_app/core/theme/app_colors.dart';
import 'package:pathguide_app/core/widgets/reusable_widgets.dart';
import 'package:pathguide_app/features/auth/presentation/bloc/auth_bloc.dart';

class StudentDashboard extends StatelessWidget {
  const StudentDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        final user = state is AuthAuthenticated ? state.user : null;
        final userName = user?.name ?? 'Student';

        return Scaffold(
          backgroundColor: AppColors.background,
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0,
            surfaceTintColor: Colors.white,
            title: const PathGuideLogo(size: 24),
            actions: [
              IconButton(
                icon: const Icon(Icons.notifications_none_outlined, color: AppColors.darkNavy),
                onPressed: () => context.push('/notifications'),
              ),
              const SizedBox(width: 4),
            ],
          ),
          bottomNavigationBar: const StudentBottomNav(currentIndex: 0),
          body: SafeArea(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _HeroBanner(name: userName),
                  _ProfilePromoBanner(),
                  const SizedBox(height: 24),
                  _StatsGrid(),
                  const SizedBox(height: 24),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: SectionRow(title: 'Quick Actions'),
                  ),
                  const SizedBox(height: 14),
                  _ActionCards(context),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _HeroBanner extends StatelessWidget {
  final String name;
  const _HeroBanner({required this.name});

  @override
  Widget build(BuildContext context) {
    return PageHeroBanner(
      tag: 'Student Portal',
      tagIcon: Icons.school_rounded,
      title: 'Hello, $name! 👋',
      subtitle: "Let's make progress on your career today.",
      colors: const [AppColors.primaryBlue, AppColors.teal],
      trailing: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.2),
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Icon(Icons.person_rounded, color: Colors.white, size: 30),
      ),
    );
  }
}

class _ProfilePromoBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.go('/student/profile'),
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppColors.primaryBlue, AppColors.teal],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(color: AppColors.primaryBlue.withValues(alpha: 0.3), blurRadius: 12, offset: const Offset(0, 4)),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '✨ Let recruiters discover the real you!',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Complete your profile to boost your visibility, stand out to AI recruiters, and unlock bigger career opportunities 🚀',
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 12, height: 1.5),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.4)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('Complete Profile', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                        SizedBox(width: 6),
                        Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 14),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.rocket_launch_rounded, color: Colors.white, size: 26),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatsGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisSpacing: 14,
        mainAxisSpacing: 14,
        childAspectRatio: 1.2,
        children: const [
          GradientStatCard(
            label: 'Active Apps',
            value: '0',
            icon: Icons.send_rounded,
            colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
          ),
          GradientStatCard(
            label: 'Skill Level',
            value: 'New',
            icon: Icons.trending_up_rounded,
            colors: [AppColors.teal, Color(0xFF06B6D4)],
          ),
          GradientStatCard(
            label: 'Saved Jobs',
            value: '0',
            icon: Icons.bookmark_rounded,
            colors: [Color(0xFFF59E0B), Color(0xFFF97316)],
          ),
          GradientStatCard(
            label: 'Path Progress',
            value: '0%',
            icon: Icons.auto_graph_rounded,
            colors: [Color(0xFFEC4899), Color(0xFFF43F5E)],
          ),
        ],
      ),
    );
  }
}

class _ActionCards extends StatelessWidget {
  final BuildContext ctx;
  const _ActionCards(this.ctx);

  @override
  Widget build(BuildContext ctx) {
    final actions = [
      (
        'Find Internships',
        'Explore opportunities that match your skills',
        Icons.work_rounded,
        const [Color(0xFF6366F1), Color(0xFF8B5CF6)],
        '/student/internships',
      ),
      (
        'My Applications',
        'Track and manage your sent applications',
        Icons.assignment_rounded,
        const [AppColors.teal, Color(0xFF06B6D4)],
        '/student/applications',
      ),
      (
        'AI Planner',
        'Design your journey to your dream job',
        Icons.map_rounded,
        const [Color(0xFFF59E0B), Color(0xFFF97316)],
        '/student/career-path',
      ),
    ];

    return Column(
      children: actions.map((a) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
          child: GestureDetector(
            onTap: () => ctx.push(a.$5),
            child: Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: a.$4,
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(color: a.$4.first.withValues(alpha: 0.3), blurRadius: 10, offset: const Offset(0, 4)),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.22),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(a.$3, color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(a.$1, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
                        const SizedBox(height: 2),
                        Text(a.$2, style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 12)),
                      ],
                    ),
                  ),
                  const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Colors.white70),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
