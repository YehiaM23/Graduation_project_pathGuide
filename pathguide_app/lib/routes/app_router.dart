import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import '../features/landing/presentation/pages/home_page.dart';
import '../features/about/presentation/pages/about_page.dart';
import '../features/contact/presentation/pages/contact_page.dart';
import '../features/auth/presentation/pages/student_login_page.dart';
import '../features/auth/presentation/pages/forgot_password_page.dart';
import '../features/auth/presentation/pages/reset_password_page.dart';
import '../features/auth/presentation/pages/signup_page.dart';
import '../features/student/dashboard/presentation/pages/student_dashboard.dart';
import '../features/student/profile/presentation/pages/student_profile_page.dart';
import '../features/student/profile/presentation/pages/student_profile_view_page.dart';
import '../features/student/career_path/presentation/pages/career_path_planner_page.dart';
import '../features/student/internships/presentation/pages/student_internships_page.dart';
import '../features/student/internships/presentation/pages/internship_details_page.dart';
import '../features/student/applications/presentation/pages/student_applications_page.dart';
import '../features/student/recommended/presentation/pages/recommended_careers_page.dart';
import '../features/recruiter/dashboard/presentation/pages/recruiter_dashboard.dart';
import '../features/recruiter/internships/presentation/pages/my_internships_page.dart';
import '../features/recruiter/internships/presentation/pages/post_internship_page.dart';
import '../core/data/models.dart';
import '../features/recruiter/applications/presentation/pages/all_applications_page.dart';
import '../features/recruiter/profile/presentation/pages/recruiter_profile_page.dart';
import '../features/notifications/presentation/pages/notifications_page.dart';
import '../features/legal/presentation/pages/privacy_policy_page.dart';
import '../features/legal/presentation/pages/terms_of_service_page.dart';
import '../features/legal/presentation/pages/cookie_policy_page.dart';
import '../features/auth/presentation/bloc/auth_bloc.dart';

// Bridges AuthBloc state into GoRouter's refreshListenable so the router
// re-evaluates the redirect callback whenever auth state changes.
class AuthNotifier extends ChangeNotifier {
  AuthState _state = AuthInitial();
  AuthState get state => _state;

  void update(AuthState newState) {
    _state = newState;
    notifyListeners();
  }
}

class AppRouter {
  static final authNotifier = AuthNotifier();

  static const _authRoutes = ['/student-login', '/signup', '/forgot-password', '/reset-password'];
  static const _landingRoutes = ['/', '/home'];

  static final router = GoRouter(
    initialLocation: '/',
    refreshListenable: authNotifier,
    redirect: (context, state) {
      final auth = authNotifier.state;
      if (auth is AuthInitial || auth is AuthLoading) return null;

      final location = state.matchedLocation;

      if (auth is AuthAuthenticated) {
        final dashboard = auth.user.role == UserRole.recruiter
            ? '/recruiter/dashboard'
            : '/student/dashboard';
        if (_authRoutes.contains(location) || _landingRoutes.contains(location)) {
          return dashboard;
        }
      }

      if (auth is AuthUnauthenticated) {
        final isProtected = location.startsWith('/student') ||
            location.startsWith('/recruiter') ||
            location == '/notifications';
        if (isProtected) return '/student-login';
      }

      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (context, state) => const HomePage()),
      GoRoute(path: '/home', builder: (context, state) => const HomePage()),
      GoRoute(path: '/about', builder: (context, state) => const AboutPage()),
      GoRoute(path: '/contact', builder: (context, state) => const ContactPage()),
      GoRoute(path: '/student-login', builder: (context, state) => const StudentLoginPage()),
      GoRoute(path: '/signup', builder: (context, state) => const SignupPage()),
      GoRoute(path: '/forgot-password', builder: (context, state) => const ForgotPasswordPage()),
      GoRoute(path: '/reset-password', builder: (context, state) => const ResetPasswordPage()),
      GoRoute(path: '/notifications', builder: (context, state) => const NotificationsPage()),
      
      // Student Routes
      GoRoute(path: '/student/dashboard', builder: (context, state) => const StudentDashboard()),
      GoRoute(path: '/student/profile', builder: (context, state) => const StudentProfileViewPage()),
      GoRoute(path: '/student/edit-profile', builder: (context, state) => const StudentProfilePage()),
      GoRoute(path: '/student/career-path', builder: (context, state) => const CareerPathPlannerPage()),
      GoRoute(path: '/student/internships', builder: (context, state) => const StudentInternshipsPage()),
      GoRoute(path: '/student/internship-details', builder: (context, state) => const InternshipDetailsPage()),
      GoRoute(path: '/student/applications', builder: (context, state) => const StudentApplicationsPage()),
      GoRoute(path: '/student/recommended', builder: (context, state) => const RecommendedCareersPage()),
      
      // Recruiter Routes
      GoRoute(path: '/recruiter/dashboard', builder: (context, state) => const RecruiterDashboard()),
      GoRoute(path: '/recruiter/profile', builder: (context, state) => const RecruiterProfilePage()),
      GoRoute(path: '/recruiter/my-internships', builder: (context, state) => const MyInternshipsPage()),
      GoRoute(path: '/recruiter/post-internship', builder: (context, state) => PostInternshipPage(editInternship: state.extra as InternshipModel?)),
      GoRoute(path: '/recruiter/applications', builder: (context, state) => const AllApplicationsPage()),
      
      // Legal Routes
      GoRoute(path: '/privacy', builder: (context, state) => const PrivacyPolicyPage()),
      GoRoute(path: '/terms', builder: (context, state) => const TermsOfServicePage()),
      GoRoute(path: '/cookies', builder: (context, state) => const CookiePolicyPage()),
    ],
  );
}
