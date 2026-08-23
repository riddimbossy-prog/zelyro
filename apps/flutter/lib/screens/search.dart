import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../catalog.dart';
import '../player_controller.dart';
import '../theme.dart';
import '../widgets.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  String q = '';
  String kind = 'Songs';

  @override
  Widget build(BuildContext context) {
    final player = context.read<PlayerController>();
    final s = q.toLowerCase();
    final hits = tracks.where((t) {
      if (s.isEmpty) return true;
      return t.title.toLowerCase().contains(s) || t.artist.toLowerCase().contains(s) || t.genre.toLowerCase().contains(s);
    }).toList();
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
          child: TextField(
            autofocus: true,
            decoration: const InputDecoration(hintText: 'Songs, beats, albums, artists', prefixIcon: Icon(Icons.search_rounded)),
            onChanged: (v) => setState(() => q = v),
          ),
        ),
        SizedBox(
          height: 42,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            children: [
              for (final k in ['Songs', 'Beats', 'Albums', 'Artists'])
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(label: Text(k), selected: kind == k, onSelected: (_) => setState(() => kind = k)),
                ),
            ],
          ),
        ),
        Expanded(
          child: kind == 'Artists'
              ? ListView(
                  children: [
                    for (final a in artists)
                      ListTile(
                        leading: CircleAvatar(backgroundImage: NetworkImage(a.avatar)),
                        title: Text(a.name),
                        subtitle: Text(a.city),
                        onTap: () => context.push('/artist/${a.slug}'),
                      ),
                  ],
                )
              : ListView.builder(
                  itemCount: hits.length,
                  itemBuilder: (_, i) => TrackLine(
                    track: hits[i],
                    n: i + 1,
                    onPlay: () => player.play(hits, i),
                  ),
                ),
        ),
      ],
    );
  }
}
