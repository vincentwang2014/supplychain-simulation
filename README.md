# Supply Chain Simulation

A configurable Beer Game style supply chain simulator with:

- demand shock playground
- bullwhip analysis
- adjustable node strategies
- save/load in browser
- JSON import/export
- visual linear chain builder

This repo is currently set up to deploy as a **static site** with no backend required.

## Production Entry

Use [`index.html`](C:/Users/vince/Documents/Codex/2026-04-24/i-want-a-turn-based-supply/index.html) as the canonical app entry.

The older `preview*.html` files are development snapshots and compatibility entry points. They are no longer the primary production URL.

## Local Preview

If you want to serve the static site locally without `npm`, you can use Python:

```powershell
& 'C:\Users\vince\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m http.server 8000
```

Then open:

- [http://localhost:8000/index.html](http://localhost:8000/index.html)

## Deploy Online

### Option 1: Netlify

This is the easiest option for the current static build.

1. Push this repo to GitHub.
2. In Netlify, create a new site from that GitHub repo.
3. Use these settings:

```text
Build command: leave blank
Publish directory: .
```

4. Deploy.

This repo already includes [`netlify.toml`](C:/Users/vince/Documents/Codex/2026-04-24/i-want-a-turn-based-supply/netlify.toml) and [`_headers`](C:/Users/vince/Documents/Codex/2026-04-24/i-want-a-turn-based-supply/_headers) for cache behavior.

Useful docs:

- [Netlify create deploys](https://docs.netlify.com/site-deploys/create-deploys/)
- [Netlify deploy overview](https://docs.netlify.com/deploy/deploy-overview)
- [Netlify deploy previews](https://docs.netlify.com/deploy/deploy-types/deploy-previews/)

### Option 2: Cloudflare Pages

Also a strong fit for this app.

1. Push this repo to GitHub.
2. In Cloudflare Pages, create a new Pages project from that repo.
3. Use these settings:

```text
Framework preset: None
Build command: leave blank
Build output directory: .
```

4. Deploy.

Useful docs:

- [Cloudflare Pages overview](https://developers.cloudflare.com/pages/)
- [Cloudflare Pages preview deployments](https://developers.cloudflare.com/pages/configuration/preview-deployments/)

## What Persists Today

The app currently supports two kinds of persistence:

- local browser saves via `localStorage`
- JSON downloads for scenarios and runs

That means:

- saved simulations stay in the same browser on the same device
- downloaded JSON files can be shared manually
- there is no shared cloud database yet

## What To Add For A True Multi-User Product

If you want others to save and reopen simulations across devices, the next step is a backend such as Supabase or Firebase.

Recommended future upgrades:

1. Cloud saves for scenarios and runs
2. Public scenario gallery
3. Auth for teachers or teams
4. Shareable scenario URLs
5. Optional classroom or comparison sessions

## Deployment Notes

- Root publish directory is the repository root.
- Main app URL should point to `index.html`.
- Because this app uses browser-side modules directly, cache headers matter. The included static host config reduces stale asset issues.
- If you later migrate back to a bundled React/Vite build, update the publish directory and deployment instructions accordingly.

## Verification

Core simulation tests can be run with:

```powershell
& 'C:\Users\vince\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tests/run-tests.js
```
