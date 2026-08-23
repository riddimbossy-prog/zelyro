# Jamendo

Independent catalog with **legal stream + download** URLs. This is the only common third-party feed VerzZify may save into Downloads. It is **not** famous/label stars. Do not mix Jamendo rows into the YouTube “popular in your country” rail.

YouTube = listen to stars (official player, no file).  
Jamendo = independents you may keep when the artist allowed download.  
VerzZify uploads = our masters, always eligible for Downloads.

## Access

1. Register an app at [Jamendo Dev Portal](https://devportal.jamendo.com/).
2. Copy the **client id** (public; still treat it as env, not a Flutter/Vite `VITE_` secret if you later add a secret).
3. Set server env:

```bash
JAMENDO_CLIENT_ID=
```

Base URL: `https://api.jamendo.com/v3.0/`  
Auth: query `client_id`. JSON: `format=json`.

## Endpoints we use

| Need | Request |
| --- | --- |
| Popular / featured | `GET /tracks/?order=popularity_week&boost=popularity_week&limit=20&include=musicinfo+licenses+stats` |
| Search | `GET /tracks/?namesearch={q}&limit=12&include=licenses+stats` |
| Artist radio | `GET /tracks/?artist_name={name}&order=popularity_total` |
| Album | `GET /albums/` + `GET /tracks/?album_id=` |
| Playlists | `GET /playlists/` / `GET /playlists/tracks/` |

Useful query params: `offset`, `featured=true`, `fuzzytags` (mood), `audioformat=mp32`, `audiodlformat=mp32`.

## Playback vs download

Response fields that matter:

| Field | Use on VerzZify |
| --- | --- |
| `audio` | Stream in the **native** VerzZify player (`HTMLAudioElement` / just_audio). Not the YouTube embed. |
| `audiodownload` | File URL for Downloads. **Empty** unless allowed. |
| `audiodownload_allowed` | If `false`, hide Download. Stream only. |
| `image` / `album_image` | Cover |
| `licenses` (`include=licenses`) | Show CC / Jamendo license + attribution (artist name, track, license name) |

Default `audio` is a low-bitrate MP3. Prefer `audioformat=mp32` for listen, `audiodlformat=mp32` for save.

Do not proxy Jamendo files through S3 as if they were VerzZify masters. Save a copy **only** into the listener’s Downloads store (same IndexedDB path as hosted tracks), and only when `audiodownload_allowed` is true.

## Product rules

- Label the rail **Independents** / **Free to keep** — never “charts” or “stars.”
- Play through `usePlayer` (hosted audio path), not `useYtPlayer`.
- Skip / radio stays on that artist’s Jamendo tracks, not YouTube.
- Geo: Jamendo has no YouTube-style `regionCode`. Optional: `fuzzytags` or search by country name; do not fake a Nigeria chart from Jamendo.
- Attribution in now-playing and Downloads: `{artist} · {license}`.
- Commercial / in-app background: some tracks are Jamendo Pro only (`include=licenses`). If license is not a free CC download, stream if `audio` exists and do not offer save.

## Quota / errors

No published hard daily cap like YouTube’s 10,000 units. Still cache popular lists (~20 min, same idea as `yt-charts` TTL). On 4xx/5xx, show the rail empty — do not fall back to YouTube results in the same list.

## Mapping

```
Jamendo track id  →  verzzify id prefix  jm_{id}
audio             →  TrackCard.audioUrl
audiodownload     →  Downloads blob (if allowed)
image             →  coverUrl
artist_name       →  artistName
license           →  distribution free_download | free_stream
```

`distribution = free_download` only when `audiodownload_allowed`.

## Out of scope

- YouTube-to-Jamendo matching
- Treating Jamendo popularity as Billboard / YouTube mostPopular
- Replacing the YouTube Home feed
