part of 'auth_bloc.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class AppStarted extends AuthEvent {}

class LoginRequested extends AuthEvent {
  final String email;
  final String password;
  final String role;

  const LoginRequested(this.email, this.password, this.role);

  @override
  List<Object?> get props => [email, password, role];
}

class RegisterRequested extends AuthEvent {
  final String name;
  final String email;
  final String password;
  final UserRole role;
  final String? phone;
  // Additional profile data
  final String? university;
  final String? major;
  final String? graduationYear;
  final String? careerPath;
  final List<String>? skills;
  final List<String>? interests;
  final String? companyName;
  final String? companyWebsite;
  final String? companyIndustry;
  final String? companyLocation;
  final String? companyDescription;

  const RegisterRequested({
    required this.name,
    required this.email,
    required this.password,
    required this.role,
    this.phone,
    this.university,
    this.major,
    this.graduationYear,
    this.careerPath,
    this.skills,
    this.interests,
    this.companyName,
    this.companyWebsite,
    this.companyIndustry,
    this.companyLocation,
    this.companyDescription,
  });

  @override
  List<Object?> get props => [
        name,
        email,
        password,
        role,
        phone,
        university,
        major,
        graduationYear,
        careerPath,
        skills,
        interests,
        companyName,
        companyWebsite,
        companyIndustry,
        companyLocation,
        companyDescription,
      ];
}

class GoogleSignInRequested extends AuthEvent {
  final String role;
  const GoogleSignInRequested({this.role = 'student'});

  @override
  List<Object?> get props => [role];
}

class LogoutRequested extends AuthEvent {}

class MockSignIn extends AuthEvent {
  final UserModel user;
  const MockSignIn(this.user);

  @override
  List<Object?> get props => [user];
}

class UserUpdateRequested extends AuthEvent {
  final UserModel updatedUser;
  const UserUpdateRequested(this.updatedUser);

  @override
  List<Object?> get props => [updatedUser];
}
