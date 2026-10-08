import 'package:google_sign_in/google_sign_in.dart';

class GoogleSignInService {
  // TODO: Replace with your Google Cloud OAuth 2.0 Client ID
  // Create one at: https://console.cloud.google.com/apis/credentials
  static const _clientId =
      'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

  static final _googleSignIn = GoogleSignIn(
    clientId: _clientId,
    scopes: ['email', 'profile'],
  );

  static Future<GoogleSignInAccount?> signIn() async {
    return await _googleSignIn.signIn();
  }

  static Future<void> signOut() async {
    await _googleSignIn.signOut();
  }
}
