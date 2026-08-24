# NeoWatch frontend

React + Vite dashboard for the NeoWatch near-Earth object tracker: a real
3D Earth with tracked objects orbiting it, a live threats list, hazard
alerts, and per-asteroid impact-energy trends. See the [root README](../README.md)
for the full feature list and backend details.

Talks to the Spring Boot backend in the repo root, mainly over its single
`GET /api/neo/dashboard` endpoint (everything the dashboard needs in one
request) plus a couple of per-asteroid endpoints for the detail page, and
`GET /ingest` to trigger a manual data pull.

## Tech stack

React 19, Vite, [Three.js](https://threejs.org) (WebGL), Tailwind CSS v4,
[Motion](https://motion.dev), [Phosphor Icons](https://phosphoricons.com) —
plain JavaScript, no TypeScript or router. The Earth is a real 3D scene
(`src/three/SystemScene.jsx`) built on NASA's day/night/cloud/normal-map
textures with a custom shader for the day-night terminator, not a static
image or flat SVG projection — falls back to a plain list-based UI (via
`SceneErrorBoundary`) if WebGL isn't available in the browser.

## Setup

Start the backend first (from the repo root):

```bash
./mvnw spring-boot:run
```

Then, from this directory:

```bash
npm install
echo "VITE_API_BASE_URL=http://localhost:8080" > .env.local
```

The app calls the backend origin from `VITE_API_BASE_URL` (loaded by Vite).
Set it to your Spring Boot URL for local development and deployments.

## Usage

```bash
npm run dev
```

Starts on `localhost:5173`. If the backend has `INGEST_KEY` configured, the
"Refresh data" button will prompt for it the first time and remember it for
the rest of that browser tab (`sessionStorage`, never baked into the build).

## Production build

```bash
npm run build
```

Set `VITE_API_BASE_URL` (e.g. in `.env.local`) to your backend origin. Also
make sure the backend's `ALLOWED_ORIGINS` includes wherever this build ends
up served from.

## Deploying to AWS Amplify

Live app: https://main.d2m0an0vcg1iwk.amplifyapp.com/

In AWS Amplify, connect this repository and configure the frontend build to run
from `frontend/`. Add this environment variable in Amplify:

```text
VITE_API_BASE_URL=https://<your-backend-origin>
```

Amplify should build from `frontend/` and serve its `dist/` directory. The Spring
Boot backend remains deployed separately, and its `ALLOWED_ORIGINS` must include
the final Amplify URL.

## License

See the [root README](../README.md#license) — no license has been chosen for
this project yet.
