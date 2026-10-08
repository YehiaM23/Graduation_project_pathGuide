import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:pathguide_app/core/theme/app_colors.dart';
import 'package:pathguide_app/core/widgets/reusable_widgets.dart';
import 'package:pathguide_app/core/data/models.dart';
import '../bloc/auth_bloc.dart';

class StudentLoginPage extends StatefulWidget {
  const StudentLoginPage({super.key});

  @override
  State<StudentLoginPage> createState() => _StudentLoginPageState();
}

class _StudentLoginPageState extends State<StudentLoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

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
            onPressed: () => context.canPop() ? context.pop() : context.go('/'),
          ),
        ),
        body: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(24, 100, 24, 44),
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
                      const Text('Welcome Back', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 6),
                      Text('Sign in to your account',
                          style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 14)),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Transform.translate(
                    offset: const Offset(0, -24),
                    child: Column(
                      children: [
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 20, offset: const Offset(0, 6))],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                height: 5,
                                decoration: const BoxDecoration(
                                  gradient: LinearGradient(colors: [AppColors.primaryBlue, AppColors.teal]),
                                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.all(24),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Sign In', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: AppColors.darkNavy)),
                                    const SizedBox(height: 4),
                                    const Text('Enter your credentials to continue', style: TextStyle(color: AppColors.mutedText, fontSize: 13)),
                                    const SizedBox(height: 24),
                                    AppTextField(
                                      label: 'Email Address',
                                      hint: 'Enter your email',
                                      controller: _emailController,
                                      keyboardType: TextInputType.emailAddress,
                                      prefixIcon: Icons.email_outlined,
                                      validator: (val) => val != null && val.contains('@') ? null : 'Enter a valid email',
                                    ),
                                    const SizedBox(height: 16),
                                    AppTextField(
                                      label: 'Password',
                                      hint: 'Enter your password',
                                      controller: _passwordController,
                                      isPassword: true,
                                      prefixIcon: Icons.lock_outline,
                                      validator: (val) => val != null && val.length >= 6 ? null : 'Password must be at least 6 characters',
                                    ),
                                    Align(
                                      alignment: Alignment.centerRight,
                                      child: TextButton(
                                        onPressed: () => context.push('/forgot-password'),
                                        child: const Text('Forgot Password?', style: TextStyle(color: AppColors.primaryBlue, fontSize: 12, fontWeight: FontWeight.w600)),
                                      ),
                                    ),
                                    BlocBuilder<AuthBloc, AuthState>(
                                      builder: (context, state) {
                                        return GradientButton(
                                          text: 'Sign In',
                                          isLoading: state is AuthLoading,
                                          onPressed: () {
                                            if (_formKey.currentState!.validate()) {
                                              context.read<AuthBloc>().add(
                                                LoginRequested(_emailController.text, _passwordController.text, 'student'),
                                              );
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
                                          label: 'Continue with Google',
                                          onPressed: state is AuthLoading
                                              ? null
                                              : () => context.read<AuthBloc>().add(const GoogleSignInRequested(role: 'student')),
                                        );
                                      },
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),
                        if (kDebugMode) ...[
                          const Divider(),
                          const SizedBox(height: 8),
                          const Text('— Debug Test Buttons —',
                              style: TextStyle(color: AppColors.mutedText, fontSize: 11)),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: () => context.read<AuthBloc>().add(MockSignIn(UserModel(
                                    id: 'test-student',
                                    name: 'Test Student',
                                    email: 'student@test.com',
                                    role: UserRole.student,
                                  ))),
                                  child: const Text('Student', style: TextStyle(fontSize: 12)),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: () => context.read<AuthBloc>().add(MockSignIn(UserModel(
                                    id: 'test-recruiter',
                                    name: 'Test Recruiter',
                                    email: 'recruiter@test.com',
                                    role: UserRole.recruiter,
                                  ))),
                                  child: const Text('Recruiter', style: TextStyle(fontSize: 12)),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                        ],
                        TextButton(
                          onPressed: () => context.push('/signup'),
                          child: RichText(
                            text: const TextSpan(
                              style: TextStyle(color: AppColors.mutedText, fontFamily: 'Poppins', fontSize: 14),
                              children: [
                                TextSpan(text: "Don't have an account? "),
                                TextSpan(
                                  text: "Sign Up",
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
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
