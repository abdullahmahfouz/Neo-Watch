# NeoWatch frontend

React + Vite dashboard for the NeoWatch near-Earth object tracker: a real
Earth with tracked objects rendered around it, a live threats list, hazard
alerts, and per-asteroid risk trends. See the [root README](../README.md)
for the full feature list and backend details.

Talks to the Spring Boot backend in the repo root, mainly over its single
`GET /api/neo/dashboard` endpoint (everything the dashboard needs in one
request) plus a couple of per-asteroid endpoints for the Impact view, and
`GET /ingest` to trigger a manual data pull.

## Tech stack

React 19, Vite, Tailwind CSS v4, [Motion](https://motion.dev), [Phosphor
Icons](https://phosphoricons.com) — plain JavaScript, no TypeScript or
router. The globe is a plain SVG orthographic Earth projection (no WebGL),
adapted from a Framer Marketplace component — see the header comment in
`src/globe/TacticalGlobe.jsx` for provenance.

## Running locally

Start the backend first (from the repo root):

```bash
./mvnw spring-boot:run
```

Then, from this directory:

```bash
npm install
npm run dev
```

Vite proxies `/api` and `/ingest` to `http://localhost:8080` in dev (see
`vite.config.js`), so the app works with no extra configuration.

If the backend has `INGEST_KEY` configured, the "Initiate Scan" button will
prompt for it the first time and remember it for the rest of that browser
tab (`sessionStorage`, never baked into the build).

## Production build

```bash
npm run build
```

For a backend on a different origin, set `VITE_API_BASE_URL` (e.g. in a
`.env` file) to that backend's URL. Also make sure the backend's
`ALLOWED_ORIGINS` includes wherever this build ends up served from.

## Deploying to Vercel

The repository root contains a `vercel.json` configured for this frontend. In
Vercel, import the repository with `/` as the project root and add:

```text
VITE_API_BASE_URL=https://<your-backend-origin>
```

Vercel builds from `frontend/` and serves its `dist/` directory. The Spring Boot
backend must remain deployed separately, and its `ALLOWED_ORIGINS` must include
the final Vercel URL.
