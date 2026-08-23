class Track {
  const Track({
    required this.id,
    required this.title,
    required this.artist,
    required this.artistSlug,
    required this.cover,
    required this.audio,
    required this.plays,
    required this.genre,
    this.duration = const Duration(seconds: 75),
    this.videoId,
  });

  final String id;
  final String title;
  final String artist;
  final String artistSlug;
  final String cover;
  final String audio;
  final int plays;
  final String genre;
  final Duration duration;
  final String? videoId;
  bool get isYoutube => videoId != null && videoId!.isNotEmpty;
}

class Artist {
  const Artist({
    required this.slug,
    required this.name,
    required this.avatar,
    required this.city,
    this.banner = '/banners/hero.jpg',
    this.followers = '128K',
  });

  final String slug;
  final String name;
  final String avatar;
  final String city;
  final String banner;
  final String followers;
}

class Playlist {
  const Playlist({
    required this.id,
    required this.title,
    required this.cover,
    required this.kind,
    this.subtitle = 'Editorial',
  });

  final String id;
  final String title;
  final String cover;
  final String kind;
  final String subtitle;
}

class Night {
  const Night({
    required this.id,
    required this.title,
    required this.poster,
    required this.place,
    required this.when,
    required this.price,
  });

  final String id;
  final String title;
  final String poster;
  final String place;
  final String when;
  final String price;
}

class LiveShow {
  const LiveShow({
    required this.id,
    required this.title,
    required this.poster,
    required this.artist,
    required this.when,
    this.price = 'Free',
  });

  final String id;
  final String title;
  final String poster;
  final String artist;
  final String when;
  final String price;
}

class Post {
  const Post({
    required this.id,
    required this.author,
    required this.avatar,
    required this.body,
    required this.image,
    required this.likes,
  });

  final String id;
  final String author;
  final String avatar;
  final String body;
  final String image;
  final String likes;
}

class Story {
  const Story({
    required this.id,
    required this.title,
    required this.cover,
    required this.tag,
  });

  final String id;
  final String title;
  final String cover;
  final String tag;
}

class YtClip {
  const YtClip({
    required this.videoId,
    required this.title,
    required this.artist,
    required this.cover,
  });

  final String videoId;
  final String title;
  final String artist;
  final String cover;

  Track asTrack() => Track(
        id: 'yt_$videoId',
        title: title,
        artist: artist,
        artistSlug: artist.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '-'),
        cover: cover,
        audio: '',
        plays: 0,
        genre: 'Feed',
        videoId: videoId,
      );
}

class YtHome {
  const YtHome({
    required this.region,
    required this.regionName,
    this.city,
    required this.videos,
    required this.artists,
    required this.playlists,
    required this.nearby,
    required this.feed,
  });

  final String region;
  final String regionName;
  final String? city;
  final List<YtClip> videos;
  final List<({String name, String avatar, String videoId})> artists;
  final List<({String title, String sub, String cover, List<YtClip> videos})> playlists;
  final List<({String region, String name, List<YtClip> videos})> nearby;
  final List<YtClip> feed;

  static YtClip clip(Map<String, dynamic> j) => YtClip(
        videoId: '${j['videoId']}',
        title: '${j['title'] ?? ''}',
        artist: '${j['channelName'] ?? ''}',
        cover: '${j['thumbnailUrl'] ?? ''}',
      );

  static YtHome fromJson(Map<String, dynamic> j) {
    Map<String, dynamic> mmap(dynamic e) =>
        {for (final k in (e as Map).keys) '$k': (e as Map)[k]};

    List<YtClip> clips(dynamic raw) {
      if (raw is! List) return [];
      final out = <YtClip>[];
      for (final e in raw) {
        if (e is Map) out.add(clip(mmap(e)));
      }
      return out;
    }

    return YtHome(
      region: '${j['region'] ?? 'GH'}',
      regionName: '${j['regionName'] ?? 'Ghana'}',
      city: j['city']?.toString(),
      videos: clips(j['videos']),
      feed: clips(j['feed']).isEmpty ? clips(j['videos']) : clips(j['feed']),
      artists: [
        for (final e in (j['artists'] as List? ?? [])
            .whereType<Map>())
          (
            name: '${e['channelName'] ?? ''}',
            avatar: '${e['avatarUrl'] ?? ''}',
            videoId: '${e['sampleVideoId'] ?? ''}',
          )
      ],
      playlists: [
        for (final e in (j['playlists'] as List? ?? []).whereType<Map>())
          (
            title: '${e['title'] ?? ''}',
            sub: '${e['subtitle'] ?? ''}',
            cover: '${e['thumbnailUrl'] ?? ''}',
            videos: clips(e['videos']),
          )
      ],
      nearby: [
        for (final e in (j['nearby'] as List? ?? []).whereType<Map>())
          (
            region: '${e['region'] ?? ''}',
            name: '${e['regionName'] ?? ''}',
            videos: clips(e['videos']),
          )
      ],
    );
  }
}
