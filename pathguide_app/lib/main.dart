import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/app_colors.dart';
import 'routes/app_router.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/recruiter/internships/presentation/bloc/internship_bloc.dart';
import 'features/recruiter/applications/presentation/bloc/application_bloc.dart';
import 'features/recruiter/applications/presentation/bloc/application_event.dart';
import 'features/student/applications/presentation/bloc/student_application_bloc.dart';
import 'features/student/applications/presentation/bloc/student_application_event.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const PathGuideApp());
}

class PathGuideApp extends StatelessWidget {
  const PathGuideApp({super.key});

  static const _mobileWidth = 430.0;

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (context) => AuthBloc()..add(AppStarted())),
        BlocProvider(create: (context) => InternshipBloc()),
        BlocProvider(create: (context) => ApplicationBloc()),
        BlocProvider(create: (context) => StudentApplicationBloc()..add(const LoadStudentApplications())),
      ],
      child: BlocListener<AuthBloc, AuthState>(
        listener: (context, state) => AppRouter.authNotifier.update(state),
        child: MaterialApp.router(
          title: 'PathGuide',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          routerConfig: AppRouter.router,
          builder: (context, child) {
            final screenWidth = MediaQuery.of(context).size.width;
            final screenHeight = MediaQuery.of(context).size.height;
            final isWideScreen = screenWidth > _mobileWidth;

            if (!isWideScreen) return child!;

            return Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Center(
                child: Container(
                  width: _mobileWidth,
                  height: screenHeight,
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.4),
                        blurRadius: 60,
                        spreadRadius: 10,
                      ),
                    ],
                  ),
                  child: MediaQuery(
                    data: MediaQuery.of(context).copyWith(
                      size: Size(_mobileWidth, screenHeight),
                    ),
                    child: ClipRect(child: child!),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
