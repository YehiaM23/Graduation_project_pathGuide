import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:pathguide_app/core/data/models.dart';
import 'package:pathguide_app/core/theme/app_colors.dart';
import 'package:pathguide_app/core/widgets/reusable_widgets.dart';
import 'package:pathguide_app/features/auth/presentation/bloc/auth_bloc.dart';

class RecruiterProfilePage extends StatefulWidget {
  const RecruiterProfilePage({super.key});

  @override
  State<RecruiterProfilePage> createState() => _RecruiterProfilePageState();
}

class _RecruiterProfilePageState extends State<RecruiterProfilePage> {
  bool _isEditing = false;
  bool _isInitialized = false;

  // Personal
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _ageController = TextEditingController();
  String? _selectedGender;

  // Recruiter Info
  final _recruiterLinkedinController = TextEditingController();
  final _recruiterRoleController = TextEditingController();
  final _yearsOfExperienceController = TextEditingController();

  // Company Info
  final _companyNameController = TextEditingController();
  final _companyAddressController = TextEditingController();
  final _companyPhoneController = TextEditingController();
  final _companyFoundedYearController = TextEditingController();
  final _companyWebsiteController = TextEditingController();
  final _companyLinkedinController = TextEditingController();
  final _bioController = TextEditingController();

  void _initializeData(UserModel user) {
    if (_isInitialized) return;
    _nameController.text = user.name;
    _phoneController.text = user.phone ?? '';
    _ageController.text = user.age ?? '';
    _selectedGender = user.gender;
    _recruiterLinkedinController.text = user.linkedinUrl ?? '';
    _recruiterRoleController.text = user.recruiterRole ?? '';
    _yearsOfExperienceController.text = user.yearsOfExperience ?? '';
    _companyNameController.text = user.companyName ?? '';
    _companyAddressController.text = user.companyAddress ?? '';
    _companyPhoneController.text = user.companyPhone ?? '';
    _companyFoundedYearController.text = user.companyFoundedYear ?? '';
    _companyWebsiteController.text = user.companyWebsite ?? '';
    _companyLinkedinController.text = user.companyLinkedin ?? '';
    _bioController.text = user.bio ?? '';
    _isInitialized = true;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _ageController.dispose();
    _recruiterLinkedinController.dispose();
    _recruiterRoleController.dispose();
    _yearsOfExperienceController.dispose();
    _companyNameController.dispose();
    _companyAddressController.dispose();
    _companyPhoneController.dispose();
    _companyFoundedYearController.dispose();
    _companyWebsiteController.dispose();
    _companyLinkedinController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  void _saveProfile() {
    setState(() => _isEditing = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Profile updated successfully!'),
        backgroundColor: AppColors.successGreen,
      ),
    );
  }

