# LUNETTE

Web app that helps people find sunglasses that fit their face — and helps designers/sellers promote and sell their frames.

## Features

- **Face fit** — scan (demo) → ranked matches
- **Discover** — search + filters; try-on without scanning
- **Local-first** — general entry shows studios in the user’s country first
- **Shop links** — `/studios/[slug]` opens that seller only
- **Seller tools** — promote workspace, list a frame, public studio page
- **Plans** — Free (max 6 products) and Pro (unlimited + boost)
- **Admin** — open seller pages (name/URL), access, tokens, site + seller look (`/admin`)
- **Branding** — admin sets site look; sellers edit their page colours/banner (`/seller/branding`)
- **Contact seller** — message flow to help buyers purchase

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Go live

See **[GO_LIVE.md](./GO_LIVE.md)** for domain, GitHub, Vercel, and next steps — written for a first website.

## Stack

- Next.js (App Router) + TypeScript
- Demo data in `src/lib/data.ts` (no database yet)
