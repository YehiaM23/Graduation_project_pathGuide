import 'package:equatable/equatable.dart';
import 'package:pathguide_app/core/data/models.dart';

abstract class StudentApplicationState extends Equatable {
  const StudentApplicationState();
}

class StudentApplicationInitial extends StudentApplicationState {
  @override
  List<Object?> get props => [];
}

class StudentApplicationLoading extends StudentApplicationState {
  @override
  List<Object?> get props => [];
}

class StudentApplicationLoaded extends StudentApplicationState {
  final List<ApplicationModel> applications;
  const StudentApplicationLoaded({required this.applications});
  @override
  List<Object?> get props => [applications];
}
