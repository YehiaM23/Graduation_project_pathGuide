import 'package:dio/dio.dart';
import 'package:pathguide_app/core/config/api_config.dart';
import 'package:pathguide_app/core/services/token_storage.dart';

class ApiClient {
  static final Dio _dio = _build();
  static Dio get instance => _dio;

  static Dio _build() {
    final dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: ApiConfig.connectTimeout,
      receiveTimeout: ApiConfig.receiveTimeout,
      headers: {'Content-Type': 'application/json'},
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await TokenStorage.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) => handler.next(error),
    ));

    return dio;
  }
}
