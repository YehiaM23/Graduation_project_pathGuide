import 'package:dio/dio.dart';
import 'package:pathguide_app/core/data/models.dart';
import 'package:pathguide_app/core/services/api_client.dart';
import 'package:pathguide_app/core/services/token_storage.dart';

class AuthApiService {
  static final _dio = ApiClient.instance;

  static Future<UserModel> login(String email, String password, String role) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });
      final data = response.data as Map<String, dynamic>;
      if (data['success'] != true) {
        throw data['message'] ?? 'Login failed';
      }
      await TokenStorage.saveToken(data['token'] as String);
      final user = data['user'] as Map<String, dynamic>;
      final userRole = (user['role'] as String?) ?? role;
      await TokenStorage.saveRole(userRole);
      return UserModel(
        id: user['userId'].toString(),
        name: (user['name'] as String?) ?? '',
        email: (user['email'] as String?) ?? email,
        role: userRole == 'recruiter' ? UserRole.recruiter : UserRole.student,
      );
    } on DioException catch (e) {
      throw _parseError(e);
    }
  }

  static Future<UserModel> registerStudent({
    required String name,
    required String email,
    required String password,
    String? phone,
    String? companyName,
  }) async {
    try {
      final response = await _dio.post('/auth/register/student', data: {
        'name': name,
        'email': email,
        'password': password,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
      });
      final data = response.data as Map<String, dynamic>;
      if (data['success'] != true) {
        throw data['message'] ?? 'Registration failed';
      }
      await TokenStorage.saveToken(data['token'] as String);
      await TokenStorage.saveRole('student');
      final user = data['user'] as Map<String, dynamic>;
      return UserModel(
        id: user['userId'].toString(),
        name: (user['name'] as String?) ?? name,
        email: (user['email'] as String?) ?? email,
        role: UserRole.student,
        phone: phone,
      );
    } on DioException catch (e) {
      throw _parseError(e);
    }
  }

  static Future<UserModel> registerRecruiter({
    required String name,
    required String email,
    required String password,
    String? phone,
    String? companyName,
  }) async {
    try {
      final response = await _dio.post('/auth/register/recruiter', data: {
        'name': name,
        'email': email,
        'password': password,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        if (companyName != null && companyName.isNotEmpty) 'companyName': companyName,
      });
      final data = response.data as Map<String, dynamic>;
      if (data['success'] != true) {
        throw data['message'] ?? 'Registration failed';
      }
      await TokenStorage.saveToken(data['token'] as String);
      await TokenStorage.saveRole('recruiter');
      final user = data['user'] as Map<String, dynamic>;
      return UserModel(
        id: user['userId'].toString(),
        name: (user['name'] as String?) ?? name,
        email: (user['email'] as String?) ?? email,
        role: UserRole.recruiter,
        phone: phone,
        companyName: companyName,
      );
    } on DioException catch (e) {
      throw _parseError(e);
    }
  }

  static String _parseError(DioException e) {
    try {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) return data['message'].toString();
      if (data is Map && data['errors'] != null) {
        final errors = data['errors'] as Map;
        return errors.values.first.toString();
      }
    } catch (_) {}
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.connectionError) {
      return 'Cannot reach the server. Check your network.';
    }
    return 'Something went wrong. Please try again.';
  }
}
