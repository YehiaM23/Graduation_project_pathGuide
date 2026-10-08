import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:pathguide_app/core/theme/app_colors.dart';
import 'package:pathguide_app/core/widgets/reusable_widgets.dart';
import 'package:pathguide_app/core/data/models.dart';
import '../bloc/auth_bloc.dart';

class SignupPage extends StatefulWidget {
  const SignupPage({super.key});

  @override
  State<SignupPage> createState() => _SignupPageState();
}

class _SignupPageState extends State<SignupPage> {
  int _currentStep = 0;
  String _selectedRole = 'Candidate';
  final _formKey1 = GlobalKey<FormState>();
  final _formKey2 = GlobalKey<FormState>();

  // Common — Step 1
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _phoneController = TextEditingController();
  final _ageController = TextEditingController();
  String? _selectedGender;

  // Recruiter — Step 2
  final _recruiterLinkedinController = TextEditingController();
  final _recruiterRoleController = TextEditingController();
  final _yearsOfExperienceController = TextEditingController();
  final _companyNameController = TextEditingController();
  final _companyAddressController = TextEditingController();
  final _companyPhoneController = TextEditingController();
  final _companyFoundedYearController = TextEditingController();
  final _companyWebsiteController = TextEditingController();
  final _companyLinkedinController = TextEditingController();
  final _companyDescriptionController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
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
    _companyDescriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthAuthenticated) {
          if (state.user.role == UserRole.recruiter) {
            context.go('/recruiter/dashboard');
          } else {
            context.go('/student/dashboard');
          }
        } else if (state is AuthError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.message), backgroundColor: AppColors.dangerRed),
          );
        }
      },
      child: Scaffold(
      backgroundColor: AppColors.background,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, color: Colors.white, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            _buildHeroHeader(),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                children: [
                  // Step indicator only for recruiter (2 steps)
                  if (_selectedRole == 'Recruiter')
                    Transform.translate(
                      offset: const Offset(0, -28),
                      child: _buildRecruiterStepIndicator(),
                    )
                  else
                    const SizedBox(height: 20),
                  _buildCurrentStep(),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () => context.push('/student-login'),
                    child: RichText(
                      text: const TextSpan(
                        style: TextStyle(color: AppColors.mutedText, fontFamily: 'Poppins', fontSize: 14),
                        children: [
                          TextSpan(text: 'Already have an account? '),
                          TextSpan(
                            text: 'Sign In',
                            style: TextStyle(color: AppColors.primaryBlue, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
    );
  }

  // ─── Hero header ────────────────────────────────────────────────────────────

  Widget _buildHeroHeader() {
    final List<Color> colors;
    final String title;
    final String subtitle;

    if (_selectedRole == 'Candidate' || _currentStep == 0) {
      colors = [AppColors.primaryBlue, AppColors.teal];
      title = 'Create Account';
      subtitle = 'Join PathGuide to start your career journey';
    } else {
      colors = [const Color(0xFF6366F1), const Color(0xFF8B5CF6)];
      title = 'Company Profile';
      subtitle = 'Complete your recruiter and company details';
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(24, 100, 24, 52),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: colors, begin: Alignment.topLeft, end: Alignment.bottomRight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_selectedRole == 'Recruiter')
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
              ),
              child: Text(
                'Step ${_currentStep + 1} of 2',
                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ),
          if (_selectedRole == 'Recruiter') const SizedBox(height: 14),
          Text(title, style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          Text(subtitle, style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 13)),
        ],
      ),
    );
  }

  // ─── Recruiter 2-step indicator ─────────────────────────────────────────────

  Widget _buildRecruiterStepIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 16, offset: const Offset(0, 4))],
      ),
      child: Row(
        children: [
          Expanded(child: _indicatorItem(1, 'Account', _currentStep >= 0)),
          _indicatorLine(_currentStep >= 1),
          Expanded(child: _indicatorItem(2, 'Company', _currentStep >= 1)),
        ],
      ),
    );
  }

  Widget _indicatorLine(bool isActive) {
    return Container(
      width: 30,
      height: 2,
      decoration: BoxDecoration(
        gradient: isActive ? const LinearGradient(colors: [AppColors.primaryBlue, AppColors.teal]) : null,
        color: isActive ? null : AppColors.cardBorder,
        borderRadius: BorderRadius.circular(2),
      ),
    );
  }

  Widget _indicatorItem(int step, String label, bool isActive) {
    return Column(
      children: [
        Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            gradient: isActive ? const LinearGradient(colors: [AppColors.primaryBlue, AppColors.teal]) : null,
            color: isActive ? null : Colors.white,
            shape: BoxShape.circle,
            border: Border.all(color: isActive ? Colors.transparent : AppColors.cardBorder, width: 2),
            boxShadow: isActive
                ? [BoxShadow(color: AppColors.primaryBlue.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 3))]
                : null,
          ),
          child: Center(
            child: Text(
              '$step',
              style: TextStyle(
                color: isActive ? Colors.white : AppColors.mutedText,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: isActive ? AppColors.darkNavy : AppColors.mutedText,
            fontSize: 11,
            fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
          ),
        ),
      ],
    );
  }

  // ─── Step routing ────────────────────────────────────────────────────────────

  Widget _buildCurrentStep() {
    if (_currentStep == 1) return _buildRecruiterStep2();
    return _buildStep1();
  }

  // ─── Step 1 — shared (Account info) ─────────────────────────────────────────

  Widget _buildStep1() {
    return Form(
      key: _formKey1,
      child: AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SectionHeader(
              title: 'Who are you?',
              subtitle: 'Select your role to get started',
            ),
            const SizedBox(height: 24),
            _buildRoleSelector(),
            const SizedBox(height: 32),
            const Text(
              'Personal Information',
              style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.darkNavy, fontSize: 16),
            ),
            const SizedBox(height: 16),
            AppTextField(
              label: 'Full Name',
              hint: 'Your full name',
              controller: _nameController,
              prefixIcon: Icons.person_outline,
              validator: (v) => v!.trim().isEmpty ? 'Please enter your name' : null,
            ),
            const SizedBox(height: 16),
            AppTextField(
              label: 'Phone Number',
              hint: '+20 123 456 7890',
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              prefixIcon: Icons.phone_outlined,
            ),
            const SizedBox(height: 16),
            const Text(
              'Gender',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.darkNavy),
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
            AppTextField(
              label: 'Age',
              hint: 'Enter your age',
              controller: _ageController,
              keyboardType: TextInputType.number,
              prefixIcon: Icons.cake_outlined,
            ),
            const SizedBox(height: 16),
            AppTextField(
              label: 'Email Address',
              hint: 'name@example.com',
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              prefixIcon: Icons.email_outlined,
              validator: (v) => v!.contains('@') ? null : 'Invalid email address',
            ),
            const SizedBox(height: 16),
            AppTextField(
              label: 'Password',
              hint: 'Create a password',
              controller: _passwordController,
              isPassword: true,
              prefixIcon: Icons.lock_outline,
              validator: (v) => v!.length < 6 ? 'Password must be at least 6 characters' : null,
            ),
            const SizedBox(height: 32),
            BlocBuilder<AuthBloc, AuthState>(
              builder: (context, state) {
                return GradientButton(
                  text: _selectedRole == 'Candidate' ? 'Create Account' : 'Next',
                  isLoading: state is AuthLoading,
                  onPressed: () {
                    if (_formKey1.currentState!.validate()) {
                      if (_selectedRole == 'Candidate') {
                        _createCandidateAccount();
                      } else {
                        setState(() => _currentStep = 1);
                      }
                    }
                  },
                );
              },
            ),
            const SizedBox(height: 20),
            const OrDivider(),
            const SizedBox(height: 20),
            BlocBuilder<AuthBloc, AuthState>(
              builder: (context, state) {
                return GoogleSignInButton(
                  label: 'Sign up with Google',
                  onPressed: state is AuthLoading
                      ? null
                      : () => context.read<AuthBloc>().add(
                            GoogleSignInRequested(
                              role: _selectedRole == 'Recruiter' ? 'recruiter' : 'student',
                            ),
                          ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  void _createCandidateAccount() {
    context.read<AuthBloc>().add(RegisterRequested(
      name: _nameController.text.trim(),
      email: _emailController.text.trim(),
      password: _passwordController.text.trim(),
      role: UserRole.student,
      phone: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
    ));
  }

  // ─── Recruiter Step 2 — Company & Recruiter info ─────────────────────────────

  Widget _buildRecruiterStep2() {
    return Form(
      key: _formKey2,
      child: AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SectionHeader(
              title: 'Professional Profile',
              subtitle: 'Complete your recruiter and company details',
            ),
            const SizedBox(height: 32),
            const Text(
              'Recruiter Info',
              style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.darkNavy, fontSize: 16),
            ),
            const SizedBox(height: 16),
            AppTextField(
              label: 'LinkedIn',
              hint: 'https://linkedin.com/in/username',
              controller: _recruiterLinkedinController,
              prefixIcon: Icons.link,
            ),
            const SizedBox(height: 16),
            AppTextField(
              label: 'Your Role',
              hint: 'e.g. HR Manager, Talent Acquisition',
              controller: _recruiterRoleController,
              prefixIcon: Icons.badge_outlined,
            ),
            const SizedBox(height: 16),
            AppTextField(
              label: 'Years of Experience',
              hint: 'Enter years of experience',
              controller: _yearsOfExperienceController,
              keyboardType: TextInputType.number,
              prefixIcon: Icons.work_history_outlined,
            ),
            const SizedBox(height: 32),
            const Text(
              'Company Info',
              style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.darkNavy, fontSize: 16),
            ),
            const SizedBox(height: 16),
            AppTextField(
              label: 'Company Name',
              hint: 'Enter company name',
              controller: _companyNameController,
              prefixIcon: Icons.business_outlined,
            ),
            const SizedBox(height: 16),
            AppTextField(
              label: 'Address',
              hint: 'Enter company address',
              controller: _companyAddressController,
              prefixIcon: Icons.location_on_outlined,
            ),
            const SizedBox(height: 16),
            AppTextField(
              label: 'Phone Number',
              hint: 'Enter company phone number',
              controller: _companyPhoneController,
              keyboardType: TextInputType.phone,
              prefixIcon: Icons.phone_outlined,
            ),
            const SizedBox(height: 16),
            AppTextField(
              label: 'Founded Year',
              hint: 'Enter founded year',
              controller: _companyFoundedYearController,
              keyboardType: TextInputType.number,
              prefixIcon: Icons.calendar_today_outlined,
            ),
            const SizedBox(height: 16),
            AppTextField(
              label: 'Website',
              hint: 'https://www.company.com',
              controller: _companyWebsiteController,
              prefixIcon: Icons.language,
            ),
            const SizedBox(height: 16),
            AppTextField(
              label: 'Company LinkedIn',
              hint: 'https://linkedin.com/company/name',
              controller: _companyLinkedinController,
              prefixIcon: Icons.link,
            ),
            const SizedBox(height: 16),
            AppTextField(
              label: 'Bio',
              hint: 'Describe your company culture and mission...',
              controller: _companyDescriptionController,
              maxLines: 4,
            ),
            const SizedBox(height: 48),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => setState(() => _currentStep = 0),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Back'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: BlocBuilder<AuthBloc, AuthState>(
                    builder: (context, state) {
                      return GradientButton(
                        text: 'Create Account',
                        isLoading: state is AuthLoading,
                        onPressed: () {
                          if (_formKey2.currentState!.validate()) {
                            context.read<AuthBloc>().add(RegisterRequested(
                              name: _nameController.text.trim(),
                              email: _emailController.text.trim(),
                              password: _passwordController.text.trim(),
                              role: UserRole.recruiter,
                              phone: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
                              companyName: _companyNameController.text.trim().isEmpty ? null : _companyNameController.text.trim(),
                            ));
                          }
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ─── Shared widgets ──────────────────────────────────────────────────────────

  Widget _buildRoleSelector() {
    return Row(
      children: [
        Expanded(child: _roleOption('Candidate', Icons.person_search_outlined)),
        const SizedBox(width: 16),
        Expanded(child: _roleOption('Recruiter', Icons.business_center_outlined)),
      ],
    );
  }

  Widget _roleOption(String role, IconData icon) {
    final isSelected = _selectedRole == role;
    return GestureDetector(
      onTap: () => setState(() {
        _selectedRole = role;
        _currentStep = 0;
      }),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryBlue.withValues(alpha: 0.05) : Colors.white,
          borderRadius: BorderRadius.circular(15),
          border: Border.all(
            color: isSelected ? AppColors.primaryBlue : AppColors.cardBorder,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(icon, color: isSelected ? AppColors.primaryBlue : AppColors.mutedText, size: 28),
            const SizedBox(height: 8),
            Text(
              role,
              style: TextStyle(
                color: isSelected ? AppColors.primaryBlue : AppColors.mutedText,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _genderOption(String gender, IconData icon) {
    final isSelected = _selectedGender == gender;
    return GestureDetector(
      onTap: () => setState(() => _selectedGender = gender),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryBlue.withValues(alpha: 0.05) : Colors.white,
          borderRadius: BorderRadius.circular(15),
          border: Border.all(
            color: isSelected ? AppColors.primaryBlue : AppColors.cardBorder,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(icon, color: isSelected ? AppColors.primaryBlue : AppColors.mutedText, size: 26),
            const SizedBox(height: 6),
            Text(
              gender,
              style: TextStyle(
                color: isSelected ? AppColors.primaryBlue : AppColors.mutedText,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
