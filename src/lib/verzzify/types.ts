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

export type MackProfileData = {
  id: string;
  username: string;
  displayName: string;
  role: string;
  country: string | null;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  city: string | null;
  favoriteGenres: string | null;
  verified: boolean;
  genres: string | null;
  monthlyListeners: number;
  followers: number;
  followingCount: number;
  totalPlays: number;
  socials: string | null;
  tracks: TrackCard[];
  albums: AlbumCard[];
  liked: TrackCard[];
  playlists: PlaylistCard[];
  following: ArtistCard[];
  suggested?: ArtistCard[];
  posts: PostCard[];
  chartRanks: Record<string, number>;
  live: LiveCard[];
  videoCall: { priceCents: number; durationMin: number; available: boolean } | null;
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

export type YtArtistCard = {
  channelId: string;
  channelName: string;
  avatarUrl: string | null;
  channelUrl: string | null;
  sampleVideoId: string;
};

export type YtPlaylistCard = {
  id: string;
  title: string;
  subtitle: string;
  thumbnailUrl: string;
  videos: YouTubeVideo[];
};

export type NearbyScene = {
  region: string;
  regionName: string;
  videos: YouTubeVideo[];
  artists: YtArtistCard[];
};

export type CampaignStatus =
  | "draft"
  | "pending"
  | "pending_review"
  | "active"
  | "paused"
  | "completed"
  | "rejected";

export type CampaignContentType =
  | "youtube"
  | "song"
  | "album"
  | "event"
  | "livestream";

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
  verzzifyArtistId: string;
  verzzifyArtistName: string;
  verzzifyArtistSlug: string;
  verzzifyArtistAvatar: string | null;
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

export type YoutubeConnection = {
  channelId: string;
  channelUrl: string;
  channelName: string;
  avatarUrl: string | null;
  subscriberCount: number | null;
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

export type StudioPlace = {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  kind: string;
  description: string | null;
};

export type ChartDelta = "up" | "down" | "same" | "new";

export type ChartTrackEntry = {
  rank: number;
  previousRank: number | null;
  delta: number | null;
  movement: ChartDelta;
  points: number;
  sales: number;
  peak: number;
  weeksOn: number;
  gainer: boolean;
  track: TrackCard;
};

export type ChartArtistEntry = {
  rank: number;
  previousRank: number | null;
  delta: number | null;
  movement: ChartDelta;
  points: number;
  peak: number;
  weeksOn: number;
  artist: ArtistCard;
};

export type ChartBoard = {
  kind: "tracks" | "artists";
  scope: string;
  genre: string | null;
  title: string;
  subtitle: string;
  updatedLabel: string;
  tracks: ChartTrackEntry[];
  artists: ChartArtistEntry[];
  countries: { id: string; label: string }[];
  genres: { id: string; label: string }[];
};
