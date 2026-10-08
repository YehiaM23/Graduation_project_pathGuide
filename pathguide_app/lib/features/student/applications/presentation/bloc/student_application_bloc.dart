import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:pathguide_app/core/data/models.dart';
import 'student_application_event.dart';
import 'student_application_state.dart';

class StudentApplicationBloc extends Bloc<StudentApplicationEvent, StudentApplicationState> {
  static final List<ApplicationModel> _applications = [
    const ApplicationModel(
      id: 's1',
      internshipId: 'mock1',
      studentId: 'me',
      status: 'Pending',
      appliedDate: '12/05/2026',
      internshipTitle: 'Flutter Developer Intern',
      companyName: 'Tech Corp',
    ),
    const ApplicationModel(
      id: 's2',
      internshipId: 'mock2',
      studentId: 'me',
      status: 'Under Review',
      appliedDate: '10/05/2026',
      internshipTitle: 'Data Science Intern',
      companyName: 'Data Insights',
    ),
    const ApplicationModel(
      id: 's3',
      internshipId: 'mock3',
      studentId: 'me',
      status: 'Accepted',
      appliedDate: '05/05/2026',
      internshipTitle: 'UI/UX Design Intern',
      companyName: 'Creative Studio',
    ),
    const ApplicationModel(
      id: 's4',
      internshipId: 'mock4',
      studentId: 'me',
      status: 'Completed',
      appliedDate: '01/04/2026',
      completionDate: '10/05/2026',
      internshipTitle: 'Backend Developer Intern',
      companyName: 'Cloud Solutions',
      feedback: 'Excellent work ethic and strong communication skills.',
      rating: 4.5,
      certificateUrl: 'CERT-2026-042',
    ),
    const ApplicationModel(
      id: 's5',
      internshipId: 'mock5',
      studentId: 'me',
      status: 'History',
      appliedDate: '01/02/2026',
      completionDate: '15/04/2026',
      internshipTitle: 'Mobile Developer Intern',
      companyName: 'App Builders',
      feedback: 'Great team player with outstanding technical skills.',
      rating: 5.0,
      certificateUrl: 'CERT-2026-010',
      studentRating: 4.0,
      studentReview: 'Amazing experience! Learned a lot about mobile development.',
    ),
  ];

  StudentApplicationBloc() : super(StudentApplicationInitial()) {
    on<LoadStudentApplications>((event, emit) {
      emit(StudentApplicationLoaded(applications: List.from(_applications)));
    });

    on<SubmitStudentReview>((event, emit) {
      final idx = _applications.indexWhere((a) => a.id == event.applicationId);
      if (idx == -1) return;
      final app = _applications[idx];
      _applications[idx] = ApplicationModel(
        id: app.id,
        internshipId: app.internshipId,
        studentId: app.studentId,
        status: 'History',
        appliedDate: app.appliedDate,
        completionDate: app.completionDate,
        internshipTitle: app.internshipTitle,
        companyName: app.companyName,
        feedback: app.feedback,
        rating: app.rating,
        certificateUrl: app.certificateUrl,
        studentRating: event.rating,
        studentReview: event.review,
      );
      emit(StudentApplicationLoaded(applications: List.from(_applications)));
    });
  }
}
