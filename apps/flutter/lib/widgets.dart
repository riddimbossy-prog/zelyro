import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'catalog.dart';
import 'models.dart';
import 'player_controller.dart';
import 'theme.dart';

class MediaImg extends StatelessWidget {
  const MediaImg(this.path, {super.key, this.fit = BoxFit.cover, this.cache = 360});
  final String path;
  final BoxFit fit;
  final int cache;
  @override
  Widget build(BuildContext context) {
    final url = media(path);
    final src = url.startsWith('http') ? url : (path.startsWith('/') ? path : '/$path');
    return Image.network(
      src,
      fit: fit,
      cacheWidth: cache,
      filterQuality: FilterQuality.medium,
      gaplessPlayback: true,
      errorBuilder: (_, __, ___) => const ColoredBox(color: Color(0xFF2A1638)),
    );
  }
}

enum GlassTone { regular, accent, thin }

class Glass extends StatelessWidget {
  const Glass({
    super.key,
    required this.child,
    this.padding,
    this.radius = 20,
    this.sigma = 20,
    this.tone = GlassTone.regular,
  });
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final double radius;
  final double sigma;
  final GlassTone tone;
  @override
  Widget build(BuildContext context) {
    final fill = switch (tone) {
      GlassTone.accent => const Color(0x66C026D3),
      GlassTone.thin => const Color(0x33120818),
      GlassTone.regular => const Color(0x66140A1C),
    };
    final edge = switch (tone) {
      GlassTone.accent => accent.withValues(alpha: 0.55),
      GlassTone.thin => Colors.white.withValues(alpha: 0.12),
      GlassTone.regular => Colors.white.withValues(alpha: 0.22),
    };
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: sigma, sigmaY: sigma),
        child: DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(radius),
            border: Border.all(color: edge, width: 1),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Colors.white.withValues(alpha: tone == GlassTone.thin ? 0.08 : 0.16),
                fill,
                const Color(0x33120818),
              ],
            ),
            boxShadow: [
              BoxShadow(color: accent.withValues(alpha: 0.12), blurRadius: 28, offset: const Offset(0, 12)),
              BoxShadow(color: Colors.white.withValues(alpha: 0.06), blurRadius: 0, offset: const Offset(0, 1)),
            ],
          ),
          child: padding == null ? child : Padding(padding: padding!, child: child),
        ),
      ),
    );
  }
}

class Frost extends StatelessWidget {
  const Frost({super.key, required this.child, this.sigma = 24});
  final Widget child;
  final double sigma;
  @override
  Widget build(BuildContext context) {
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: sigma, sigmaY: sigma),
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                const Color(0xCC0B0314),
                accent.withValues(alpha: 0.10),
                const Color(0xD607010D),
              ],
            ),
            border: Border(
              top: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
              bottom: BorderSide(color: Colors.white.withValues(alpha: 0.06)),
            ),
          ),
          child: child,
        ),
      ),
    );
  }
}

class Aurora extends StatelessWidget {
  const Aurora({super.key, required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        const ColoredBox(color: bg),
        const Positioned(top: -90, right: -50, child: _Orb(color: Color(0x66C026D3), size: 280)),
        const Positioned(top: 180, left: -100, child: _Orb(color: Color(0x446D28D9), size: 260)),
        const Positioned(bottom: 40, right: -80, child: _Orb(color: Color(0x33DB2777), size: 240)),
        child,
      ],
    );
  }
}

class _Orb extends StatelessWidget {
  const _Orb({required this.color, required this.size});
  final Color color;
  final double size;
  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: ImageFiltered(
        imageFilter: ImageFilter.blur(sigmaX: 48, sigmaY: 48),
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(shape: BoxShape.circle, color: color),
        ),
      ),
    );
  }
}

class SectionHead extends StatelessWidget {
  const SectionHead(this.title, {super.key, this.action, this.onAction, this.kicker});
  final String title;
  final String? action;
  final String? kicker;
  final VoidCallback? onAction;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 28, 12, 12),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (kicker != null) Text(kicker!.toUpperCase(), style: Theme.of(context).textTheme.labelSmall),
                Text(title, style: Theme.of(context).textTheme.headlineMedium),
              ],
            ),
          ),
          if (action != null)
            TextButton(onPressed: onAction, child: Text(action!, style: const TextStyle(color: accent, fontWeight: FontWeight.w800))),
        ],
      ),
    );
  }
}

