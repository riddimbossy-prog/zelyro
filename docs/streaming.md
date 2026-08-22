# Streaming

HTML audio / ExoPlayer / AVPlayer against a signed stream URL. Meaningful streams (≥30s) increment `play_count` via `stream_events`. Rapid repeats, bots, and identical device bursts are not monetizable. Player persists across routes; lock-screen and Bluetooth use Media Session / platform controls.

**Sources**

- VerzZify masters → signed S3 / local stream → native player → Downloads allowed per license.
- YouTube → official embed in VerzZify chrome only. Never a file. See [youtube.md](youtube.md).
- Jamendo independents → `audio` URL in the native player; Downloads only when `audiodownload_allowed`. See [jamendo.md](jamendo.md).

