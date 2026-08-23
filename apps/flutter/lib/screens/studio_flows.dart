import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../catalog.dart';
import '../theme.dart';
import '../widgets.dart';

class _Head extends StatelessWidget {
  const _Head(this.title);
  final String title;
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        IconButton(onPressed: () => context.pop(), icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18)),
        Expanded(child: Text(title, style: Theme.of(context).textTheme.headlineMedium)),
      ],
    );
  }
}

class _Field extends StatelessWidget {
  const _Field(this.hint, {this.lines = 1, this.trailing});
  final String hint;
  final int lines;
  final Widget? trailing;
  @override
  Widget build(BuildContext context) {
    return TextField(
      maxLines: lines,
      decoration: InputDecoration(
        hintText: hint,
        suffixIcon: trailing,
        filled: true,
        fillColor: const Color(0xFF141018),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0x66C026D3)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: accent, width: 1.4),
        ),
      ),
    );
  }
}

class _Drop extends StatelessWidget {
  const _Drop({required this.label, required this.icon, this.square = false, required this.on, required this.picked});
  final String label;
  final IconData icon;
  final bool square;
  final bool picked;
  final VoidCallback on;
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: on,
      child: Container(
        height: square ? 168 : 120,
        width: square ? 168 : double.infinity,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: const Color(0xFF141018),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: picked ? accent : const Color(0x88C026D3), style: BorderStyle.solid, width: 1.4),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(picked ? Icons.check_circle : icon, color: Colors.white, size: 36),
            const SizedBox(height: 8),
            Text(picked ? 'Selected' : label, style: const TextStyle(fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }
}

void _toast(BuildContext context, String m) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));
}

class UploadSongScreen extends StatefulWidget {
  const UploadSongScreen({super.key});
  @override
  State<UploadSongScreen> createState() => _UploadSongScreenState();
}

class _UploadSongScreenState extends State<UploadSongScreen> {
  bool cover = false, audio = false, paid = false;
  String mood = 'Energetic', genre = 'Afrobeats', lang = 'English (en)';
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
      children: [
        const _Head('Upload Song'),
        Center(child: _Drop(label: 'Upload Cover Art', icon: Icons.add, square: true, picked: cover, on: () => setState(() => cover = true))),
        const SizedBox(height: 12),
        _Drop(label: 'Select Audio', icon: Icons.music_note, picked: audio, on: () => setState(() => audio = true)),
        const SizedBox(height: 14),
        const _Field('Enter Song Title'),
        const SizedBox(height: 16),
        const Text('Select Mood', style: TextStyle(fontWeight: FontWeight.w800)),
        const SizedBox(height: 8),
        Wrap(spacing: 8, children: [
          for (final m in ['Relaxing', 'Energetic', 'Happy', 'Dark'])
            ChoiceChip(label: Text(m), selected: mood == m, onSelected: (_) => setState(() => mood = m)),
        ]),
        const SizedBox(height: 16),
        const Text('Select Genre', style: TextStyle(fontWeight: FontWeight.w800)),
        const SizedBox(height: 8),
        Wrap(spacing: 8, children: [
          for (final g in ['Afrobeats', 'Amapiano', 'Hip Hop', 'Pop', 'Highlife', 'Gospel'])
            ChoiceChip(label: Text(g), selected: genre == g, onSelected: (_) => setState(() => genre = g)),
        ]),
        const SizedBox(height: 14),
        DropdownButtonFormField<String>(
          value: lang,
          decoration: InputDecoration(
            filled: true,
            fillColor: const Color(0xFF141018),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0x66C026D3))),
          ),
          items: ['English (en)', 'Twi (tw)', 'Pidgin', 'French (fr)'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
          onChanged: (v) => setState(() => lang = v ?? lang),
        ),
        const SizedBox(height: 16),
        ListTile(
          title: const Text('Free', style: TextStyle(color: accent, fontWeight: FontWeight.w800)),
          leading: Radio<bool>(value: false, groupValue: paid, onChanged: (v) => setState(() => paid = v ?? false)),
        ),
        ListTile(
          title: const Text('Paid', style: TextStyle(color: accent, fontWeight: FontWeight.w800)),
          leading: Radio<bool>(value: true, groupValue: paid, onChanged: (v) => setState(() => paid = v ?? true)),
        ),
        if (paid) const _Field('Price (USD)'),
        const SizedBox(height: 16),
        FilledButton(onPressed: () { _toast(context, 'Wireframe: song queued for publish'); context.pop(); }, child: const Text('Submit')),
      ],
    );
  }
}

