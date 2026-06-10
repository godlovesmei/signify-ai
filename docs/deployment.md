# Signify AI Deployment Guide

## Recommended Production Shape

- Frontend: Vercel, root directory `apps/frontend`.
- Backend: Azure Container Apps, image built from `apps/backend/Dockerfile`.
- Container registry: Azure Container Registry.
- Auth and database: Supabase hosted project.

This keeps the Next.js app on the platform with the best framework integration, while the FastAPI inference service runs as a normal container with CPU, memory, health checks, and secrets controlled in Azure.

## Required Secrets And Environment Variables

Backend, set in Azure Container Apps:

```bash
APP_DEBUG=false
MODEL_PATH=models/exports/bisindo_yolo/best.pt
INPUT_SIZE=640
CONFIDENCE_THRESHOLD=0.5
INFERENCE_TIMEOUT_SECONDS=5
CORS_ORIGINS=https://your-vercel-domain.vercel.app,https://your-custom-domain.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_SECRET=<store-as-azure-secret>
REQUIRE_AUTH=true
```

Frontend, set in Vercel Project Settings:

```bash
NEXT_PUBLIC_API_URL=https://your-azure-container-app-url
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
```

Never put `SUPABASE_JWT_SECRET` in `.env.example`, Vercel frontend env, Dockerfile, or container image layers.

## Local Docker Smoke Test

Create a local backend env file:

```bash
cp apps/backend/.env.example apps/backend/.env
```

For local unauthenticated testing, keep `REQUIRE_AUTH=false` and leave
`SUPABASE_JWT_SECRET` empty. The backend will treat frontend `Authorization`
headers as anonymous in this mode. For production parity, set
`REQUIRE_AUTH=true`, `SUPABASE_URL`, and `SUPABASE_JWT_SECRET`.

Build and run:

```bash
docker compose up --build
```

Check health:

```bash
curl http://localhost:8000/health
```

The Docker image includes only `models/exports/bisindo_yolo/best.pt`, not the full `models/` directory.

## Azure Container Apps Deployment

Use these names as placeholders:

```bash
RG=signify-ai-prod-rg
LOCATION=southeastasia
ACR=signifyairegistry
ACA_ENV=signify-ai-env
APP=signify-ai-backend
TAG=$(git rev-parse --short HEAD)
```

Create the resource group and registry:

```bash
az group create --name "$RG" --location "$LOCATION"
az acr create --resource-group "$RG" --name "$ACR" --sku Basic
```

Build the backend image in ACR:

```bash
az acr build \
  --registry "$ACR" \
  --image "signify-backend:$TAG" \
  --file apps/backend/Dockerfile \
  .
```

Create a Container Apps environment:

```bash
az containerapp env create \
  --name "$ACA_ENV" \
  --resource-group "$RG" \
  --location "$LOCATION"
```

Create the container app:

```bash
az containerapp create \
  --name "$APP" \
  --resource-group "$RG" \
  --environment "$ACA_ENV" \
  --image "$ACR.azurecr.io/signify-backend:$TAG" \
  --registry-server "$ACR.azurecr.io" \
  --registry-identity system \
  --target-port 8000 \
  --ingress external \
  --cpu 1 \
  --memory 2Gi \
  --min-replicas 0 \
  --max-replicas 1 \
  --secrets supabase-jwt-secret="<your-supabase-jwt-secret>" \
  --env-vars \
    APP_DEBUG=false \
    MODEL_PATH=models/exports/bisindo_yolo/best.pt \
    INPUT_SIZE=640 \
    CONFIDENCE_THRESHOLD=0.5 \
    INFERENCE_TIMEOUT_SECONDS=5 \
    REQUIRE_AUTH=true \
    SUPABASE_URL=https://your-project.supabase.co \
    SUPABASE_JWT_SECRET=secretref:supabase-jwt-secret \
    CORS_ORIGINS=https://your-vercel-domain.vercel.app
```

The `--registry-identity system` flag uses a managed identity for ACR pulls instead of long-lived registry credentials. If your Azure account cannot auto-create the `AcrPull` role assignment, create that role assignment on the ACR scope manually, then rerun the container app command.

Get the backend URL:

```bash
az containerapp show \
  --name "$APP" \
  --resource-group "$RG" \
  --query properties.configuration.ingress.fqdn \
  --output tsv
```

Then set Vercel `NEXT_PUBLIC_API_URL` to `https://<that-fqdn>` and redeploy the frontend.

## Vercel Deployment

In Vercel:

1. Import the Git repository.
2. Set Root Directory to `apps/frontend`.
3. Add the frontend environment variables listed above for Production and Preview.
4. Deploy.

After the first deploy, copy the production Vercel domain back into Azure `CORS_ORIGINS`, then restart or redeploy the backend revision.

## Production Checklist

- Rotate the Supabase JWT secret if it was ever committed, pasted, or stored in an example file.
- Set `REQUIRE_AUTH=true` on Azure.
- Keep `SUPABASE_JWT_SECRET` only in Azure secrets.
- Keep frontend Vercel env limited to public values: API URL, Supabase URL, Supabase publishable key.
- Set `CORS_ORIGINS` to exact Vercel/custom domains, not `*`.
- Use `--min-replicas 0` while saving credits; switch to `1` for demos that must avoid cold starts.
- Keep `--max-replicas 1` unless the model can handle concurrent replicas and cost is acceptable.
- Enable Supabase leaked password protection if your Supabase plan supports it.
- Add a custom domain only after both health checks pass.
