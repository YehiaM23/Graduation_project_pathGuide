part of 'internship_bloc.dart';

abstract class InternshipState extends Equatable {
  const InternshipState();
  
  @override
  List<Object?> get props => [];
}

class InternshipInitial extends InternshipState {}

class InternshipLoading extends InternshipState {}

class InternshipLoaded extends InternshipState {
  final List<InternshipModel> myInternships;
  const InternshipLoaded(this.myInternships);

  @override
  List<Object?> get props => [myInternships];
}

class InternshipError extends InternshipState {
  final String message;
  const InternshipError(this.message);

  @override
  List<Object?> get props => [message];
}
