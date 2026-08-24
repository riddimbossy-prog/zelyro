import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:web/web.dart' as web;
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
    final related = tracks.where((x) => x.id != t.id).take(8).toList();
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 32),
      children: [
        Row(children: [
          IconButton(onPressed: () => context.pop(), icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 32)),
          const Expanded(
            child: Column(children: [
              Text('PLAYING FROM', style: TextStyle(fontSize: 10, letterSpacing: 2, fontWeight: FontWeight.w800, color: muted)),
              Text('VerzZify', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
            ]),
          ),
          IconButton(onPressed: () => showShareSheet(context, cover: t.cover, title: t.title, artist: t.artist), icon: const Icon(Icons.ios_share)),
        ]),
        const SizedBox(height: 16),
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 360),
            child: AspectRatio(
              aspectRatio: 1,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: MediaImg(t.cover, cache: 720),
              ),
            ),
          ),
        ),
        const SizedBox(height: 28),
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(t.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.headlineMedium),
              TextButton(
                style: TextButton.styleFrom(padding: EdgeInsets.zero, alignment: Alignment.centerLeft),
                onPressed: () => context.push('/artist/${t.artistSlug}'),
                child: Text(t.artist, style: const TextStyle(color: muted, fontSize: 15)),
              ),
            ]),
          ),
          IconButton(onPressed: () {}, icon: const Icon(Icons.favorite_border)),
        ]),
        Slider(
          value: 0.18,
          onChanged: (_) {},
          activeColor: Colors.white,
          inactiveColor: const Color(0xFF3A2A44),
        ),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 4),
          child: Row(children: [Text('0:42', style: TextStyle(color: muted, fontSize: 12)), Spacer(), Text('3:21', style: TextStyle(color: muted, fontSize: 12))]),
        ),
        const SizedBox(height: 8),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          IconButton(onPressed: () {}, icon: const Icon(Icons.shuffle_rounded)),
          IconButton(onPressed: player.prev, icon: const Icon(Icons.skip_previous_rounded, size: 40)),
          IconButton.filled(
            style: IconButton.styleFrom(backgroundColor: Colors.white, foregroundColor: Colors.black, padding: const EdgeInsets.all(18)),
            onPressed: player.toggle,
            icon: Icon(player.playing ? Icons.pause_rounded : Icons.play_arrow_rounded, size: 36),
          ),
          IconButton(onPressed: player.next, icon: const Icon(Icons.skip_next_rounded, size: 40)),
          IconButton(onPressed: () {}, icon: const Icon(Icons.repeat_rounded)),
        ]),
        const SizedBox(height: 8),
        Row(mainAxisAlignment: MainAxisAlignment.end, children: [
          IconButton(
            onPressed: () {
              final id = t.videoId;
              if (id == null || id.isEmpty) return;
              web.window.open('/api/v1/yt-mp3?videoId=${Uri.encodeComponent(id)}', '_blank');
            },
            icon: const Icon(Icons.download_outlined),
          ),
          IconButton(onPressed: () => showShareSheet(context, cover: t.cover, title: t.title, artist: t.artist), icon: const Icon(Icons.queue_music)),
        ]),
        const SizedBox(height: 20),
        Text('Next up', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 8),
        ...related.asMap().entries.map((e) => TrackLine(track: e.value, n: e.key + 1, onPlay: () => player.play(related, e.key))),
      ],
    );
  }
}
