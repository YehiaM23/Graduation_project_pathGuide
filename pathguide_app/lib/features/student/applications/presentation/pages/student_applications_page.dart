import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:pathguide_app/core/theme/app_colors.dart';
import 'package:pathguide_app/core/widgets/reusable_widgets.dart';
import 'package:pathguide_app/core/data/models.dart';
import 'package:pathguide_app/features/student/applications/presentation/bloc/student_application_bloc.dart';
import 'package:pathguide_app/features/student/applications/presentation/bloc/student_application_event.dart';
import 'package:pathguide_app/features/student/applications/presentation/bloc/student_application_state.dart';

class StudentApplicationsPage extends StatefulWidget {
  const StudentApplicationsPage({super.key});

  @override
  State<StudentApplicationsPage> createState() => _StudentApplicationsPageState();
}

class _StudentApplicationsPageState extends State<StudentApplicationsPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    context.read<StudentApplicationBloc>().add(const LoadStudentApplications());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<StudentApplicationBloc, StudentApplicationState>(
      builder: (context, state) {
        if (state is StudentApplicationLoading) {
          return Scaffold(
            backgroundColor: AppColors.background,
            appBar: AppBar(
              backgroundColor: Colors.white,
              elevation: 0,
              surfaceTintColor: Colors.white,
              leading: IconButton(
                icon: const Icon(Icons.arrow_back_ios_rounded, color: AppColors.darkNavy, size: 20),
                onPressed: () => context.go('/student/dashboard'),
              ),
              title: const Text('My Applications',
                  style: TextStyle(color: AppColors.darkNavy, fontWeight: FontWeight.bold, fontSize: 18)),
            ),
            bottomNavigationBar: const StudentBottomNav(currentIndex: 2),
            body: const Center(child: CircularProgressIndicator()),
          );
        }
        final apps = state is StudentApplicationLoaded ? state.applications : <ApplicationModel>[];
        final active    = apps.where((a) => a.status == 'Pending' || a.status == 'Under Review').toList();
        final accepted  = apps.where((a) => a.status == 'Accepted').toList();
        final completed = apps.where((a) => a.status == 'Completed').toList();
        final history   = apps.where((a) => a.status == 'History').toList();

        return Scaffold(
          backgroundColor: AppColors.background,
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0,
            surfaceTintColor: Colors.white,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_rounded, color: AppColors.darkNavy, size: 20),
              onPressed: () => context.go('/student/dashboard'),
            ),
            title: const Text('My Applications',
                style: TextStyle(color: AppColors.darkNavy, fontWeight: FontWeight.bold, fontSize: 18)),
          ),
          bottomNavigationBar: const StudentBottomNav(currentIndex: 2),
          body: SafeArea(
            child: Column(
              children: [
                PageHeroBanner(
                  tag: '${apps.length} Applications',
                  tagIcon: Icons.assignment_rounded,
                  title: 'Track Your Journey',
                  subtitle: 'Stay updated on all your internship statuses.',
                  colors: const [AppColors.teal, Color(0xFF06B6D4)],
                ),
                const SizedBox(height: 16),
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: TabBar(
                    controller: _tabController,
                    isScrollable: true,
                    tabAlignment: TabAlignment.center,
                    labelColor: Colors.white,
                    unselectedLabelColor: AppColors.mutedText,
                    indicator: BoxDecoration(
                      gradient: const LinearGradient(colors: [AppColors.teal, Color(0xFF06B6D4)]),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    indicatorSize: TabBarIndicatorSize.tab,
                    dividerColor: Colors.transparent,
                    labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                    unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 12),
                    tabs: [
                      _tab('Active', active.length),
                      _tab('Accepted', accepted.length),
                      _tab('Completed', completed.length),
                      _tab('History', history.length),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildList(active, _ActiveCard.new),
                      _buildList(accepted, _AcceptedCard.new),
                      _buildList(completed, (a) => _CompletedCard(application: a, onReview: () => _showReviewDialog(a))),
                      _buildList(history, _HistoryCard.new),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Tab _tab(String label, int count) => Tab(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(label),
            if (count > 0) ...[
              const SizedBox(width: 5),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(10)),
                child: Text('$count', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            ],
          ],
        ),
      );

  Widget _buildList<T extends ApplicationModel>(List<T> items, Widget Function(T) builder) {
    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [AppColors.teal.withValues(alpha: 0.1), const Color(0xFF06B6D4).withValues(alpha: 0.1)]),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.assignment_outlined, size: 48, color: AppColors.teal),
            ),
            const SizedBox(height: 20),
            const Text('Nothing here yet', style: TextStyle(color: AppColors.darkNavy, fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 8),
            const Text('Applications will appear here as they progress.', style: TextStyle(color: AppColors.mutedText, fontSize: 14)),
          ],
        ),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
      itemCount: items.length,
      separatorBuilder: (_, __) => const SizedBox(height: 14),
      itemBuilder: (_, i) => builder(items[i]),
    );
  }

  void _showReviewDialog(ApplicationModel app) {
    double selectedRating = 0;
    final reviewController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Rate Your Experience', style: TextStyle(color: AppColors.darkNavy, fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 4),
              Text(app.internshipTitle ?? '', style: const TextStyle(color: AppColors.mutedText, fontSize: 13, fontWeight: FontWeight.w400)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Your Rating', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.darkNavy)),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (i) {
                  final filled = i < selectedRating;
                  return GestureDetector(
                    onTap: () => setDialogState(() => selectedRating = i + 1.0),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: Icon(filled ? Icons.star_rounded : Icons.star_border_rounded,
                          color: filled ? const Color(0xFFF59E0B) : AppColors.mutedText, size: 36),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 16),
              const Text('Your Review', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.darkNavy)),
              const SizedBox(height: 8),
              TextField(
                controller: reviewController,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: 'Share your experience...',
                  hintStyle: const TextStyle(color: AppColors.mutedText, fontSize: 13),
                  filled: true,
                  fillColor: AppColors.background,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.cardBorder)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.cardBorder)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.teal, width: 1.5)),
                  contentPadding: const EdgeInsets.all(12),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: AppColors.mutedText)),
            ),
            ElevatedButton(
              onPressed: () {
                if (selectedRating == 0 || reviewController.text.trim().isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please add a rating and review.'), backgroundColor: AppColors.dangerRed),
                  );
                  return;
                }
                context.read<StudentApplicationBloc>().add(SubmitStudentReview(
                  applicationId: app.id,
                  rating: selectedRating,
                  review: reviewController.text.trim(),
                ));
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Review submitted!'), backgroundColor: AppColors.successGreen),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.teal,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('Submit Review', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Card shells ─────────────────────────────────────────────────────────────

class _ActiveCard extends StatelessWidget {
  final ApplicationModel application;
  const _ActiveCard(this.application);

  @override
  Widget build(BuildContext context) {
    final isPending = application.status == 'Pending';
    final gradColors = isPending
        ? const [AppColors.teal, Color(0xFF06B6D4)]
        : const [Color(0xFFF59E0B), Color(0xFFF97316)];
    final icon = isPending ? Icons.send_rounded : Icons.hourglass_empty_rounded;
    return _AppCardShell(
      application: application,
      gradColors: gradColors,
      icon: icon,
      child: _infoRow(Icons.access_time_rounded, isPending ? 'Pending recruiter review' : 'Application under review'),
    );
  }
}

class _AcceptedCard extends StatelessWidget {
  final ApplicationModel application;
  const _AcceptedCard(this.application);

  @override
  Widget build(BuildContext context) {
    return _AppCardShell(
      application: application,
      gradColors: const [AppColors.successGreen, Color(0xFF059669)],
      icon: Icons.check_circle_rounded,
      child: _infoRow(Icons.celebration_rounded, 'Congratulations! Your application was accepted.'),
    );
  }
}

class _CompletedCard extends StatelessWidget {
  final ApplicationModel application;
  final VoidCallback onReview;
  const _CompletedCard({required this.application, required this.onReview});

  @override
  Widget build(BuildContext context) {
    return _AppCardShell(
      application: application,
      gradColors: const [Color(0xFF6366F1), Color(0xFF8B5CF6)],
      icon: Icons.stars_rounded,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (application.certificateUrl != null)
            _infoRow(Icons.verified_rounded, 'Certificate: ${application.certificateUrl}'),
          if (application.feedback != null) ...[
            const SizedBox(height: 8),
            _infoRow(Icons.format_quote_rounded, application.feedback!),
          ],
          if (application.rating != null) ...[
            const SizedBox(height: 8),
            Row(children: [
              const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 14),
              const SizedBox(width: 4),
              Text('Recruiter rated you ${application.rating!.toStringAsFixed(1)}/5',
                  style: const TextStyle(color: AppColors.mutedText, fontSize: 12)),
            ]),
          ],
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: onReview,
              icon: const Icon(Icons.rate_review_rounded, size: 16),
              label: const Text('Add Your Review', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6366F1),
                foregroundColor: Colors.white,
                minimumSize: const Size(0, 44),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _HistoryCard extends StatelessWidget {
  final ApplicationModel application;
  const _HistoryCard(this.application);

  @override
  Widget build(BuildContext context) {
    return _AppCardShell(
      application: application,
      gradColors: const [Color(0xFFEC4899), Color(0xFFF43F5E)],
      icon: Icons.history_edu_rounded,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (application.certificateUrl != null)
            _infoRow(Icons.verified_rounded, 'Certificate: ${application.certificateUrl}'),
          if (application.studentReview != null) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFEC4899).withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFEC4899).withValues(alpha: 0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Your Review', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppColors.darkNavy)),
                      RatingStars(rating: application.studentRating ?? 0, size: 12),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(application.studentReview!,
                      style: const TextStyle(color: AppColors.mutedText, fontSize: 12, height: 1.4)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ─── Shared shell ─────────────────────────────────────────────────────────────

class _AppCardShell extends StatelessWidget {
  final ApplicationModel application;
  final List<Color> gradColors;
  final IconData icon;
  final Widget child;
  const _AppCardShell({required this.application, required this.gradColors, required this.icon, required this.child});

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
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: gradColors),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 46,
                      height: 46,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(colors: gradColors),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(icon, color: Colors.white, size: 22),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(application.internshipTitle ?? 'Internship',
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.darkNavy)),
                          Text(application.companyName ?? '',
                              style: TextStyle(color: gradColors[0], fontWeight: FontWeight.w600, fontSize: 13)),
                        ],
                      ),
                    ),
                    StatusBadge(label: application.status, color: gradColors[0]),
                  ],
                ),
                const SizedBox(height: 10),
                Row(children: [
                  _mini(Icons.calendar_today_rounded, 'Applied: ${application.appliedDate}'),
                  if (application.completionDate != null) ...[
                    const SizedBox(width: 14),
                    _mini(Icons.check_rounded, 'Done: ${application.completionDate!}'),
                  ],
                ]),
                const SizedBox(height: 14),
                child,
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _mini(IconData icon, String text) => Row(children: [
    Icon(icon, size: 12, color: AppColors.mutedText),
    const SizedBox(width: 5),
    Text(text, style: const TextStyle(fontSize: 11, color: AppColors.mutedText, fontWeight: FontWeight.w500)),
  ]);
}

Widget _infoRow(IconData icon, String text) => Row(
  crossAxisAlignment: CrossAxisAlignment.start,
  children: [
    Icon(icon, size: 14, color: AppColors.mutedText),
    const SizedBox(width: 6),
    Expanded(child: Text(text, style: const TextStyle(color: AppColors.mutedText, fontSize: 12, height: 1.4))),
  ],
);
