import 'dart:convert';
import 'package:http/http.dart' as http;
import 'catalog.dart';
import 'models.dart';

String api(String path) {
  if (path.startsWith('http')) return path;
  if (mediaHost.isNotEmpty) return '$mediaHost$path';
  return '${Uri.base.origin}$path';
}

class VzApi {
  static Future<Map<String, dynamic>> get(String path) async {
    final res = await http.get(Uri.parse(api(path)));
    if (res.statusCode >= 400) {
      throw Exception(res.body);
    }
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  static Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body) async {
    final res = await http.post(
      Uri.parse(api(path)),
      headers: {'content-type': 'application/json'},
      body: jsonEncode(body),
    );
    final map = jsonDecode(res.body.isEmpty ? '{}' : res.body) as Map<String, dynamic>;
    if (res.statusCode >= 400) {
      throw Exception(map['error'] ?? res.body);
    }
    return map;
  }

  static Track trackFrom(Map<String, dynamic> j) {
    return Track(
      id: '${j['id']}',
      title: '${j['title'] ?? ''}',
      artist: '${j['artistName'] ?? j['artist'] ?? ''}',
      artistSlug: '${j['artistSlug'] ?? ''}',
      cover: '${j['coverUrl'] ?? j['cover'] ?? '/covers/desk-light.jpg'}',
      audio: '${j['audioUrl'] ?? j['audio'] ?? '/audio/t01.mp3'}',
      plays: (j['playCount'] as num?)?.toInt() ?? 0,
      genre: '${j['genre'] ?? ''}',
    );
  }
}
