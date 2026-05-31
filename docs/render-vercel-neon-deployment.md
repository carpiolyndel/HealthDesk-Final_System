# Render + Vercel + Neon Deployment

This split deployment uses:

```text
Render = Spring Boot backend API
Vercel = static frontend pages from src/main/resources/static
Neon = PostgreSQL database
```

Railway deployment files are separate. Do not change `railway.json` or
`src/main/resources/application-railway.properties` when deploying this
Render + Vercel + Neon setup.

## 1. Neon

Create a Neon PostgreSQL project and copy:

```text
host
database
user
password
```

Use this JDBC URL format on Render:

```text
jdbc:postgresql://<neon-host>/<neon-database>?sslmode=require
```

## 2. Render Backend

Create a Render Web Service from this repository. Use Docker deployment. The included `render.yaml` sets the backend profile to `render`.

Set these Render environment variables:

```bash
SPRING_PROFILES_ACTIVE=render
SPRING_DATASOURCE_URL=jdbc:postgresql://<neon-host>/<neon-database>?sslmode=require
SPRING_DATASOURCE_USERNAME=<neon-user>
SPRING_DATASOURCE_PASSWORD=<neon-password>
JWT_SECRET=<long-random-secret>
ENCRYPTION_SECRET_KEY=<long-random-secret>
HEALTHDESK_ADMIN_USERNAME=admin
HEALTHDESK_ADMIN_EMAIL=<admin-email>
HEALTHDESK_ADMIN_PASSWORD=<strong-admin-password>
HEALTHDESK_ADMIN_MFA_ENABLED=true
HEALTHDESK_DEMO_USERS_ENABLED=true
HEALTHDESK_DEMO_DOCTOR_PASSWORD=<strong-demo-password>
HEALTHDESK_DEMO_NURSE_PASSWORD=<strong-demo-password>
HEALTHDESK_DEMO_STAFF_PASSWORD=<strong-demo-password>
MFA_DELIVERY_MODE=emailjs
EMAILJS_SERVICE_ID=<emailjs-service-id>
EMAILJS_TEMPLATE_ID=<emailjs-template-id>
EMAILJS_PUBLIC_KEY=<emailjs-public-key>
EMAILJS_PRIVATE_KEY=<emailjs-private-key-optional>
APP_CORS_ALLOWED_ORIGINS=https://<your-vercel-domain>
```

For the current split Vercel projects, use:

```bash
APP_CORS_ALLOWED_ORIGINS=https://healthdesk-guest.vercel.app,https://healthdesk-app-mu.vercel.app
```

After Render deploys, test:

```text
https://<your-render-backend-domain>/hello
```

For the current Render service:

```text
https://healthdesk-final-system.onrender.com/hello
```

## 3. Vercel Frontend

Create a Vercel project from the same repository.

Use these settings if deploying both guest and app under one Vercel project:

```text
Framework Preset: Other
Build Command: node scripts/write-vercel-runtime-config.mjs
Output Directory: src/main/resources/static
```

Set this Vercel environment variable:

```bash
HEALTHDESK_API_BASE_URL=https://<your-render-backend-domain>/api
```

For the current Render backend:

```bash
HEALTHDESK_API_BASE_URL=https://healthdesk-final-system.onrender.com/api
```

After Vercel deploys, open:

```text
https://<your-vercel-domain>/guest/
https://<your-vercel-domain>/app/login.html
```

### Separate Vercel Projects

If deploying the guest site and app site as separate Vercel projects, use the
same build command and environment variable, but different output directories.

Guest project:

```text
Build Command: node scripts/write-vercel-runtime-config.mjs
Output Directory: src/main/resources/static/guest
HEALTHDESK_API_BASE_URL=https://healthdesk-final-system.onrender.com/api
Open: https://healthdesk-guest.vercel.app/
Runtime config check: https://healthdesk-guest.vercel.app/js/runtime-config.js
```

App project:

```text
Build Command: node scripts/write-vercel-runtime-config.mjs
Output Directory: src/main/resources/static/app
HEALTHDESK_API_BASE_URL=https://healthdesk-final-system.onrender.com/api
Open: https://healthdesk-app-mu.vercel.app/login.html
Runtime config check: https://healthdesk-app-mu.vercel.app/js/runtime-config.js
```

The runtime config check should show:

```js
window.HEALTHDESK_API_BASE_URL = 'https://healthdesk-final-system.onrender.com/api';
```

## 4. Final CORS Update

After you know the Vercel domain, update Render:

```bash
APP_CORS_ALLOWED_ORIGINS=https://<your-vercel-domain>
```

Redeploy or restart the Render backend after changing environment variables.
