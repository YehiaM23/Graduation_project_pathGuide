import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:pathguide_app/core/data/models.dart';
import 'package:pathguide_app/core/theme/app_colors.dart';
import 'package:pathguide_app/core/widgets/reusable_widgets.dart';
import 'package:pathguide_app/features/auth/presentation/bloc/auth_bloc.dart';

class StudentProfileViewPage extends StatefulWidget {
  const StudentProfileViewPage({super.key});

  @override
  State<StudentProfileViewPage> createState() => _StudentProfileViewPageState();
}

class _StudentProfileViewPageState extends State<StudentProfileViewPage> {
  bool _isEditing = false;
  bool _isInitialized = false;

  // Personal
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _ageController = TextEditingController();
  String? _selectedGender;

  // Education
  String? _selectedUniversity;
  String? _selectedMajor;
  final _gradYearController = TextEditingController();
  final _bioController = TextEditingController();

  // Links
  final _linkedinController = TextEditingController();
  final _githubController = TextEditingController();

  // Career & chips
  String? _selectedCareerPath;
  final List<String> _skills = [];
  final List<String> _interests = [];

  static const List<String> _careerPaths = [
    'Software Engineer', 'Full-Stack Developer', 'Backend Developer',
    'Frontend Developer', 'Mobile Developer', 'Data Scientist',
    'AI / Machine Learning Engineer', 'Cybersecurity Analyst',
    'Cloud Engineer', 'DevOps Engineer', 'UI/UX Designer',
    'Game Developer', 'Embedded Systems Engineer', 'Data Engineer',
    'Blockchain Developer', 'Network Engineer',
  ];

  static const List<String> _egyptianUniversities = [
    'Ain Shams University',
    'Al-Azhar University',
    'Alexandria University',
    'American University in Cairo (AUC)',
    'Arab Academy for Science, Technology & Maritime Transport',
    'Assiut University',
    'Benha University',
    'Beni-Suef University',
    'Cairo University',
    'Damietta University',
    'Delta University for Science and Technology',
    'Egyptian Chinese University',
    'Egyptian Russian University',
    'Fayoum University',
    'Future University in Egypt (FUE)',
    'Helwan University',
    'Kafr El Sheikh University',
    'Luxor University',
    'Mansoura University',
    'Menoufia University',
    'Merit University',
    'Minia University',
    'Misr International University (MIU)',
    'Misr University for Science and Technology (MUST)',
    'Modern Sciences and Arts University (MSA)',
    'Nahda University',
    'New Giza University (NGU)',
    'Nile University',
    'October 6 University',
    'Pharos University in Alexandria',
    'Port Said University',
    'Sadat City University',
    'Sinai University',
    'Sohag University',
    'South Valley University',
    'Suez Canal University',
    'Tanta University',
    'Zagazig University',
    'Zewail City of Science and Technology',
  ];

  static const List<String> _csMajors = [
    'Artificial Intelligence',
    'Bioinformatics',
    'Computer Engineering',
    'Computer Graphics & Multimedia',
    'Computer Networks & Security',
    'Computer Science',
    'Cybersecurity',
    'Data Engineering',
    'Data Science',
    'Digital Media Technology',
    'Embedded Systems',
    'Game Development',
    'Human-Computer Interaction',
    'Information Systems',
    'Information Technology',
    'Machine Learning',
    'Mobile Computing',
    'Robotics & Automation',
    'Software Engineering',
    'Systems Engineering',
    'Web Development',
  ];

  final List<String> _allSkills = [
    'Adobe XD', 'Angular', 'AWS', 'CSS', 'Docker', 'Excel', 'Express', 'Figma',
    'Flutter', 'Git', 'HTML', 'Java', 'JavaScript', 'JUnit', 'Kotlin', 'Kubernetes',
    'MongoDB', 'NumPy', 'Pandas', 'PostgreSQL', 'Power BI', 'Python', 'PyTorch',
    'R', 'React', 'React Native', 'REST APIs', 'Sass', 'Selenium', 'SQL', 'Swift',
    'Tableau', 'TensorFlow', 'TestNG', 'TypeScript', 'Vue.js',
  ];

