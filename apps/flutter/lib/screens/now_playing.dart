import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../catalog.dart';
import '../player_controller.dart';
import '../theme.dart';
import '../widgets.dart';
import 'studio_flows.dart';

class NowPlayingScreen extends StatelessWidget {
  const NowPlayingScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final player = context.watch<PlayerController>();
    final t = player.current ?? tracks.first;
    final related = tracks.where((x) => x.id != t.id).take(5).toList();
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
      children: [
        Row(children: [
          IconButton(onPressed: () => context.pop(), icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 32)),
          const Spacer(),
          IconButton(onPressed: () {}, icon: const Icon(Icons.chat_bubble_outline)),
          IconButton(onPressed: () {}, icon: const Icon(Icons.notifications_none)),
          IconButton(onPressed: () => context.go('/studio'), icon: const Icon(Icons.dashboard_outlined)),
        ]),
        const SizedBox(height: 8),
        Center(
          child: Container(
            width: 240,
            height: 240,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: [BoxShadow(color: accent.withValues(alpha: 0.45), blurRadius: 40, spreadRadius: 4)],
            ),
            child: ClipOval(child: MediaImg(t.cover, cache: 480)),
          ),
        ),
        const SizedBox(height: 22),
        Text(t.title, textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineMedium),
        TextButton(
          onPressed: () => context.push('/artist/${t.artistSlug}'),
          child: Text(t.artist, style: const TextStyle(color: muted, fontSize: 16)),
        ),
        Slider(
          value: 0.12,
          onChanged: (_) {},
          activeColor: accent,
          inactiveColor: const Color(0xFF3A2A44),
        ),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 22),
          child: Row(children: [Text('00:07', style: TextStyle(color: Color(0xFFEAB308))), Spacer(), Text('02:55', style: TextStyle(color: muted))]),
        ),
        const SizedBox(height: 8),
        Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [
          _Act(Icons.favorite_border, 'Like', () {}),
          _Act(Icons.smart_display_outlined, 'Video', () {
            if (t.isYoutube) return;
          }),
          _Act(Icons.playlist_add, 'Playlist', () {}),
          _Act(Icons.download_outlined, 'Download', () {}),
          _Act(Icons.send_outlined, 'Share', () => showShareSheet(context, cover: t.cover, title: t.title, artist: t.artist)),
        ]),
        const SizedBox(height: 12),
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          IconButton(onPressed: player.prev, icon: const Icon(Icons.skip_previous_rounded, size: 36)),
          const SizedBox(width: 8),
          IconButton.filled(
            style: IconButton.styleFrom(backgroundColor: accent, foregroundColor: Colors.white, padding: const EdgeInsets.all(16)),
            onPressed: player.toggle,
            icon: Icon(player.playing ? Icons.pause_rounded : Icons.play_arrow_rounded, size: 36),
          ),
          const SizedBox(width: 8),
          IconButton(onPressed: player.next, icon: const Icon(Icons.skip_next_rounded, size: 36)),
        ]),
        const SizedBox(height: 24),
        Text('Related Songs', style: Theme.of(context).textTheme.headlineMedium),
        ...related.asMap().entries.map((e) => TrackLine(track: e.value, n: e.key + 1, onPlay: () => player.play(related, e.key))),
        const SizedBox(height: 8),
        const Center(child: Text('Next Up', style: TextStyle(fontWeight: FontWeight.w800))),
      ],
    );
  }
}

class _Act extends StatelessWidget {
  const _Act(this.icon, this.label, this.on);
  final IconData icon;
  final String label;
  final VoidCallback on;
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: on,
      child: Column(children: [
        Icon(icon),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 12, color: muted, fontWeight: FontWeight.w700)),
      ]),
    );
  }
}
