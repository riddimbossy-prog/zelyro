import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../catalog.dart';
import '../player_controller.dart';
import '../theme.dart';
import '../widgets.dart';

class ChartsScreen extends StatelessWidget {
  const ChartsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final player = context.read<PlayerController>();
    final ranked = [...tracks]..sort((a, b) => b.plays.compareTo(a.plays));
    return ListView(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Global 200', style: Theme.of(context).textTheme.headlineLarge),
              const Text('Mock ranking · SEU = downloads × 200 + streams', style: TextStyle(color: muted)),
            ],
          ),
        ),
        for (int i = 0; i < ranked.length; i++)
          TrackLine(track: ranked[i], n: i + 1, onPlay: () => player.play(ranked, i)),
      ],
    );
  }
}
