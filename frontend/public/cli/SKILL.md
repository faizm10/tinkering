---
name: repopulse
description: Install and wire up RepoPulse product analytics in the current project, then report the install back to the RepoPulse dashboard. Use when the user wants to add RepoPulse, set up analytics, or runs the RepoPulse installer.
---

# RepoPulse setup

You are setting up [RepoPulse](https://repo-pulse-eta.vercel.app) analytics in the user's project. RepoPulse is a lightweight browser SDK: it loads `analytics.js`, calls `RepoPulse.init({ projectKey })`, and sends pageviews/events to an ingest endpoint. Your job is to wire it into this project correctly for its framework, then report the install back to the RepoPulse site.

Base URL: `https://repo-pulse-eta.vercel.app`

## Step 1 — Get the project key

The public project key looks like `rp_pub_...`. Find it in this order:
1. If a `.repopulse-key` file exists in the project root, read the key from it.
2. Otherwise, ask the user: "Paste your RepoPulse project key (starts with `rp_pub_`). You can copy it from the RepoPulse dashboard onboarding step or repository settings."

Do not proceed without a key that starts with `rp_pub_`.

## Step 2 — Verify the key and learn the project

Call the verify endpoint:

```
GET https://repo-pulse-eta.vercel.app/api/cli?key=<PROJECT_KEY>
```

- If the response is `{ "valid": true, ... }`, note `repository`, `slug`, `ingestEndpoint`, and `allowedOrigins`. Tell the user which repository this key maps to and confirm it's the right one.
- If `valid` is false, stop and tell the user the key wasn't recognized.

Use `ingestEndpoint` from the response (it is `https://repo-pulse-eta.vercel.app/api/ingest`) when wiring the snippet.

## Step 3 — Detect the framework

Inspect the project to decide where the snippet goes. Check `package.json` dependencies and config files:

- **Next.js (App Router)** — `next` dependency + an `app/` directory with `layout.tsx`/`layout.js`.
- **Next.js (Pages Router)** — `next` dependency + a `pages/` directory.
- **Vite / React / Vue / Svelte (SPA)** — `vite` dependency, or `index.html` at root.
- **Astro** — `astro` dependency.
- **SvelteKit** — `@sveltejs/kit` dependency.
- **Plain static site** — an `index.html` with no framework.

If you cannot tell, ask the user which framework they use.

## Step 4 — Install the snippet

Use this universal initializer (it loads the script, then inits only after it's ready, so ordering is never a problem). Replace `PROJECT_KEY` with the real key:

```js
(function () {
  if (window.RepoPulse) return;
  var s = document.createElement("script");
  s.src = "https://repo-pulse-eta.vercel.app/analytics.js";
  s.async = true;
  s.onload = function () {
    window.RepoPulse.init({
      projectKey: "PROJECT_KEY",
      endpoint: "https://repo-pulse-eta.vercel.app/api/ingest",
    });
  };
  document.head.appendChild(s);
})();
```

Place it per framework:

### Next.js (App Router)
Create `components/repopulse-analytics.tsx`:

```tsx
"use client";

import { useEffect } from "react";

export function RepoPulseAnalytics() {
  useEffect(() => {
    if (typeof window === "undefined" || (window as unknown as { RepoPulse?: unknown }).RepoPulse) return;
    const s = document.createElement("script");
    s.src = "https://repo-pulse-eta.vercel.app/analytics.js";
    s.async = true;
    s.onload = () =>
      (window as unknown as { RepoPulse: { init: (o: object) => void } }).RepoPulse.init({
        projectKey: "PROJECT_KEY",
        endpoint: "https://repo-pulse-eta.vercel.app/api/ingest",
      });
    document.head.appendChild(s);
  }, []);
  return null;
}
```

Then render `<RepoPulseAnalytics />` inside the `<body>` of the root `app/layout.tsx`.

### Next.js (Pages Router)
Add the same client component and render it in `pages/_app.tsx`.

### Vite / CRA / plain HTML / Astro / SvelteKit
Add the universal initializer as an inline `<script>` in the `<head>` of `index.html` (Vite/CRA/static), `src/app.html` (SvelteKit), or the base layout (`src/layouts/*.astro` for Astro). For framework entry points without an HTML file, add the IIFE to the app's main entry module so it runs once on load.

Always set the key and `https://repo-pulse-eta.vercel.app/api/ingest` endpoint exactly as above.

## Step 5 — Make sure the app origin is allowed

RepoPulse only accepts events from origins listed on the project (`allowedOrigins` from Step 2). If the user's dev/prod origin (e.g. `http://localhost:3000` or their production domain) is NOT in that list, tell them to add it in the RepoPulse dashboard under the repository's settings → allowed origins. Events are rejected from unlisted origins.

## Step 6 — Report the install back to RepoPulse

Once the snippet is in place, report it:

```
POST https://repo-pulse-eta.vercel.app/api/cli
Content-Type: application/json

{ "projectKey": "<PROJECT_KEY>", "framework": "<detected framework>", "appUrl": "<production URL if known, else omit>" }
```

A `{ "ok": true }` response means the RepoPulse dashboard now shows this project as connected via the CLI.

## Step 7 — Summarize

Tell the user:
- Which file(s) you changed and where the snippet lives.
- The repository the key is linked to.
- That events will appear on the RepoPulse dashboard within a minute or two of real traffic (`https://repo-pulse-eta.vercel.app/dashboard/<slug>/overview`).
- A reminder to add their origin to allowed origins if it wasn't already listed.

Do not commit secrets. The `rp_pub_` key is a public, browser-safe key — it is fine to embed in client code. Never hardcode a `rp_sec_` (secret) key in the app.
