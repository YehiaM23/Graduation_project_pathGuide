import 'package:equatable/equatable.dart';

abstract class StudentApplicationEvent extends Equatable {
  const StudentApplicationEvent();
}

class LoadStudentApplications extends StudentApplicationEvent {
  const LoadStudentApplications();
  @override
  List<Object?> get props => [];
}

class SubmitStudentReview extends StudentApplicationEvent {
  final String applicationId;
  final double rating;
  final String review;
  const SubmitStudentReview({required this.applicationId, required this.rating, required this.review});
  @override
  List<Object?> get props => [applicationId, rating, review];
}
