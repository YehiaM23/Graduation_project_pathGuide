import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:pathguide_app/core/data/models.dart';
import 'package:pathguide_app/core/theme/app_colors.dart';
import 'package:pathguide_app/core/widgets/reusable_widgets.dart';
import 'package:pathguide_app/features/auth/presentation/bloc/auth_bloc.dart';

class StudentProfilePage extends StatefulWidget {
  const StudentProfilePage({super.key});

  @override
  State<StudentProfilePage> createState() => _StudentProfilePageState();
}

class _StudentProfilePageState extends State<StudentProfilePage> {
  // Personal
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _ageController = TextEditingController();
  String? _selectedGender;

  // Education
  final _univController = TextEditingController();
  final _majorController = TextEditingController();
  final _gradYearController = TextEditingController();
  final _bioController = TextEditingController();

  // Links
  final _linkedinController = TextEditingController();
  final _githubController = TextEditingController();

  // Career & Skills
  String? _selectedCareerPath;
  final List<String> _skills = [];
  final List<String> _interests = [];

  bool _isInitialized = false;

  final List<String> _allSkillsMaster = [
    'Adobe XD', 'Angular', 'AWS', 'CSS', 'Docker', 'Excel', 'Express', 'Figma',
    'Flutter', 'Git', 'HTML', 'Java', 'JavaScript', 'JUnit', 'Kotlin', 'Kubernetes',
    'MongoDB', 'NumPy', 'Pandas', 'PostgreSQL', 'Power BI', 'Python', 'PyTorch',
    'R', 'React', 'React Native', 'REST APIs', 'Sass', 'Selenium', 'SQL', 'Swift',
    'Tableau', 'TensorFlow', 'TestNG', 'TypeScript', 'Vue.js',
  ];

  final List<String> _allInterestsMaster = [
    'AI & Machine Learning', 'Anime', 'Audiobooks', 'Basketball', 'Beach', 'Blogging',
    'Building Apps', 'Business Strategy', 'Camping', 'Community Service',
    'Content Creation', 'Cooking', 'Cycling', 'Digital Art', 'Drawing', 'Entrepreneurship',
    'Fashion', 'Football', 'Freelancing', 'Gadgets', 'Gaming', 'Graphic Design',
    'Gym & Fitness', 'Hiking', 'Investing', 'Leadership', 'Learning Languages',
    'Marketing', 'Martial Arts', 'Mentoring', 'Movies', 'Music', 'Music Concerts',
    'Nature', 'Networking', 'Online Courses', 'Open Source', 'Personal Finance',
    'Photography', 'Playing Instruments', 'Podcasts', 'Programming', 'Public Speaking',
    'Reading', 'Road Trips', 'Running', 'Self Improvement',
    'Startups', 'Swimming', 'Teaching', 'Tech News', 'Theatre', 'Traveling',
    'TV Series', 'Video Editing', 'Volunteering', 'Writing',
  ];

  static const List<String> _careerPaths = [
    'Software Engineer', 'Full-Stack Developer', 'Backend Developer',
    'Frontend Developer', 'Mobile Developer', 'Data Scientist',
    'AI / Machine Learning Engineer', 'Cybersecurity Analyst',
    'Cloud Engineer', 'DevOps Engineer', 'UI/UX Designer',
    'Game Developer', 'Embedded Systems Engineer', 'Data Engineer',
    'Blockchain Developer', 'Network Engineer',
  ];

  void _initializeData(UserModel user) {
    if (_isInitialized) return;
    _nameController.text = user.name;
    _phoneController.text = user.phone ?? '';
    _ageController.text = user.age ?? '';
    _selectedGender = user.gender;
    _univController.text = user.university ?? '';
    _majorController.text = user.major ?? '';
    _gradYearController.text = user.graduationYear ?? '';
    _bioController.text = user.bio ?? '';
    _linkedinController.text = user.linkedinUrl ?? '';
    _githubController.text = user.githubUrl ?? '';
    _selectedCareerPath = _careerPaths.contains(user.careerPath) ? user.careerPath : null;
    _skills.addAll(user.skills);
    _interests.addAll(user.interests);
    _isInitialized = true;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _ageController.dispose();
    _univController.dispose();
    _majorController.dispose();
    _gradYearController.dispose();
    _bioController.dispose();
    _linkedinController.dispose();
    _githubController.dispose();
    super.dispose();
  }

