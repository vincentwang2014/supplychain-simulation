# Deployment Playbook

This project is ready to deploy as a static site.

Canonical entry:

- [`index.html`](C:/Users/vince/Documents/Codex/2026-04-24/i-want-a-turn-based-supply/index.html)

Recommended host:

- Netlify for the easiest first public deploy
- Cloudflare Pages as a strong alternative

## What is already prepared

- static root entry at `index.html`
- cache-control config via [`netlify.toml`](C:/Users/vince/Documents/Codex/2026-04-24/i-want-a-turn-based-supply/netlify.toml)
- static headers via [`_headers`](C:/Users/vince/Documents/Codex/2026-04-24/i-want-a-turn-based-supply/_headers)
- fallback page via [`404.html`](C:/Users/vince/Documents/Codex/2026-04-24/i-want-a-turn-based-supply/404.html)
- deploy docs via [`README.md`](C:/Users/vince/Documents/Codex/2026-04-24/i-want-a-turn-based-supply/README.md)
- `.gitignore` for a clean repo

## Fastest path: Netlify drag-and-drop

Use this if you want a public URL quickly without setting up Git first.

1. Go to Netlify and sign in.
2. Create a new site with drag-and-drop deploy.
3. Upload this whole project folder.
4. Open the generated public URL.
5. Confirm the app loads from `index.html`.

Notes:

- This works because the project is already a static site.
- For later updates, re-upload the updated folder or switch to Git-based deploys.

## Better long-term path: GitHub + Netlify

Use this if you want preview deploys and easy updates.

### Step 1: Create a Git repo locally

Run these commands in this folder:

```powershell
git init
git add .
git commit -m "Initial supply chain simulator"
```

### Step 2: Create a GitHub repository

Create an empty GitHub repo, then connect it:

```powershell
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

### Step 3: Connect Netlify

In Netlify:

1. Create a new project from Git.
2. Choose the GitHub repository.
3. Use these settings:

```text
Build command: leave blank
Publish directory: .
```

4. Deploy.

### Step 4: Verify production

Check:

- the homepage opens
- demand presets run
- chain builder works
- save/download/import work
- bullwhip charts render

## Cloudflare Pages path

If you prefer Cloudflare Pages:

1. Push this project to GitHub.
2. Create a Pages project from the repo.
3. Use:

```text
Framework preset: None
Build command: leave blank
Build output directory: .
```

4. Deploy.

## Before you share publicly

Recommended final checks:

1. Open the production URL in a private/incognito browser window.
2. Run one saved scenario.
3. Try one JSON export and import.
4. Confirm mobile layout looks acceptable.
5. Confirm there are no stale-cache issues after refresh.

## What still requires a human step

I can prepare the files in this workspace, but I cannot complete these account-linked actions from here:

- GitHub repository creation under your account
- Netlify login / site creation
- Cloudflare Pages login / project creation
- custom domain setup

## Suggested launch sequence

1. Do a quick manual smoke test at [http://localhost:8000/index.html](http://localhost:8000/index.html)
2. Create GitHub repo
3. Push code
4. Connect Netlify
5. Share the public URL
