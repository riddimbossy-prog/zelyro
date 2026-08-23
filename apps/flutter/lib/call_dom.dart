import 'package:web/web.dart' as web;

class CallDom {
  static const _id = 'vz-call-frame';

  static void open(String room) {
    close();
    final body = web.document.body;
    if (body == null) return;
    final iframe = web.HTMLIFrameElement()
      ..id = _id
      ..src = '/call.html?room=${Uri.encodeComponent(room)}&name=You'
      ..allow = 'camera; microphone; autoplay; fullscreen';
    iframe.setAttribute('allow', 'camera; microphone; autoplay; fullscreen');
    final s = iframe.style;
    s.setProperty('position', 'fixed');
    s.setProperty('inset', '0');
    s.setProperty('width', '100%');
    s.setProperty('height', '100%');
    s.setProperty('border', '0');
    s.setProperty('z-index', '99998');
    s.setProperty('background', '#000');
    body.appendChild(iframe);
  }

  static void close() {
    web.document.getElementById(_id)?.remove();
  }
}
