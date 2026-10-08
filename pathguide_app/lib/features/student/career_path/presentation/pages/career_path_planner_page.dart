import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:pathguide_app/core/theme/app_colors.dart';
import 'package:pathguide_app/core/widgets/reusable_widgets.dart';
import 'package:pathguide_app/features/auth/presentation/bloc/auth_bloc.dart';

// ── Static career data map ────────────────────────────────────────────────────

typedef _CourseTpl = (String title, String skill, String duration);

final _careerDataMap = <String, ({List<String> requiredSkills, List<_CourseTpl> courses})>{
  'Junior Developer': (
    requiredSkills: ['HTML', 'CSS', 'JavaScript', 'Git', 'React', 'Python'],
    courses: [
      ('Introduction to Programming with Python', 'Python', '10 hrs'),
      ('HTML & CSS Fundamentals', 'HTML/CSS', '8 hrs'),
      ('JavaScript Essentials', 'JavaScript', '12 hrs'),
      ('Git & GitHub for Beginners', 'Git', '4 hrs'),
      ('React Basics for Beginners', 'React', '10 hrs'),
    ],
  ),
  'Full-Stack Developer': (
    requiredSkills: ['React', 'Node.js', 'MongoDB', 'PostgreSQL', 'Express', 'Docker', 'JavaScript', 'Python'],
    courses: [
      ('NumPy Masterclass: Python on Data Science & Machine Learning', 'Python', '5.5 hrs'),
      ('MongoDB Masterclass: Excel in NoSQL & Pass Certification!', 'MongoDB', '14.5 hrs'),
      ('React & TypeScript - The Practical Guide', 'React', '8 hrs'),
      ('Node.js, Express, MongoDB & More: The Complete Bootcamp', 'Node.js', '42 hrs'),
      ('Docker & Kubernetes: The Complete Guide', 'Docker', '22 hrs'),
    ],
  ),
  'Backend Developer': (
    requiredSkills: ['Java', 'REST APIs', 'PostgreSQL', 'Node.js', 'Docker', 'Python', 'MongoDB'],
    courses: [
      ('Java Programming Masterclass for Developers', 'Java', '80 hrs'),
      ('REST APIs with Node.js and Express', 'REST APIs', '15 hrs'),
      ('PostgreSQL & SQL Complete Developer Guide', 'PostgreSQL', '20 hrs'),
      ('Node.js: The Complete Guide to Build RESTful APIs', 'Node.js', '40 hrs'),
      ('Docker & Kubernetes Essentials', 'Docker', '22 hrs'),
    ],
  ),
  'Software Engineer': (
    requiredSkills: ['Python', 'Java', 'Docker', 'AWS', 'SQL', 'Git'],
    courses: [
      ('Data Structures & Algorithms in Python', 'Python', '30 hrs'),
      ('System Design Fundamentals', 'System Design', '15 hrs'),
      ('Java Programming Masterclass for Developers', 'Java', '40 hrs'),
      ('Docker & Kubernetes: The Complete Guide', 'Docker', '22 hrs'),
      ('Cloud Fundamentals with AWS', 'AWS', '18 hrs'),
    ],
  ),
  'Frontend Developer': (
    requiredSkills: ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript', 'Figma'],
    courses: [
      ('HTML & CSS Deep Dive: From Basics to Advanced', 'HTML/CSS', '12 hrs'),
      ('JavaScript: The Complete Guide 2024', 'JavaScript', '20 hrs'),
      ('React & TypeScript - The Practical Guide', 'React', '8 hrs'),
      ('TypeScript Masterclass', 'TypeScript', '10 hrs'),
      ('Figma UI Design for Developers', 'Figma', '6 hrs'),
    ],
  ),
  'Mobile Developer': (
    requiredSkills: ['Flutter', 'Dart', 'Firebase', 'REST APIs', 'Swift', 'Kotlin'],
    courses: [
      ('Flutter & Dart - The Complete Guide', 'Flutter', '42 hrs'),
      ('Firebase for Flutter Apps', 'Firebase', '8 hrs'),
      ('iOS & Swift: The Complete App Development Bootcamp', 'Swift', '55 hrs'),
      ('Android with Kotlin: Complete Bootcamp', 'Kotlin', '30 hrs'),
      ('REST APIs for Mobile Developers', 'REST APIs', '10 hrs'),
    ],
  ),
  'Data Scientist': (
    requiredSkills: ['Python', 'NumPy', 'Pandas', 'TensorFlow', 'SQL', 'Tableau', 'PyTorch'],
    courses: [
      ('NumPy Masterclass: Python on Data Science & Machine Learning', 'NumPy', '5.5 hrs'),
      ('Python for Data Science and Machine Learning Bootcamp', 'Python', '25 hrs'),
      ('Pandas Data Analysis Masterclass', 'Pandas', '10 hrs'),
      ('TensorFlow Developer Certificate Prep', 'TensorFlow', '15 hrs'),
      ('Tableau 2024 A-Z: Hands-On Tableau Training', 'Tableau', '8 hrs'),
    ],
  ),
};