class CreateTicketScreen extends StatefulWidget {
  const CreateTicketScreen({super.key});
  @override
  State<CreateTicketScreen> createState() => _CreateTicketScreenState();
}

class _CreateTicketScreenState extends State<CreateTicketScreen> {
  bool photo = false;
  DateTime? when;
  String cat = 'Concert';
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
      children: [
        const _Head('Create Ticket'),
        Center(child: _Drop(label: 'Ticket Photo', icon: Icons.add, square: true, picked: photo, on: () => setState(() => photo = true))),
        const SizedBox(height: 14),
        const _Field('Event Name'),
        const SizedBox(height: 10),
        const _Field('Name'),
        const SizedBox(height: 10),
        _Field(
          when == null ? 'Select Event Date & Time' : when.toString().substring(0, 16),
          trailing: const Icon(Icons.calendar_month_outlined),
        ),
        const SizedBox(height: 10),
        DropdownButtonFormField<String>(
          value: cat,
          decoration: InputDecoration(
            hintText: 'Select Event Category',
            filled: true,
            fillColor: const Color(0xFF141018),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0x66C026D3))),
          ),
          items: ['Concert', 'Club night', 'Festival', 'Showcase'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
          onChanged: (v) => setState(() => cat = v ?? cat),
        ),
        const SizedBox(height: 10),
        const _Field('Select Google Location', trailing: Icon(Icons.location_on, color: Colors.redAccent)),
        const SizedBox(height: 10),
        const _Field('About Event', lines: 4),
        const SizedBox(height: 16),
        FilledButton(
          onPressed: () {
            _toast(context, 'Wireframe: ticket created');
            context.push('/event/${nights.first.id}');
          },
          child: const Text('Create Ticket'),
        ),
      ],
    );
  }
}

class YoutubeLinkScreen extends StatelessWidget {
  const YoutubeLinkScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
      children: [
        const _Head('Youtube Link'),
        const Text('Paste a public video. It plays in the VerzZify player — we do not keep the file.', style: TextStyle(color: muted)),
        const SizedBox(height: 14),
        const _Field('https://www.youtube.com/watch?v='),
        const SizedBox(height: 10),
        const _Field('Display title'),
        const SizedBox(height: 16),
        FilledButton(onPressed: () { _toast(context, 'Wireframe: link saved to your profile'); context.pop(); }, child: const Text('Promote')),
      ],
    );
  }
}

