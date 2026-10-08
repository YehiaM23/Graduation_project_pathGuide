import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:pathguide_app/core/theme/app_colors.dart';
import 'package:pathguide_app/core/widgets/reusable_widgets.dart';
import 'package:pathguide_app/core/data/models.dart';
import 'package:pathguide_app/features/recruiter/internships/presentation/bloc/internship_bloc.dart';

class StudentInternshipsPage extends StatefulWidget {
  const StudentInternshipsPage({super.key});

  @override
  State<StudentInternshipsPage> createState() => _StudentInternshipsPageState();
}

class _StudentInternshipsPageState extends State<StudentInternshipsPage> {
  String _searchQuery = '';
  final _search = TextEditingController();

  @override
  void initState() {
    super.initState();
    context.read<InternshipBloc>().add(LoadAllInternships());
  }

  void _filter(String q) => setState(() => _searchQuery = q);

  List<InternshipModel> _getFiltered(List<InternshipModel> all) {
    if (_searchQuery.isEmpty) return all;
    final q = _searchQuery.toLowerCase();
    return all.where((i) =>
        i.title.toLowerCase().contains(q) ||
        i.company.toLowerCase().contains(q) ||
        i.requiredSkill.toLowerCase().contains(q)).toList();
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
          onPressed: () => context.pop(),
        ),
        title: const Text('Internships', style: TextStyle(color: AppColors.darkNavy, fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      bottomNavigationBar: const StudentBottomNav(currentIndex: 1),
      body: SafeArea(
        child: BlocBuilder<InternshipBloc, InternshipState>(
          builder: (context, state) {
            if (state is InternshipLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            final all = state is InternshipLoaded ? state.myInternships : <InternshipModel>[];
            final filtered = _getFiltered(all);

            return Column(
              children: [
                PageHeroBanner(
                  tag: '${all.length} Opportunities',
                  tagIcon: Icons.work_outline_rounded,
                  title: 'Find Your Next Step',
                  subtitle: 'Discover internships matched to your skills and goals.',
                  colors: const [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                ),
                const SizedBox(height: 16),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: TextField(
                    controller: _search,
                    onChanged: _filter,
                    decoration: InputDecoration(
                      hintText: 'Search by title, company, or skill…',
                      prefixIcon: const Icon(Icons.search_rounded, color: AppColors.mutedText),
                      suffixIcon: _search.text.isNotEmpty
                          ? IconButton(icon: const Icon(Icons.clear_rounded), onPressed: () { _search.clear(); _filter(''); })
                          : null,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    children: [
                      Text('${filtered.length} results', style: const TextStyle(color: AppColors.mutedText, fontSize: 13, fontWeight: FontWeight.w500)),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.primaryBlue.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.filter_list_rounded, size: 14, color: AppColors.primaryBlue),
                            SizedBox(width: 4),
                            Text('Filter', style: TextStyle(fontSize: 12, color: AppColors.primaryBlue, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: filtered.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(24),
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(colors: [const Color(0xFF6366F1).withValues(alpha: 0.1), const Color(0xFF8B5CF6).withValues(alpha: 0.1)]),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.work_off_outlined, size: 48, color: Color(0xFF6366F1)),
                              ),
                              const SizedBox(height: 20),
                              Text(
                                all.isEmpty ? 'No internships posted yet' : 'No results found',
                                style: const TextStyle(color: AppColors.darkNavy, fontWeight: FontWeight.bold, fontSize: 18),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                all.isEmpty ? 'Check back later for new opportunities.' : 'Try a different search term.',
                                style: const TextStyle(color: AppColors.mutedText, fontSize: 14),
                              ),
                            ],
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
                          itemCount: filtered.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 14),
                          itemBuilder: (_, i) => _InternshipCard(internship: filtered[i]),
                        ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _InternshipCard extends StatelessWidget {
  final InternshipModel internship;
  const _InternshipCard({required this.internship});

  static const _colors = [
    [Color(0xFF6366F1), Color(0xFF8B5CF6)],
    [AppColors.teal, Color(0xFF06B6D4)],
    [Color(0xFFF59E0B), Color(0xFFF97316)],
    [Color(0xFFEC4899), Color(0xFFF43F5E)],
  ];

  @override
  Widget build(BuildContext context) {
    final idx = internship.id.hashCode % _colors.length;
    final colors = _colors[idx.abs()];

    return GestureDetector(
      onTap: () => context.push('/student/internship-details', extra: internship),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.cardBorder),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 12, offset: const Offset(0, 4))],
        ),
        child: Column(
          children: [
            Container(
              height: 6,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: colors),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(colors: colors),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.business_rounded, color: Colors.white, size: 24),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(internship.title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.darkNavy)),
                            Text(internship.company, style: TextStyle(color: colors[0], fontWeight: FontWeight.w600, fontSize: 13)),
                          ],
                        ),
                      ),
                      const Icon(Icons.bookmark_border_rounded, color: AppColors.cardBorder, size: 22),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Wrap(
                    spacing: 10,
                    runSpacing: 6,
                    children: [
                      _Chip(Icons.location_on_outlined, internship.location),
                      _Chip(Icons.access_time_rounded, internship.duration),
                      _Chip(Icons.payments_outlined, internship.stipend),
                    ],
                  ),
                  const SizedBox(height: 14),
                  const Divider(height: 1, color: AppColors.cardBorder),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Flexible(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: colors[0].withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(internship.requiredSkill, style: TextStyle(color: colors[0], fontWeight: FontWeight.w600, fontSize: 12), overflow: TextOverflow.ellipsis),
                        ),
                      ),
                      const Spacer(),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const Text('Deadline', style: TextStyle(color: AppColors.mutedText, fontSize: 10)),
                          Text(internship.deadline, style: const TextStyle(color: AppColors.dangerRed, fontSize: 12, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ],
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

class _Chip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _Chip(this.icon, this.label);

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppColors.mutedText),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(color: AppColors.mutedText, fontSize: 12)),
      ],
    );
  }
}
