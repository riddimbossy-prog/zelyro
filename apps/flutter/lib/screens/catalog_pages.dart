import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../api.dart';
import '../call_dom.dart';
import '../catalog.dart';
import '../models.dart';
import '../player_controller.dart';
import '../theme.dart';
import '../widgets.dart';

class EventScreen extends StatelessWidget {
  const EventScreen({super.key, required this.id});
  final String id;
  @override
  Widget build(BuildContext context) {
    final e = nightById(id);
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        ClipRRect(borderRadius: BorderRadius.circular(20), child: SizedBox(height: 220, child: MediaImg(e.poster, cache: 900))),
        const SizedBox(height: 16),
        const Text('LIVE NIGHT', style: TextStyle(color: accent, fontWeight: FontWeight.w800, letterSpacing: 1.8, fontSize: 11)),
        Text(e.title, style: Theme.of(context).textTheme.headlineLarge),
        Text('${e.place} · ${e.when}', style: Theme.of(context).textTheme.bodySmall),
        const SizedBox(height: 20),
        Glass(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('General', style: TextStyle(fontWeight: FontWeight.w700)), Text('Doors 8pm · mock ticket', style: TextStyle(color: muted, fontSize: 13))])),
              FilledButton(
                onPressed: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Wireframe: ${e.price} ticket held'))),
                child: Text('Buy ${e.price}'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Glass(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('VIP', style: TextStyle(fontWeight: FontWeight.w700)), Text('Lounge · mock', style: TextStyle(color: muted, fontSize: 13))])),
              OutlinedButton(onPressed: () {}, child: const Text('Buy')),
            ],
          ),
        ),
      ],
    );
  }
}

class LiveScreen extends StatelessWidget {
  const LiveScreen({super.key, required this.id});
  final String id;
  @override
  Widget build(BuildContext context) {
    final e = liveById(id);
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Stack(
            children: [
              SizedBox(height: 240, width: double.infinity, child: MediaImg(e.poster, cache: 900)),
              const Positioned(left: 16, top: 16, child: Chip(label: Text('LIVE MOCK'), backgroundColor: accent)),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Text(e.title, style: Theme.of(context).textTheme.headlineLarge),
        Text('${e.artist} · ${e.when}', style: Theme.of(context).textTheme.bodySmall),
        const SizedBox(height: 16),
        FilledButton.icon(
          onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('PPV layout only — stream comes later.'))),
          icon: const Icon(Icons.play_arrow_rounded),
          label: Text(e.price == 'Free' ? 'Watch free' : 'Unlock ${e.price}'),
        ),
      ],
    );
  }
}

class VideoScreen extends StatefulWidget {
  const VideoScreen({super.key, required this.id});
  final String id;
  @override
  State<VideoScreen> createState() => _VideoScreenState();
}

class _VideoScreenState extends State<VideoScreen> {
  @override
  void initState() {
    super.initState();
    CallDom.open(widget.id);
  }

  @override
  void dispose() {
    CallDom.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return const ColoredBox(color: Colors.black, child: SizedBox.expand());
  }
}

class ArtistScreen extends StatefulWidget {
  const ArtistScreen({super.key, required this.slug});
  final String slug;
  @override
  State<ArtistScreen> createState() => _ArtistScreenState();
}

class _ArtistScreenState extends State<ArtistScreen> {
  bool following = false;
  @override
  Widget build(BuildContext context) {
    final player = context.read<PlayerController>();
    final a = artistBySlug(widget.slug) ?? artists.first;
    final mine = tracks.where((t) => t.artistSlug == a.slug).toList();
    final list = mine.isEmpty ? tracks.take(5).toList() : mine;
    return ListView(
      children: [
        SizedBox(height: 200, child: MediaImg(a.banner, cache: 900)),
        Padding(
          padding: const EdgeInsets.all(20),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(a.name, style: Theme.of(context).textTheme.headlineLarge),
            Text('${a.city} · ${a.followers} followers', style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 12),
            Wrap(spacing: 8, children: [
              FilledButton(onPressed: () => setState(() => following = !following), child: Text(following ? 'Following' : 'Follow')),
              OutlinedButton(onPressed: () => context.push('/video/demo-room'), child: const Text('Book 1-1')),
            ]),
          ]),
        ),
        ...list.asMap().entries.map((e) => TrackLine(track: e.value, n: e.key + 1, onPlay: () => player.play(list, e.key))),
      ],
    );
  }
}