// ── Fallback data ─────────────────────────────────────────────────────────────

final _defaultData = _careerDataMap['Full-Stack Developer']!;

// ── Course model ──────────────────────────────────────────────────────────────

class _CourseData {
  final String title;
  final String skill;
  final String duration;
  bool isCompleted = false;
  String? certificateUrl;
  double? rating;
  String? review;

  _CourseData({required this.title, required this.skill, required this.duration});
}

// ── Widget ────────────────────────────────────────────────────────────────────

class CareerPathPlannerPage extends StatefulWidget {
  const CareerPathPlannerPage({super.key});

  @override
  State<CareerPathPlannerPage> createState() => _CareerPathPlannerPageState();
}

class _CareerPathPlannerPageState extends State<CareerPathPlannerPage> {
  List<_CourseData> _courses = [];
  String _lastCareerPath = '';

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_courses.isEmpty) {
      final state = context.read<AuthBloc>().state;
      final path = state is AuthAuthenticated
          ? (state.user.careerPath ?? 'Full-Stack Developer')
          : 'Full-Stack Developer';
      _syncCourses(path);
    }
  }

  void _syncCourses(String path) {
    _lastCareerPath = path;
    final data = _careerDataMap[path] ?? _defaultData;
    _courses = data.courses
        .map((c) => _CourseData(title: c.$1, skill: c.$2, duration: c.$3))
        .toList();
  }

  int get _completedCount => _courses.where((c) => c.isCompleted).length;
  double get _progress => _courses.isEmpty ? 0 : _completedCount / _courses.length;

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        final user = state is AuthAuthenticated ? state.user : null;
        final careerPath = user?.careerPath ?? 'Full-Stack Developer';
        final userSkills = user?.skills ?? const [];

        // Reinit courses when career path changes
        if (_lastCareerPath != careerPath) {
          _syncCourses(careerPath);
        }

        final careerData = _careerDataMap[careerPath] ?? _defaultData;
        final requiredSkills = careerData.requiredSkills;
        final userSkillsLower = userSkills.map((s) => s.toLowerCase()).toSet();
        final missingSkills = requiredSkills
            .where((s) => !userSkillsLower.contains(s.toLowerCase()))
            .toList();

        return Scaffold(
          backgroundColor: AppColors.background,
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0,
            surfaceTintColor: Colors.white,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_rounded, color: AppColors.darkNavy, size: 20),
              onPressed: () => context.canPop() ? context.pop() : context.go('/student/dashboard'),
            ),
            title: const Text(
              'Career Path Planner',
              style: TextStyle(color: AppColors.darkNavy, fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ),
          bottomNavigationBar: const StudentBottomNav(currentIndex: 4),
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionHeader(
                    title: 'Your Roadmap',
                    subtitle: 'Track your personalized learning path to your dream career.',
                  ),
                  const SizedBox(height: 32),
                  _buildCareerGoalCard(context, careerPath),
                  const SizedBox(height: 16),
                  _buildCurrentSkillsCard(userSkills),
                  const SizedBox(height: 32),
                  SectionHeader(
                    title: 'Path to $careerPath',
                    subtitle: 'A data-driven curriculum based on current industry requirements.',
                  ),
                  const SizedBox(height: 20),
                  _buildSummaryStats(requiredSkills.length, missingSkills.length),
                  const SizedBox(height: 32),
                  _buildRequiredSkillsSection(requiredSkills, userSkillsLower),
                  const SizedBox(height: 24),
                  _buildSkillsToLearnSection(missingSkills),
                  const SizedBox(height: 32),
                  const SectionHeader(
                    title: 'Learning Journey',
                    subtitle: 'Follow these courses in order to build your skills progressively.',
                  ),
                  const SizedBox(height: 16),
                  _buildProgressBar(),
                  const SizedBox(height: 24),
                  ..._courses.asMap().entries.map((e) => Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: _buildCourseItem(e.value, e.key),
                      )),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  // ─── Career goal card ──────────────────────────────────────────────────────

  Widget _buildCareerGoalCard(BuildContext context, String careerPath) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Career Goal',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.mutedText),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      careerPath,
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primaryBlue),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.primaryBlue.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.stars_rounded, color: AppColors.primaryBlue),
              ),
            ],
          ),
          const Divider(height: 32),
          Row(
            children: [
              const Icon(Icons.info_outline, size: 16, color: AppColors.mutedText),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Based on your profile settings and interests.',
                  style: TextStyle(color: AppColors.mutedText, fontSize: 12),
                ),
              ),
              TextButton(
                onPressed: () => context.go('/student/recommended'),
                style: TextButton.styleFrom(visualDensity: VisualDensity.compact),
                child: const Text('Change Goal', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ─── Current skills card ───────────────────────────────────────────────────

  Widget _buildCurrentSkillsCard(List<String> skills) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Your Current Arsenal',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.darkNavy),
          ),
          const SizedBox(height: 4),
          const Text(
            'Skills already in your profile.',
            style: TextStyle(color: AppColors.mutedText, fontSize: 13),
          ),
          const SizedBox(height: 20),
          skills.isEmpty
              ? const Text(
                  'No skills added yet. Update your profile to add skills.',
                  style: TextStyle(color: AppColors.mutedText, fontSize: 13, fontStyle: FontStyle.italic),
                )
              : Wrap(
                  spacing: 8,
                  runSpacing: 10,
                  children: skills.map((s) => SkillChip(label: s, isSelected: true)).toList(),
                ),
        ],
      ),
    );
  }

  // ─── Summary stats ─────────────────────────────────────────────────────────

  Widget _buildSummaryStats(int totalRequired, int missingCount) {
    final totalHrs = _courses.fold(0.0, (sum, c) {
      final n = double.tryParse(c.duration.replaceAll(RegExp(r'[^\d.]'), '')) ?? 0;
      return sum + n;
    });

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 1.5,
      children: [
        _statCard('Total Courses', '${_courses.length}', AppColors.primaryBlue, Icons.library_books_rounded),
        _statCard('Skills to Gain', '$missingCount', AppColors.teal, Icons.auto_awesome_rounded),
        _statCard('Learning Time', '${totalHrs.toStringAsFixed(0)} hrs', AppColors.warningYellow, Icons.timer_rounded),
        _statCard('Industry Skills', '$totalRequired', AppColors.primaryBlue, Icons.event_available_rounded),
      ],
    );
  }

  Widget _statCard(String label, String value, Color color, IconData icon) {
    return AppCard(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(icon, size: 20, color: color),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(value,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.darkNavy)),
              Text(label,
                  style: const TextStyle(color: AppColors.mutedText, fontSize: 10, fontWeight: FontWeight.w500)),
            ],
          ),
        ],
      ),
    );
  }

  // ─── Required skills ───────────────────────────────────────────────────────

  Widget _buildRequiredSkillsSection(List<String> required, Set<String> userSkillsLower) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Industry Requirements',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.darkNavy)),
          const SizedBox(height: 4),
          const Text('Skills typically required for this role.',
              style: TextStyle(color: AppColors.mutedText, fontSize: 13)),
          const SizedBox(height: 20),
          Wrap(
            spacing: 8,
            runSpacing: 10,
            children: required
                .map((s) => _SkillCheckChip(
                      label: s,
                      isDone: userSkillsLower.contains(s.toLowerCase()),
                    ))
                .toList(),
          ),
        ],
      ),
    );
  }

  // ─── Skills to learn ───────────────────────────────────────────────────────

  Widget _buildSkillsToLearnSection(List<String> missing) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Your Gap Analysis',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.darkNavy)),
          const SizedBox(height: 4),
          const Text('Missing skills you need to acquire.',
              style: TextStyle(color: AppColors.mutedText, fontSize: 13)),
          const SizedBox(height: 20),
          missing.isEmpty
              ? const Row(
                  children: [
                    Icon(Icons.check_circle_rounded, color: AppColors.successGreen, size: 18),
                    SizedBox(width: 8),
                    Text('You have all required skills!',
                        style: TextStyle(color: AppColors.successGreen, fontWeight: FontWeight.bold, fontSize: 13)),
                  ],
                )
              : Wrap(
                  spacing: 8,
                  runSpacing: 10,
                  children: missing.map((s) => SkillChip(label: s)).toList(),
                ),
        ],
      ),
    );
  }

  // ─── Progress bar ──────────────────────────────────────────────────────────

  Widget _buildProgressBar() {
    final pct = (_progress * 100).toStringAsFixed(0);
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 12, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Overall Progress',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.darkNavy)),
                  const SizedBox(height: 2),
                  Text('$_completedCount of ${_courses.length} courses completed',
                      style: const TextStyle(color: AppColors.mutedText, fontSize: 12)),
                ],
              ),
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [AppColors.primaryBlue, AppColors.teal]),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Center(
                  child: Text('$pct%',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: _progress),
              duration: const Duration(milliseconds: 600),
              curve: Curves.easeOut,
              builder: (_, value, __) => LinearProgressIndicator(
                value: value,
                minHeight: 10,
                backgroundColor: AppColors.background,
                valueColor: const AlwaysStoppedAnimation(AppColors.primaryBlue),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: _courses.asMap().entries.map((e) {
              final done = e.value.isCompleted;
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 2),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 400),
                    height: 4,
                    decoration: BoxDecoration(
                      color: done ? AppColors.successGreen : AppColors.cardBorder,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          if (_completedCount == _courses.length && _courses.isNotEmpty) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.successGreen.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.successGreen.withValues(alpha: 0.3)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.emoji_events_rounded, color: AppColors.successGreen, size: 18),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'All courses completed! You\'re career-ready 🚀',
                      style: TextStyle(color: AppColors.successGreen, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ─── Course card ───────────────────────────────────────────────────────────

  Widget _buildCourseItem(_CourseData course, int index) {
    final isCurrent = !course.isCompleted && index == _courses.indexWhere((c) => !c.isCompleted);
    final color = course.isCompleted
        ? AppColors.successGreen
        : (isCurrent ? AppColors.primaryBlue : AppColors.cardBorder);

    return AppCard(
      padding: EdgeInsets.zero,
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              width: 6,
              decoration: BoxDecoration(
                color: color,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(20),
                  bottomLeft: Radius.circular(20),
                ),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        if (course.isCompleted)
                          const Padding(
                            padding: EdgeInsets.only(right: 8),
                            child: Icon(Icons.check_circle, color: AppColors.successGreen, size: 18),
                          ),
                        Expanded(
                          child: Text(
                            course.title,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                              color: course.isCompleted ? AppColors.mutedText : AppColors.darkNavy,
                              decoration: course.isCompleted ? TextDecoration.lineThrough : null,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        StatusBadge(
                          label: course.skill,
                          color: course.isCompleted ? AppColors.mutedText : AppColors.primaryBlue,
                        ),
                        const SizedBox(width: 12),
                        const Icon(Icons.access_time, size: 14, color: AppColors.mutedText),
                        const SizedBox(width: 4),
                        Text(course.duration,
                            style: const TextStyle(color: AppColors.mutedText, fontSize: 12)),
                        const Spacer(),
                        if (isCurrent)
                          const StatusBadge(label: 'In Progress', color: AppColors.primaryBlue),
                      ],
                    ),
                    if (course.isCompleted && course.rating != null) ...[
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          RatingStars(rating: course.rating!, size: 13),
                          const SizedBox(width: 8),
                          if (course.review != null)
                            Expanded(
                              child: Text(
                                '"${course.review!}"',
                                style: const TextStyle(
                                  color: AppColors.mutedText,
                                  fontSize: 11,
                                  fontStyle: FontStyle.italic,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                        ],
                      ),
                    ],
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () {},
                            style: OutlinedButton.styleFrom(
                              minimumSize: const Size(0, 44),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            child: const Text('View Details'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: course.isCompleted ? null : () => _showMarkCompleteDialog(course),
                            style: ElevatedButton.styleFrom(
                              minimumSize: const Size(0, 44),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              backgroundColor: course.isCompleted ? AppColors.successGreen : null,
                              disabledBackgroundColor: AppColors.successGreen,
                              disabledForegroundColor: Colors.white,
                            ),
                            child: Text(course.isCompleted ? 'Completed' : 'Complete'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Mark complete dialog ──────────────────────────────────────────────────

  void _showMarkCompleteDialog(_CourseData course) {
    final certController = TextEditingController();
    double selectedRating = 0;
    final reviewController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text('Complete Course',
              style: TextStyle(color: AppColors.darkNavy, fontWeight: FontWeight.bold, fontSize: 16)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primaryBlue.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.primaryBlue.withValues(alpha: 0.15)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.menu_book_rounded, color: AppColors.primaryBlue, size: 18),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(course.title,
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold, fontSize: 12, color: AppColors.darkNavy)),
                            const SizedBox(height: 2),
                            Text('${course.skill} · ${course.duration}',
                                style: const TextStyle(color: AppColors.mutedText, fontSize: 11)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                AppTextField(
                  label: 'Certificate URL (optional)',
                  hint: 'https://coursera.org/verify/...',
                  controller: certController,
                  prefixIcon: Icons.verified_rounded,
                ),
                const SizedBox(height: 6),
                const Text(
                  'Paste a link to your certificate from Coursera, Udemy, etc.',
                  style: TextStyle(fontSize: 10, color: AppColors.mutedText),
                ),
                const SizedBox(height: 20),
                const Text('Rate This Course',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.darkNavy)),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(5, (i) {
                    final filled = i < selectedRating;
                    return GestureDetector(
                      onTap: () => setDialogState(() => selectedRating = i + 1.0),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: Icon(
                          filled ? Icons.star_rounded : Icons.star_border_rounded,
                          color: filled ? const Color(0xFFF59E0B) : AppColors.mutedText,
                          size: 34,
                        ),
                      ),
                    );
                  }),
                ),
                const SizedBox(height: 20),
                AppTextField(
                  label: 'Your Review (optional)',
                  hint: 'Share what you learned...',
                  controller: reviewController,
                  maxLines: 3,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: AppColors.mutedText)),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                setState(() {
                  course.isCompleted = true;
                  course.certificateUrl =
                      certController.text.trim().isEmpty ? null : certController.text.trim();
                  course.rating = selectedRating == 0 ? null : selectedRating;
                  course.review =
                      reviewController.text.trim().isEmpty ? null : reviewController.text.trim();
                });
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Course marked as complete! Progress updated.'),
                    backgroundColor: AppColors.successGreen,
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryBlue,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('Mark Complete',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Skill check chip ──────────────────────────────────────────────────────────

class _SkillCheckChip extends StatelessWidget {
  final String label;
  final bool isDone;
  const _SkillCheckChip({required this.label, required this.isDone});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: isDone ? AppColors.successGreen.withValues(alpha: 0.1) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDone ? AppColors.successGreen : AppColors.cardBorder),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (isDone) const Icon(Icons.check, color: AppColors.successGreen, size: 14),
          if (isDone) const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              color: isDone ? AppColors.successGreen : AppColors.mutedText,
              fontSize: 12,
              fontWeight: isDone ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }
}