  void _saveProfile(UserModel currentUser) {
    final updated = currentUser.copyWith(
      name: _nameController.text.trim(),
      phone: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
      age: _ageController.text.trim().isEmpty ? null : _ageController.text.trim(),
      gender: _selectedGender,
      university: _univController.text.trim().isEmpty ? null : _univController.text.trim(),
      major: _majorController.text.trim().isEmpty ? null : _majorController.text.trim(),
      graduationYear: _gradYearController.text.trim().isEmpty ? null : _gradYearController.text.trim(),
      bio: _bioController.text.trim().isEmpty ? null : _bioController.text.trim(),
      linkedinUrl: _linkedinController.text.trim().isEmpty ? null : _linkedinController.text.trim(),
      githubUrl: _githubController.text.trim().isEmpty ? null : _githubController.text.trim(),
      careerPath: _selectedCareerPath,
      skills: List.from(_skills),
      interests: List.from(_interests),
    );
    context.read<AuthBloc>().add(UserUpdateRequested(updated));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Profile updated successfully!'),
        backgroundColor: AppColors.successGreen,
      ),
    );
    context.go('/student/profile');
  }

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
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_rounded, color: AppColors.darkNavy, size: 20),
              onPressed: () => context.go('/student/profile'),
            ),
            title: const Text('Edit Profile',
                style: TextStyle(color: AppColors.darkNavy, fontWeight: FontWeight.bold, fontSize: 18)),
            actions: [
              TextButton(
                onPressed: () => _saveProfile(user),
                child: const Text('Save',
                    style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryBlue, fontSize: 15)),
              ),
            ],
          ),
          bottomNavigationBar: const StudentBottomNav(currentIndex: 5),
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  _buildSection(
                    title: 'Personal Info',
                    icon: Icons.person_outline_rounded,
                    child: Column(
                      children: [
                        AppTextField(label: 'Full Name', hint: 'Enter your name', controller: _nameController, prefixIcon: Icons.person_outline),
                        const SizedBox(height: 16),
                        AppTextField(label: 'Phone', hint: '+20 123 456 7890', controller: _phoneController, keyboardType: TextInputType.phone, prefixIcon: Icons.phone_outlined),
                        const SizedBox(height: 16),
                        const Align(
                          alignment: Alignment.centerLeft,
                          child: Text('Gender', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.darkNavy)),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Expanded(child: _genderOption('Male', Icons.male_rounded)),
                            const SizedBox(width: 12),
                            Expanded(child: _genderOption('Female', Icons.female_rounded)),
                          ],
                        ),
                        const SizedBox(height: 16),
                        AppTextField(label: 'Age', hint: 'Enter your age', controller: _ageController, keyboardType: TextInputType.number, prefixIcon: Icons.cake_outlined),
                        const SizedBox(height: 16),
                        AppTextField(label: 'Bio', hint: 'Tell us about yourself...', controller: _bioController, maxLines: 3),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildSection(
                    title: 'Education',
                    icon: Icons.school_outlined,
                    child: Column(
                      children: [
                        AppTextField(label: 'University', hint: 'Enter your university', controller: _univController, prefixIcon: Icons.school_outlined),
                        const SizedBox(height: 16),
                        AppTextField(label: 'Major', hint: 'e.g. Computer Science', controller: _majorController, prefixIcon: Icons.workspace_premium_outlined),
                        const SizedBox(height: 16),
                        AppTextField(label: 'Graduation Year', hint: 'e.g. 2026', controller: _gradYearController, keyboardType: TextInputType.number, prefixIcon: Icons.calendar_today_outlined),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildSection(
                    title: 'Career Path',
                    icon: Icons.timeline_rounded,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Desired Career Path', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.darkNavy)),
                        const SizedBox(height: 10),
                        DropdownButtonFormField<String>(
                          isExpanded: true,
                          value: _selectedCareerPath,
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
                  _buildSection(
                    title: 'Links',
                    icon: Icons.link_rounded,
                    child: Column(
                      children: [
                        AppTextField(label: 'LinkedIn', hint: 'https://linkedin.com/in/username', controller: _linkedinController, prefixIcon: Icons.link),
                        const SizedBox(height: 16),
                        AppTextField(label: 'GitHub', hint: 'https://github.com/username', controller: _githubController, prefixIcon: Icons.code),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildSection(
                    title: 'Skills',
                    icon: Icons.code_rounded,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (_skills.isEmpty)
                          const Text('No skills added yet.', style: TextStyle(color: AppColors.mutedText, fontStyle: FontStyle.italic, fontSize: 13))
                        else
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: _skills.map((s) => SkillChip(
                              label: s,
                              isSelected: true,
                              onTap: () => setState(() => _skills.remove(s)),
                            )).toList(),
                          ),
                        const SizedBox(height: 16),
                        OutlinedButton.icon(
                          onPressed: _showSkillDialog,
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
                  _buildSection(
                    title: 'Interests',
                    icon: Icons.favorite_rounded,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (_interests.isEmpty)
                          const Text('No interests added yet.', style: TextStyle(color: AppColors.mutedText, fontStyle: FontStyle.italic, fontSize: 13))
                        else
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: _interests.map((i) => SkillChip(
                              label: i,
                              isSelected: true,
                              onTap: () => setState(() => _interests.remove(i)),
                            )).toList(),
                          ),
                        const SizedBox(height: 16),
                        OutlinedButton.icon(
                          onPressed: _showInterestDialog,
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
            ),
          ),
        );
      },
    );
  }

  // ─── Section wrapper ─────────────────────────────────────────────────────────

  Widget _buildSection({required String title, required IconData icon, required Widget child}) {
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
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(7),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [AppColors.primaryBlue, AppColors.teal]),
                        borderRadius: BorderRadius.circular(9),
                      ),
                      child: Icon(icon, color: Colors.white, size: 15),
                    ),
                    const SizedBox(width: 10),
                    Text(title,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.darkNavy)),
                  ],
                ),
                const SizedBox(height: 20),
                child,
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─── Gender selector ─────────────────────────────────────────────────────────

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
          border: Border.all(
              color: isSelected ? AppColors.primaryBlue : AppColors.cardBorder,
              width: isSelected ? 2 : 1),
        ),
        child: Column(
          children: [
            Icon(icon, color: isSelected ? AppColors.primaryBlue : AppColors.mutedText, size: 22),
            const SizedBox(height: 4),
            Text(gender,
                style: TextStyle(
                    color: isSelected ? AppColors.primaryBlue : AppColors.mutedText,
                    fontWeight: FontWeight.bold,
                    fontSize: 12)),
          ],
        ),
      ),
    );
  }

  // ─── Dialogs ─────────────────────────────────────────────────────────────────

  void _showSkillDialog() {
    final available = _allSkillsMaster.where((s) => !_skills.contains(s)).toList();
    _showPickerDialog('Add Skill', available, (picked) => setState(() => _skills.add(picked)));
  }

  void _showInterestDialog() {
    final available = _allInterestsMaster.where((i) => !_interests.contains(i)).toList();
    _showPickerDialog('Add Interest', available, (picked) => setState(() => _interests.add(picked)));
  }

  void _showPickerDialog(String title, List<String> items, void Function(String) onPick) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(title, style: const TextStyle(color: AppColors.darkNavy, fontWeight: FontWeight.bold)),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: items.length,
            itemBuilder: (_, i) => ListTile(
              title: Text(items[i]),
              onTap: () {
                onPick(items[i]);
                Navigator.pop(ctx);
              },
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close', style: TextStyle(color: AppColors.mutedText)),
          ),
        ],
      ),
    );
  }
}
