import 'package:flutter/material.dart';

class CommunityScreen extends StatelessWidget {
  const CommunityScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final posts = [
      ('Nia Adaeze', 'Rooftop session this week on VerzZify Live.'),
      ('Nova Park', 'Glass Rain, Seoul. PPV this week.'),
      ('Ama Serwaa', 'Gold Coast Evening — dusk brass, no click.'),
    ];
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: posts.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, i) {
        final p = posts[i];
        return Card(
          color: const Color(0xFF1A1024),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          child: ListTile(
            contentPadding: const EdgeInsets.all(16),
            title: Text(p.$1, style: const TextStyle(fontWeight: FontWeight.w700)),
            subtitle: Padding(padding: const EdgeInsets.only(top: 8), child: Text(p.$2)),
          ),
        );
      },
    );
  }
}
