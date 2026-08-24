## Deploy Configuration (configured by /setup-deploy)

This project has two independently deployed components — see [README.md](README.md) and
[DEPLOY.md](DEPLOY.md) for full context.

### Frontend
- Platform: AWS Amplify Hosting (GitHub-connected via Amplify Console, not a CLI zip deploy)
- Production URL: https://main.d2m0an0vcg1iwk.amplifyapp.com/
- Deploy trigger: automatic on push to `main` (Amplify builds from `frontend/`)
- Deploy status: check the Amplify Console, or just poll the production URL
- Post-deploy health check: HTTP GET on the production URL (200 = up)

### Backend
- Platform: AWS App Runner (region `us-east-2`), image built and pushed to ECR
- Production URL: https://rn9uic3jah.us-east-2.awsapprunner.com
- Instance size: 0.5 vCPU / 1 GB — the default 0.25 vCPU / 0.5 GB tier is too slow to boot
  this JVM+Hibernate app within App Runner's health-check grace window and fails deployment
- Deploy trigger: CLI script, not automatic — see "Redeploying the backend after a code
  change" in [DEPLOY.md](DEPLOY.md) (`docker build` → push to ECR → `aws apprunner
  start-deployment`)
- Deploy status command:
  ```bash
  aws apprunner describe-service --region us-east-2 \
    --service-arn $(aws apprunner list-services --region us-east-2 --query "ServiceSummaryList[?ServiceName=='neowatch-backend'].ServiceArn" --output text) \
    --query "Service.{Status:Status,Url:ServiceUrl}"
  ```
- Post-deploy health check: `GET /actuator/health` on the App Runner service URL

### Custom deploy hooks
- Pre-merge: `./mvnw test` (backend), `npm run build` (frontend, also run by Amplify itself)
- Deploy trigger: automatic for frontend (push to `main`); manual CLI script for backend
- Deploy status: poll frontend production URL; `aws apprunner describe-service` for backend
- Health check: frontend production URL (200 OK); backend `/actuator/health`

### Notes
- `ALLOWED_ORIGINS` on the backend includes the Amplify production URL above.
- `VITE_API_BASE_URL` on the frontend (Amplify Console env var) points at the backend's
  App Runner URL. It was previously misnamed `VITE_API_URL` pointing at a dead Elastic
  Beanstalk URL, so the live site was silently falling back to `localhost:8080` in
  production — fixed 2026-08-24.
- The backend image must be built `--platform linux/amd64` — building on Apple Silicon
  without that flag produces an arm64 image that App Runner can't run (fails health check
  with zero application logs, since the container never executes at all). Use
  `docker buildx build --platform linux/amd64 --push` to build and push in one step; a
  plain `docker push` of a large image intermittently hit "connection reset by peer" on
  this network, buildx's push path did not.
- Project type: web app (Spring Boot backend + React/Vite frontend)
- Merge method: not detected (no `gh` CLI available in this environment) — defaulting to
  squash-merge; correct this line if the repo actually uses merge or rebase.
