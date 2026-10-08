import 'package:flutter/material.dart';

class AppColors {
  static const primaryBlue = Color(0xFF0A7BFF);
  static const teal = Color(0xFF00CDBD);
  static const background = Color(0xFFF6FAFF);
  static const darkNavy = Color(0xFF0F172A);
  static const mutedText = Color(0xFF64748B);
  static const cardBorder = Color(0xFFE2E8F0);
  static const lightBlue = Color(0xFFEFF6FF);
  static const lightPurple = Color(0xFFF5EDFF);
  static const successGreen = Color(0xFF10B981);
  static const warningYellow = Color(0xFFFACC15);
  static const dangerRed = Color(0xFFEF4444);
  static const error = Color(0xFFEF4444);
  static const success = Color(0xFF10B981);
  static const textPrimary = Color(0xFF0F172A);
  static const textSecondary = Color(0xFF64748B);

  static const primaryGradient = LinearGradient(
    colors: [primaryBlue, teal],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const mainGradient = LinearGradient(
    colors: [primaryBlue, teal],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const verticalGradient = LinearGradient(
    colors: [primaryBlue, teal],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
}
