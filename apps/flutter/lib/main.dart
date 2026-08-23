import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'player_controller.dart';
import 'screens/catalog_pages.dart';
import 'screens/charts.dart';
import 'screens/home.dart';
import 'screens/library.dart';
import 'screens/profile.dart';
import 'screens/search.dart';
import 'screens/now_playing.dart';
import 'screens/studio.dart';
import 'screens/studio_flows.dart';
import 'theme.dart';
import 'widgets.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    ChangeNotifierProvider(
      create: (_) => PlayerController(),
      child: const VerzZifyApp(),
    ),
  );
}

final _router = GoRouter(
  routes: [
    ShellRoute(
      builder: (context, state, child) => _Shell(child: child),
      routes: [
        GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
        GoRoute(path: '/search', builder: (_, __) => const SearchScreen()),
        GoRoute(path: '/library', builder: (_, __) => const LibraryScreen()),
        GoRoute(path: '/community', builder: (_, __) => const CommunityFeed()),
        GoRoute(path: '/charts', builder: (_, __) => const ChartsScreen()),
        GoRoute(path: '/studio', builder: (_, __) => const StudioScreen()),
        GoRoute(path: '/studio/upload', builder: (_, __) => const UploadSongScreen()),
        GoRoute(path: '/studio/youtube', builder: (_, __) => const YoutubeLinkScreen()),
        GoRoute(path: '/studio/live', builder: (_, __) => const LiveHubScreen()),
        GoRoute(path: '/studio/ticket', builder: (_, __) => const CreateTicketScreen()),
        GoRoute(path: '/studio/album', builder: (_, __) => const SimpleCreateScreen(title: 'Create Album', hint: 'Album title')),
        GoRoute(path: '/studio/playlist', builder: (_, __) => const SimpleCreateScreen(title: 'Create Playlist', hint: 'Playlist title')),
        GoRoute(path: '/studio/wallet', builder: (_, __) => const WalletScreen()),
        GoRoute(path: '/studio/history', builder: (_, __) => const ChatHistoryScreen()),
        GoRoute(path: '/now', builder: (_, __) => const NowPlayingScreen()),
        GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
        GoRoute(path: '/discover', builder: (_, __) => const DiscoverScreen()),
        GoRoute(path: '/news', builder: (_, __) => const NewsScreen()),
        GoRoute(path: '/event/:id', builder: (_, s) => EventScreen(id: s.pathParameters['id']!)),
        GoRoute(path: '/live/:id', builder: (_, s) => LiveScreen(id: s.pathParameters['id']!)),
        GoRoute(path: '/video/:id', builder: (_, s) => VideoScreen(id: s.pathParameters['id']!)),
        GoRoute(path: '/artist/:slug', builder: (_, s) => ArtistScreen(slug: s.pathParameters['slug']!)),
        GoRoute(path: '/track/:id', builder: (_, s) => TrackScreen(id: s.pathParameters['id']!)),
      ],
    ),
  ],
);

class VerzZifyApp extends StatelessWidget {
  const VerzZifyApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'VerzZify',
      debugShowCheckedModeBanner: false,
      theme: verzzifyTheme(),
      routerConfig: _router,
    );
  }
}

class _Shell extends StatelessWidget {
  const _Shell({required this.child});
  final Widget child;

  static const dests = [
    ('/', Icons.home_rounded, 'Home'),
    ('/search', Icons.search_rounded, 'Search'),
    ('/library', Icons.download_rounded, 'Library'),
    ('/community', Icons.groups_rounded, 'Community'),
    ('/charts', Icons.emoji_events_rounded, 'Charts'),
    ('/studio', Icons.mic_rounded, 'Studio'),
    ('/profile', Icons.person_rounded, 'You'),
  ];

  @override
  Widget build(BuildContext context) {
    final loc = GoRouterState.of(context).uri.path;
    final wide = MediaQuery.sizeOf(context).width >= 900;
    int idx = dests.indexWhere((d) => d.$1 == loc);
    if (idx < 0) idx = 0;
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Aurora(
        child: Row(
          children: [
          if (wide)
            NavigationRail(
              selectedIndex: idx,
              onDestinationSelected: (i) => context.go(dests[i].$1),
              labelType: NavigationRailLabelType.all,
              leading: const Padding(
                padding: EdgeInsets.fromLTRB(12, 16, 12, 24),
                child: Image(image: AssetImage('assets/logo.png'), height: 36, filterQuality: FilterQuality.medium),
              ),
              destinations: [
                for (final d in dests) NavigationRailDestination(icon: Icon(d.$2), label: Text(d.$3)),
              ],
            ),
          Expanded(
            child: Column(
              children: [
                const TopBar(),
                Expanded(child: child),
                const YoutubeDock(),
                const MiniBar(),
              ],
            ),
          ),
        ],
        ),
      ),
      bottomNavigationBar: wide
          ? null
          : NavigationBar(
              selectedIndex: idx.clamp(0, 4),
              onDestinationSelected: (i) => context.go(dests[i].$1),
              destinations: [
                for (final d in dests.take(5)) NavigationDestination(icon: Icon(d.$2), label: d.$3),
              ],
            ),
    );
  }
}
