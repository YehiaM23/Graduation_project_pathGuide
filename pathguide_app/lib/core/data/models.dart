import 'package:equatable/equatable.dart';

enum UserRole { student, recruiter }

class UserModel extends Equatable {
  final String id;
  final String name;
  final String email;
  final UserRole role;
  final String? phone;
  // Student Specific
  final String? university;
  final String? major;
  final String? graduationYear;
  final String? careerPath;
  final List<String> skills;
  final List<String> interests;
  // Recruiter & General
  final String? bio;
  final String? linkedinUrl;
  final String? githubUrl;
  final String? companyName;
  final String? companyWebsite;
  final String? companyIndustry;
  final String? companyLocation;
  // Recruiter Extended
  final String? gender;
  final String? age;
  final String? recruiterRole;
  final String? yearsOfExperience;
  final String? companyAddress;
  final String? companyPhone;
  final String? companyFoundedYear;
  final String? companyLinkedin;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.phone,
    this.university,
    this.major,
    this.graduationYear,
    this.careerPath,
    this.bio,
    this.linkedinUrl,
    this.githubUrl,
    this.skills = const [],
    this.interests = const [],
    this.companyName,
    this.companyWebsite,
    this.companyIndustry,
    this.companyLocation,
    this.gender,
    this.age,
    this.recruiterRole,
    this.yearsOfExperience,
    this.companyAddress,
    this.companyPhone,
    this.companyFoundedYear,
    this.companyLinkedin,
  });

  @override
  List<Object?> get props => [
        id, name, email, role, phone,
        university, major, graduationYear, careerPath,
        bio, linkedinUrl, githubUrl, skills, interests,
        companyName, companyWebsite, companyIndustry, companyLocation,
        gender, age, recruiterRole, yearsOfExperience,
        companyAddress, companyPhone, companyFoundedYear, companyLinkedin,
      ];

  UserModel copyWith({
    String? id,
    String? name,
    String? email,
    UserRole? role,
    String? phone,
    String? university,
    String? major,
    String? graduationYear,
    String? careerPath,
    String? bio,
    String? linkedinUrl,
    String? githubUrl,
    List<String>? skills,
    List<String>? interests,
    String? companyName,
    String? companyWebsite,
    String? companyIndustry,
    String? companyLocation,
    String? gender,
    String? age,
    String? recruiterRole,
    String? yearsOfExperience,
    String? companyAddress,
    String? companyPhone,
    String? companyFoundedYear,
    String? companyLinkedin,
  }) {
    return UserModel(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      role: role ?? this.role,
      phone: phone ?? this.phone,
      university: university ?? this.university,
      major: major ?? this.major,
      graduationYear: graduationYear ?? this.graduationYear,
      careerPath: careerPath ?? this.careerPath,
      bio: bio ?? this.bio,
      linkedinUrl: linkedinUrl ?? this.linkedinUrl,
      githubUrl: githubUrl ?? this.githubUrl,
      skills: skills ?? this.skills,
      interests: interests ?? this.interests,
      companyName: companyName ?? this.companyName,
      companyWebsite: companyWebsite ?? this.companyWebsite,
      companyIndustry: companyIndustry ?? this.companyIndustry,
      companyLocation: companyLocation ?? this.companyLocation,
      gender: gender ?? this.gender,
      age: age ?? this.age,
      recruiterRole: recruiterRole ?? this.recruiterRole,
      yearsOfExperience: yearsOfExperience ?? this.yearsOfExperience,
      companyAddress: companyAddress ?? this.companyAddress,
      companyPhone: companyPhone ?? this.companyPhone,
      companyFoundedYear: companyFoundedYear ?? this.companyFoundedYear,
      companyLinkedin: companyLinkedin ?? this.companyLinkedin,
    );
  }
}

class StudentProfileModel extends Equatable {
  final String userId;
  final String? phone;
  final String? university;
  final String? major;
  final String? graduationYear;
  final String? gpa;
  final String? bio;
  final String? linkedinUrl;
  final String? githubUrl;
  final String? cvUrl;
  final String? careerPath;
  final List<String> skills;
  final List<String> interests;

  const StudentProfileModel({
    required this.userId,
    this.phone,
    this.university,
    this.major,
    this.graduationYear,
    this.gpa,
    this.bio,
    this.linkedinUrl,
    this.githubUrl,
    this.cvUrl,
    this.careerPath,
    this.skills = const [],
    this.interests = const [],
  });

  @override
  List<Object?> get props => [
        userId,
        phone,
        university,
        major,
        graduationYear,
        gpa,
        bio,
        linkedinUrl,
        githubUrl,
        cvUrl,
        careerPath,
        skills,
        interests,
      ];
}

class InternshipModel extends Equatable {
  final String id;
  final String title;
  final String company;
  final String description;
  final String location;
  final String duration;
  final String stipend;
  final String startDate;
  final String deadline;
  final String requiredSkill;
  final bool isActive;

