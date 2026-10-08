import 'package:pathguide_app/core/data/models.dart';
import 'package:pathguide_app/core/services/api_client.dart';

class StudentApiService {
  static final _dio = ApiClient.instance;

  /// Fetch the full student profile from the backend
  static Future<UserModel> getProfile(UserModel current) async {
    final response = await _dio.get('/students/profile');
    final j = response.data as Map<String, dynamic>;
    return current.copyWith(
      id: j['userId']?.toString() ?? current.id,
      name: (j['userName'] as String?) ?? current.name,
      phone: j['phone'] as String?,
      university: j['universityName'] as String?,
      major: j['majorName'] as String?,
      graduationYear: j['graduationYear']?.toString(),
      bio: j['bio'] as String?,
      linkedinUrl: j['linkedinUrl'] as String?,
      githubUrl: j['githubUrl'] as String?,
      careerPath: j['careerPathName'] as String?,
      skills: ((j['skills'] as List?) ?? [])
          .map((s) => (s['skillName'] as String?) ?? '')
          .where((s) => s.isNotEmpty)
          .toList(),
      interests: ((j['interests'] as List?) ?? [])
          .map((i) => (i['interestName'] as String?) ?? '')
          .where((s) => s.isNotEmpty)
          .toList(),
    );
  }

  /// Skill name → skillId lookup map
  static Future<Map<String, int>> getSkillsMap() async {
    final response = await _dio.get('/skills');
    final list = response.data as List<dynamic>;
    return {
      for (final s in list)
        if ((s['skillName'] as String?) != null && s['skillId'] != null)
          s['skillName'] as String: s['skillId'] as int,
    };
  }

  /// Interest name → interestId lookup map
  static Future<Map<String, int>> getInterestsMap() async {
    final response = await _dio.get('/interests');
    final list = response.data as List<dynamic>;
    return {
      for (final i in list)
        if ((i['interestName'] as String?) != null && i['interestId'] != null)
          i['interestName'] as String: i['interestId'] as int,
    };
  }

  /// Career path name → careerPathId lookup map
  static Future<Map<String, int>> getCareerPathsMap() async {
    final response = await _dio.get('/careerpaths');
    final list = response.data as List<dynamic>;
    return {
      for (final cp in list)
        if ((cp['careerPathName'] as String?) != null && cp['careerPathId'] != null)
          cp['careerPathName'] as String: cp['careerPathId'] as int,
    };
  }

  /// University name → universityId lookup map
  static Future<Map<String, int>> getUniversitiesMap() async {
    final response = await _dio.get('/universities');
    final list = response.data as List<dynamic>;
    return {
      for (final u in list)
        if ((u['universityName'] as String?) != null && u['universityId'] != null)
          u['universityName'] as String: u['universityId'] as int,
    };
  }

  /// Major name → majorId lookup map
  static Future<Map<String, int>> getMajorsMap() async {
    final response = await _dio.get('/majors');
    final list = response.data as List<dynamic>;
    return {
      for (final m in list)
        if ((m['majorName'] as String?) != null && m['majorId'] != null)
          m['majorName'] as String: m['majorId'] as int,
    };
  }

  /// Save student profile fields back to the backend
  static Future<void> updateProfile({
    required String name,
    String? phone,
    String? bio,
    String? graduationYear,
    String? linkedinUrl,
    String? githubUrl,
    int? careerPathId,
    int? universityId,
    int? majorId,
    List<int>? skillIds,
    List<int>? interestIds,
  }) async {
    await _dio.put('/students/profile', data: {
      'fullName': name,
      if (phone != null && phone.isNotEmpty) 'phone': phone,
      if (bio != null && bio.isNotEmpty) 'bio': bio,
      if (graduationYear != null && graduationYear.isNotEmpty)
        'graduationYear': int.tryParse(graduationYear),
      if (linkedinUrl != null && linkedinUrl.isNotEmpty) 'linkedinUrl': linkedinUrl,
      if (githubUrl != null && githubUrl.isNotEmpty) 'githubUrl': githubUrl,
      if (careerPathId != null) 'careerPathId': careerPathId,
      if (universityId != null) 'universityId': universityId,
      if (majorId != null) 'majorId': majorId,
      if (skillIds != null) 'skillIds': skillIds,
      if (interestIds != null) 'interestIds': interestIds,
    });
  }
}
