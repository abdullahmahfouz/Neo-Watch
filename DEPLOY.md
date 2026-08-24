# Deploying the NeoWatch backend to AWS

The frontend is already live on AWS Amplify (see
[frontend/README.md](frontend/README.md#deploying-to-aws-amplify)) — this doc only covers
getting the Spring Boot backend running on AWS and wiring it up to that existing frontend.

## Target architecture

```
Browser ──▶ Amplify Hosting (ca-central-1, already deployed)
   │
   └──────▶ App Runner (us-east-2) ──▶ RDS Postgres (ca-central-1, existing, public endpoint)
                                    └─▶ Redis Cloud (existing, external — unchanged)
```

- **Backend**: containerized (see `Dockerfile`), pushed to ECR **in `us-east-2`**, run on
  App Runner — fully managed, no servers/cluster to operate.
- **Region split**: your RDS instance lives in `ca-central-1`, but **App Runner is not
  offered there** — it's only available in us-east-1/2, us-west-2, eu-west-1/2/3,
  eu-central-1, ap-northeast-1, ap-south-1, ap-southeast-1/2. `us-east-2` (Ohio) is the
  closest of those to Canada. ECR repos are regional and App Runner can only pull from one
  in its own region, hence the backend and its image repo both sit in `us-east-2` while the
  database stays put in `ca-central-1`. The RDS endpoint is already internet-reachable (that's
  how local dev connects), so the cross-region hop just adds a few ms of latency. Redis Cloud
  is external and unaffected by any of this.

**Known gate on new accounts:** App Runner may return `SubscriptionRequiredException` on a
freshly created AWS account even in a supported region — this is a temporary fraud-prevention
hold, not a config problem, and clears on its own within a day or two (faster after opening a
support case if you have a paid Support plan). ECR, IAM, ECS, and Lambda are unaffected by
this gate; only App Runner service creation is blocked until it clears. If step 3 fails with
that error, everything through step 1 (image in ECR) is still done — just retry step 3 later.

This assumes AWS CLI v2 installed and `aws configure`'d, and Docker installed and running.

## 0. One-time variables

```bash
export BACKEND_REGION=us-east-2       # App Runner + its ECR repo (App Runner: no ca-central-1)
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REPO=neowatch-backend
export APPRUNNER_SERVICE=neowatch-backend
```

## 1. Build and push the image

```bash
aws ecr create-repository --repository-name $ECR_REPO --region $BACKEND_REGION

aws ecr get-login-password --region $BACKEND_REGION \
  | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$BACKEND_REGION.amazonaws.com

# --platform linux/amd64 is required if you're building on Apple Silicon (or any arm64
# machine) — App Runner runs amd64. An arm64 image pulls fine but the container never
# executes: no application logs at all, health check just times out, and the deployment
# fails with no clear error pointing at the real cause. buildx also pushes more reliably
# for large images than a separate `docker push` (fewer "connection reset by peer" retries
# on some networks).
docker buildx build --platform linux/amd64 \
  -t $AWS_ACCOUNT_ID.dkr.ecr.$BACKEND_REGION.amazonaws.com/$ECR_REPO:latest \
  --push .
```

## 2. Let App Runner pull from ECR

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

## 3. Create the App Runner service

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
          "ALLOWED_ORIGINS": "https://main.d2m0an0vcg1iwk.amplifyapp.com",
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
    "Cpu": "0.5 vCPU",
    "Memory": "1 GB"
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

`ALLOWED_ORIGINS` is set above to the live Amplify URL directly, since it's already known
(`https://main.d2m0an0vcg1iwk.amplifyapp.com`) — no need for a placeholder/come-back-later step.

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

## 4. Point the frontend at the new backend

In the Amplify Console (Amplify was connected via GitHub, not CLI zip upload — see
[frontend/README.md](frontend/README.md#deploying-to-aws-amplify)), go to your app →
**Environment variables** and set:

```text
VITE_API_BASE_URL=https://<your-apprunner-service-url>
```

Then trigger a redeploy (Console → your app → "Redeploy this version", or push a commit —
Amplify redeploys on every push to the connected branch).

Visit `https://main.d2m0an0vcg1iwk.amplifyapp.com` and confirm the dashboard loads real data.

## Redeploying the backend after a code change

```bash
docker buildx build --platform linux/amd64 \
  -t $AWS_ACCOUNT_ID.dkr.ecr.$BACKEND_REGION.amazonaws.com/$ECR_REPO:latest \
  --push .
aws apprunner start-deployment --region $BACKEND_REGION \
  --service-arn $(aws apprunner list-services --region $BACKEND_REGION --query "ServiceSummaryList[?ServiceName=='$APPRUNNER_SERVICE'].ServiceArn" --output text)
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

App Runner's 0.5 vCPU / 1 GB instance bills per second while running, roughly $10-20/month
at low, steady traffic — it does not scale to zero. (App Runner's smallest tier, 0.25 vCPU /
0.5 GB, isn't enough for this app: under that CPU quota, JVM + Hibernate + Tomcat startup
took over a minute in testing, long enough to blow past App Runner's health-check grace
window and fail the deployment — 0.5 vCPU is the practical minimum here.) RDS and Redis
costs are whatever you're already paying for those; Amplify Hosting is unaffected since
it's already deployed.
