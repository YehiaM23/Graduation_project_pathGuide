import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pathguide_app/core/theme/app_colors.dart';
import 'package:pathguide_app/core/widgets/reusable_widgets.dart';

class AboutPage extends StatelessWidget {
  const AboutPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          _HeroSliver(),
          SliverToBoxAdapter(child: _MissionSection()),
          SliverToBoxAdapter(child: _HowItWorksSection()),
          SliverToBoxAdapter(child: _ValuesSection()),
          const SliverToBoxAdapter(child: SizedBox(height: 40)),
        ],
      ),
    );
  }
}

// ── Hero ──────────────────────────────────────────────────────────────────────

class _HeroSliver extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SliverAppBar(
      expandedHeight: 260,
      pinned: true,
      backgroundColor: AppColors.primaryBlue,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_ios_rounded, color: Colors.white, size: 20),
        onPressed: () => context.pop(),
      ),
      title: const Text('About Us', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            // gradient background
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.primaryBlue, AppColors.teal],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
            ),
            // decorative floating circles
            Positioned(top: -30, right: -20, child: _Circle(120, Colors.white, 0.06)),
            Positioned(top: 60, right: 30, child: _Circle(60, Colors.white, 0.1)),
            Positioned(bottom: 20, left: -30, child: _Circle(100, Colors.white, 0.07)),
            // content
            Positioned(
              bottom: 30,
              left: 20,
              right: 20,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.explore_rounded, color: Colors.white, size: 13),
                        SizedBox(width: 6),
                        Text('Since 2024 · Egypt', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Bridging Academia\n& Industry',
                    style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold, height: 1.2),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Empowering every student to discover their\nunique career path with confidence.',
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 13, height: 1.5),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Circle extends StatelessWidget {
  final double size;
  final Color color;
  final double opacity;
  const _Circle(this.size, this.color, this.opacity);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withValues(alpha: opacity),
      ),
    );
  }
}

// ── Mission ───────────────────────────────────────────────────────────────────

class _MissionSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionLabel('Our Mission', Icons.rocket_launch_rounded, const [AppColors.primaryBlue, AppColors.teal]),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.cardBorder),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 12, offset: const Offset(0, 4))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '"Every student deserves a clear path to their dream career."',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: AppColors.darkNavy,
                    fontStyle: FontStyle.italic,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 14),
                const Text(
                  'PathGuide was built to eliminate confusion and uncertainty from the career journey. We connect university students with real internships, personalized career guidance, and the skills they need — all in one place.',
                  style: TextStyle(color: AppColors.mutedText, fontSize: 13, height: 1.7),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [AppColors.primaryBlue.withValues(alpha: 0.06), AppColors.teal.withValues(alpha: 0.06)]),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.format_quote_rounded, color: AppColors.primaryBlue, size: 28),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Empowering the next generation of Egyptian tech talent.',
                          style: TextStyle(color: AppColors.primaryBlue, fontWeight: FontWeight.w600, fontSize: 13, height: 1.4),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── How It Works ──────────────────────────────────────────────────────────────

class _HowItWorksSection extends StatelessWidget {
  static const _steps = [
    (Icons.person_add_rounded, 'Create Your Profile', 'Sign up and fill in your skills, education, and career interests.', [AppColors.primaryBlue, AppColors.teal]),
    (Icons.auto_awesome_rounded, 'Get AI Recommendations', 'Our engine analyses your profile and suggests the best career paths and internships for you.', [Color(0xFF6366F1), Color(0xFF8B5CF6)]),
    (Icons.work_rounded, 'Apply to Internships', 'Browse curated opportunities and apply with one tap — no CV building needed.', [AppColors.teal, Color(0xFF06B6D4)]),
    (Icons.trending_up_rounded, 'Grow Your Career', 'Track applications, collect feedback, earn certificates, and level up.', [Color(0xFFF59E0B), Color(0xFFF97316)]),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionLabel('How It Works', Icons.settings_suggest_rounded, const [Color(0xFF6366F1), Color(0xFF8B5CF6)]),
          const SizedBox(height: 16),
          ...List.generate(_steps.length, (i) {
            final s = _steps[i];
            return _StepTile(step: i + 1, icon: s.$1, title: s.$2, body: s.$3, colors: s.$4, isLast: i == _steps.length - 1);
          }),
        ],
      ),
    );
  }
}

class _StepTile extends StatelessWidget {
  final int step;
  final IconData icon;
  final String title;
  final String body;
  final List<Color> colors;
  final bool isLast;

  const _StepTile({required this.step, required this.icon, required this.title, required this.body, required this.colors, required this.isLast});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: colors),
                shape: BoxShape.circle,
                boxShadow: [BoxShadow(color: colors.first.withValues(alpha: 0.35), blurRadius: 10, offset: const Offset(0, 4))],
              ),
              child: Icon(icon, color: Colors.white, size: 20),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 50,
                margin: const EdgeInsets.symmetric(vertical: 4),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [colors.last, colors.last.withValues(alpha: 0.1)],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
          ],
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Padding(
            padding: EdgeInsets.only(bottom: isLast ? 0 : 8),
            child: Container(
              padding: const EdgeInsets.all(16),
              margin: const EdgeInsets.only(bottom: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.cardBorder),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 8, offset: const Offset(0, 3))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 22,
                        height: 22,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(colors: colors),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Center(
                          child: Text('$step', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11)),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.darkNavy)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(body, style: const TextStyle(color: AppColors.mutedText, fontSize: 13, height: 1.5)),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

// ── Values ────────────────────────────────────────────────────────────────────

class _ValuesSection extends StatelessWidget {
  static const _values = [
    (Icons.diversity_3_rounded, 'Inclusivity', 'Open to every student regardless of university or background.', [Color(0xFFEC4899), Color(0xFFF43F5E)]),
    (Icons.bolt_rounded, 'Innovation', 'AI-powered tools that make guidance fast and personalised.', [Color(0xFFF59E0B), Color(0xFFF97316)]),
    (Icons.handshake_rounded, 'Trust', 'Verified recruiters and transparent application tracking.', [AppColors.teal, Color(0xFF06B6D4)]),
    (Icons.emoji_events_rounded, 'Excellence', 'We measure success by the careers we help launch.', [Color(0xFF6366F1), Color(0xFF8B5CF6)]),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionLabel('Our Values', Icons.favorite_rounded, const [Color(0xFFEC4899), Color(0xFFF43F5E)]),
          const SizedBox(height: 16),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.1,
            children: _values.map((v) => _ValueCard(icon: v.$1, title: v.$2, body: v.$3, colors: v.$4)).toList(),
          ),
        ],
      ),
    );
  }
}

class _ValueCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String body;
  final List<Color> colors;
  const _ValueCard({required this.icon, required this.title, required this.body, required this.colors});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [colors[0].withValues(alpha: 0.08), colors[1].withValues(alpha: 0.04)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: colors[0].withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(9),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: colors),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: Colors.white, size: 18),
          ),
          const SizedBox(height: 12),
          Text(title, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: colors[0])),
          const SizedBox(height: 6),
          Text(body, style: const TextStyle(color: AppColors.mutedText, fontSize: 11, height: 1.4)),
        ],
      ),
    );
  }
}


// ── Shared helper ─────────────────────────────────────────────────────────────

Widget _sectionLabel(String title, IconData icon, List<Color> colors) {
  return Row(
    children: [
      Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: colors),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: Colors.white, size: 16),
      ),
      const SizedBox(width: 10),
      Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.darkNavy)),
    ],
  );
}