  const InternshipModel({
    required this.id,
    required this.title,
    required this.company,
    required this.description,
    required this.location,
    required this.duration,
    required this.stipend,
    required this.startDate,
    required this.deadline,
    required this.requiredSkill,
    this.isActive = true,
  });

  factory InternshipModel.fromJson(Map<String, dynamic> j) {
    final skill = j['requiredSkill'] as Map<String, dynamic>?;
    final stipendVal = j['stipend'];
    final weeks = j['periodInWeeks'];
    return InternshipModel(
      id: j['internshipId']?.toString() ?? '',
      title: (j['title'] as String?) ?? '',
      company: (j['companyName'] as String?) ?? '',
      description: (j['description'] as String?) ?? '',
      location: (j['location'] as String?) ?? '',
      duration: weeks != null ? '$weeks weeks' : 'N/A',
      stipend: stipendVal != null ? 'EGP $stipendVal' : 'Unpaid',
      startDate: _fmtDate(j['startDate'] as String?),
      deadline: _fmtDate(j['deadline'] as String?),
      requiredSkill: (skill?['skillName'] as String?) ?? '',
      isActive: (j['isActive'] as bool?) ?? true,
    );
  }

  static String _fmtDate(String? iso) {
    if (iso == null) return '';
    try {
      final d = DateTime.parse(iso);
      return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
    } catch (_) {
      return iso;
    }
  }

  @override
  List<Object?> get props => [
        id,
        title,
        company,
        description,
        location,
        duration,
        stipend,
        startDate,
        deadline,
        requiredSkill,
        isActive,
      ];
}

class ApplicationModel extends Equatable {
  final String id;
  final String internshipId;
  final String studentId;
  final String status; // 'Pending', 'Under Review', 'Accepted', 'Rejected', 'Completed', 'History'
  final String appliedDate;
  final String? reviewedDate;
  final String? completionDate;
  final double? rating;
  final String? feedback;
  final String? certificateUrl;
  // Recruiter view extras
  final String? internshipTitle;
  final String? companyName;
  final String? studentName;
  final String? studentEmail;
  // Student review (submitted after internship completes)
  final double? studentRating;
  final String? studentReview;

  const ApplicationModel({
    required this.id,
    required this.internshipId,
    required this.studentId,
    required this.status,
    required this.appliedDate,
    this.reviewedDate,
    this.completionDate,
    this.rating,
    this.feedback,
    this.certificateUrl,
    this.internshipTitle,
    this.companyName,
    this.studentName,
    this.studentEmail,
    this.studentRating,
    this.studentReview,
  });

  factory ApplicationModel.fromJson(Map<String, dynamic> j) {
    return ApplicationModel(
      id: j['applicationId']?.toString() ?? '',
      internshipId: j['internshipId']?.toString() ?? '',
      studentId: j['studentId']?.toString() ?? '',
      status: _mapStatus((j['status'] as String?) ?? 'pending'),
      appliedDate: InternshipModel._fmtDate(j['appliedAt'] as String?),
      reviewedDate: InternshipModel._fmtDate(j['reviewedAt'] as String?),
      completionDate: InternshipModel._fmtDate(j['completedAt'] as String?),
      rating: j['performanceRating'] != null
          ? (j['performanceRating'] as num).toDouble()
          : null,
      feedback: (j['performanceComment'] as String?) ??
          (j['reviewerNotes'] as String?),
      certificateUrl: j['certificateUrl'] as String?,
      internshipTitle: j['internshipTitle'] as String?,
      studentName: j['studentName'] as String?,
      studentEmail: j['studentEmail'] as String?,
    );
  }

  static String _mapStatus(String s) => switch (s.toLowerCase()) {
        'pending'   => 'Pending',
        'reviewed'  => 'Under Review',
        'accepted'  => 'Accepted',
        'rejected'  => 'Rejected',
        'completed' => 'Completed',
        _           => s,
      };

  @override
  List<Object?> get props => [
        id, internshipId, studentId, status, appliedDate,
        reviewedDate, completionDate, rating, feedback,
        certificateUrl, studentRating, studentReview,
      ];
}

class CourseModel extends Equatable {
  final String id;
  final String title;
  final String skill;
  final double durationHours;
  final String? certificateUrl;
  final bool isCompleted;

  const CourseModel({
    required this.id,
    required this.title,
    required this.skill,
    required this.durationHours,
    this.certificateUrl,
    this.isCompleted = false,
  });

  @override
  List<Object?> get props => [id, title, skill, durationHours, certificateUrl, isCompleted];
}

class NotificationModel extends Equatable {
  final String id;
  final String title;
  final String message;
  final String time;
  final bool isRead;

  const NotificationModel({
    required this.id,
    required this.title,
    required this.message,
    required this.time,
    this.isRead = false,
  });

  @override
  List<Object?> get props => [id, title, message, time, isRead];
}
