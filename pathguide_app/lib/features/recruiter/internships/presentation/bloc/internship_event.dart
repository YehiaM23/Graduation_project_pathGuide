part of 'internship_bloc.dart';

abstract class InternshipEvent extends Equatable {
  const InternshipEvent();

  @override
  List<Object?> get props => [];
}

class LoadMyInternships extends InternshipEvent {}

class LoadAllInternships extends InternshipEvent {}

class AddInternship extends InternshipEvent {
  final InternshipModel internship;
  const AddInternship(this.internship);

  @override
  List<Object?> get props => [internship];
}

class EditInternship extends InternshipEvent {
  final InternshipModel internship;
  const EditInternship(this.internship);

  @override
  List<Object?> get props => [internship];
}

class WithdrawInternship extends InternshipEvent {
  final String internshipId;
  const WithdrawInternship(this.internshipId);

  @override
  List<Object?> get props => [internshipId];
}

class RepostInternship extends InternshipEvent {
  final String internshipId;
  const RepostInternship(this.internshipId);

  @override
  List<Object?> get props => [internshipId];
}
