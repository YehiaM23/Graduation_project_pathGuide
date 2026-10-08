import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:pathguide_app/core/data/models.dart';
import 'package:pathguide_app/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:pathguide_app/core/theme/app_colors.dart';
import 'package:pathguide_app/core/widgets/reusable_widgets.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        if (state is! AuthAuthenticated) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }

        final user = state.user;

        return Scaffold(
          appBar: AppBar(
            title: const Text('My Profile', style: TextStyle(fontWeight: FontWeight.bold)),
            centerTitle: true,
            actions: [
              IconButton(
                icon: const Icon(Icons.edit_outlined),
                onPressed: () => context.push('/student/profile'),
              ),
            ],
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              children: [
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    color: AppColors.primaryBlue.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      user.name.isNotEmpty ? user.name.substring(0, 1).toUpperCase() : 'U',
                      style: const TextStyle(
                        fontSize: 40,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primaryBlue,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  user.name,
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                Text(
                  user.careerPath ?? 'Student',
                  style: const TextStyle(color: AppColors.primaryBlue, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                Text(
                  '${user.university ?? ''} • ${user.major ?? ''}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.mutedText),
                ),
                const SizedBox(height: 32),
                _buildInfoRow(Icons.email_outlined, user.email),
                if (user.phone != null && user.phone!.isNotEmpty)
                  _buildInfoRow(Icons.phone_outlined, user.phone!),
                if (user.graduationYear != null && user.graduationYear!.isNotEmpty)
                  _buildInfoRow(Icons.calendar_today_outlined, 'Class of ${user.graduationYear}'),
                const SizedBox(height: 32),
                _buildSkillSection('Skills', user.skills),
                const SizedBox(height: 24),
                _buildSkillSection('Interests', user.interests),
                const SizedBox(height: 24),
                _buildCVSection(context),
                const SizedBox(height: 32),
                GradientButton(
                  text: 'Logout',
                  onPressed: () => context.read<AuthBloc>().add(LogoutRequested()),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 18, color: AppColors.mutedText),
          const SizedBox(width: 8),
          Text(text, style: const TextStyle(color: AppColors.darkNavy)),
        ],
      ),
    );
  }

  Widget _buildSkillSection(String title, List<String> items) {
    if (items.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: Wrap(
            spacing: 8,
            runSpacing: 8,
            children: items
                .map((item) => Chip(
                      label: Text(item),
                      backgroundColor: AppColors.primaryBlue.withValues(alpha: 0.1),
                      side: BorderSide.none,
                      labelStyle: const TextStyle(color: AppColors.primaryBlue, fontSize: 12),
                    ))
                .toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildCVSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Resume / CV', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            TextButton(
              onPressed: () async {
                final scaffoldMessenger = ScaffoldMessenger.of(context);
                FilePickerResult? result = await FilePicker.platform.pickFiles(
                  type: FileType.custom,
                  allowedExtensions: ['pdf', 'doc', 'docx'],
                );
                if (result != null) {
                  scaffoldMessenger.showSnackBar(
                    SnackBar(content: Text('Uploaded: ${result.files.first.name}'), backgroundColor: AppColors.success),
                  );
                }
              },
              child: const Text('Upload New'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: Row(
            children: [
              const Icon(Icons.description, color: AppColors.primaryBlue, size: 40),
              const SizedBox(width: 16),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('John_Doe_CV.pdf', style: TextStyle(fontWeight: FontWeight.bold)),
                    Text('Uploaded on Oct 12, 2023', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.download),
                onPressed: () {},
              ),
            ],
          ),
        ),
      ],
    );
  }
}

