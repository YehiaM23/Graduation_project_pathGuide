import 'package:pathguide_app/core/data/models.dart';
import 'package:pathguide_app/core/services/api_client.dart';

class ApplicationApiService {
  static final _dio = ApiClient.instance;

  /// Student applies for an internship
  static Future<ApplicationModel> apply(int internshipId) async {
    final response = await _dio.post('/applications', data: {'internshipId': internshipId});
    return ApplicationModel.fromJson(response.data as Map<String, dynamic>);
  }

  /// Student fetches their own applications
  static Future<List<ApplicationModel>> getMyApplications() async {
    final response = await _dio.get('/applications/student');
    final list = response.data as List<dynamic>;
    return list.map((j) => ApplicationModel.fromJson(j as Map<String, dynamic>)).toList();
  }

  /// Recruiter fetches applications for their internships
  static Future<List<ApplicationModel>> getRecruiterApplications() async {
    final response = await _dio.get('/applications/recruiter');
    final list = response.data as List<dynamic>;
    return list.map((j) => ApplicationModel.fromJson(j as Map<String, dynamic>)).toList();
  }

  /// Recruiter updates application status (accept / complete)
  static Future<void> updateStatus(
    String applicationId,
    String status, {
    String? reviewerNotes,
    int? performanceRating,
    String? performanceComment,
  }) async {
    await _dio.put('/applications/$applicationId/status', data: {
      'status': status,
      if (reviewerNotes != null) 'reviewerNotes': reviewerNotes,
      if (performanceRating != null) 'performanceRating': performanceRating,
      if (performanceComment != null) 'performanceComment': performanceComment,
    });
  }
}