  void _cancelEdit() => setState(() => _isEditing = false);

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        if (state is! AuthAuthenticated) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }
        final user = state.user;
        _initializeData(user);
        final email = user.email;

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
            title: Text(
              _isEditing ? 'Edit Profile' : 'My Profile',
              style: const TextStyle(color: AppColors.darkNavy, fontWeight: FontWeight.bold, fontSize: 18),
            ),
            actions: [
              if (_isEditing) ...[
                TextButton(
                  onPressed: _cancelEdit,
                  child: const Text('Cancel', style: TextStyle(color: AppColors.mutedText, fontWeight: FontWeight.w600)),
                ),
                TextButton(
                  onPressed: _saveProfile,
                  child: const Text('Save', style: TextStyle(color: AppColors.primaryBlue, fontWeight: FontWeight.bold)),
                ),
              ] else
                TextButton(
                  onPressed: () => setState(() => _isEditing = true),
                  child: const Text('Edit', style: TextStyle(color: AppColors.primaryBlue, fontWeight: FontWeight.bold)),
                ),
            ],
          ),
          bottomNavigationBar: const RecruiterBottomNav(currentIndex: 3),
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  _buildAvatarSection(user),
                  const SizedBox(height: 20),
                  _buildSection(
                    title: 'Personal Info',
                    icon: Icons.person_outline_rounded,
                    children: [
                      _buildField('Full Name', _nameController, Icons.person_outline, email: email),
                      _buildReadOnlyRow('Email', email, Icons.email_outlined, isEmail: true),
                      _buildField('Phone', _phoneController, Icons.phone_outlined),
                      _buildGenderField(),
                      _buildField('Age', _ageController, Icons.cake_outlined, keyboardType: TextInputType.number),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildSection(
                    title: 'Recruiter Info',
                    icon: Icons.badge_outlined,
                    children: [
                      _buildField('LinkedIn', _recruiterLinkedinController, Icons.link),
                      _buildField('Your Role', _recruiterRoleController, Icons.work_outline_rounded),
                      _buildField('Years of Experience', _yearsOfExperienceController, Icons.work_history_outlined, keyboardType: TextInputType.number),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildSection(
                    title: 'Company Info',
                    icon: Icons.business_outlined,
                    children: [
                      _buildField('Company Name', _companyNameController, Icons.business_outlined),
                      _buildField('Address', _companyAddressController, Icons.location_on_outlined),
                      _buildField('Phone Number', _companyPhoneController, Icons.phone_outlined, keyboardType: TextInputType.phone),
                      _buildField('Founded Year', _companyFoundedYearController, Icons.calendar_today_outlined, keyboardType: TextInputType.number),
                      _buildField('Website', _companyWebsiteController, Icons.language),
                      _buildField('Company LinkedIn', _companyLinkedinController, Icons.link),
                      _buildField('Bio', _bioController, Icons.info_outline, maxLines: 3),
                    ],
                  ),
                  const SizedBox(height: 32),
                  _buildSignOutButton(context),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildAvatarSection(UserModel user) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 12, offset: const Offset(0, 4))],
      ),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [AppColors.primaryBlue, AppColors.teal]),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(Icons.business_rounded, color: Colors.white, size: 40),
          ),
          const SizedBox(height: 14),
          Text(
            user.name,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.darkNavy),
          ),
          const SizedBox(height: 4),
          Text(
            user.email,
            style: const TextStyle(fontSize: 13, color: AppColors.mutedText),
          ),
          const SizedBox(height: 10),
          const StatusBadge(label: 'Recruiter', color: AppColors.primaryBlue),
        ],
      ),
    );
  }

  Widget _buildSection({required String title, required IconData icon, required List<Widget> children}) {
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
                    Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.darkNavy)),
                  ],
                ),
                const SizedBox(height: 20),
                ...children,
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildField(
    String label,
    TextEditingController controller,
    IconData icon, {
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
    String? email,
  }) {
    final value = controller.text.isEmpty ? 'N/A' : controller.text;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: _isEditing
          ? AppTextField(
              label: label,
              hint: 'Enter $label',
              controller: controller,
              prefixIcon: icon,
              keyboardType: keyboardType,
              maxLines: maxLines,
            )
          : _infoRow(icon, label, value),
    );
  }

  Widget _buildReadOnlyRow(String label, String value, IconData icon, {bool isEmail = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: _isEditing
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.darkNavy)),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: Row(
                    children: [
                      Icon(icon, size: 18, color: AppColors.mutedText),
                      const SizedBox(width: 10),
                      Expanded(child: Text(value, style: const TextStyle(color: AppColors.mutedText, fontSize: 14))),
                      const Icon(Icons.lock_outline, size: 14, color: AppColors.mutedText),
                    ],
                  ),
                ),
              ],
            )
          : _infoRow(icon, label, value),
    );
  }

  Widget _buildGenderField() {
    final displayValue = _selectedGender ?? 'N/A';
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: _isEditing
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Gender', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.darkNavy)),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(child: _genderOption('Male', Icons.male_rounded)),
                    const SizedBox(width: 12),
                    Expanded(child: _genderOption('Female', Icons.female_rounded)),
                  ],
                ),
              ],
            )
          : _infoRow(Icons.wc_outlined, 'Gender', displayValue),
    );
  }

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
        child: Column(
          children: [
            Icon(icon, color: isSelected ? AppColors.primaryBlue : AppColors.mutedText, size: 22),
            const SizedBox(height: 4),
            Text(gender, style: TextStyle(color: isSelected ? AppColors.primaryBlue : AppColors.mutedText, fontWeight: FontWeight.bold, fontSize: 12)),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(7),
          decoration: BoxDecoration(
            color: AppColors.primaryBlue.withValues(alpha: 0.07),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 15, color: AppColors.primaryBlue),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(color: AppColors.mutedText, fontSize: 12)),
              const SizedBox(height: 2),
              Text(
                value,
                style: TextStyle(
                  color: value == 'N/A' ? AppColors.mutedText : AppColors.darkNavy,
                  fontWeight: value == 'N/A' ? FontWeight.w400 : FontWeight.w600,
                  fontSize: 14,
                  fontStyle: value == 'N/A' ? FontStyle.italic : FontStyle.normal,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSignOutButton(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: () => _confirmSignOut(context),
        icon: const Icon(Icons.logout_rounded, size: 18),
        label: const Text('Sign Out', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.dangerRed,
          side: const BorderSide(color: AppColors.dangerRed),
          minimumSize: const Size(0, 52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      ),
    );
  }

  void _confirmSignOut(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Sign Out',
            style: TextStyle(color: AppColors.darkNavy, fontWeight: FontWeight.bold)),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: AppColors.mutedText)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              context.read<AuthBloc>().add(LogoutRequested());
              context.go('/');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.dangerRed,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Sign Out', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
