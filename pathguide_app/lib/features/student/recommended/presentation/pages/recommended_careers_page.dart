import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:pathguide_app/core/data/models.dart';
import 'package:pathguide_app/core/theme/app_colors.dart';
import 'package:pathguide_app/core/widgets/reusable_widgets.dart';
import 'package:pathguide_app/features/auth/presentation/bloc/auth_bloc.dart';

// ── Static recommended data (matches screenshot) ──────────────────────────────

class _PathInfo {
  final String title;
  final String rankLabel;
  final Color rankColor;
  final Color trophyColor;
  final int matchScore;
  final int interestMatch;
  final int skillMatch;
  final int collaborative;
  final int totalSkills;
  final int matchedSkills;
  final List<String> missingSkills;

  const _PathInfo({
    required this.title,
    required this.rankLabel,
    required this.rankColor,
    required this.trophyColor,
    required this.matchScore,
    required this.interestMatch,
    required this.skillMatch,
    required this.collaborative,
    required this.totalSkills,
    required this.matchedSkills,
    required this.missingSkills,
  });
}

const _recommendedPaths = [
  _PathInfo(
    title: 'Junior Developer',
    rankLabel: 'Best Fit',
    rankColor: AppColors.successGreen,
    trophyColor: Color(0xFFFFD700),
    matchScore: 61,
    interestMatch: 8,
    skillMatch: 83,
    collaborative: 0,
    totalSkills: 6,
    matchedSkills: 5,
    missingSkills: ['Git'],
  ),
  _PathInfo(
    title: 'Full-Stack Developer',
    rankLabel: '2nd Best',
    rankColor: Color(0xFF06B6D4),
    trophyColor: Color(0xFFC0C0C0),
    matchScore: 48,
    interestMatch: 42,
    skillMatch: 50,
    collaborative: 0,
    totalSkills: 8,
    matchedSkills: 4,
    missingSkills: ['PostgreSQL', 'React', 'Node.js', 'Express'],
  ),
  _PathInfo(
    title: 'Backend Developer',
    rankLabel: '3rd Best',
    rankColor: Color(0xFFF97316),
    trophyColor: Color(0xFFCD7F32),
    matchScore: 46,
    interestMatch: 37,
    skillMatch: 50,
    collaborative: 0,
    totalSkills: 8,
    matchedSkills: 4,
    missingSkills: ['REST APIs', 'Java', 'PostgreSQL', 'Node.js'],
  ),
];

const _allCareerPaths = [
  'Junior Developer',
  'Software Engineer',
  'Full-Stack Developer',
  'Backend Developer',
  'Frontend Developer',
  'Mobile Developer',
  'Data Scientist',
  'AI / Machine Learning Engineer',
  'Cybersecurity Analyst',
  'Cloud Engineer',
  'DevOps Engineer',
  'UI/UX Designer',
  'Game Developer',
  'Embedded Systems Engineer',
  'Data Engineer',
  'Blockchain Developer',
  'Network Engineer',
];

// ── Page ──────────────────────────────────────────────────────────────────────

class RecommendedCareersPage extends StatefulWidget {
  const RecommendedCareersPage({super.key});

  @override
  State<RecommendedCareersPage> createState() => _RecommendedCareersPageState();
}

class _RecommendedCareersPageState extends State<RecommendedCareersPage> {
  String? _dropdownValue;

