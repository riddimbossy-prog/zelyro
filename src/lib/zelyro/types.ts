export type TrackCard = {
  id: string;
  title: string;
  coverUrl: string;
  audioUrl: string;
  durationMs: number;
  genre: string | null;
  distribution: string;
  priceCents: number;
  currency: string;
  playCount: number;
  likeCount: number;
  albumId: string | null;
  albumTitle: string | null;
  lyrics: string | null;
  explicit: boolean;
  featuredArtists: string | null;
  producer: string | null;
  songwriter: string | null;
  copyrightOwner: string | null;
  country: string | null;
  artistId: string;
  artistName: string;
  artistSlug: string;
  artistAvatar: string | null;
  verified: boolean;
  liked?: boolean;
  purchased?: boolean;
};

export type ArtistCard = {
  id: string;
  slug: string;
  name: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  country: string | null;
  city: string | null;
  bio: string | null;
  genres: string | null;
  verified: boolean;
  monthlyListeners: number;
  followers: number;
  role: string;
};

export type AlbumCard = {
  id: string;
  title: string;
  coverUrl: string;
  albumType: string;
  artistId: string;
  artistName: string;
  artistSlug: string;
  priceCents: number;
  currency: string;
  releaseDate: string | null;
};

export type PlaylistCard = {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  kind: string;
};

export type EventCard = {
  id: string;
  title: string;
  posterUrl: string;
  venue: string | null;
  city: string | null;
  country: string | null;
  startsAt: string;
  description: string | null;
  organizerName: string;
};

export type TicketType = {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  capacity: number;
  sold: number;
};

export type LiveCard = {
  id: string;
  title: string;
  posterUrl: string;
  startsAt: string;
  priceCents: number;
  isFree: boolean;
  artistName: string;
  artistSlug: string;
  status: string;
};

export type PostCard = {
  id: string;
  body: string;
  imageUrl: string | null;
  likeCount: number;
  createdAt: string;
  authorName: string;
  authorSlug: string;
  authorAvatar: string | null;
  track: TrackCard | null;
};

export type WalletSnapshot = {
  availableCents: number;
  pendingCents: number;
  lifetimeCents: number;
  currency: string;
};

export type LedgerRow = {
  id: string;
  amountCents: number;
  direction: string;
  kind: string;
  available: boolean;
  createdAt: string;
  meta: string | null;
};

export type AccountRole = "fan" | "artist" | "producer" | "organizer" | "admin" | "super_admin";

export const ACCOUNT_ROLES: AccountRole[] = [
  "fan",
  "artist",
  "producer",
  "organizer",
  "admin",
  "super_admin",
];

export type ExternalProvider =
  | "youtube"
  | "spotify"
  | "apple_music"
  | "audiomack"
  | "soundcloud"
  | "boomplay"
  | "other";

export type CampaignStatus =
  | "draft"
  | "pending_review"
  | "scheduled"
  | "active"
  | "paused"
  | "completed"
  | "rejected";

export type CampaignContentType = "youtube" | "song" | "album" | "event" | "livestream";

export type YouTubeVideo = {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelName: string;
  channelId: string | null;
  channelUrl: string | null;
  publishedAt: string | null;
  description: string | null;
  durationSeconds: number | null;
  embeddable: boolean;
  url: string;
  viewCount: number | null;
  likeCount: number | null;
  source: "youtube";
};

export type YouTubePromotion = {
  campaignId: string;
  campaignName: string;
  description: string | null;
  status: CampaignStatus;
  contentType: CampaignContentType;
  genre: string | null;
  country: string | null;
  featured: boolean;
  budgetCents: number;
  spentCents: number;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  impressions: number;
  clicks: number;
  video: YouTubeVideo;
  zelyroArtistId: string;
  zelyroArtistName: string;
  zelyroArtistSlug: string;
  zelyroArtistAvatar: string | null;
  linkId: string;
  saved?: boolean;
};

export type CampaignAnalytics = {
  impressions: number;
  uniqueImpressions: number;
  clicks: number;
  playsInitiated: number;
  profileVisits: number;
  shares: number;
  saves: number;
  followersGained: number;
  ctr: number;
  spentCents: number;
  remainingCents: number;
  youtubeViews: number | null;
  youtubeViewsNote: string;
};

export type StudioPlace = {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  kind: string;
  description: string | null;
};

export type ProducerCard = {
  id: string;
  slug: string;
  name: string;
  avatarUrl: string | null;
  city: string | null;
  country: string | null;
  title: string | null;
  services: string | null;
  available: boolean;
};

export type YoutubeConnection = {
  channelId: string;
  channelUrl: string;
  channelName: string;
  avatarUrl: string | null;
  subscriberCount: number | null;
};
