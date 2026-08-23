# Deploying NeoWatch to AWS

Target architecture. Frontend and database stay in `ca-central-1` (co-located with the existing
RDS instance); the backend runs in `us-east-2` because **App Runner is not offered in
`ca-central-1`** — it's only available in us-east-1/2, us-west-2, eu-west-1/2/3, eu-central-1,
ap-northeast-1, ap-south-1, ap-southeast-1/2, and us-east-2 (Ohio) is the closest of those to
Canada:

```
Browser ──▶ Amplify Hosting (ca-central-1, frontend build)
   │
   └──────▶ App Runner (us-east-2) ──▶ RDS Postgres (ca-central-1, existing, public endpoint)
                                    └─▶ Redis Cloud (existing, external — unchanged)
```

- **Frontend**: static Vite build deployed to AWS Amplify Hosting via CLI zip upload (no GitHub OAuth/console click-through required). Amplify fronts it with its own CDN + HTTPS on an `*.amplifyapp.com` domain.
- **Backend**: containerized (see `Dockerfile`), pushed to ECR **in `us-east-2`**, run on App Runner — fully managed, no servers/cluster to operate. (Amplify Hosting doesn't run arbitrary containers/Spring Boot apps, so the backend still lives on App Runner. ECR repos are regional and App Runner can only pull from one in its own region, hence the region split from the rest of the stack.)
- **Database & cache**: unchanged. `DB_URL` already points at RDS in `ca-central-1`; the cross-region hop to us-east-2 adds a few ms of latency but works since the RDS endpoint is already internet-reachable. Redis stays on its existing external host.

**Known gate on new accounts:** App Runner may return `SubscriptionRequiredException` on a
freshly created AWS account even in a supported region — this is a temporary fraud-prevention
hold, not a config problem, and clears on its own within a day or two (or faster after opening
a support case in the console, if you have any paid Support plan). Confirmed on this account:
ECR, IAM, ECS, and Lambda all work immediately; only App Runner is gated. Retry step 3 once it
clears — everything up through pushing the image to ECR can be done regardless.

This doc assumes you already have an AWS account (you do — the RDS instance proves it) with the AWS CLI v2 installed and `aws configure`'d, and Docker installed and running. Neither is required just to read this. The frontend steps also need `zip` and `jq` (both already present on this machine).

## 0. One-time variables

Set these once per terminal session before running anything below:

```bash
export AWS_REGION=ca-central-1        # frontend (Amplify) + RDS/existing infra
export BACKEND_REGION=us-east-2       # App Runner + its ECR repo (App Runner: no ca-central-1)
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REPO=neowatch-backend
export APPRUNNER_SERVICE=neowatch-backend
export AMPLIFY_APP_NAME=neowatch-frontend
```

## 1. Backend: build and push the image

Note the ECR repo lives in `$BACKEND_REGION` (not `$AWS_REGION`) — App Runner only pulls from
an ECR repo in its own region.

```bash
aws ecr create-repository --repository-name $ECR_REPO --region $BACKEND_REGION

aws ecr get-login-password --region $BACKEND_REGION \
  | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$BACKEND_REGION.amazonaws.com

docker build -t $ECR_REPO .
docker tag $ECR_REPO:latest $AWS_ACCOUNT_ID.dkr.ecr.$BACKEND_REGION.amazonaws.com/$ECR_REPO:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$BACKEND_REGION.amazonaws.com/$ECR_REPO:latest
```

## 2. Backend: let App Runner pull from ECR

One-time IAM role so App Runner is allowed to pull the private image:

```bash
aws iam create-role --role-name AppRunnerECRAccessRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "build.apprunner.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name AppRunnerECRAccessRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess
```

## 3. Backend: create the App Runner service

Fill in the real values below (from `.env`) and save as a local, **gitignored** file —
`deploy.local.json` is already covered by `.gitignore`, don't rename it:

```bash
cat > deploy.local.json <<EOF
{
  "ServiceName": "$APPRUNNER_SERVICE",
  "SourceConfiguration": {
    "ImageRepository": {
      "ImageIdentifier": "$AWS_ACCOUNT_ID.dkr.ecr.$BACKEND_REGION.amazonaws.com/$ECR_REPO:latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "8080",
        "RuntimeEnvironmentVariables": {
          "NASA_API_KEY": "<from .env>",
          "DB_URL": "<from .env>",
          "DB_USERNAME": "<from .env>",
          "DB_PASSWORD": "<from .env>",
          "REDIS_HOST": "<from .env>",
          "REDIS_PORT": "<from .env>",
          "REDIS_PASSWORD": "<from .env>",
          "ALLOWED_ORIGINS": "http://localhost:5173",
          "INGEST_KEY": "<pick a strong secret — this becomes the password for triggering ingestion>",
          "TRUST_PROXY_HEADERS": "true"
        }
      }
    },
    "AutoDeploymentsEnabled": false,
    "AuthenticationConfiguration": {
      "AccessRoleArn": "arn:aws:iam::$AWS_ACCOUNT_ID:role/AppRunnerECRAccessRole"
    }
  },
  "InstanceConfiguration": {
    "Cpu": "0.25 vCPU",
    "Memory": "0.5 GB"
  },
  "HealthCheckConfiguration": {
    "Protocol": "HTTP",
    "Path": "/actuator/health",
    "Interval": 10,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 5
  }
}
EOF

aws apprunner create-service --cli-input-json file://deploy.local.json --region $BACKEND_REGION
```

`ALLOWED_ORIGINS` is set to `localhost` for now on purpose — you don't know the CloudFront
domain until step 5. Come back and update it in step 6.

**`TRUST_PROXY_HEADERS=true` is correct here specifically because App Runner's own load
balancer sets `X-Forwarded-For` itself** — this is the one deployment target where enabling
that flag doesn't open up IP spoofing (see the comment in `RateLimitFilter.java`).

Note the values above go into the App Runner service definition as plain environment
variables (visible to anyone with IAM access to describe the service, encrypted at rest).
Fine for a solo project matching the local `.env` risk posture already in use; if you want
tighter isolation later, swap `RuntimeEnvironmentVariables` for `RuntimeEnvironmentSecrets`
referencing AWS Secrets Manager ARNs — same JSON shape, different field name.

Check status and grab the service URL once it's running:

```bash
aws apprunner describe-service --region $BACKEND_REGION \
  --service-arn $(aws apprunner list-services --region $BACKEND_REGION --query "ServiceSummaryList[?ServiceName=='$APPRUNNER_SERVICE'].ServiceArn" --output text) \
  --query "Service.{Status:Status,Url:ServiceUrl}"
```

Status goes `OPERATION_IN_PROGRESS` → `RUNNING` (a few minutes). Once running:

```bash
curl https://<ServiceUrl-from-above>/actuator/health
```

## 4. Frontend: build

```bash
cd frontend
echo "VITE_API_BASE_URL=https://<your-apprunner-service-url>" > .env.production
npm install
npm run build
cd ..
```

## 5. Frontend: AWS Amplify Hosting (CLI zip deploy)

This skips the Amplify Console's GitHub-connect flow (which needs a browser + OAuth click-through)
and instead pushes the built `dist/` straight up as a zip via the CLI — nothing to click, and it's
scriptable for redeploys.

```bash
APP_ID=$(aws amplify create-app --name $AMPLIFY_APP_NAME --region $AWS_REGION \
  --query "app.appId" --output text)

# SPA rewrite: without this, refreshing on anything other than "/" 404s, since Amplify
# is serving static files and doesn't know about client-side routes.
aws amplify update-app --app-id $APP_ID --region $AWS_REGION \
  --custom-rules '[{"source":"/<*>","target":"/index.html","status":"200"}]'

aws amplify create-branch --app-id $APP_ID --branch-name main --region $AWS_REGION

cd frontend && zip -qr ../frontend-build.zip dist && cd ..

DEPLOY=$(aws amplify create-deployment --app-id $APP_ID --branch-name main --region $AWS_REGION)
UPLOAD_URL=$(echo "$DEPLOY" | jq -r '.zipUploadUrl')
JOB_ID=$(echo "$DEPLOY" | jq -r '.jobId')

curl -sf -X PUT -H "Content-Type: application/zip" --data-binary @frontend-build.zip "$UPLOAD_URL"

aws amplify start-deployment --app-id $APP_ID --branch-name main --job-id $JOB_ID --region $AWS_REGION

rm frontend-build.zip
echo "https://main.$APP_ID.amplifyapp.com"
```

Save `$APP_ID` somewhere (e.g. append `export AMPLIFY_APP_ID=$APP_ID` to your notes) — every
redeploy below needs it and `aws amplify list-apps` is how you'd look it up again otherwise.

Poll until the job's `SUCCEED`:

```bash
aws amplify get-job --app-id $APP_ID --branch-name main --job-id $JOB_ID --region $AWS_REGION \
  --query "job.summary.status"
```

## 6. Close the loop: real CORS origin

Now that you have the Amplify domain, update the backend's `ALLOWED_ORIGINS`:

```bash
# Edit deploy.local.json: set ALLOWED_ORIGINS to "https://main.<app-id>.amplifyapp.com"
aws apprunner update-service --region $BACKEND_REGION \
  --service-arn $(aws apprunner list-services --region $BACKEND_REGION --query "ServiceSummaryList[?ServiceName=='$APPRUNNER_SERVICE'].ServiceArn" --output text) \
  --source-configuration file://deploy.local.json
```

Visit `https://main.$APP_ID.amplifyapp.com` and confirm the dashboard loads real data.

## Redeploying after a code change

**Backend:**
```bash
docker build -t $ECR_REPO .
docker tag $ECR_REPO:latest $AWS_ACCOUNT_ID.dkr.ecr.$BACKEND_REGION.amazonaws.com/$ECR_REPO:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$BACKEND_REGION.amazonaws.com/$ECR_REPO:latest
aws apprunner start-deployment --region $BACKEND_REGION \
  --service-arn $(aws apprunner list-services --region $BACKEND_REGION --query "ServiceSummaryList[?ServiceName=='$APPRUNNER_SERVICE'].ServiceArn" --output text)
```

**Frontend:**
```bash
cd frontend && npm run build && cd .. && zip -qr frontend-build.zip frontend/dist

DEPLOY=$(aws amplify create-deployment --app-id $AMPLIFY_APP_ID --branch-name main --region $AWS_REGION)
curl -sf -X PUT -H "Content-Type: application/zip" \
  --data-binary @frontend-build.zip "$(echo "$DEPLOY" | jq -r '.zipUploadUrl')"
aws amplify start-deployment --app-id $AMPLIFY_APP_ID --branch-name main \
  --job-id "$(echo "$DEPLOY" | jq -r '.jobId')" --region $AWS_REGION

rm frontend-build.zip
```

## Before this is truly public

- [ ] `INGEST_KEY` set to a real secret (not left blank)
- [ ] `ALLOWED_ORIGINS` set to the real Amplify domain, not `localhost` or `*`
- [ ] `TRUST_PROXY_HEADERS=true` (App Runner sets `X-Forwarded-For` itself — this is safe here)
- [ ] RDS security group: confirm it isn't wide open to `0.0.0.0/0` on 5432 — it's currently
      internet-reachable (that's how local dev connects to it), which is how App Runner's
      default networking reaches it too, but the security group should still scope to known
      ranges where practical
- [ ] A custom domain via Route 53 (+ Amplify's built-in ACM cert management) instead of the
      raw `amplifyapp.com` / App Runner URLs (optional, not required for any of the above to work)

## Rough cost

App Runner's minimum instance (0.25 vCPU / 0.5 GB) bills per second while running, roughly
$5-10/month at low, steady traffic — it does not scale to zero. Amplify Hosting for a small
SPA is typically well under $1/month (build minutes + minimal data transfer). RDS and Redis
costs are whatever you're already paying for those.
