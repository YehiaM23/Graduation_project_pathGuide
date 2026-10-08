import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:pathguide_app/core/data/models.dart';
import 'application_event.dart';
import 'application_state.dart';

class ApplicationBloc extends Bloc<ApplicationEvent, ApplicationState> {
  static final List<ApplicationModel> _applications = [
    const ApplicationModel(
      id: '1',
      internshipId: 'mock1',
      studentId: 'student1',
      status: 'Pending',
      appliedDate: '10/05/2026',
      studentName: 'Ahmed Hassan',
      studentEmail: 'ahmed@student.com',
      internshipTitle: 'Flutter Developer Intern',
    ),
    const ApplicationModel(
      id: '2',
      internshipId: 'mock1',
      studentId: 'student2',
      status: 'Pending',
      appliedDate: '11/05/2026',
      studentName: 'Sara Mohamed',
      studentEmail: 'sara@student.com',
      internshipTitle: 'Flutter Developer Intern',
    ),
    const ApplicationModel(
      id: '3',
      internshipId: 'mock2',
      studentId: 'student3',
      status: 'Accepted',
      appliedDate: '01/05/2026',
      studentName: 'Omar Ali',
      studentEmail: 'omar@student.com',
      internshipTitle: 'UI/UX Design Intern',
    ),
    const ApplicationModel(
      id: '4',
      internshipId: 'mock2',
      studentId: 'student4',
      status: 'Completed',
      appliedDate: '20/04/2026',
      studentName: 'Nour Khalil',
      studentEmail: 'nour@student.com',
      internshipTitle: 'UI/UX Design Intern',
      feedback: 'Excellent performance and outstanding communication skills.',
      rating: 5.0,
      certificateUrl: 'CERT-2026-001',
      completionDate: '15/05/2026',
    ),
  ];

  ApplicationBloc() : super(ApplicationInitial()) {
    on<LoadApplications>((event, emit) {
      emit(ApplicationLoaded(applications: List.from(_applications)));
    });

    on<UpdateApplicationStatus>((event, emit) {
      final idx = _applications.indexWhere((a) => a.id == event.applicationId);
      if (idx == -1) return;
      final app = _applications[idx];
      _applications[idx] = ApplicationModel(
        id: app.id,
        internshipId: app.internshipId,
        studentId: app.studentId,
        status: event.status,
        appliedDate: app.appliedDate,
        studentName: app.studentName,
        studentEmail: app.studentEmail,
        internshipTitle: app.internshipTitle,
        feedback: event.feedback ?? app.feedback,
        rating: event.rating ?? app.rating,
        certificateUrl: event.certificateId ?? app.certificateUrl,
        completionDate: event.status == 'Completed' ? _today() : app.completionDate,
      );
      emit(ApplicationLoaded(applications: List.from(_applications)));
    });

    on<DeleteApplication>((event, emit) {
      _applications.removeWhere((a) => a.id == event.applicationId);
      emit(ApplicationLoaded(applications: List.from(_applications)));
    });
  }

  static String _today() {
    final now = DateTime.now();
    return '${now.day.toString().padLeft(2, '0')}/${now.month.toString().padLeft(2, '0')}/${now.year}';
  }
}
