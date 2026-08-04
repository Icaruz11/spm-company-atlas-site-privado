# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Static marketing landing page (pt-BR) for **SPM Company / Protocolo ATLAS**, targeting health professionals. Pure HTML/CSS/vanilla JS — no framework, no bundler, no `package.json`. Deployed to **Vercel** (config in `vercel.json`); lead capture is handled by a separate **Google Apps Script + Google Sheets** backend (`apps-script/Code.gs`).

## Commands

There is no build/lint/test tooling. Useful checks:

- Validate a JS file parses: `node --check assets/js/<file>.js`
- Preview locally: serve the repo root with any static file server (e.g. `npx serve .` or `python3 -m http.server`) — opening `index.html` directly via `file://` will break absolute paths (`/assets/...`) and the CSP.
- The Apps Script backend (`apps-script/Code.gs`) is deployed independently via the Google Apps Script editor/CLI (clasp), not via Vercel.

## Architecture

### Pages
- `index.html` — the homepage/sales page. Sections (anchors used for nav + CTAs): `#protocolo` (hero), `#sintomas`, `#como-funciona`, `#casos`, `#diagnostico` (lead form), `#servicos`, `#sobre-fundador`, `#faq`. Keep nav links, CTA hrefs, and section ids in sync — broken anchors are a recurring issue flagged in `docs/superpowers/plans/`.
- `obrigado/index.html`, `politica-de-privacidade/index.html`, `termos-de-uso/index.html`, `404.html` — share the same header/footer shell and `assets/css/styles.css`. `404.html` and legal pages set `data-page="legal"` and `<meta name="robots" content="noindex, nofollow">`.
- `sitemap.xml` / `robots.txt` — must stay in sync with the public page list above.

### Shared JS layer (`assets/js/`, loaded via `defer` in this order: config → tracking → main → form)
- **`config.js`** — defines the global `window.SPM_CONFIG` object (brand name, site URL, `appsScriptUrl`, `pixelId`, `whatsappUrl`, `instagramUrl`, localStorage keys). All other scripts read from this object; this is the single place to update real endpoints/IDs for production.
- **`main.js`** — generic page behavior: header scroll state, mobile nav toggle, scroll-reveal via `IntersectionObserver` (`[data-reveal]`), smooth-scroll anchors, and resolving WhatsApp/Instagram links from config (falls back to `#diagnostico` / a default Instagram URL if config still has placeholder `SEU_*` values).
- **`pixel.js`** — loads the Meta Pixel **unconditionally** on every page (no consent gate, by business decision): `fbq("init")` + `PageView` on load, plus `ViewContent` (home, when `data-track-view-content="true"`) and `CompleteRegistration` (thank-you pages, when `data-track-complete-registration="true"`) driven by `data-*` attributes on `<body>`. Loaded on all pages including legal/404.
- **`tracking.js`** — thin layer over the always-on pixel. Exposes `window.SPMTracker` (`track`, `setConsent`, `getConsent`). `track()` fires `fbq` events whenever the pixel exists (used for `Lead` on form success). It never disables the pixel; the cookie banner (`[data-cookie-banner]`) stays in the markup but is not shown and does not gate tracking.
- **`form.js`** — drives the lead form (`[data-lead-form]` in `#diagnostico`). Handles: tracking-param capture/restore (UTM, fbclid, gclid via `localStorage`), draft autosave/restore (`spm_form_draft`), honeypot field (`name="website"`), and submission. If `appsScriptUrl` (or `data-endpoint`) is a real URL (not containing `COLE_AQUI`/`SEU_`), it POSTs to the Apps Script web app as `application/x-www-form-urlencoded`; otherwise it runs in "preview" mode (saves to `spm_last_lead`, no network call). On success it redirects to `/obrigado/`.

### Lead form fields
Form field `name` attributes must match the columns expected by `apps-script/Code.gs` (`HEADERS`/row order in `doPost`): `nome`, `email`, `whatsapp`, `empresa`, `segmento`, `faturamento`, `instagram`, plus tracking fields (`event_id`, `fbp`, `fbc`, `utm_*`, `fbclid`, `gclid`, `page_url`, `referrer`, `user_agent`) and the `website` honeypot. The form no longer collects `consentimento` — `Code.gs` still has the "Consentimento LGPD" column, so it is simply written empty (kept for backward compatibility with existing sheets). If you add/rename a form field, update both `index.html` and `apps-script/Code.gs` (`HEADERS` array and the `row` array in `doPost`) together.

### Styling (`assets/css/styles.css`)
Single stylesheet. Design tokens are CSS custom properties on `:root` (brand colors `--spm-blue`/`--spm-blue-2`/`--spm-gray`, dark navy surfaces `--navy-*`, accent `--cyan`/`--violet`, typography via `--font-body`/`--font-heading` using the bundled "Metropolis" font family in `assets/fonts/`). `color-scheme: dark` — the site is dark-themed by design. 5 `@media` breakpoints handle responsive layout.

### Vercel config (`vercel.json`)
- `trailingSlash: true` — internal links to subpages must end with `/` (e.g. `/obrigado/`).
- A strict `Content-Security-Policy` header whitelists exactly the external origins in use (`script.google.com`/`script.googleusercontent.com` for Apps Script, `connect.facebook.net` for the Meta Pixel, `youtube.com`/`youtube-nocookie.com` for embeds). **Any new external script/iframe/font/connection must be added here or it will be silently blocked by the browser.**

### Agent skills
`.agents/skills/` contains Claude Code skills pulled per `skills-lock.json` (`copywriting`, `frontend-design`, `gpt-image-2`, `ui-ux-pro-max`) — relevant when writing page copy or building/styling new sections.

### Planning docs
`docs/superpowers/plans/*.md` contain prior implementation plans (redesign + production go-live checklist). They reference an old local Windows path (`C:\Users\Icaruz\...\SITE SPM 2`) — treat file paths in those docs as relative to this repo root instead, and check off/update items there when completing related work described in them.
