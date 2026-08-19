# Streaming

HTML audio / ExoPlayer / AVPlayer against a signed stream URL. Meaningful streams (≥30s) increment `play_count` via `stream_events`. Rapid repeats, bots, and identical device bursts are not monetizable. Player persists across routes; lock-screen and Bluetooth use Media Session / platform controls.