class TrackScreen extends StatelessWidget {
  const TrackScreen({super.key, required this.id});
  final String id;
  @override
  Widget build(BuildContext context) {
    final player = context.read<PlayerController>();
    final t = trackById(id);
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: ClipRRect(borderRadius: BorderRadius.circular(20), child: AspectRatio(aspectRatio: 1, child: MediaImg(t.cover, cache: 800))),
          ),
        ),
        const SizedBox(height: 20),
        Text(t.title, textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineMedium),
        TextButton(onPressed: () => context.push('/artist/${t.artistSlug}'), child: Text(t.artist)),
        const SizedBox(height: 8),
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          FilledButton.icon(onPressed: () => player.play([t, ...tracks.where((x) => x.id != t.id)], 0), icon: const Icon(Icons.play_arrow_rounded), label: const Text('Play')),
          const SizedBox(width: 8),
          OutlinedButton(onPressed: () {}, child: const Text('Like')),
        ]),
      ],
    );
  }
}

class DiscoverScreen extends StatefulWidget {
  const DiscoverScreen({super.key});
  @override
  State<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends State<DiscoverScreen> {
  static const genres = [
    'afrobeats', 'amapiano', 'highlife', 'hiphop', 'rnb', 'pop', 'dancehall', 'gospel',
    'kpop', 'latin', 'reggaeton', 'drill', 'house', 'rock', 'bollywood', 'electronic',
  ];
  static const countries = ['GH', 'NG', 'ZA', 'KE', 'JM', 'US', 'GB', 'BR', 'MX', 'KR', 'JP', 'IN', 'FR', 'DE', 'PT'];
  String region = 'GH';
  String genre = 'afrobeats';
  List<YtClip> videos = [];
  List<({String name, String avatar, String videoId})> artists = [];
  bool loading = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => loading = true);
    try {
      final raw = await VzApi.get('/api/v1/catalog?region=$region&genre=$genre');
      final clips = (raw['videos'] as List? ?? []).whereType<Map>().map((e) => YtHome.clip({for (final k in e.keys) '$k': e[k]})).toList();
      final arts = [
        for (final e in (raw['artists'] as List? ?? []).whereType<Map>())
          (
            name: '${e['channelName'] ?? ''}',
            avatar: '${e['avatarUrl'] ?? ''}',
            videoId: '${e['sampleVideoId'] ?? ''}',
          )
      ];
      if (!mounted) return;
      setState(() {
        videos = clips;
        artists = arts;
        loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final player = context.read<PlayerController>();
    return ListView(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
          child: Text('Discover', style: Theme.of(context).textTheme.headlineLarge),
        ),
        const Padding(
          padding: EdgeInsets.fromLTRB(20, 4, 20, 8),
          child: Text('Musicians from YouTube, by country and genre.', style: TextStyle(color: muted)),
        ),
        SizedBox(
          height: 44,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            children: [
              for (final c in countries)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(c),
                    selected: region == c,
                    onSelected: (_) {
                      setState(() => region = c);
                      _load();
                    },
                  ),
                ),
            ],
          ),
        ),
        SizedBox(
          height: 44,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            children: [
              for (final g in genres)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(g),
                    selected: genre == g,
                    onSelected: (_) {
                      setState(() => genre = g);
                      _load();
                    },
                  ),
                ),
            ],
          ),
        ),
        if (loading) const Padding(padding: EdgeInsets.all(24), child: LinearProgressIndicator()),
        if (artists.isNotEmpty) ...[
          SectionHead('$genre artists', kicker: region),
          SizedBox(
            height: 118,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              itemCount: artists.length,
              separatorBuilder: (_, __) => const SizedBox(width: 16),
              itemBuilder: (_, i) {
                final a = artists[i];
                return InkWell(
                  onTap: () {
                    final idx = videos.indexWhere((v) => v.videoId == a.videoId);
                    if (videos.isNotEmpty) player.playClips(videos, idx < 0 ? 0 : idx);
                  },
                  child: SizedBox(
                    width: 84,
                    child: Column(
                      children: [
                        CircleAvatar(radius: 36, backgroundImage: a.avatar.isEmpty ? null : NetworkImage(a.avatar)),
                        const SizedBox(height: 8),
                        Text(a.name.split(' ').first, maxLines: 1, overflow: TextOverflow.ellipsis),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
        ...videos.asMap().entries.map((e) => TrackLine(
              track: e.value.asTrack(),
              n: e.key + 1,
              onPlay: () => player.playClips(videos, e.key),
            )),
        if (!loading && videos.isEmpty)
          const Padding(
            padding: EdgeInsets.all(20),
            child: Text('No public music for that mix yet. Try another country or genre.', style: TextStyle(color: muted)),
          ),
      ],
    );
  }
}

class NewsScreen extends StatelessWidget {
  const NewsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        Text('Journal', style: Theme.of(context).textTheme.headlineLarge),
        const SizedBox(height: 12),
        for (final s in stories)
          Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Glass(
              child: Row(
                children: [
                  SizedBox(width: 120, height: 90, child: MediaImg(s.cover, cache: 240)),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(s.tag.toUpperCase(), style: const TextStyle(color: accent, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1.4)),
                        Text(s.title, style: Theme.of(context).textTheme.titleMedium),
                      ]),
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class CommunityFeed extends StatelessWidget {
  const CommunityFeed({super.key});
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        Text('Community', style: Theme.of(context).textTheme.headlineLarge),
        const SizedBox(height: 12),
        Glass(
          padding: const EdgeInsets.all(12),
          child: InkWell(
            onTap: () => context.go('/search'),
            child: const Row(children: [
              Icon(Icons.search, color: muted),
              SizedBox(width: 8),
              Expanded(child: Text('Search songs, beats, live streams, albums, 1-1, artists…', style: TextStyle(color: muted))),
            ]),
          ),
        ),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(child: Text('Your Creator Studio', style: Theme.of(context).textTheme.headlineMedium)),
          TextButton(onPressed: () => context.go('/studio'), child: const Text('Open')),
        ]),
        const SizedBox(height: 8),
        Wrap(spacing: 8, runSpacing: 8, children: [
          ActionChip(avatar: const Icon(Icons.library_music, size: 16), label: const Text('Upload'), onPressed: () => context.push('/studio/upload')),
          ActionChip(avatar: const Icon(Icons.confirmation_number, size: 16), label: const Text('Ticket'), onPressed: () => context.push('/studio/ticket')),
          ActionChip(avatar: const Icon(Icons.wifi_tethering, size: 16), label: const Text('Live'), onPressed: () => context.push('/studio/live')),
          ActionChip(avatar: const Icon(Icons.account_balance_wallet, size: 16), label: const Text('Wallet'), onPressed: () => context.push('/studio/wallet')),
        ]),
        const SizedBox(height: 16),
        Glass(
          padding: const EdgeInsets.all(12),
          child: ListTile(
            leading: const Icon(Icons.videocam, color: accent),
            title: const Text('Open 1-1 room'),
            subtitle: const Text('Nia Adaeze is available (mock)'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/video/demo-room'),
          ),
        ),
        const SizedBox(height: 16),
        for (final p in posts)
          Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Glass(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ListTile(
                    leading: CircleAvatar(backgroundImage: NetworkImage(p.avatar)),
                    title: Text(p.author),
                    subtitle: const Text('2h ago'),
                  ),
                  Padding(padding: const EdgeInsets.fromLTRB(16, 0, 16, 8), child: Text(p.body)),
                  SizedBox(height: 180, width: double.infinity, child: MediaImg(p.image, cache: 700)),
                  Padding(
                    padding: const EdgeInsets.all(8),
                    child: Row(children: [
                      IconButton(onPressed: () {}, icon: const Icon(Icons.favorite_border)),
                      Text(p.likes),
                      IconButton(onPressed: () {}, icon: const Icon(Icons.chat_bubble_outline)),
                    ]),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
