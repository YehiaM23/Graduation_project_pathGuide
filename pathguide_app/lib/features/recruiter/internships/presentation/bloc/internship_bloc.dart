import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:pathguide_app/core/data/models.dart';

part 'internship_event.dart';
part 'internship_state.dart';

class InternshipBloc extends Bloc<InternshipEvent, InternshipState> {
  static final List<InternshipModel> _localInternships = [
    const InternshipModel(
      id: 'mock1',
      title: 'Flutter Developer Intern',
      company: 'TechCorp Egypt',
      description: 'Work on cross-platform mobile apps using Flutter and Dart.',
      location: 'Remote',
      duration: '3 Months',
      stipend: '5000 EGP',
      startDate: '01/06/2026',
      deadline: '25/05/2026',
      requiredSkill: 'Flutter, Dart',
      isActive: true,
    ),
    const InternshipModel(
      id: 'mock2',
      title: 'UI/UX Design Intern',
      company: 'TechCorp Egypt',
      description: 'Design user interfaces for web and mobile products.',
      location: 'Cairo, Egypt',
      duration: '2 Months',
      stipend: '3000 EGP',
      startDate: '15/06/2026',
      deadline: '10/06/2026',
      requiredSkill: 'Figma, UI/UX Design',
      isActive: false,
    ),
  ];

  InternshipBloc() : super(InternshipInitial()) {
    on<LoadMyInternships>((event, emit) {
      emit(InternshipLoaded(List.from(_localInternships)));
    });

    on<LoadAllInternships>((event, emit) {
      emit(InternshipLoaded(_localInternships.where((i) => i.isActive).toList()));
    });

    on<AddInternship>((event, emit) {
      _localInternships.add(event.internship);
      emit(InternshipLoaded(List.from(_localInternships)));
    });

    on<EditInternship>((event, emit) {
      final idx = _localInternships.indexWhere((i) => i.id == event.internship.id);
      if (idx != -1) _localInternships[idx] = event.internship;
      emit(InternshipLoaded(List.from(_localInternships)));
    });

    on<WithdrawInternship>((event, emit) {
      final idx = _localInternships.indexWhere((i) => i.id == event.internshipId);
      if (idx != -1) {
        final i = _localInternships[idx];
        _localInternships[idx] = InternshipModel(
          id: i.id, title: i.title, company: i.company,
          description: i.description, location: i.location,
          duration: i.duration, stipend: i.stipend,
          startDate: i.startDate, deadline: i.deadline,
          requiredSkill: i.requiredSkill, isActive: false,
        );
      }
      emit(InternshipLoaded(List.from(_localInternships)));
    });

    on<RepostInternship>((event, emit) {
      final idx = _localInternships.indexWhere((i) => i.id == event.internshipId);
      if (idx != -1) {
        final i = _localInternships[idx];
        _localInternships[idx] = InternshipModel(
          id: i.id, title: i.title, company: i.company,
          description: i.description, location: i.location,
          duration: i.duration, stipend: i.stipend,
          startDate: i.startDate, deadline: i.deadline,
          requiredSkill: i.requiredSkill, isActive: true,
        );
      }
      emit(InternshipLoaded(List.from(_localInternships)));
    });
  }
}
