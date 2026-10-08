import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:pathguide_app/core/theme/app_colors.dart';
import 'package:pathguide_app/core/widgets/reusable_widgets.dart';
import 'package:pathguide_app/core/data/models.dart';
import 'package:pathguide_app/features/recruiter/internships/presentation/bloc/internship_bloc.dart';

class MyInternshipsPage extends StatefulWidget {
  const MyInternshipsPage({super.key});

  @override
  State<MyInternshipsPage> createState() => _MyInternshipsPageState();
}

class _MyInternshipsPageState extends State<MyInternshipsPage> {
  @override
  void initState() {
    super.initState();
    context.read<InternshipBloc>().add(LoadMyInternships());
  }

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
          onPressed: () => context.go('/recruiter/dashboard'),
        ),
        title: const Text('My Internships',
            style: TextStyle(color: AppColors.darkNavy, fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline_rounded, color: AppColors.primaryBlue),
            onPressed: () => context.push('/recruiter/post-internship'),
          ),
        ],
      ),
      bottomNavigationBar: const RecruiterBottomNav(currentIndex: 1),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              const SectionHeader(
                title: 'Posted Opportunities',
                subtitle: 'Track and manage your internship listings.',
              ),
              const SizedBox(height: 16),
              Expanded(
                child: BlocBuilder<InternshipBloc, InternshipState>(
                  builder: (context, state) {
                    if (state is InternshipLoading) {
                      return const Center(child: CircularProgressIndicator());
                    } else if (state is InternshipLoaded) {
                      if (state.myInternships.isEmpty) {
                        return Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.work_off_outlined,
                                  size: 64,
                                  color: AppColors.mutedText.withValues(alpha: 0.5)),
                              const SizedBox(height: 16),
                              const Text('No internships posted yet.',
                                  style: TextStyle(color: AppColors.mutedText)),
                            ],
                          ),
                        );
                      }
                      return ListView.builder(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        itemCount: state.myInternships.length,
                        itemBuilder: (context, index) =>
                            _InternshipCard(internship: state.myInternships[index]),
                      );
                    } else if (state is InternshipError) {
                      return Center(child: Text(state.message));
                    }
                    return const SizedBox.shrink();
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InternshipCard extends StatelessWidget {
  final InternshipModel internship;
  const _InternshipCard({required this.internship});

  @override
  Widget build(BuildContext context) {
    final isActive = internship.isActive;

    return AppCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title + status badge
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  internship.title,
                  style: const TextStyle(
                      fontSize: 17, fontWeight: FontWeight.bold, color: AppColors.darkNavy),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              StatusBadge(
                label: isActive ? 'Active' : 'Withdrawn',
                color: isActive ? AppColors.successGreen : AppColors.mutedText,
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            internship.company,
            style: const TextStyle(color: AppColors.primaryBlue, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(Icons.location_on_outlined, size: 14, color: AppColors.mutedText),
              const SizedBox(width: 4),
              Expanded(
                child: Text(internship.location,
                    style: const TextStyle(color: AppColors.mutedText, fontSize: 13)),
              ),
              const Icon(Icons.schedule_outlined, size: 14, color: AppColors.mutedText),
              const SizedBox(width: 4),
              Text(internship.duration,
                  style: const TextStyle(color: AppColors.mutedText, fontSize: 13)),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.calendar_today_outlined, size: 14, color: AppColors.mutedText),
              const SizedBox(width: 4),
              Text('Deadline: ${internship.deadline}',
                  style: const TextStyle(color: AppColors.mutedText, fontSize: 13)),
            ],
          ),
          const SizedBox(height: 18),

          // Row 1: Edit | Withdraw / Repost
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => context.push('/recruiter/post-internship', extra: internship),
                  icon: const Icon(Icons.edit_outlined, size: 16),
                  label: const Text('Edit'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primaryBlue,
                    side: const BorderSide(color: AppColors.primaryBlue),
                    minimumSize: const Size(0, 44),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: isActive
                    ? OutlinedButton.icon(
                        onPressed: () => _confirmWithdraw(context),
                        icon: const Icon(Icons.pause_circle_outline_rounded, size: 16),
                        label: const Text('Withdraw'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.dangerRed,
                          side: const BorderSide(color: AppColors.dangerRed),
                          minimumSize: const Size(0, 44),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      )
                    : GradientButton(
                        text: 'Repost',
                        onPressed: () => context
                            .read<InternshipBloc>()
                            .add(RepostInternship(internship.id)),
                        height: 44,
                      ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Row 2: View Applicants (full width)
          GradientButton(
            text: 'View Applicants',
            onPressed: () => context.push('/recruiter/applications'),
            height: 44,
          ),
        ],
      ),
    ).withMargin(const EdgeInsets.only(bottom: 16));
  }

  void _confirmWithdraw(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Withdraw Internship',
            style: TextStyle(color: AppColors.darkNavy, fontWeight: FontWeight.bold)),
        content: Text(
            'Are you sure you want to withdraw "${internship.title}"? It will no longer be visible to candidates.\n\nYou can repost it anytime.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: AppColors.mutedText)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              context.read<InternshipBloc>().add(WithdrawInternship(internship.id));
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.dangerRed,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Withdraw', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
