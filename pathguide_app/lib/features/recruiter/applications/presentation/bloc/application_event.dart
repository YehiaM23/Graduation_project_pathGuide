import 'package:equatable/equatable.dart';

abstract class ApplicationEvent extends Equatable {
  const ApplicationEvent();

  @override
  List<Object?> get props => [];
}

class LoadApplications extends ApplicationEvent {}

class UpdateApplicationStatus extends ApplicationEvent {
  final String applicationId;
  final String status;
  final String? feedback;
  final double? rating;
  final String? certificateId;

  const UpdateApplicationStatus({
    required this.applicationId,
    required this.status,
    this.feedback,
    this.rating,
    this.certificateId,
  });

  @override
  List<Object?> get props => [applicationId, status, feedback, rating, certificateId];
}

class DeleteApplication extends ApplicationEvent {
  final String applicationId;
  const DeleteApplication(this.applicationId);

  @override
  List<Object?> get props => [applicationId];
}
