import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../api.dart';
import '../catalog.dart';
import '../models.dart';
import '../player_controller.dart';
import '../theme.dart';
import '../widgets.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  YtHome yt = const YtHome(
    region: 'GH',
    regionName: 'Ghana',
    videos: fallbackClips,
    feed: fallbackClips,
    artists: [],
    playlists: [],
    nearby: [],
  );
  String region = 'GH';
  String? loadError;

  static const fallbackClips = [
    YtClip(videoId: 'GIDiI5kyBDQ', title: 'Black Sherif - Kwaku the Traveller (Official Video)', artist: 'Black Sherif', cover: 'https://i.ytimg.com/vi/GIDiI5kyBDQ/hqdefault.jpg'),
    YtClip(videoId: 'NPCC02SaJVg', title: 'King Promise - Terminator feat. Young Jonn', artist: 'King Promise', cover: 'https://i.ytimg.com/vi/NPCC02SaJVg/hqdefault.jpg'),
    YtClip(videoId: '421w1j87fEM', title: 'Burna Boy - Last Last', artist: 'Burna Boy', cover: 'https://i.ytimg.com/vi/421w1j87fEM/hqdefault.jpg'),
    YtClip(videoId: 'tQiNQL-FEgU', title: 'Free Mind', artist: 'Tems', cover: 'https://i.ytimg.com/vi/tQiNQL-FEgU/hqdefault.jpg'),
    YtClip(videoId: 'pRpeEdMmmQ0', title: 'Shakira - Waka Waka (This Time for Africa)', artist: 'Shakira', cover: 'https://i.ytimg.com/vi/pRpeEdMmmQ0/hqdefault.jpg'),
  ];

  @override
  void initState() {
    super.initState();
    _load('GH');
  }

  Future<void> _load([String? code]) async {
    final want = (code ?? 'GH').toUpperCase();
    YtHome? parsed;
    String? err;
    for (final url in [
      '/feed.json',
      '/api/v1/youtube?region=$want',
      '/api/v1/home',
    ]) {
      try {
        final raw = await VzApi.get(url);
        final map = raw['youtubeHome'] is Map
            ? Map<String, dynamic>.from(raw['youtubeHome'] as Map)
            : raw;
        if (map['videos'] is List || map['feed'] is List) {
          parsed = YtHome.fromJson(map);
          if (parsed.videos.isNotEmpty || parsed.feed.isNotEmpty) break;
          parsed = null;
        }
      } catch (e) {
        err = '$e';
      }
    }
    if (!mounted) return;
    setState(() {
      if (parsed != null) {
        yt = parsed;
        region = parsed.region;
        loadError = null;
      } else {
        loadError = err;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final player = context.read<PlayerController>();
    final feed = yt.feed.isNotEmpty ? yt.feed : yt.videos;
    final popular = yt.videos.isNotEmpty ? yt.videos : feed;
    final heroClip = feed.isNotEmpty ? feed.first : popular.first;
    final heroTrack = heroClip.asTrack();
    final place = (yt.city != null && yt.city!.isNotEmpty) ? '${yt.city} · ${yt.regionName}' : yt.regionName;

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: SizedBox(
                height: 300,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    MediaImg(heroTrack.cover, cache: 900),
                    const DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.centerLeft,
                          end: Alignment.centerRight,
                          colors: [Color(0xE607010D), Color(0x6607010D), Colors.transparent],
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Text('POPULAR IN ${place.toUpperCase()}', style: const TextStyle(color: accent, fontWeight: FontWeight.w800, letterSpacing: 1.8, fontSize: 11)),
                          const SizedBox(height: 6),
                          Text(heroTrack.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.headlineLarge),
                          Text(heroTrack.artist, style: const TextStyle(color: Colors.white70, fontSize: 16, fontWeight: FontWeight.w600)),
                          const SizedBox(height: 16),
                          Wrap(spacing: 8, children: [
                            FilledButton.icon(
                              onPressed: () => player.playClips(feed.isNotEmpty ? feed : popular, 0),
                              icon: const Icon(Icons.play_arrow_rounded),
                              label: const Text('Play'),
                            ),
                          ]),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: SizedBox(
            height: 48,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              children: [
                for (final code in ['GH', 'NG', 'US', 'GB', 'ZA', 'BR', 'KR', 'PT'])
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(code),
                      selected: region == code,
                      onSelected: (_) => _load(code),
                    ),
                  ),
              ],
            ),
          ),
        ),
        if (popular.isNotEmpty)
          _ytRail(context, 'For you in $place', popular, player, kicker: 'Catalog mix from your country'),
        if (yt.artists.isNotEmpty)
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SectionHead('Popular artists', kicker: place, action: 'See all', onAction: () => context.go('/discover')),
                SizedBox(
                  height: 118,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    scrollDirection: Axis.horizontal,
                    itemCount: yt.artists.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 16),
                    itemBuilder: (_, i) {
                      final a = yt.artists[i];
                      return InkWell(
                        onTap: () {
                          final idx = popular.indexWhere((v) => v.videoId == a.videoId);
                          player.playClips(popular, idx < 0 ? 0 : idx);
                        },
                        child: SizedBox(
                          width: 84,
                          child: Column(
                            children: [
                              CircleAvatar(radius: 36, backgroundImage: NetworkImage(a.avatar)),
                              const SizedBox(height: 8),
                              Text(a.name.split(' ').first, maxLines: 1, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.titleMedium),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        for (final n in yt.nearby)
            if (n.videos.isNotEmpty)
              _ytRail(context, n.name, n.videos, player, kicker: 'Nearby'),
        if (yt.playlists.isNotEmpty)
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SectionHead('Playlists & mixes', kicker: 'Songs · beats · albums', action: 'Charts', onAction: () => context.go('/charts')),
                SizedBox(
                  height: 168,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    scrollDirection: Axis.horizontal,
                    itemCount: yt.playlists.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 12),
                    itemBuilder: (_, i) {
                      final p = yt.playlists[i];
                      return PosterTile(
                        image: p.cover,
                        title: p.title,
                        sub: p.sub,
                        onTap: () {
                          if (p.videos.isNotEmpty) player.playClips(p.videos, 0);
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        _rail(context, 'On VerzZify', tracks, player, '/search', kicker: 'Hosted catalog'),
        SliverToBoxAdapter(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SectionHead('Upcoming nights', action: 'Tickets', onAction: () => context.push('/event/${nights.first.id}')),
              SizedBox(
                height: 168,
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  scrollDirection: Axis.horizontal,
                  itemCount: nights.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (_, i) {
                    final e = nights[i];
                    return PosterTile(image: e.poster, title: e.title, sub: '${e.place} · ${e.price}', onTap: () => context.push('/event/${e.id}'));
                  },
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ],
    );
  }

  SliverToBoxAdapter _ytRail(BuildContext context, String title, List<YtClip> list, PlayerController player, {String? kicker}) {
    return SliverToBoxAdapter(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SectionHead(title, action: 'Play all', onAction: () => player.playClips(list, 0), kicker: kicker),
          SizedBox(
            height: 210,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (_, i) {
                return YtVideoTile(clip: list[i], onPlay: () => player.playClips(list, i));
              },
            ),
          ),
        ],
      ),
    );
  }

  SliverToBoxAdapter _rail(BuildContext context, String title, List<Track> list, PlayerController player, String seeAll, {String? kicker}) {
    return SliverToBoxAdapter(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SectionHead(title, action: 'See all', onAction: () => context.go(seeAll), kicker: kicker),
          SizedBox(
            height: 210,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (_, i) {
                final t = list[i];
                return CoverTile(
                  track: t,
                  onPlay: () => player.play(List.from(list), i),
                  onOpen: () => context.push('/track/${t.id}'),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