class CoverTile extends StatelessWidget {
  const CoverTile({super.key, required this.track, required this.onPlay, this.onOpen});
  final Track track;
  final VoidCallback onPlay;
  final VoidCallback? onOpen;
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 164,
      child: InkWell(
        onTap: onOpen ?? onPlay,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 1,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    MediaImg(track.cover, cache: 360),
                    const DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, Color(0xAA000000)]),
                      ),
                    ),
                    Positioned(
                      right: 8,
                      bottom: 8,
                      child: Glass(
                        radius: 999,
                        padding: const EdgeInsets.all(6),
                        child: InkWell(
                          onTap: onPlay,
                          child: const CircleAvatar(radius: 16, backgroundColor: accent, child: Icon(Icons.play_arrow_rounded, size: 20)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(track.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.titleMedium),
            Text(track.artist, maxLines: 1, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}

class YtVideoTile extends StatelessWidget {
  const YtVideoTile({super.key, required this.clip, required this.onPlay});
  final YtClip clip;
  final VoidCallback onPlay;
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 260,
      child: InkWell(
        onTap: onPlay,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 16 / 9,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    MediaImg(clip.cover, cache: 520),
                    const DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, Color(0xAA000000)]),
                      ),
                    ),
                    const Center(child: CircleAvatar(radius: 22, backgroundColor: accent, child: Icon(Icons.play_arrow_rounded, size: 28))),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(clip.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.titleMedium),
            Text(clip.artist, maxLines: 1, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}

class PosterTile extends StatelessWidget {
  const PosterTile({super.key, required this.image, required this.title, required this.sub, required this.onTap});
  final String image;
  final String title;
  final String sub;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: SizedBox(
        width: 176,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 16 / 10,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    MediaImg(image, cache: 400),
                    const DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, Color(0x99000000)]),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.titleMedium),
            Text(sub, maxLines: 1, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}

class TrackLine extends StatelessWidget {
  const TrackLine({super.key, required this.track, required this.n, required this.onPlay});
  final Track track;
  final int n;
  final VoidCallback onPlay;
  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onPlay,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      leading: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(width: 28, child: Text('$n', style: const TextStyle(color: muted, fontWeight: FontWeight.w800))),
          ClipRRect(borderRadius: BorderRadius.circular(10), child: SizedBox(width: 52, height: 52, child: MediaImg(track.cover, cache: 104))),
        ],
      ),
      title: Text(track.title, maxLines: 1, overflow: TextOverflow.ellipsis),
      subtitle: Text('${track.artist} · ${track.genre}', maxLines: 1),
      trailing: IconButton(onPressed: onPlay, icon: const Icon(Icons.play_arrow_rounded, color: accent)),
    );
  }
}

class MiniBar extends StatelessWidget {
  const MiniBar({super.key});
  @override
  Widget build(BuildContext context) {
    final player = context.watch<PlayerController>();
    final t = player.current;
    if (t == null) return const SizedBox.shrink();
    return Frost(
      child: Material(
        color: const Color(0xCC140A1C),
        child: SafeArea(
          top: false,
          child: Container(
            decoration: BoxDecoration(border: Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.12)))),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            child: Row(
              children: [
                ClipRRect(borderRadius: BorderRadius.circular(10), child: SizedBox(width: 52, height: 52, child: MediaImg(t.cover, cache: 104))),
                const SizedBox(width: 12),
                Expanded(
                  child: InkWell(
                    onTap: () => context.push('/now'),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(t.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                        Text(t.artist, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: muted, fontSize: 14)),
                      ],
                    ),
                  ),
                ),
                IconButton(onPressed: player.prev, icon: const Icon(Icons.skip_previous_rounded)),
                IconButton.filled(
                  style: IconButton.styleFrom(backgroundColor: accent),
                  onPressed: player.toggle,
                  icon: Icon(player.isYoutube || player.playing ? Icons.pause_rounded : Icons.play_arrow_rounded),
                ),
                IconButton(onPressed: player.next, icon: const Icon(Icons.skip_next_rounded)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class TopBar extends StatelessWidget {
  const TopBar({super.key});
  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.sizeOf(context).width >= 720;
    return Frost(
      child: Material(
        color: const Color(0xCC07010D),
        child: SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 10),
            child: Row(
              children: [
                if (MediaQuery.sizeOf(context).width < 900)
                  const Padding(
                    padding: EdgeInsets.only(right: 10),
                    child: Image(image: AssetImage('assets/logo.png'), height: 28),
                  ),
                Expanded(
                  child: InkWell(
                    onTap: () => context.go('/search'),
                    borderRadius: BorderRadius.circular(28),
                    child: Glass(
                      tone: GlassTone.thin,
                      radius: 28,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      child: const Row(
                        children: [
                          Icon(Icons.search_rounded, color: muted),
                          SizedBox(width: 8),
                          Text('Search songs, beats, albums', style: TextStyle(color: muted, fontSize: 16)),
                        ],
                      ),
                    ),
                  ),
                ),
                if (wide) ...[
                  const SizedBox(width: 8),
                  TextButton(onPressed: () => context.go('/discover'), child: const Text('Discover')),
                  TextButton(onPressed: () => context.go('/news'), child: const Text('Journal')),
                ],
                IconButton(onPressed: () => context.go('/studio'), icon: const Icon(Icons.mic_none_rounded)),
                IconButton(onPressed: () => context.go('/profile'), icon: const Icon(Icons.person_outline_rounded)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class YoutubeDock extends StatelessWidget {
  const YoutubeDock({super.key});
  @override
  Widget build(BuildContext context) {
    final player = context.watch<PlayerController>();
    if (!player.isYoutube) return const SizedBox.shrink();
    // Space for the real DOM player (fixed overlay). Do not put an iframe here.
    final h = MediaQuery.sizeOf(context).width >= 900 ? 280.0 : 200.0;
    return SizedBox(height: h);
  }
}
