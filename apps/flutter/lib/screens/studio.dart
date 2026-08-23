import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme.dart';
import '../widgets.dart';

class StudioScreen extends StatefulWidget {
  const StudioScreen({super.key});
  @override
  State<StudioScreen> createState() => _StudioScreenState();
}

class _StudioScreenState extends State<StudioScreen> {
  bool online = false;

  static const tiles = [
    ('/studio/upload', Icons.library_music_rounded, 'Upload Songs'),
    ('/studio/youtube', Icons.smart_display_outlined, 'Youtube Link'),
    ('/studio/live', Icons.wifi_tethering_rounded, 'Live Stream'),
    ('/studio/ticket', Icons.confirmation_number_outlined, 'Create Ticket'),
    ('/studio/album', Icons.album_outlined, 'Create Album'),
    ('/studio/playlist', Icons.queue_music_rounded, 'Create Playlist'),
    ('/video/demo-room', Icons.videocam_outlined, '1-1 Video Chat'),
    ('/studio/history', Icons.history_rounded, 'Video Chat History'),
  ];

  @override
  Widget build(BuildContext context) {
    final cols = MediaQuery.sizeOf(context).width > 700 ? 4 : 2;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        Text('Your Creator Studio', style: Theme.of(context).textTheme.headlineLarge),
        const SizedBox(height: 12),
        Glass(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            children: [
              const Expanded(child: Text('Your Available Status', style: TextStyle(fontWeight: FontWeight.w800))),
              GestureDetector(
                onTap: () => setState(() => online = !online),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: online ? accent : const Color(0xFF2A1638),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(online ? 'Online' : 'Offline', style: const TextStyle(fontWeight: FontWeight.w800)),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: cols,
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 2.1,
          children: [
            for (final t in tiles)
              InkWell(
                onTap: () => context.push(t.$1),
                child: Glass(
                  radius: 16,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  child: Row(
                    children: [
                      CircleAvatar(radius: 16, backgroundColor: const Color(0x33C026D3), child: Icon(t.$2, color: accent, size: 18)),
                      const SizedBox(width: 8),
                      Expanded(child: Text(t.$3, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14))),
                    ],
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 16),
        TextButton.icon(onPressed: () => context.push('/studio/wallet'), icon: const Icon(Icons.account_balance_wallet_outlined), label: const Text('Wallet')),
      ],
    );
  }
}