  final List<String> _allInterests = [
    'AI & Machine Learning', 'Anime', 'Audiobooks', 'Basketball', 'Beach', 'Blogging',
    'Building Apps', 'Business Strategy', 'Camping', 'Community Service',
    'Content Creation', 'Cooking', 'Cycling', 'Digital Art', 'Drawing', 'Entrepreneurship',
    'Fashion', 'Football', 'Freelancing', 'Gadgets', 'Gaming', 'Graphic Design',
    'Gym & Fitness', 'Hiking', 'Investing', 'Leadership', 'Learning Languages',
    'Marketing', 'Martial Arts', 'Mentoring', 'Movies', 'Music', 'Music Concerts',
    'Nature', 'Networking', 'Online Courses', 'Open Source', 'Personal Finance',
    'Photography', 'Playing Instruments', 'Podcasts', 'Programming', 'Public Speaking',
    'Reading', 'Road Trips', 'Running', 'Self Improvement', 'Startups', 'Swimming',
    'Teaching', 'Tech News', 'Theatre', 'Traveling', 'TV Series', 'Video Editing',
    'Volunteering', 'Writing',
  ];

  void _initializeData(UserModel user) {
    if (_isInitialized) return;
    _nameController.text = user.name;
    _phoneController.text = user.phone ?? '';
    _ageController.text = user.age ?? '';
    _selectedGender = user.gender;
    _selectedUniversity = _egyptianUniversities.contains(user.university) ? user.university : null;
    _selectedMajor = _csMajors.contains(user.major) ? user.major : null;
    _gradYearController.text = user.graduationYear ?? '';
    _bioController.text = user.bio ?? '';
    _linkedinController.text = user.linkedinUrl ?? '';
    _githubController.text = user.githubUrl ?? '';
    _selectedCareerPath = _careerPaths.contains(user.careerPath) ? user.careerPath : null;
    if (_skills.isEmpty) _skills.addAll(user.skills);
    if (_interests.isEmpty) _interests.addAll(user.interests);
    _isInitialized = true;
  }

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _ageController.dispose();
    _gradYearController.dispose();
    _bioController.dispose();
    _linkedinController.dispose();
    _githubController.dispose();
    super.dispose();
  }

  void _save(UserModel current) {
    final updated = current.copyWith(
      name: _nameController.text.trim(),
      phone: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
      age: _ageController.text.trim().isEmpty ? null : _ageController.text.trim(),
      gender: _selectedGender,
      university: _selectedUniversity,
      major: _selectedMajor,
      graduationYear: _gradYearController.text.trim().isEmpty ? null : _gradYearController.text.trim(),
      bio: _bioController.text.trim().isEmpty ? null : _bioController.text.trim(),
      linkedinUrl: _linkedinController.text.trim().isEmpty ? null : _linkedinController.text.trim(),
      githubUrl: _githubController.text.trim().isEmpty ? null : _githubController.text.trim(),
      careerPath: _selectedCareerPath,
      skills: List.from(_skills),
      interests: List.from(_interests),
    );
    context.read<AuthBloc>().add(UserUpdateRequested(updated));
    setState(() => _isEditing = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Profile updated!'), backgroundColor: AppColors.successGreen),
    );
  }

  void _cancelEdit() => setState(() => _isEditing = false);

  // ─── Build ───────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        if (state is! AuthAuthenticated) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }
        final user = state.user;
        _initializeData(user);

        return Scaffold(
          backgroundColor: AppColors.background,
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0,
            surfaceTintColor: Colors.white,
            automaticallyImplyLeading: false,
            title: Text(
              _isEditing ? 'Edit Profile' : 'My Profile',
              style: const TextStyle(
                  color: AppColors.darkNavy, fontWeight: FontWeight.bold, fontSize: 18),
            ),
            actions: [
              if (_isEditing) ...[
                TextButton(
                  onPressed: _cancelEdit,
                  child: const Text('Cancel',
                      style: TextStyle(color: AppColors.mutedText, fontWeight: FontWeight.w600)),
                ),
                TextButton(
                  onPressed: () => _save(user),
                  child: const Text('Save',
                      style: TextStyle(color: AppColors.primaryBlue, fontWeight: FontWeight.bold)),
                ),
              ] else
                TextButton(
                  onPressed: () => setState(() => _isEditing = true),
                  child: const Text('Edit',
                      style: TextStyle(color: AppColors.primaryBlue, fontWeight: FontWeight.bold)),
                ),
            ],
          ),
          bottomNavigationBar: const StudentBottomNav(currentIndex: 5),
          body: SafeArea(
            child: _isEditing ? _buildEditMode(user) : _buildViewMode(user),
          ),
        );
      },
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW MODE
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildViewMode(UserModel user) {
    return SingleChildScrollView(
      child: Column(
        children: [
          _buildHero(user),
          const SizedBox(height: 20),
          _buildViewCard(
            title: 'Personal Info',
            icon: Icons.person_outline_rounded,
            rows: [
              (Icons.person_outline, 'Full Name', user.name),
              (Icons.email_outlined, 'Email', user.email),
              (Icons.phone_outlined, 'Phone', user.phone?.isNotEmpty == true ? user.phone! : 'N/A'),
              (Icons.wc_outlined, 'Gender', user.gender?.isNotEmpty == true ? user.gender! : 'N/A'),
              (Icons.cake_outlined, 'Age', user.age?.isNotEmpty == true ? user.age! : 'N/A'),
              (Icons.info_outline, 'Bio', user.bio?.isNotEmpty == true ? user.bio! : 'N/A'),
            ],
          ),
          const SizedBox(height: 16),
          _buildViewCard(
            title: 'Education',
            icon: Icons.school_outlined,
            rows: [
              (Icons.school_outlined, 'University', user.university?.isNotEmpty == true ? user.university! : 'N/A'),
              (Icons.workspace_premium_outlined, 'Major', user.major?.isNotEmpty == true ? user.major! : 'N/A'),
              (Icons.calendar_today_outlined, 'Graduation Year', user.graduationYear?.isNotEmpty == true ? user.graduationYear! : 'N/A'),
            ],
          ),
          const SizedBox(height: 16),
          _buildViewCard(
            title: 'Career Path',
            icon: Icons.timeline_rounded,
            rows: [
              (Icons.timeline_rounded, 'Career Path', user.careerPath?.isNotEmpty == true ? user.careerPath! : 'N/A'),
            ],
          ),
          const SizedBox(height: 16),
          _buildViewCard(
            title: 'Links',
            icon: Icons.link_rounded,
            rows: [
              (Icons.link_rounded, 'LinkedIn', user.linkedinUrl?.isNotEmpty == true ? user.linkedinUrl! : 'N/A'),
              (Icons.code_rounded, 'GitHub', user.githubUrl?.isNotEmpty == true ? user.githubUrl! : 'N/A'),
            ],
          ),
          const SizedBox(height: 16),
          _buildChipsCard('Skills', Icons.code_rounded,
              user.skills, const [AppColors.primaryBlue, AppColors.teal]),
          const SizedBox(height: 16),
          _buildChipsCard('Interests', Icons.favorite_rounded,
              user.interests, const [Color(0xFFEC4899), Color(0xFFF43F5E)]),
          const SizedBox(height: 24),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: OutlinedButton.icon(
              onPressed: () => context.read<AuthBloc>().add(LogoutRequested()),
              icon: const Icon(Icons.logout_rounded, size: 18),
              label: const Text('Sign Out',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.dangerRed,
                side: const BorderSide(color: AppColors.dangerRed),
                minimumSize: const Size(double.infinity, 52),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildHero(UserModel user) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(24, 28, 24, 32),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primaryBlue, AppColors.teal],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Hello,',
              style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 16)),
          Text('${user.name}!',
              style: const TextStyle(
                  color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold, height: 1.2)),
          const SizedBox(height: 18),
          Row(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.25),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white.withValues(alpha: 0.5), width: 2),
                ),
                child: Center(
                  child: Text(
                    user.name.isNotEmpty ? user.name[0].toUpperCase() : 'S',
                    style: const TextStyle(
                        color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(user.email,
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.9), fontSize: 13),
                        overflow: TextOverflow.ellipsis),
                    if (user.careerPath?.isNotEmpty ?? false) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.timeline_rounded, color: Colors.white, size: 13),
                            const SizedBox(width: 5),
                            Flexible(
                              child: Text(user.careerPath!,
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600),
                                  overflow: TextOverflow.ellipsis),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildViewCard({
    required String title,
    required IconData icon,
    required List<(IconData, String, String)> rows,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: _cardShell(
        title: title,
        icon: icon,
        child: Column(
          children: rows.asMap().entries.map((e) {
            final isLast = e.key == rows.length - 1;
            return Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 14),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(7),
                    decoration: BoxDecoration(
                      color: AppColors.primaryBlue.withValues(alpha: 0.07),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(e.value.$1, size: 15, color: AppColors.primaryBlue),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(e.value.$2,
                            style: const TextStyle(color: AppColors.mutedText, fontSize: 12)),
                        const SizedBox(height: 2),
                        Text(e.value.$3,
                            style: TextStyle(
                                color: e.value.$3 == 'N/A' ? AppColors.mutedText : AppColors.darkNavy,
                                fontWeight: e.value.$3 == 'N/A' ? FontWeight.w400 : FontWeight.w600,
                                fontStyle: e.value.$3 == 'N/A' ? FontStyle.italic : FontStyle.normal,
                                fontSize: 14)),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildChipsCard(
      String title, IconData icon, List<String> items, List<Color> colors) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.cardBorder),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 12, offset: const Offset(0, 4))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 4,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: colors),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(7),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(colors: colors),
                          borderRadius: BorderRadius.circular(9),
                        ),
                        child: Icon(icon, color: Colors.white, size: 15),
                      ),
                      const SizedBox(width: 10),
                      Text(title,
                          style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: AppColors.darkNavy)),
                    ],
                  ),
                  const SizedBox(height: 14),
                  if (items.isEmpty)
                    const Text(
                      'None added yet — tap Edit to add',
                      style: TextStyle(color: AppColors.mutedText, fontStyle: FontStyle.italic, fontSize: 13),
                    )
                  else
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: items.map((s) => SkillChip(label: s, isSelected: true)).toList(),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EDIT MODE
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildEditMode(UserModel user) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          _cardShell(
            title: 'Personal Info',
            icon: Icons.person_outline_rounded,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AppTextField(label: 'Full Name', hint: 'Enter your name', controller: _nameController, prefixIcon: Icons.person_outline),
                const SizedBox(height: 16),
                AppTextField(label: 'Phone', hint: '+20 123 456 7890', controller: _phoneController, keyboardType: TextInputType.phone, prefixIcon: Icons.phone_outlined),
                const SizedBox(height: 16),
                const Text('Gender', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.darkNavy)),
                const SizedBox(height: 10),
                Row(children: [
                  Expanded(child: _genderOption('Male', Icons.male_rounded)),
                  const SizedBox(width: 12),
                  Expanded(child: _genderOption('Female', Icons.female_rounded)),
                ]),
                const SizedBox(height: 16),
                AppTextField(label: 'Age', hint: 'Enter your age', controller: _ageController, keyboardType: TextInputType.number, prefixIcon: Icons.cake_outlined, inputFormatters: [FilteringTextInputFormatter.digitsOnly]),
                const SizedBox(height: 16),
                AppTextField(label: 'Bio', hint: 'Tell us about yourself...', controller: _bioController, maxLines: 3),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _cardShell(
            title: 'Education',
            icon: Icons.school_outlined,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              _buildDropdownField(
                label: 'University',
                hint: 'Select your university',
                value: _selectedUniversity,
                items: _egyptianUniversities,
                onChanged: (v) => setState(() => _selectedUniversity = v),
              ),
              const SizedBox(height: 16),
              _buildDropdownField(
                label: 'Major',
                hint: 'Select your major',
                value: _selectedMajor,
                items: _csMajors,
                onChanged: (v) => setState(() => _selectedMajor = v),
              ),
              const SizedBox(height: 16),
              AppTextField(label: 'Graduation Year', hint: 'e.g. 2026', controller: _gradYearController, keyboardType: TextInputType.number, prefixIcon: Icons.calendar_today_outlined, inputFormatters: [FilteringTextInputFormatter.digitsOnly]),
            ]),
          ),
          const SizedBox(height: 16),
          _cardShell(
            title: 'Career Path',
            icon: Icons.timeline_rounded,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Desired Career Path', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.darkNavy)),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  isExpanded: true,
                  initialValue: _selectedCareerPath,
                  hint: const Text('Select your career path', style: TextStyle(color: AppColors.mutedText, fontSize: 14)),
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: AppColors.background,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.cardBorder)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.cardBorder)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primaryBlue, width: 1.5)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                  items: _careerPaths.map((e) => DropdownMenuItem(value: e, child: Text(e, overflow: TextOverflow.ellipsis))).toList(),
                  onChanged: (v) => setState(() => _selectedCareerPath = v),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _cardShell(
            title: 'Links',
            icon: Icons.link_rounded,
            child: Column(children: [
              AppTextField(label: 'LinkedIn', hint: 'https://linkedin.com/in/username', controller: _linkedinController, prefixIcon: Icons.link),
              const SizedBox(height: 16),
              AppTextField(label: 'GitHub', hint: 'https://github.com/username', controller: _githubController, prefixIcon: Icons.code),
            ]),
          ),
          const SizedBox(height: 16),
          _cardShell(
            title: 'Skills',
            icon: Icons.code_rounded,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_skills.isEmpty)
                  const Text('No skills added yet.', style: TextStyle(color: AppColors.mutedText, fontStyle: FontStyle.italic, fontSize: 13))
                else
                  Wrap(
                    spacing: 8, runSpacing: 8,
                    children: _skills.map((s) => SkillChip(label: s, isSelected: true, onTap: () => setState(() => _skills.remove(s)))).toList(),
                  ),
                const SizedBox(height: 14),
                OutlinedButton.icon(
                  onPressed: () => _showPicker('Add Skill', _allSkills, _skills, (v) => _skills.add(v)),
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Add Skill'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primaryBlue,
                    side: const BorderSide(color: AppColors.primaryBlue),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _cardShell(
            title: 'Interests',
            icon: Icons.favorite_rounded,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_interests.isEmpty)
                  const Text('No interests added yet.', style: TextStyle(color: AppColors.mutedText, fontStyle: FontStyle.italic, fontSize: 13))
                else
                  Wrap(
                    spacing: 8, runSpacing: 8,
                    children: _interests.map((i) => SkillChip(label: i, isSelected: true, onTap: () => setState(() => _interests.remove(i)))).toList(),
                  ),
                const SizedBox(height: 14),
                OutlinedButton.icon(
                  onPressed: () => _showPicker('Add Interest', _allInterests, _interests, (v) => _interests.add(v)),
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Add Interest'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFEC4899),
                    side: const BorderSide(color: Color(0xFFEC4899)),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  // ─── Shared card shell ────────────────────────────────────────────────────

  Widget _cardShell({required String title, required IconData icon, required Widget child}) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 12, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 4,
            decoration: const BoxDecoration(
              gradient: LinearGradient(colors: [AppColors.primaryBlue, AppColors.teal]),
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Container(
                    padding: const EdgeInsets.all(7),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [AppColors.primaryBlue, AppColors.teal]),
                      borderRadius: BorderRadius.circular(9),
                    ),
                    child: Icon(icon, color: Colors.white, size: 15),
                  ),
                  const SizedBox(width: 10),
                  Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.darkNavy)),
                ]),
                const SizedBox(height: 20),
                child,
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─── Dropdown field ───────────────────────────────────────────────────────

  Widget _buildDropdownField({
    required String label,
    required String hint,
    required String? value,
    required List<String> items,
    required void Function(String?) onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.darkNavy)),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          isExpanded: true,
          initialValue: value,
          hint: Text(hint, style: const TextStyle(color: AppColors.mutedText, fontSize: 14)),
          decoration: InputDecoration(
            filled: true,
            fillColor: AppColors.background,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.cardBorder)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.cardBorder)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primaryBlue, width: 1.5)),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
          items: items.map((e) => DropdownMenuItem(value: e, child: Text(e, overflow: TextOverflow.ellipsis))).toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }

  // ─── Gender selector ──────────────────────────────────────────────────────

  Widget _genderOption(String gender, IconData icon) {
    final isSelected = _selectedGender == gender;
    return GestureDetector(
      onTap: () => setState(() => _selectedGender = gender),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryBlue.withValues(alpha: 0.05) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isSelected ? AppColors.primaryBlue : AppColors.cardBorder, width: isSelected ? 2 : 1),
        ),
        child: Column(children: [
          Icon(icon, color: isSelected ? AppColors.primaryBlue : AppColors.mutedText, size: 22),
          const SizedBox(height: 4),
          Text(gender, style: TextStyle(color: isSelected ? AppColors.primaryBlue : AppColors.mutedText, fontWeight: FontWeight.bold, fontSize: 12)),
        ]),
      ),
    );
  }

  // ─── Picker dialog ────────────────────────────────────────────────────────

  void _showPicker(String title, List<String> master, List<String> selected, void Function(String) onAdd) {
    final available = master.where((s) => !selected.contains(s)).toList();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(title, style: const TextStyle(color: AppColors.darkNavy, fontWeight: FontWeight.bold)),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: available.length,
            itemBuilder: (_, i) => ListTile(
              title: Text(available[i]),
              onTap: () { setState(() => onAdd(available[i])); Navigator.pop(ctx); },
            ),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close', style: TextStyle(color: AppColors.mutedText))),
        ],
      ),
    );
  }
}
