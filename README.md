# Trip Time — Viaje mamás

Dashboard with countdowns to each traveler's flights (departure, arrival and total to Australia), live flight status from AeroDataBox, a rotating photo collage and dark/light theme.

**Live:** https://viaje-mamas.vercel.app

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

| Variable | Description |
| --- | --- |
| `AERODATABOX_API_KEY` | RapidAPI key for AeroDataBox (server only, never exposed to the browser). |
| `TRACKING_MOCK` | `true` uses fake flight statuses (no API calls, no quota). `false` uses the real API. |

Other commands: `npm run build` (production build + type-check), `npm run lint`.

## Updating content

- **Flights:** edit `data/trips.ts` (ISO dates with explicit offset, local time of each airport).
- **Photos:** add or remove images in `public/collage/` (any file name; `.jpg .jpeg .png .webp .avif`).

## Deploy

Hosted on **Vercel**, connected to this GitHub repo.

- Every push to `master` deploys to production automatically (~1–2 min).
- Every branch / pull request gets its own preview URL.
- Live flight statuses refresh on their own (each flight is queried at most every 30 min, only from 6 h before departure to 2 h after arrival).

Environment variables in Vercel (Settings → Environment Variables):

| Variable | Production | Preview |
| --- | --- | --- |
| `AERODATABOX_API_KEY` | real key | — |
| `TRACKING_MOCK` | `false` | `true` |

## Specs

Features are defined in `specs/` and implemented one per branch (`spec-NN-slug`).
