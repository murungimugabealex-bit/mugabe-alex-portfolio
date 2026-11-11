# Murungi Alex Mugabe — Personal Website

My personal portfolio and contact site. Static HTML, CSS and vanilla JavaScript, hosted on
Cloudflare Pages with a serverless contact form (Cloudflare Pages Functions + Resend).

## Structure

```
public/               # Everything that gets deployed
  index.html
  css/styles.css
  js/app.js
  assets/
  404.html
  robots.txt
  _headers            # Security headers for Cloudflare Pages
functions/
  api/contact.js      # POST /api/contact — sends mail through Resend
screenshots/          # Dev screenshots (not deployed)
wrangler.toml         # Cloudflare Pages config
```

## Run locally

Plain static preview (contact form won't send):

```powershell
npx serve public
```

Full preview with the contact function:

```powershell
Copy-Item .dev.vars.example .dev.vars   # then paste your Resend key
npx wrangler pages dev public
```

## Contact form setup (Resend)

1. Create a free account at <https://resend.com> and generate an API key.
2. The key is only needed server-side — never put it in `public/`.
3. For local dev, put it in `.dev.vars` (git-ignored).
4. For production, add it as a Cloudflare Pages environment variable/secret named
   `RESEND_API_KEY`.

Until the key is set, the form returns a friendly error and offers WhatsApp instead.

> Note: with the default `onboarding@resend.dev` sender, Resend only delivers to the email
> address on the Resend account. That's fine for this site. To send from a custom domain later,
> verify the domain in Resend and update `FROM` in `functions/api/contact.js`.

## Deploy to Cloudflare Pages

### Option A — Wrangler (fastest)

```powershell
npx wrangler login
npx wrangler pages project create mugabe-alex-portfolio --production-branch main
npx wrangler pages deploy public
```

Then add the secret:

```powershell
npx wrangler pages secret put RESEND_API_KEY --project-name mugabe-alex-portfolio
```

The site will be live at `https://mugabe-alex-portfolio.pages.dev`.

### Option B — Git integration

1. Push this repo to GitHub.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**.
3. Framework preset: **None**. Build command: leave empty. Build output directory: `public`.
4. Add `RESEND_API_KEY` under **Settings → Environment variables** (as a secret), then redeploy.

## Custom domain later

In the Pages project, open **Custom domains → Set up a domain**, enter the domain, and follow
the DNS instructions. Update the `<meta property="og:*">` URLs and add a `sitemap.xml` once the
final domain is known.

## Editing content

All copy lives in `public/index.html`. Colours, spacing and type are tokens at the top of
`public/css/styles.css`. Site behaviour (nav, scroll-spy, form) is in `public/js/app.js`.

To change the hero photo, replace `public/assets/portrait.jpg` (keep roughly the same aspect
ratio) and update the `width`/`height` attributes on the hero `<img>` if the dimensions change.
