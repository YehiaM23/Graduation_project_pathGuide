import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:pathguide_app/core/theme/app_colors.dart';
import 'package:pathguide_app/core/widgets/reusable_widgets.dart';
import 'package:pathguide_app/core/data/models.dart';
import 'package:pathguide_app/features/recruiter/applications/presentation/bloc/application_bloc.dart';
import 'package:pathguide_app/features/recruiter/applications/presentation/bloc/application_event.dart';
import 'package:pathguide_app/features/recruiter/applications/presentation/bloc/application_state.dart';

class AllApplicationsPage extends StatefulWidget {
  const AllApplicationsPage({super.key});

  @override
  State<AllApplicationsPage> createState() => _AllApplicationsPageState();
}

class _AllApplicationsPageState extends State<AllApplicationsPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    context.read<ApplicationBloc>().add(LoadApplications());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
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
        title: const Text('Applications',
            style: TextStyle(color: AppColors.darkNavy, fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      bottomNavigationBar: const RecruiterBottomNav(currentIndex: 2),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Column(
                children: [
                  const SectionHeader(
                    title: 'Review Applicants',
                    subtitle: 'Manage and track applications for your posted internships.',
                  ),
                  const SizedBox(height: 16),
                  BlocBuilder<ApplicationBloc, ApplicationState>(
                    builder: (context, state) {
                      final apps = state is ApplicationLoaded ? state.applications : <ApplicationModel>[];
                      final pending = apps.where((a) => a.status == 'Pending').length;
                      final accepted = apps.where((a) => a.status == 'Accepted').length;
                      final completed = apps.where((a) => a.status == 'Completed').length;
                      return TabBar(
                        controller: _tabController,
                        labelColor: AppColors.primaryBlue,
                        unselectedLabelColor: AppColors.mutedText,
                        indicatorColor: AppColors.primaryBlue,
                        indicatorSize: TabBarIndicatorSize.label,
                        indicatorWeight: 3,
                        labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
                        tabs: [
                          Tab(text: 'Pending${pending > 0 ? ' ($pending)' : ''}'),
                          Tab(text: 'Accepted${accepted > 0 ? ' ($accepted)' : ''}'),
                          Tab(text: 'Completed${completed > 0 ? ' ($completed)' : ''}'),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
            Expanded(
              child: BlocBuilder<ApplicationBloc, ApplicationState>(
                builder: (context, state) {
                  if (state is ApplicationLoading) {
                    return const Center(child: CircularProgressIndicator());
                  } else if (state is ApplicationLoaded) {
                    return TabBarView(
                      controller: _tabController,
                      children: [
                        _AppList(
                          apps: state.applications.where((a) => a.status == 'Pending').toList(),
                          emptyLabel: 'No pending applications',
                          emptyIcon: Icons.hourglass_empty_rounded,
                          cardBuilder: (app) => _PendingCard(app: app),
                        ),
                        _AppList(
                          apps: state.applications.where((a) => a.status == 'Accepted').toList(),
                          emptyLabel: 'No accepted applications',
                          emptyIcon: Icons.check_circle_outline_rounded,
                          cardBuilder: (app) => _AcceptedCard(app: app),
                        ),
                        _AppList(
                          apps: state.applications.where((a) => a.status == 'Completed').toList(),
                          emptyLabel: 'No completed internships',
                          emptyIcon: Icons.workspace_premium_outlined,
                          cardBuilder: (app) => _CompletedCard(app: app),
                        ),
                      ],
                    );
                  } else if (state is ApplicationError) {
                    return Center(child: Text(state.message));
                  }
                  return const SizedBox.shrink();
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Generic list wrapper ────────────────────────────────────────────────────

class _AppList extends StatelessWidget {
  final List<ApplicationModel> apps;
  final String emptyLabel;
  final IconData emptyIcon;
  final Widget Function(ApplicationModel) cardBuilder;

  const _AppList({
    required this.apps,
    required this.emptyLabel,
    required this.emptyIcon,
    required this.cardBuilder,
  });

  @override
  Widget build(BuildContext context) {
    if (apps.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(emptyIcon, size: 64, color: AppColors.mutedText.withValues(alpha: 0.4)),
            const SizedBox(height: 16),
            Text(emptyLabel, style: const TextStyle(color: AppColors.mutedText, fontSize: 15)),
          ],
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
      itemCount: apps.length,
      itemBuilder: (_, i) => cardBuilder(apps[i]),
    );
  }
}

// ─── Pending card ────────────────────────────────────────────────────────────

class _PendingCard extends StatelessWidget {
  final ApplicationModel app;
  const _PendingCard({required this.app});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StudentHeader(app: app, badgeLabel: 'Pending', badgeColor: const Color(0xFFF59E0B)),
          const SizedBox(height: 8),
          _InfoRow(icon: Icons.calendar_today_outlined, text: 'Applied: ${app.appliedDate}'),
          if (app.internshipTitle != null) ...[
            const SizedBox(height: 4),
            _InfoRow(icon: Icons.work_outline_rounded, text: app.internshipTitle!),
          ],
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _confirmReject(context),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.dangerRed,
                    side: const BorderSide(color: AppColors.dangerRed),
                    minimumSize: const Size(0, 44),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Reject'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: GradientButton(
                  text: 'Accept',
                  onPressed: () => context.read<ApplicationBloc>().add(
                        UpdateApplicationStatus(applicationId: app.id, status: 'Accepted'),
                      ),
                  height: 44,
                ),
              ),
            ],
          ),
        ],
      ),
    ).withMargin(const EdgeInsets.only(bottom: 16));
  }

  void _confirmReject(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Reject Application', style: TextStyle(color: AppColors.darkNavy, fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to reject ${app.studentName ?? "this applicant"}\'s application? This cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: AppColors.mutedText)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              context.read<ApplicationBloc>().add(DeleteApplication(app.id));
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.dangerRed,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Reject', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}

// ─── Accepted card ───────────────────────────────────────────────────────────

class _AcceptedCard extends StatelessWidget {
  final ApplicationModel app;
  const _AcceptedCard({required this.app});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StudentHeader(app: app, badgeLabel: 'Accepted', badgeColor: AppColors.successGreen),
          const SizedBox(height: 8),
          _InfoRow(icon: Icons.calendar_today_outlined, text: 'Applied: ${app.appliedDate}'),
          if (app.internshipTitle != null) ...[
            const SizedBox(height: 4),
            _InfoRow(icon: Icons.work_outline_rounded, text: app.internshipTitle!),
          ],
          const SizedBox(height: 20),
          GradientButton(
            text: 'Complete Internship',
            onPressed: () => _showCompletionDialog(context),
            height: 44,
          ),
        ],
      ),
    ).withMargin(const EdgeInsets.only(bottom: 16));
  }

  void _showCompletionDialog(BuildContext context) {
    final certController = TextEditingController();
    final feedbackController = TextEditingController();
    double rating = 4.0;

    showDialog(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (dialogCtx, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [AppColors.primaryBlue, AppColors.teal]),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.workspace_premium_rounded, color: Colors.white, size: 18),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Text('Complete Internship',
                    style: TextStyle(color: AppColors.darkNavy, fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Finalize ${app.studentName ?? "the intern"}\'s internship by adding a certificate and your feedback.',
                  style: const TextStyle(color: AppColors.mutedText, fontSize: 13, height: 1.4),
                ),
                const SizedBox(height: 20),
                const Text('Certificate ID / Number',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.darkNavy)),
                const SizedBox(height: 8),
                TextField(
                  controller: certController,
                  decoration: InputDecoration(
                    hintText: 'e.g. CERT-2026-001',
                    hintStyle: const TextStyle(color: AppColors.mutedText, fontSize: 13),
                    prefixIcon: const Icon(Icons.verified_outlined, color: AppColors.primaryBlue, size: 18),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.cardBorder)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.cardBorder)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primaryBlue, width: 1.5)),
                  ),
                ),
                const SizedBox(height: 16),
                const Text('Feedback / Evaluation',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.darkNavy)),
                const SizedBox(height: 8),
                TextField(
                  controller: feedbackController,
                  maxLines: 3,
                  decoration: InputDecoration(
                    hintText: 'Write your feedback about the intern...',
                    hintStyle: const TextStyle(color: AppColors.mutedText, fontSize: 13),
                    contentPadding: const EdgeInsets.all(16),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.cardBorder)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.cardBorder)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primaryBlue, width: 1.5)),
                  ),
                ),
                const SizedBox(height: 16),
                const Text('Performance Rating',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.darkNavy)),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(5, (i) {
                    return GestureDetector(
                      onTap: () => setDialogState(() => rating = (i + 1).toDouble()),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: Icon(
                          i < rating ? Icons.star_rounded : Icons.star_outline_rounded,
                          color: Colors.amber,
                          size: 34,
                        ),
                      ),
                    );
                  }),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogCtx),
              child: const Text('Cancel', style: TextStyle(color: AppColors.mutedText)),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(dialogCtx);
                context.read<ApplicationBloc>().add(
                      UpdateApplicationStatus(
                        applicationId: app.id,
                        status: 'Completed',
                        feedback: feedbackController.text.trim().isEmpty ? null : feedbackController.text.trim(),
                        rating: rating,
                        certificateId: certController.text.trim().isEmpty ? null : certController.text.trim(),
                      ),
                    );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryBlue,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('Submit & Complete', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Completed card ──────────────────────────────────────────────────────────

class _CompletedCard extends StatelessWidget {
  final ApplicationModel app;
  const _CompletedCard({required this.app});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StudentHeader(app: app, badgeLabel: 'Completed', badgeColor: AppColors.primaryBlue),
          if (app.internshipTitle != null) ...[
            const SizedBox(height: 8),
            _InfoRow(icon: Icons.work_outline_rounded, text: app.internshipTitle!),
          ],
          if (app.completionDate != null) ...[
            const SizedBox(height: 4),
            _InfoRow(icon: Icons.event_available_rounded, text: 'Completed: ${app.completionDate}'),
          ],
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.primaryBlue.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.primaryBlue.withValues(alpha: 0.15)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (app.certificateUrl != null) ...[
                  Row(
                    children: [
                      const Icon(Icons.verified_rounded, size: 16, color: AppColors.primaryBlue),
                      const SizedBox(width: 8),
                      const Text('Certificate ID: ',
                          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.darkNavy)),
                      Expanded(
                        child: Text(app.certificateUrl!,
                            style: const TextStyle(fontSize: 13, color: AppColors.primaryBlue, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                ],
                if (app.rating != null) ...[
                  Row(
                    children: [
                      ...List.generate(5, (i) => Icon(
                            i < (app.rating ?? 0) ? Icons.star_rounded : Icons.star_outline_rounded,
                            color: Colors.amber,
                            size: 18,
                          )),
                      const SizedBox(width: 6),
                      Text('${app.rating?.toStringAsFixed(1)}/5.0',
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.darkNavy)),
                    ],
                  ),
                  const SizedBox(height: 10),
                ],
                if (app.feedback != null && app.feedback!.isNotEmpty)
                  Text(
                    '"${app.feedback}"',
                    style: const TextStyle(fontSize: 13, color: AppColors.mutedText, fontStyle: FontStyle.italic, height: 1.4),
                  ),
              ],
            ),
          ),
        ],
      ),
    ).withMargin(const EdgeInsets.only(bottom: 16));
  }
}

// ─── Shared widgets ──────────────────────────────────────────────────────────

class _StudentHeader extends StatelessWidget {
  final ApplicationModel app;
  final String badgeLabel;
  final Color badgeColor;

  const _StudentHeader({required this.app, required this.badgeLabel, required this.badgeColor});

  @override
  Widget build(BuildContext context) {
    final name = app.studentName ?? 'Applicant #${app.studentId}';
    return Row(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: AppColors.primaryBlue.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: Text(
              name[0].toUpperCase(),
              style: const TextStyle(fontSize: 20, color: AppColors.primaryBlue, fontWeight: FontWeight.bold),
            ),
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(name,
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.darkNavy)),
              if (app.studentEmail != null)
                Text(app.studentEmail!,
                    style: const TextStyle(fontSize: 12, color: AppColors.mutedText)),
            ],
          ),
        ),
        StatusBadge(label: badgeLabel, color: badgeColor),
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _InfoRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppColors.mutedText),
        const SizedBox(width: 6),
        Expanded(child: Text(text, style: const TextStyle(fontSize: 13, color: AppColors.mutedText))),
      ],
    );
  }
}
