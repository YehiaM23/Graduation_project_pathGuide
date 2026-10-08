import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:pathguide_app/core/theme/app_colors.dart';
import 'package:pathguide_app/core/widgets/reusable_widgets.dart';
import 'package:pathguide_app/features/auth/presentation/bloc/auth_bloc.dart';

class RecruiterDashboardScaffold extends StatelessWidget {
  final Widget body;
  final String title;
  final List<Widget>? actions;

  const RecruiterDashboardScaffold({
    super.key,
    required this.body,
    this.title = 'Recruiter Dashboard',
    this.actions,
  });

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        final user = state is AuthAuthenticated ? state.user : null;
        final userName = user?.name ?? 'Recruiter';
        final userEmail = user?.email ?? '';

        return LayoutBuilder(
          builder: (context, constraints) {
            final isDesktop = constraints.maxWidth > 900;

            return PageScaffold(
              showLogo: true,
              title: title,
              actions: actions,
              scrollable: false, // Set to false to allow internal scrolling and Expanded widgets
              drawer: isDesktop ? null : _buildRecruiterDrawer(context, userName, userEmail),
              body: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (isDesktop)
                    _buildSidebar(context, userName, userEmail),
                  if (isDesktop) const SizedBox(width: 32),
                  Expanded(
                    child: body,
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildSidebar(BuildContext context, String name, String email) {
    final location = GoRouterState.of(context).uri.path;

    return Container(
      width: 280,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildProfileHeader(name, email),
          const SizedBox(height: 32),
          _sidebarItem(context, Icons.dashboard_outlined, 'Dashboard', '/recruiter/dashboard', location == '/recruiter/dashboard'),
          _sidebarItem(context, Icons.person_outline, 'Edit Profile', '/recruiter/profile', location == '/recruiter/profile'),
          _sidebarItem(context, Icons.list_alt_rounded, 'My Internships', '/recruiter/my-internships', location == '/recruiter/my-internships'),
          _sidebarItem(context, Icons.add_business_rounded, 'Post Internship', '/recruiter/post-internship', location == '/recruiter/post-internship'),
          _sidebarItem(context, Icons.assignment_ind_rounded, 'Applications', '/recruiter/applications', location == '/recruiter/applications'),
          const Spacer(),
          const Divider(),
          _sidebarItem(context, Icons.logout_rounded, 'Sign Out', '/home', false, color: AppColors.dangerRed, isLogout: true),
        ],
      ),
    );
  }

  Widget _buildProfileHeader(String name, String email) {
    return Row(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            gradient: AppColors.mainGradient,
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(Icons.business, color: Colors.white, size: 24),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.darkNavy),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              Text(
                email,
                style: const TextStyle(fontSize: 12, color: AppColors.mutedText),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _sidebarItem(BuildContext context, IconData icon, String title, String route, bool isSelected, {Color? color, bool isLogout = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: InkWell(
        onTap: () {
          if (isLogout) {
            context.read<AuthBloc>().add(LogoutRequested());
            context.go(route);
          } else {
            context.go(route);
          }
        },
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primaryBlue.withValues(alpha: 0.1) : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Icon(icon, color: color ?? (isSelected ? AppColors.primaryBlue : AppColors.mutedText), size: 22),
              const SizedBox(width: 12),
              Text(
                title,
                style: TextStyle(
                  color: color ?? (isSelected ? AppColors.primaryBlue : AppColors.darkNavy),
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRecruiterDrawer(BuildContext context, String name, String email) {
    final location = GoRouterState.of(context).uri.path;

    return Drawer(
      backgroundColor: Colors.white,
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(20, 60, 20, 30),
            decoration: const BoxDecoration(gradient: AppColors.mainGradient),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: const Icon(Icons.business, color: Colors.white, size: 30),
                ),
                const SizedBox(height: 16),
                Text(
                  name,
                  style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                ),
                Text(
                  email,
                  style: const TextStyle(color: Colors.white70, fontSize: 14),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          _drawerItem(context, Icons.dashboard_outlined, 'Dashboard', '/recruiter/dashboard', location == '/recruiter/dashboard'),
          _drawerItem(context, Icons.person_outline, 'Edit Profile', '/recruiter/profile', location == '/recruiter/profile'),
          _drawerItem(context, Icons.list_alt_rounded, 'My Internships', '/recruiter/my-internships', location == '/recruiter/my-internships'),
          _drawerItem(context, Icons.add_business_rounded, 'Post Internship', '/recruiter/post-internship', location == '/recruiter/post-internship'),
          _drawerItem(context, Icons.assignment_ind_rounded, 'Applications', '/recruiter/applications', location == '/recruiter/applications'),
          const Spacer(),
          const Divider(),
          _drawerItem(context, Icons.logout_rounded, 'Sign Out', '/home', false, color: AppColors.dangerRed, isLogout: true),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _drawerItem(BuildContext context, IconData icon, String title, String route, bool isSelected, {Color? color, bool isLogout = false}) {
    return ListTile(
      leading: Icon(icon, color: color ?? (isSelected ? AppColors.primaryBlue : AppColors.mutedText)),
      title: Text(
        title,
        style: TextStyle(
          color: color ?? (isSelected ? AppColors.primaryBlue : AppColors.darkNavy),
          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
        ),
      ),
      onTap: () {
        if (isLogout) {
          context.read<AuthBloc>().add(LogoutRequested());
          context.go(route);
        } else {
          Navigator.pop(context);
          context.go(route);
        }
      },
      dense: true,
      visualDensity: VisualDensity.compact,
    );
  }
}
