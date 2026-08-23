import 'package:flutter/foundation.dart';
import 'package:just_audio/just_audio.dart';

import 'catalog.dart';
import 'models.dart';
import 'yt_dom.dart';

class PlayerController extends ChangeNotifier {
  PlayerController() {
    _player.playerStateStream.listen((_) => notifyListeners());
  }

  final AudioPlayer _player = AudioPlayer();
  List<Track> queue = const [];
  int index = 0;
  bool ytPaused = false;

  Track? get current => queue.isEmpty ? null : queue[index];
  bool get isYoutube => current?.isYoutube == true;
  String? get youtubeId => current?.videoId;
  bool get playing => isYoutube ? !ytPaused : _player.playing;

  List<String> get youtubeQueue => [
        for (final t in queue)
          if (t.videoId != null && t.videoId!.isNotEmpty) t.videoId!,
      ];

  Future<void> play(List<Track> q, int i) async {
    queue = q;
    index = i;
    final t = current;
    if (t == null) return;
    ytPaused = false;
    if (t.isYoutube) {
      YtDom.sync(t.videoId, youtubeQueue);
      notifyListeners();
      try {
        await _player.stop();
      } catch (_) {}
      return;
    }
    YtDom.sync(null, const []);
    notifyListeners();
    await _player.setUrl(media(t.audio));
    await _player.play();
    notifyListeners();
  }

  Future<void> playClips(List<YtClip> clips, int i) {
    return play(clips.map((c) => c.asTrack()).toList(), i);
  }

  Future<void> toggle() async {
    if (current == null) {
      await play(tracks, 0);
      return;
    }
    if (isYoutube) {
      ytPaused = !ytPaused;
      YtDom.post(ytPaused ? 'pause' : 'play');
      notifyListeners();
      return;
    }
    if (_player.playing) {
      await _player.pause();
    } else {
      await _player.play();
    }
    notifyListeners();
  }

  Future<void> next() async {
    if (queue.isEmpty) return;
    await play(queue, (index + 1) % queue.length);
  }

  Future<void> prev() async {
    if (queue.isEmpty) return;
    await play(queue, (index - 1 + queue.length) % queue.length);
  }

  @override
  void dispose() {
    YtDom.sync(null, const []);
    _player.dispose();
    super.dispose();
  }
}
