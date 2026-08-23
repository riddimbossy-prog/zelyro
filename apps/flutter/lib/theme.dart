import 'package:flutter/material.dart';

const bg = Color(0xFF07010D);
const accent = Color(0xFFC026D3);
const fg = Color(0xFFF6F0FF);
const muted = Color(0xFFC4B4D8);
const card = Color(0xCC1A1024);
const glass = Color(0x99120818);

ThemeData verzzifyTheme() {
  const text = TextTheme(
    headlineLarge: TextStyle(fontFamily: 'Montserrat', fontWeight: FontWeight.w800, fontSize: 40, color: fg, letterSpacing: -1.4, height: 1.02),
    headlineMedium: TextStyle(fontFamily: 'Montserrat', fontWeight: FontWeight.w800, fontSize: 22, color: fg, letterSpacing: -0.5),
    titleMedium: TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w700, fontSize: 16, color: fg),
    bodyMedium: TextStyle(fontFamily: 'Nunito', fontSize: 16, color: fg, height: 1.45),
    bodySmall: TextStyle(fontFamily: 'Nunito', fontSize: 14, color: muted, height: 1.35),
    labelSmall: TextStyle(fontFamily: 'Nunito', fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1.6, color: accent),
  );
  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    fontFamily: 'Nunito',
    scaffoldBackgroundColor: Colors.transparent,
    colorScheme: const ColorScheme.dark(
      primary: accent,
      surface: Color(0xFF1A1024),
      onPrimary: Colors.white,
      onSurface: fg,
    ),
    textTheme: text,
    appBarTheme: const AppBarTheme(backgroundColor: Colors.transparent, elevation: 0, scrolledUnderElevation: 0),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0x66140A1C),
      hintStyle: const TextStyle(fontFamily: 'Nunito', color: muted, fontSize: 16),
      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(28),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.16)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(28),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.14)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(28),
        borderSide: const BorderSide(color: accent, width: 1.4),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: accent,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: const StadiumBorder(),
        textStyle: const TextStyle(fontFamily: 'Nunito', fontWeight: FontWeight.w800, fontSize: 16),
      ),
    ),
    chipTheme: ChipThemeData(
      selectedColor: accent,
      backgroundColor: const Color(0x991A1024),
      labelStyle: const TextStyle(fontFamily: 'Nunito', color: fg, fontWeight: FontWeight.w700, fontSize: 14),
      shape: StadiumBorder(side: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
    ),
    navigationBarTheme: const NavigationBarThemeData(
      backgroundColor: Color(0xCC07010D),
      indicatorColor: Color(0x40C026D3),
      height: 68,
    ),
    navigationRailTheme: const NavigationRailThemeData(
      backgroundColor: Color(0xCC0B0312),
      indicatorColor: Color(0x40C026D3),
    ),
  );
}
