import 'dart:js_interop';
import 'package:web/web.dart' as web;

/// Real DOM iframe on top of the Flutter canvas. Platform views + ClipRRect
/// swallow YouTube; this is created on the same tap that starts playback.
class YtDom {
  static const _id = 'vz-yt-frame';

  static void sync(String? videoId, List<String> queue) {
    final body = web.document.body;
    if (body == null) return;
    final existing = web.document.getElementById(_id);
    if (videoId == null || videoId.isEmpty) {
      existing?.remove();
      return;
    }
    final ids = [for (final e in queue) if (e.isNotEmpty) e];
    if (!ids.contains(videoId)) ids.insert(0, videoId);
    final src =
        '/yt.html?v=${Uri.encodeComponent(videoId)}&list=${Uri.encodeComponent(ids.join(","))}&autoplay=1';
    if (existing is web.HTMLIFrameElement) {
      if (!existing.src.contains('v=$videoId')) existing.src = src;
      return;
    }
    final iframe = web.HTMLIFrameElement()
      ..id = _id
      ..src = src
      ..allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'
      ..referrerPolicy = 'origin';
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
    final s = iframe.style;
    s.setProperty('position', 'fixed');
    s.setProperty('left', '12px');
    s.setProperty('right', '12px');
    s.setProperty('bottom', '92px');
    s.setProperty('width', 'calc(100% - 24px)');
    s.setProperty('height', 'min(42vw, 340px)');
    s.setProperty('border', '0');
    s.setProperty('border-radius', '16px');
    s.setProperty('z-index', '99999');
    s.setProperty('background', '#07010d');
    s.setProperty('box-shadow', '0 12px 40px #0008');
    body.appendChild(iframe);
  }

  static void post(String cmd) {
    final el = web.document.getElementById(_id);
    if (el is web.HTMLIFrameElement) {
      el.contentWindow?.postMessage(cmd.toJS, '*'.toJS);
    }
  }
}
