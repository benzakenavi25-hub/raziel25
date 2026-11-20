# Listing microsite template

One property per page, built from data. Plain HTML/CSS/JS. GSAP, ScrollTrigger and Lenis load from a CDN.

```
template/              page.html, styles.css, main.js, favicon.svg  (shared)
listings/<slug>/       data.json + photos/ (+ optional plans/*.pdf, staging/*.jpg)
build.mjs              node build.mjs <slug>  →  index.html, accessibility.html, privacy.html, assets/, og.jpg at the repo root
```

## The next listing in 5 steps

1. **Copy** `listings/raziel-25` to `listings/<new-slug>`.
2. **Inputs:**
   - `photos/` — the agent's photos. Any file names: a photo is referenced by the number at the end of its name (`<anything>-12.JPG` or `<anything> 12.jpg`), or by its exact file name.
   - `plans/` *(optional)* — one PDF per floor. Each floor in `data.json` names its PDF (`"plan": "כניסה"` matches any PDF whose name contains that word). `planCrop` = `[left, top, width, height]` as fractions of the page, cutting away the title block and border; the build trims the rest.
   - `staging/` *(optional)* — the real empty photo plus ready-made furnishing visualizations of the same frame. The build resizes the visualizations to the photo's exact size.
3. **Edit `data.json`:**
   - **`theme`**: `"light"` (stone ground, drafting-grid motif, one dark walnut section for the numbers) or `"dark"` (tree-rings motif, light numbers section).
   - **`intro`**: `"door"` (front door with the house number `houseNumber`, swings open) · `"elevator"` (floor counter up to `floor`, doors part — for apartments) · `"none"`.
   - Texts, `meta`, `price`, `priceLine`, `facts`, `extras`, `agents` (one or more; `visit.whatsappTo` picks who gets the visit messages), `labels` + `menu` + `menuOrder`.
   - **Optional sections** — leave them out and they don't render:
     - `floors` + `planTitle` → **THE PLAN** (pinned, floor by floor; each floor: `plan`, `rooms`, `photo`).
     - `staging` → **IMAGINE** (before/after slider with style chips; skipped automatically if any of its files is missing).
     - `story`, `location`, `visit`.
   - Photos: `photos.hero`, `photos.signature`, `photos.location`, `story[i].photo`, `floors[i].photo`, and `gallery: [{ "photo": 27, "latin": "LIVING", "he": "הסלון" }, …]` in display order. Add `focus` (CSS object-position) where a crop matters and a short Hebrew `alt` for every photo used. `"price": null` removes the price section.
4. **Build:** `npm install` (once: sharp + pdf-to-png-converter), then `node build.mjs <new-slug>`.
5. **Publish:** commit + push (GitHub Pages serves the repo root). Paste the link into a WhatsApp chat to check the preview card (title, price line, photo).

## Rules the build keeps

- Real photos only. The build only corrects white balance, applies one shared subtle grade, resizes (Lanczos) and lightly sharpens the full-screen photos. No generative edits.
- The only AI images allowed are the staging visualizations: always next to the real photo, always labeled `הדמיה · הריהוט אינו כלול`.
- Floor plans are rendered from the PDFs as they are (darkness → alpha, painted in the accent colour). Nothing is redrawn.
- Every photo is exported as WebP at 1000 and 2000 px. `og.jpg` is a 1200×630 crop of the hero.
- `indexable: false` adds `noindex`. Set `url` in `data.json` to the live address: the OG image needs an absolute URL.
- Analytics: GoatCounter (no cookies) is on by default for every listing. Click events: `wa-<agent>`, `call-<agent>` (agent `slug` in data.json), `slot-<n>`, `style-a/b/real`, `plan-<room id>` (`floors[i].spots[k].id`), `gallery-open`. `"goatcounter": false` turns it off; a URL overrides the endpoint. The privacy page mentions it automatically.
