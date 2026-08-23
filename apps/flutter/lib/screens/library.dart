import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../catalog.dart';
import '../player_controller.dart';
import '../theme.dart';
import '../widgets.dart';

class LibraryScreen extends StatelessWidget {
  const LibraryScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final player = context.read<PlayerController>();
    return DefaultTabController(
      length: 3,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
            child: Text('Library', style: Theme.of(context).textTheme.headlineLarge),
          ),
          const TabBar(
            labelColor: accent,
            unselectedLabelColor: muted,
            indicatorColor: accent,
            tabs: [Tab(text: 'Liked'), Tab(text: 'Downloads'), Tab(text: 'History')],
          ),
          Expanded(
            child: TabBarView(
              children: [
                ListView(children: [for (int i = 0; i < 4; i++) TrackLine(track: tracks[i], n: i + 1, onPlay: () => player.play(tracks, i))]),
                ListView(children: [
                  const Padding(
                    padding: EdgeInsets.all(20),
                    child: Text('Offline copies will live here. This tab is the layout only.', style: TextStyle(color: muted)),
                  ),
                  for (int i = 4; i < 7; i++) TrackLine(track: tracks[i], n: i - 3, onPlay: () => player.play(tracks, i)),
                ]),
                ListView(children: [for (int i = 0; i < tracks.length; i++) TrackLine(track: tracks[i], n: i + 1, onPlay: () => player.play(tracks, i))]),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
