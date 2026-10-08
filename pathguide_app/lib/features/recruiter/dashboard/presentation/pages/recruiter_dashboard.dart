import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:pathguide_app/core/theme/app_colors.dart';
import 'package:pathguide_app/core/widgets/reusable_widgets.dart';
import 'package:pathguide_app/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:pathguide_app/features/recruiter/applications/presentation/bloc/application_bloc.dart';
import 'package:pathguide_app/features/recruiter/applications/presentation/bloc/application_state.dart';
import 'package:pathguide_app/features/recruiter/internships/presentation/bloc/internship_bloc.dart';

class RecruiterDashboard extends StatelessWidget {
  const RecruiterDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        final user = state is AuthAuthenticated ? state.user : null;
        final userName = user?.name ?? 'Recruiter';

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
          bottomNavigationBar: const RecruiterBottomNav(currentIndex: 0),
          body: SafeArea(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _HeroBanner(name: userName),
                  const SizedBox(height: 24),
                  _StatsGrid(),
                  const SizedBox(height: 24),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: SectionRow(
                      title: 'Quick Actions',
                    ),
                  ),
                  const SizedBox(height: 14),
                  _ActionCards(context),
                  const SizedBox(height: 24),
                  _RecentApplicants(context),
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
      tag: 'Recruiter Portal',
      tagIcon: Icons.business_center_rounded,
      title: 'Welcome, $name! 🏢',
      subtitle: 'Manage internships and review student applications.',
      colors: const [Color(0xFF6366F1), Color(0xFF8B5CF6)],
      trailing: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.2),
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Icon(Icons.business_rounded, color: Colors.white, size: 30),
      ),
    );
  }
}

class _StatsGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return BlocBuilder<InternshipBloc, InternshipState>(
      builder: (context, internshipState) {
        return BlocBuilder<ApplicationBloc, ApplicationState>(
          builder: (context, appState) {
            final activeInternships = internshipState is InternshipLoaded
                ? internshipState.myInternships.where((i) => i.isActive).length
                : 0;
            final applications = appState is ApplicationLoaded ? appState.applications : [];
            final total = applications.length;
            final pending = applications.where((a) => a.status == 'Pending').length;
            final completed = applications.where((a) => a.status == 'Completed').length;

            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 14,
                mainAxisSpacing: 14,
                childAspectRatio: 1.2,
                children: [
                  GradientStatCard(
                    label: 'Active Internships',
                    value: activeInternships.toString(),
                    icon: Icons.work_rounded,
                    colors: const [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                  ),
                  GradientStatCard(
                    label: 'Total Applications',
                    value: total.toString(),
                    icon: Icons.groups_rounded,
                    colors: const [AppColors.teal, Color(0xFF06B6D4)],
                  ),
                  GradientStatCard(
                    label: 'Pending Review',
                    value: pending.toString(),
                    icon: Icons.pending_actions_rounded,
                    colors: const [Color(0xFFF59E0B), Color(0xFFF97316)],
                  ),
                  GradientStatCard(
                    label: 'Completed',
                    value: completed.toString(),
                    icon: Icons.check_circle_outline_rounded,
                    colors: const [AppColors.successGreen, Color(0xFF059669)],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

class _ActionCards extends StatelessWidget {
  final BuildContext ctx;
  const _ActionCards(this.ctx);

  @override
  Widget build(BuildContext context) {
    final actions = [
      (
        'Post Internship',
        'Create a new opportunity for students',
        Icons.add_business_rounded,
        const [Color(0xFF6366F1), Color(0xFF8B5CF6)],
        '/recruiter/post-internship',
      ),
      (
        'My Internships',
        'View and manage your posted listings',
        Icons.list_alt_rounded,
        const [AppColors.teal, Color(0xFF06B6D4)],
        '/recruiter/my-internships',
      ),
      (
        'Review Applications',
        'Check and respond to pending applications',
        Icons.assignment_ind_rounded,
        const [Color(0xFFF59E0B), Color(0xFFF97316)],
        '/recruiter/applications',
      ),
    ];

    return Column(
      children: actions.map((a) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
          child: GestureDetector(
            onTap: () => context.push(a.$5),
            child: Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: a.$4, begin: Alignment.centerLeft, end: Alignment.centerRight),
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(color: a.$4.first.withValues(alpha: 0.3), blurRadius: 10, offset: const Offset(0, 4)),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.22), borderRadius: BorderRadius.circular(12)),
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


class _RecentApplicants extends StatelessWidget {
  final BuildContext ctx;
  const _RecentApplicants(this.ctx);

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ApplicationBloc, ApplicationState>(
      builder: (context, state) {
        if (state is! ApplicationLoaded || state.applications.isEmpty) return const SizedBox.shrink();
        final recent = state.applications.reversed.take(3).toList();

        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: SectionRow(
                title: 'Recent Activity',
                actionLabel: 'View All',
                onAction: () => context.push('/recruiter/applications'),
              ),
            ),
            const SizedBox(height: 14),
            ...recent.map((app) {
              final name = 'Applicant #${app.studentId}';
              return Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                child: AppCard(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                          ),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: Text(
                            name.isNotEmpty ? name[0] : '?',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(name, style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.darkNavy, fontSize: 14)),
                            Text('Applied · ${app.appliedDate}', style: const TextStyle(color: AppColors.mutedText, fontSize: 12)),
                          ],
                        ),
                      ),
                      StatusBadge(
                        label: app.status,
                        color: app.status == 'Completed' ? AppColors.successGreen : AppColors.primaryBlue,
                      ),
                    ],
                  ),
                ),
              );
            }),
          ],
        );
      },
    );
  }
}
