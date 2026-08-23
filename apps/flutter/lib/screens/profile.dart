import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../catalog.dart';
import '../player_controller.dart';
import '../theme.dart';
import '../widgets.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool following = false;
  @override
  Widget build(BuildContext context) {
    final player = context.read<PlayerController>();
    final you = artists[2];
    return ListView(
      children: [
        SizedBox(
          height: 240,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Positioned.fill(child: MediaImg(you.banner, cache: 900)),
              const DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, Color(0xE607010D)]))),
              Positioned(
                left: 20,
                bottom: -28,
                child: CircleAvatar(radius: 52, backgroundColor: bg, child: CircleAvatar(radius: 48, backgroundImage: NetworkImage(you.avatar))),
              ),
            ],
          ),
        ),
        const SizedBox(height: 40),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(you.name, style: Theme.of(context).textTheme.headlineLarge),
              Text('${you.city} · ${you.followers} followers', style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: 14),
              Row(children: [
                FilledButton(onPressed: () => setState(() => following = !following), child: Text(following ? 'Following' : 'Follow')),
                const SizedBox(width: 8),
                OutlinedButton(onPressed: () => context.push('/video/demo-room'), child: const Text('1-1 video')),
                const SizedBox(width: 8),
                IconButton.outlined(onPressed: () {}, icon: const Icon(Icons.share_outlined)),
              ]),
              const SizedBox(height: 28),
              Text('Songs', style: Theme.of(context).textTheme.headlineMedium),
            ],
          ),
        ),
        ...tracks.take(6).toList().asMap().entries.map(
              (e) => TrackLine(track: e.value, n: e.key + 1, onPlay: () => player.play(tracks, e.key)),
            ),
        const SizedBox(height: 24),
      ],
    );
  }
}
