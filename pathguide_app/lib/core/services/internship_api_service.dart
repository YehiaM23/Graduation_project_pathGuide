import 'package:dio/dio.dart';
import 'package:pathguide_app/core/data/models.dart';
import 'package:pathguide_app/core/services/api_client.dart';

class InternshipApiService {
  static final _dio = ApiClient.instance;

  /// All active internships — for students browsing
  static Future<List<InternshipModel>> getInternships() async {
    final response = await _dio.get('/internships');
    final list = response.data as List<dynamic>;
    return list.map((j) => InternshipModel.fromJson(j as Map<String, dynamic>)).toList();
  }

  /// Internships posted by the logged-in recruiter
  static Future<List<InternshipModel>> getMyInternships() async {
    final response = await _dio.get('/internships/recruiter');
    final list = response.data as List<dynamic>;
    return list.map((j) => InternshipModel.fromJson(j as Map<String, dynamic>)).toList();
  }

  static Future<InternshipModel> createInternship({
    required String title,
    required String description,
    required String location,
    required int periodInWeeks,
    required String deadline,
    required String startDate,
    int? skillId,
    double? stipend,
  }) async {
    final response = await _dio.post('/internships', data: {
      'title': title,
      'description': description,
      'location': location,
      'periodInWeeks': periodInWeeks,
      'deadline': deadline,
      'startDate': startDate,
      if (skillId != null) 'skillId': skillId,
      if (stipend != null) 'stipend': stipend,
    });
    return InternshipModel.fromJson(response.data as Map<String, dynamic>);
  }

  static Future<InternshipModel> updateInternship({
    required String id,
    required String title,
    required String description,
    required String location,
    required int periodInWeeks,
    required String deadline,
    required String startDate,
    required bool isActive,
    int? skillId,
    double? stipend,
  }) async {
    final response = await _dio.put('/internships/$id', data: {
      'title': title,
      'description': description,
      'location': location,
      'periodInWeeks': periodInWeeks,
      'deadline': deadline,
      'startDate': startDate,
      'isActive': isActive,
      if (skillId != null) 'skillId': skillId,
      if (stipend != null) 'stipend': stipend,
    });
    return InternshipModel.fromJson(response.data as Map<String, dynamic>);
  }

  static Future<void> deleteInternship(String id) async {
    await _dio.delete('/internships/$id');
  }
}
