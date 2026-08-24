import { rapidKey, rapidSearch } from "./rapid-yt";
// RESTORE IN PROGRESS - see next commit
export function extractVideoId(input: string): string | null { return null; }
export function youtubeWatchUrl(videoId: string): string { return `https://www.youtube.com/watch?v=${videoId}`; }
export function youtubeEmbedUrl(videoId: string, autoplay = false): string { return `https://www.youtube-nocookie.com/embed/${videoId}`; }
export function getVideoThumbnail(videoId: string): string { return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`; }
export async function getVideoDetails() { return null; }
export async function getPublicVideoStats() { return { viewCount: null, likeCount: null, official: false }; }
export async function validateYouTubeUrl() { return { ok: false }; }
export async function getChannelDetails() { return null; }
export async function searchVideos() { return []; }
export async function searchMusic() { return []; }
export async function searchArtists() { return []; }
export async function getRelatedVideos() { return []; }
export async function getPlaylistDetails() { return null; }
export function youtubeVideoToTrack(v: any) { return v; }
export const LOCAL_YOUTUBE_CATALOG = [];
export const YouTubeService = {};