  void _saveCareerPath(BuildContext context, String path, UserModel user) {
    context.read<AuthBloc>().add(UserUpdateRequested(user.copyWith(careerPath: path)));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Career path set to "$path"'),
        backgroundColor: AppColors.successGreen,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthAuthenticated) {
          final path = state.user.careerPath;
          if (path != null && path != _dropdownValue) {
            setState(() => _dropdownValue = path);
          }
        }
      },
      builder: (context, state) {
        final user = state is AuthAuthenticated ? state.user : null;
        final currentPath = user?.careerPath;
        _dropdownValue ??= currentPath ?? _allCareerPaths.first;

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
                onPressed: () {},
              ),
              const SizedBox(width: 4),
            ],
          ),
          bottomNavigationBar: const StudentBottomNav(currentIndex: 3),
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Header ────────────────────────────────────────────────
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Recommended\nCareer Paths',
                              style: TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: AppColors.darkNavy,
                                height: 1.25,
                              ),
                            ),
                            SizedBox(height: 6),
                            Text(
                              'Top 3 career paths tailored to your skills and interests',
                              style: TextStyle(fontSize: 13, color: AppColors.mutedText, height: 1.4),
                            ),
                          ],
                        ),
                      ),
                      TextButton.icon(
                        onPressed: () {},
                        icon: const Icon(Icons.refresh_rounded, size: 16),
                        label: const Text('Refresh'),
                        style: TextButton.styleFrom(
                          foregroundColor: AppColors.primaryBlue,
                          visualDensity: VisualDensity.compact,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // ── Your Career Path card ──────────────────────────────────
                  _YourCareerPathCard(
                    dropdownValue: _dropdownValue!,
                    onChanged: (v) { if (v != null) setState(() => _dropdownValue = v); },
                    onSave: user != null ? () => _saveCareerPath(context, _dropdownValue!, user) : null,
                  ),
                  const SizedBox(height: 20),

                  // ── 3 Recommended career cards ─────────────────────────────
                  ..._recommendedPaths.map((path) => _CareerCard(
                        path: path,
                        isCurrentPath: currentPath == path.title,
                        onSetPath: user != null
                            ? () => _saveCareerPath(context, path.title, user)
                            : null,
                      )),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

// ── Your Career Path card ─────────────────────────────────────────────────────

class _YourCareerPathCard extends StatelessWidget {
  final String dropdownValue;
  final ValueChanged<String?> onChanged;
  final VoidCallback? onSave;

  const _YourCareerPathCard({
    required this.dropdownValue,
    required this.onChanged,
    required this.onSave,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Your Career Path',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.darkNavy),
          ),
          const SizedBox(height: 8),
          const Text(
            'Pick your target career path. You can choose one of the recommendations below, or select any path here.',
            style: TextStyle(fontSize: 12, color: AppColors.mutedText, height: 1.5),
          ),
          const SizedBox(height: 16),
          const Text(
            'Career path',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.darkNavy),
          ),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.cardBorder),
              borderRadius: BorderRadius.circular(10),
              color: AppColors.background,
            ),
            child: DropdownButton<String>(
              value: dropdownValue,
              isExpanded: true,
              underline: const SizedBox(),
              style: const TextStyle(
                color: AppColors.darkNavy,
                fontSize: 14,
                fontWeight: FontWeight.w500,
                fontFamily: 'Poppins',
              ),
              dropdownColor: Colors.white,
              borderRadius: BorderRadius.circular(12),
              items: _allCareerPaths
                  .map((p) => DropdownMenuItem(value: p, child: Text(p)))
                  .toList(),
              onChanged: onChanged,
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: onSave,
              icon: const Icon(Icons.check_rounded, size: 16, color: Colors.white),
              label: const Text(
                'Save career path',
                style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryBlue,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(vertical: 13),
                elevation: 0,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: const [
              Icon(Icons.info_outline_rounded, size: 13, color: AppColors.mutedText),
              SizedBox(width: 5),
              Text(
                'Algorithm: content_based',
                style: TextStyle(fontSize: 11, color: AppColors.mutedText),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Career card ───────────────────────────────────────────────────────────────

class _CareerCard extends StatelessWidget {
  final _PathInfo path;
  final bool isCurrentPath;
  final VoidCallback? onSetPath;

  const _CareerCard({
    required this.path,
    required this.isCurrentPath,
    required this.onSetPath,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isCurrentPath ? AppColors.primaryBlue : AppColors.cardBorder,
          width: isCurrentPath ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: isCurrentPath
                ? AppColors.primaryBlue.withValues(alpha: 0.08)
                : Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Title row ────────────────────────────────────────────────────
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.emoji_events_rounded, color: path.trophyColor, size: 30),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      path.title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.darkNavy,
                      ),
                    ),
                    const SizedBox(height: 5),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                      decoration: BoxDecoration(
                        color: path.rankColor,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        path.rankLabel,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '${path.matchScore}%',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFFF97316),
                    ),
                  ),
                  const Text(
                    'Match Score',
                    style: TextStyle(fontSize: 10, color: AppColors.mutedText),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),

          // ── 3 stat boxes ─────────────────────────────────────────────────
          Row(
            children: [
              _StatBox(
                label: 'Interest\nMatch',
                value: '${path.interestMatch}%',
                valueColor: AppColors.dangerRed,
              ),
              const SizedBox(width: 8),
              _StatBox(
                label: 'Skill\nMatch',
                value: '${path.skillMatch}%',
                valueColor: AppColors.successGreen,
              ),
              const SizedBox(width: 8),
              _StatBox(
                label: 'Collaborative',
                value: '${path.collaborative}%',
                valueColor: AppColors.dangerRed,
              ),
            ],
          ),
          const SizedBox(height: 14),

          // ── Skills matched ────────────────────────────────────────────────
          RichText(
            text: TextSpan(
              style: const TextStyle(fontSize: 13, color: AppColors.darkNavy),
              children: [
                const TextSpan(text: 'Skills:  ', style: TextStyle(fontWeight: FontWeight.w500)),
                TextSpan(
                  text: '${path.matchedSkills} / ${path.totalSkills} matched',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),

          // ── Missing skills ────────────────────────────────────────────────
          if (path.missingSkills.isNotEmpty) ...[
            const SizedBox(height: 10),
            const Text(
              'Missing Skills:',
              style: TextStyle(fontSize: 12, color: AppColors.mutedText, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: path.missingSkills
                  .map((s) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.cardBorder),
                        ),
                        child: Text(
                          s,
                          style: const TextStyle(fontSize: 12, color: AppColors.darkNavy),
                        ),
                      ))
                  .toList(),
            ),
          ],

          const SizedBox(height: 14),
          const Divider(color: AppColors.cardBorder, height: 1),
          const SizedBox(height: 14),

          // ── CTA ───────────────────────────────────────────────────────────
          if (isCurrentPath)
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Icon(Icons.check_circle_rounded, color: AppColors.successGreen, size: 18),
                SizedBox(width: 6),
                Text(
                  'Your current career path',
                  style: TextStyle(
                    color: AppColors.successGreen,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ],
            )
          else
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: onSetPath,
                icon: const Icon(Icons.check_rounded, size: 16),
                label: const Text(
                  'Set as my career path',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primaryBlue,
                  side: const BorderSide(color: AppColors.primaryBlue, width: 1.5),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ── Stat box ──────────────────────────────────────────────────────────────────

class _StatBox extends StatelessWidget {
  final String label;
  final String value;
  final Color valueColor;

  const _StatBox({required this.label, required this.value, required this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: valueColor),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 10, color: AppColors.mutedText, height: 1.3),
            ),
          ],
        ),
      ),
    );
  }
}
