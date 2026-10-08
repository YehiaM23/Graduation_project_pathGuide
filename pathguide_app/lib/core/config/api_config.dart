class ApiConfig {
  // Your PC's local IP address — find it with `ipconfig` on Windows
  // Example: http://192.168.1.100:5064/api
  static const String _host = '192.168.1.3';
  static const int _port = 5064;

  static const String baseUrl = 'http://$_host:$_port/api';

  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
