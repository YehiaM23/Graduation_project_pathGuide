import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:pathguide_app/core/data/models.dart';
import 'package:pathguide_app/core/services/auth_api_service.dart';
import 'package:pathguide_app/core/services/google_sign_in_service.dart';
import 'package:pathguide_app/core/services/token_storage.dart';

part 'auth_event.dart';
part 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  AuthBloc() : super(AuthInitial()) {
    on<AppStarted>((event, emit) async {
      final token = await TokenStorage.getToken();
      if (token == null) {
        emit(AuthUnauthenticated());
        return;
      }
      final role = await TokenStorage.getRole();
      final userRole = role == 'recruiter' ? UserRole.recruiter : UserRole.student;
      final user = UserModel(id: '', name: '', email: '', role: userRole);
      emit(AuthAuthenticated(user));
    });

    on<LoginRequested>((event, emit) async {
      emit(AuthLoading());
      try {
        final user = await AuthApiService.login(event.email, event.password, event.role);
        emit(AuthAuthenticated(user));
      } catch (e) {
        emit(AuthError(e.toString()));
      }
    });

    on<RegisterRequested>((event, emit) async {
      emit(AuthLoading());
      try {
        final UserModel user;
        if (event.role == UserRole.recruiter) {
          user = await AuthApiService.registerRecruiter(
            name: event.name,
            email: event.email,
            password: event.password,
            phone: event.phone,
            companyName: event.companyName,
          );
        } else {
          user = await AuthApiService.registerStudent(
            name: event.name,
            email: event.email,
            password: event.password,
            phone: event.phone,
          );
        }
        emit(AuthAuthenticated(user));
      } catch (e) {
        emit(AuthError(e.toString()));
      }
    });

    on<UserUpdateRequested>((event, emit) {
      if (state is AuthAuthenticated) {
        emit(AuthAuthenticated(event.updatedUser));
      }
    });

    on<GoogleSignInRequested>((event, emit) async {
      emit(AuthLoading());
      try {
        final account = await GoogleSignInService.signIn();
        if (account == null) {
          emit(AuthUnauthenticated());
          return;
        }
        final role = event.role == 'recruiter' ? UserRole.recruiter : UserRole.student;
        emit(AuthAuthenticated(UserModel(
          id: account.id,
          name: account.displayName ?? account.email.split('@').first,
          email: account.email,
          role: role,
        )));
      } catch (e) {
        emit(const AuthError('Google Sign-In failed. Please try again.'));
      }
    });

    on<LogoutRequested>((event, emit) async {
      await TokenStorage.clear();
      emit(AuthUnauthenticated());
    });

    on<MockSignIn>((event, emit) {
      emit(AuthAuthenticated(event.user));
    });
  }
}