class LiveHubScreen extends StatelessWidget {
  const LiveHubScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
      children: [
        const _Head('Live Streaming'),
        Text('My Live Streams', style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 12),
        SizedBox(
          height: 180,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              InkWell(
                onTap: () => context.push('/live/${lives.first.id}'),
                child: Glass(
                  radius: 18,
                  child: const SizedBox(
                    width: 140,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircleAvatar(radius: 28, backgroundColor: Colors.white, child: Icon(Icons.add, color: accent, size: 32)),
                        SizedBox(height: 10),
                        Text('Start Live\nstream', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w800)),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              InkWell(
                onTap: () => context.push('/live/${lives.first.id}'),
                child: SizedBox(
                  width: 150,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(18),
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        MediaImg(lives.first.poster, cache: 300),
                        const Align(alignment: Alignment.topLeft, child: Padding(padding: EdgeInsets.all(8), child: Chip(label: Text('Ended'), backgroundColor: accent))),
                        const Center(child: CircleAvatar(child: Icon(Icons.play_arrow))),
                        Align(alignment: Alignment.bottomCenter, child: Padding(padding: const EdgeInsets.all(8), child: Text(lives.first.title, style: const TextStyle(fontWeight: FontWeight.w800)))),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Text('Recommended Accounts', style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 12),
        SizedBox(
          height: 110,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              for (final a in artists.take(5))
                Padding(
                  padding: const EdgeInsets.only(right: 16),
                  child: InkWell(
                    onTap: () => context.push('/artist/${a.slug}'),
                    child: Column(children: [
                      CircleAvatar(radius: 34, backgroundImage: NetworkImage(a.avatar)),
                      const SizedBox(height: 6),
                      Text(a.name.split(' ').first, style: const TextStyle(fontWeight: FontWeight.w800)),
                    ]),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class WalletScreen extends StatelessWidget {
  const WalletScreen({super.key});
  @override
  Widget build(BuildContext context) {
    const rows = [
      ('Someone Purchased Your Beat.', '\$ 0.50', '19 Mar 26'),
      ('Someone Purchased Your Beat.', '\$ 0.50', '14 Mar 26'),
      ('You Have Purchased A Song From Avatar.', '\$ 2.00', '27 Feb 26'),
      ('Your Livestream Has Been Accessed.', '\$ 0.05', '05 Feb 26'),
    ];
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
      children: [
        const _Head('Wallet'),
        const Text('Available Balance', textAlign: TextAlign.center, style: TextStyle(color: muted)),
        Text('\$27.33', textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineLarge),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(child: OutlinedButton.icon(onPressed: () => _toast(context, 'Wireframe: withdraw'), icon: const Icon(Icons.near_me_outlined), label: const Text('Withdraw'))),
          const SizedBox(width: 10),
          Expanded(child: OutlinedButton.icon(onPressed: () => _toast(context, 'Wireframe: reports'), icon: const Icon(Icons.description_outlined), label: const Text('Reports'))),
        ]),
        const SizedBox(height: 24),
        Row(children: [
          Expanded(child: Text('Recent Transactions', style: Theme.of(context).textTheme.headlineMedium)),
          const Text('See All', style: TextStyle(color: accent, fontWeight: FontWeight.w800)),
        ]),
        const SizedBox(height: 8),
        for (final r in rows)
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: CircleAvatar(backgroundImage: NetworkImage(artists.first.avatar)),
            title: Text(r.$1),
            subtitle: Text(r.$3, style: const TextStyle(color: muted)),
            trailing: Text(r.$2, style: const TextStyle(fontWeight: FontWeight.w800)),
          ),
      ],
    );
  }
}

class SimpleCreateScreen extends StatelessWidget {
  const SimpleCreateScreen({super.key, required this.title, required this.hint});
  final String title;
  final String hint;
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
      children: [
        _Head(title),
        Center(child: _Drop(label: 'Cover', icon: Icons.add, square: true, picked: false, on: () {})),
        const SizedBox(height: 14),
        _Field(hint),
        const SizedBox(height: 10),
        const _Field('Description', lines: 3),
        const SizedBox(height: 16),
        FilledButton(onPressed: () { _toast(context, 'Wireframe saved'); context.pop(); }, child: Text('Create $title')),
      ],
    );
  }
}

class ChatHistoryScreen extends StatelessWidget {
  const ChatHistoryScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
      children: [
        const _Head('Video Chat History'),
        for (final a in artists.take(4))
          ListTile(
            leading: CircleAvatar(backgroundImage: NetworkImage(a.avatar)),
            title: Text(a.name),
            subtitle: Text('Ended · ${a.city}'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.push('/video/demo-room'),
          ),
      ],
    );
  }
}

void showShareSheet(BuildContext context, {required String cover, required String title, String artist = ''}) {
  showGeneralDialog(
    context: context,
    barrierColor: Colors.black87,
    barrierDismissible: true,
    barrierLabel: 'Share',
    pageBuilder: (_, __, ___) => ShareTemplates(
      cover: cover,
      title: title,
      artist: artist,
    ),
  );
}

enum ShareKind { poster, circle, story, live, link }

class ShareTemplates extends StatefulWidget {
  const ShareTemplates({super.key, required this.cover, required this.title, this.artist = ''});
  final String cover;
  final String title;
  final String artist;
  @override
  State<ShareTemplates> createState() => _ShareTemplatesState();
}

class _ShareTemplatesState extends State<ShareTemplates> {
  ShareKind kind = ShareKind.poster;

  String get _link => 'https://verzzify.com/listen/${Uri.encodeComponent(widget.title.toLowerCase().replaceAll(" ", "-"))}';
  String get _live => 'https://verzzify.com/live/${Uri.encodeComponent(widget.artist.toLowerCase().replaceAll(" ", "-"))}';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        fit: StackFit.expand,
        children: [
          MediaImg(widget.cover, cache: 200),
          BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 28, sigmaY: 28),
            child: const ColoredBox(color: Color(0xCC07010D)),
          ),
          SafeArea(
            child: Column(
              children: [
                Align(
                  alignment: Alignment.topRight,
                  child: IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close, size: 28)),
                ),
                const Spacer(),
                _preview(),
                const Spacer(),
                const Padding(
                  padding: EdgeInsets.fromLTRB(20, 0, 20, 8),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text('Choose Templates', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 20)),
                  ),
                ),
                SizedBox(
                  height: 108,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: [
                      _pick(ShareKind.poster, 'Default', Icons.crop_square),
                      _pick(ShareKind.circle, 'Vinyl', Icons.album),
                      _pick(ShareKind.story, 'Story', Icons.crop_portrait),
                      _pick(ShareKind.live, 'Live', Icons.wifi_tethering),
                      _pick(ShareKind.link, 'Copy link', Icons.link),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                  child: SizedBox(
                    width: double.infinity,
                    child: FilledButton(onPressed: _share, child: Text(kind == ShareKind.link || kind == ShareKind.live ? 'Copy link' : 'Share')),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _preview() {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 280),
      child: KeyedSubtree(key: ValueKey(kind), child: _cardFor(kind)),
    );
  }

  Widget _cardFor(ShareKind k) {
    switch (k) {
      case ShareKind.circle:
        return SizedBox(
          width: 268,
          height: 268,
          child: Stack(
            alignment: Alignment.center,
            children: [
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: [BoxShadow(color: accent.withValues(alpha: 0.45), blurRadius: 36, spreadRadius: 2)],
                  gradient: const RadialGradient(colors: [Color(0xFF2A1638), Color(0xFF050008)]),
                ),
              ),
              for (final r in [248.0, 220.0, 190.0, 162.0])
                Container(width: r, height: r, decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: Colors.white.withValues(alpha: 0.07)))),
              ClipOval(child: SizedBox(width: 118, height: 118, child: MediaImg(widget.cover, cache: 240))),
              Container(width: 16, height: 16, decoration: const BoxDecoration(shape: BoxShape.circle, color: bg)),
              const Positioned(bottom: 8, child: Text('VERZZIFY VINYL', style: TextStyle(fontFamily: 'Montserrat', fontSize: 10, letterSpacing: 2, fontWeight: FontWeight.w800, color: accent))),
            ],
          ),
        );
      case ShareKind.story:
        return Container(
          width: 210,
          height: 360,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: Colors.white.withValues(alpha: 0.16)),
            boxShadow: [BoxShadow(color: accent.withValues(alpha: 0.25), blurRadius: 28)],
          ),
          clipBehavior: Clip.antiAlias,
          child: Stack(
            fit: StackFit.expand,
            children: [
              MediaImg(widget.cover, cache: 560),
              const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color(0x6607010D), Colors.transparent, Color(0xF207010D)],
                  ),
                ),
              ),
              Positioned(top: 14, left: 14, right: 14, child: Row(children: [_logo(16), const SizedBox(width: 8), const Text('VERZZIFY', style: TextStyle(fontFamily: 'Montserrat', fontWeight: FontWeight.w800, letterSpacing: 1.4, fontSize: 11))])),
              Positioned(
                left: 12,
                right: 12,
                bottom: 14,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      color: const Color(0x66120818),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(widget.title, maxLines: 2, style: const TextStyle(fontFamily: 'Montserrat', fontWeight: FontWeight.w800, fontSize: 16, height: 1.1)),
                        Text(widget.artist, style: const TextStyle(color: muted, fontSize: 13)),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(color: accent, borderRadius: BorderRadius.circular(999)),
                          child: const Text('Play on VerzZify', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12)),
                        ),
                      ]),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      case ShareKind.live:
        return _frame(
          width: 270,
          height: 300,
          child: Stack(fit: StackFit.expand, children: [
            MediaImg(widget.cover, cache: 520),
            const DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0x55000000), Color(0xE607010D)]))),
            Positioned(left: 12, top: 12, child: _logo(18)),
            Positioned(
              right: 12,
              top: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(color: accent, borderRadius: BorderRadius.circular(8)),
                child: const Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.circle, size: 8, color: Colors.white),
                  SizedBox(width: 6),
                  Text('LIVE', style: TextStyle(fontFamily: 'Montserrat', fontWeight: FontWeight.w800, letterSpacing: 1)),
                ]),
              ),
            ),
            Positioned(
              left: 14,
              right: 14,
              bottom: 14,
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('JOIN ME', style: TextStyle(fontFamily: 'Montserrat', fontSize: 11, letterSpacing: 2, color: accent, fontWeight: FontWeight.w800)),
                Text(widget.artist.isEmpty ? widget.title : widget.artist, style: const TextStyle(fontFamily: 'Montserrat', fontWeight: FontWeight.w800, fontSize: 22, height: 1.05)),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(10),
                      color: const Color(0x66FFFFFF),
                      child: Row(children: [
                        const Icon(Icons.link, size: 16),
                        const SizedBox(width: 6),
                        Expanded(child: Text(_live, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700))),
                      ]),
                    ),
                  ),
                ),
              ]),
            ),
          ]),
        );
      case ShareKind.link:
        return ClipRRect(
          borderRadius: BorderRadius.circular(22),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
            child: Container(
              width: 300,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0x99120818),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: Colors.white.withValues(alpha: 0.16)),
              ),
              child: Column(children: [
                Row(children: [
                  ClipRRect(borderRadius: BorderRadius.circular(12), child: SizedBox(width: 72, height: 72, child: MediaImg(widget.cover, cache: 140))),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(widget.title, maxLines: 2, style: const TextStyle(fontFamily: 'Montserrat', fontWeight: FontWeight.w800, fontSize: 16, height: 1.1)),
                    Text(widget.artist, style: const TextStyle(color: muted, fontSize: 13)),
                  ])),
                ]),
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(color: const Color(0x33000000), borderRadius: BorderRadius.circular(12), border: Border.all(color: accent.withValues(alpha: 0.4))),
                  child: Row(children: [
                    const Icon(Icons.link, color: accent, size: 18),
                    const SizedBox(width: 8),
                    Expanded(child: Text(_link, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: accent, fontSize: 12, fontWeight: FontWeight.w700))),
                  ]),
                ),
                const SizedBox(height: 8),
                const Text('verzzify.com', style: TextStyle(fontFamily: 'Montserrat', letterSpacing: 1.5, fontSize: 10, color: muted, fontWeight: FontWeight.w800)),
              ]),
            ),
          ),
        );
      case ShareKind.poster:
        return _frame(
          width: 268,
          height: 268,
          child: Stack(fit: StackFit.expand, children: [
            MediaImg(widget.cover, cache: 540),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0x33000000), Color(0x9907010D)]),
              ),
            ),
            Positioned(left: 12, top: 12, child: _logo(20)),
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: ClipRRect(
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
                  child: Container(
                    padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
                    color: const Color(0x73120818),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const Text('NOW PLAYING', style: TextStyle(fontFamily: 'Montserrat', fontSize: 9, letterSpacing: 2, color: accent, fontWeight: FontWeight.w800)),
                      Text(widget.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontFamily: 'Montserrat', fontWeight: FontWeight.w800, fontSize: 18)),
                      Text(widget.artist, style: const TextStyle(color: muted, fontSize: 13)),
                    ]),
                  ),
                ),
              ),
            ),
          ]),
        );
    }
  }

  Widget _frame({required double width, required double height, required Widget child}) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        boxShadow: [BoxShadow(color: accent.withValues(alpha: 0.28), blurRadius: 28)],
        border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
      ),
      clipBehavior: Clip.antiAlias,
      child: child,
    );
  }

  Widget _logo(double r) {
    return CircleAvatar(
      radius: r,
      backgroundColor: const Color(0xFF1A1024),
      child: ClipOval(
        child: Image.asset(
          'assets/logo.png',
          width: r * 1.6,
          height: r * 1.6,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => const Text('V', style: TextStyle(fontWeight: FontWeight.w900)),
        ),
      ),
    );
  }

  Widget _pick(ShareKind k, String label, IconData icon) {
    final on = kind == k;
    return Padding(
      padding: const EdgeInsets.only(right: 14),
      child: InkWell(
        onTap: () => setState(() => kind = k),
        child: Column(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: on ? accent : Colors.white24, width: on ? 3 : 1),
                color: const Color(0xFF1A1024),
              ),
              clipBehavior: Clip.antiAlias,
              child: k == ShareKind.poster || k == ShareKind.circle
                  ? MediaImg(widget.cover, cache: 80)
                  : Icon(icon, color: on ? accent : Colors.white),
            ),
            const SizedBox(height: 6),
            Text(label, textAlign: TextAlign.center, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: on ? accent : muted)),
          ],
        ),
      ),
    );
  }

  Future<void> _share() async {
    final text = switch (kind) {
      ShareKind.live => 'LIVE on VerzZify — ${widget.artist.isEmpty ? widget.title : widget.artist}\n$_live',
      ShareKind.link => '${widget.title} — $_link',
      ShareKind.story => '${widget.title} by ${widget.artist} · Story card · $_link',
      ShareKind.circle => '${widget.title} · $_link',
      ShareKind.poster => '${widget.title} by ${widget.artist} on VerzZify\n$_link',
    };
    await Clipboard.setData(ClipboardData(text: text));
    if (!mounted) return;
    Navigator.pop(context);
    _toast(context, kind == ShareKind.link || kind == ShareKind.live ? 'Link copied' : 'Caption copied · ${kind.name} template');
  }
}

