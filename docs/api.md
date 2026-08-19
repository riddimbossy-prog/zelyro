# API

Base: `/api/v1`. Errors:

```json
{ "success": false, "code": "TRACK_NOT_FOUND", "message": "The requested track could not be found." }
```

Modules match backend folders in the architecture doc. This web app currently uses TanStack `createServerFn` as the API surface with the same rules (auth middleware, server-side prices).

YouTube: `YouTubeService` and `YouTubePromotionService` (validate URL, create campaign, impressions, clicks, analytics). Never accept a client-supplied view count.

