import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../api.dart';
import '../catalog.dart';
import '../models.dart';
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
  List<YtClip> ytHits = [];
  Timer? _deb;

  @override
  void dispose() {
    _deb?.cancel();
    super.dispose();
  }

  void _onQ(String v) {
    setState(() => q = v);
    _deb?.cancel();
    if (v.trim().length < 2) {
      setState(() => ytHits = []);
      return;
    }
    _deb = Timer(const Duration(milliseconds: 400), () async {
      try {
        final raw = await VzApi.get('/api/v1/youtube?q=${Uri.encodeQueryComponent(v.trim())}');
        final list = (raw['videos'] as List? ?? []).whereType<Map>().map((e) => YtHome.clip({for (final k in e.keys) '$k': e[k]})).toList();
        if (!mounted || q != v) return;
        setState(() => ytHits = list);
      } catch (_) {}
    });
  }

  @override
  Widget build(BuildContext context) {
    final player = context.read<PlayerController>();
    final s = q.toLowerCase();
    final local = tracks.where((t) {
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
            onChanged: _onQ,
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
              : ListView(
                  children: [
                    if (ytHits.isNotEmpty) ...[
                      const Padding(
                        padding: EdgeInsets.fromLTRB(16, 12, 16, 4),
                        child: Text('From the catalog', style: TextStyle(color: muted, fontWeight: FontWeight.w800)),
                      ),
                      ...ytHits.asMap().entries.map((e) => TrackLine(
                            track: e.value.asTrack(),
                            n: e.key + 1,
                            onPlay: () => player.playClips(ytHits, e.key),
                          )),
                    ],
                    if (local.isNotEmpty) ...[
                      const Padding(
                        padding: EdgeInsets.fromLTRB(16, 12, 16, 4),
                        child: Text('On VerzZify', style: TextStyle(color: muted, fontWeight: FontWeight.w800)),
                      ),
                      ...local.asMap().entries.map((e) => TrackLine(
                            track: e.value,
                            n: e.key + 1,
                            onPlay: () => player.play(local, e.key),
                          )),
                    ],
                  ],
                ),
        ),
      ],
    );
  }
}
