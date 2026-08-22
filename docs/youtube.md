# YouTube

Official Data API + oEmbed only. Playback is the official YouTube player (`youtube-nocookie.com` embed or the watch URL). No download, extraction, or storage of YouTube media unless the platform has an explicit, licensed right — which search results never grant.

## YouTubeService

`searchVideos`, `searchMusic`, `searchArtists`, `getVideoDetails`, `getChannelDetails`, `getRelatedVideos`, `getPlaylistDetails`, `validateYouTubeUrl`, `extractVideoId`, `getVideoThumbnail`, `getPublicVideoStats`.

Creators paste `youtube.com/watch?v=…` or `youtu.be/…`. Metadata (title, thumbnail, channel) is retrieved — never typed in by hand when the API can provide it.

## YouTubePromotionService

`createPromotion`, `validatePromotion`, `activatePromotion`, `pausePromotion`, `recordImpression`, `recordClick`, `recordPlaybackOpen`, `getCampaignAnalytics`.

## Metrics

VerzZify reports VerzZify impressions, clicks, and playback opens. **Do not** display those as YouTube views. Official YouTube statistics appear only when the Data API returns them.

## Product

Discovery + search + playback + sharing + artist promotion + traffic to legitimate YouTube content. UI and database keep VerzZify-hosted songs distinguishable from YouTube-hosted videos.
