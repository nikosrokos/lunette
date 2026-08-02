# LUNETTE — Go live guide (first website)

This app is a **working web MVP** with demo data (no real payments, camera ML, or email yet). Follow these steps to put it on the internet with your own domain.

---

## What you have

| Piece | Status |
|-------|--------|
| Web app (Next.js) | Ready in this repo |
| Buyer: face fit, search/filters, try-on, contact seller | Demo UI |
| Seller: studio page, promote, list a frame | Demo UI |
| Seller plans Free / Pro (Free = max 6 products) | Demo UI |
| Admin: spaces, access, Free/Pro tokens | Demo UI (`/admin`, PIN `lunette-admin`) |
| Admin opens seller pages (name + URL) | Demo UI |
| Admin/seller branding (colours, banners) | Demo UI (`/admin`, `/seller/branding`) |
| Shop link vs local-first marketplace | Implemented |
| Real camera face scan / payments / email | Not yet — see “Later” |

---

## Step 1 — Create a GitHub repository

1. Create a free account at [github.com](https://github.com) if you don’t have one.
2. Click **New repository**.
3. Name it e.g. `lunette` (public or private).
4. **Do not** add a README if you will push this existing project.
5. On your computer (or in Cursor), connect and push:

```bash
cd /path/to/lunette
git init
git add .
git commit -m "Initial LUNETTE web MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/lunette.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 2 — Deploy for free (recommended: Vercel)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. **Add New Project** → import the `lunette` repo.
3. Leave defaults (Framework: Next.js). Click **Deploy**.
4. After 1–2 minutes you get a URL like:

`https://lunette-xxxx.vercel.app`

That is your first live site. Share it to test.

---

## Step 3 — Buy a domain (your real URL)

Pick a short name, for example:

- `lunette.app`
- `getlunette.com`
- `lunettefit.com`

Buy from:

- [Namecheap](https://www.namecheap.com)
- [Google Domains / Squarespace Domains](https://domains.squarespace.com)
- [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/)
- Or buy **inside Vercel**: Project → Settings → Domains → Buy

**Typical cost:** ~$10–20 / year for `.com` (varies by extension).

---

## Step 4 — Connect the domain to Vercel

1. In Vercel → your project → **Settings** → **Domains**.
2. Add `yourdomain.com` and `www.yourdomain.com`.
3. Vercel shows DNS records. In your domain registrar, add them (usually):

| Type | Name | Value |
|------|------|--------|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

(Use the exact values Vercel shows — they can change.)

4. Wait for DNS (often 5–60 minutes, sometimes up to 24h).
5. Visit `https://yourdomain.com` — you should see LUNETTE.

---

## Step 5 — Useful URLs once live

| Page | URL |
|------|-----|
| Home | `https://yourdomain.com/` |
| Discover (local shops first) | `/discover` |
| Face fit | `/fit` |
| All studios | `/studios` |
| Direct shop link (share this) | `/studios/atelier-maren` |
| Seller promote | `/seller/promote` |
| List a frame | `/seller/frames/new` |

Sellers promote with links like:

`https://yourdomain.com/studios/atelier-maren`

Buyers with that link see **only that shop**.

---

## Step 6 — What you need (checklist)

### Must-have to go live (MVP demo)
- [ ] GitHub account
- [ ] Vercel account (free)
- [ ] This repo pushed to GitHub
- [ ] Deploy on Vercel
- [ ] (Optional but recommended) Custom domain

### Nice-to-have soon
- [ ] Business email (e.g. Google Workspace or improvmx + your domain)
- [ ] Privacy policy + terms pages (required if you collect emails)
- [ ] Logo / real product photos from sellers
- [ ] Analytics (Vercel Analytics or Plausible)

### Later (to make it a real product)
- [ ] **Auth** — seller login (Clerk, Auth.js, or Supabase Auth)
- [ ] **Database** — store studios, frames, messages (Supabase, Neon, or PlanetScale)
- [ ] **File uploads** — frame photos (Uploadthing, Cloudinary, or S3)
- [ ] **Email** — contact seller messages (Resend or Postmark)
- [ ] **Face scan** — real measurements (camera + on-device model or a vendor API)
- [ ] **Payments** (optional) — Stripe if you take commission or sell directly
- [ ] **Country detection** — IP geolocation (Vercel headers / Cloudflare) instead of manual select
- [ ] **Legal** — GDPR/cookie notice if you have EU users

---

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

---

## Suggested order for a first-time founder

1. Deploy the demo on Vercel (today).
2. Buy a domain and connect it.
3. Show the site to 2–3 sunglasses sellers; collect real photos + measurements.
4. Add email contact (Resend) so “Contact seller” actually sends.
5. Add seller accounts + database before marketing widely.
6. Then invest in real face scanning.

---

## Support notes

- This MVP uses **demo data** in `src/lib/data.ts` — edit that file to change studios/frames.
- Country defaults to **France**; users can change it in the header.
- Face fit is **simulated** (always returns a demo oval / medium / wide profile).
