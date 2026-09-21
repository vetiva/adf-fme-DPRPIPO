# Deploy to Vercel + Supabase

GitHub: [vetiva/adf-fme-DPRPIPO](https://github.com/vetiva/adf-fme-DPRPIPO)  
Custom domain: `adf-fme-DPRPIPO.com` (Azure DNS)

## 1. Supabase table (once)

1. Open your Supabase project → **SQL Editor**.
2. Paste and run [`supabase/schema.sql`](./supabase/schema.sql).
3. Confirm table `student_applications` under **Table Editor**.

## 2. Vercel environment variables

In [Vercel](https://vercel.com) → your project → **Settings → Environment Variables**.

Add these for **Production** (and Preview if you use preview deploys):

| Name | Value | Notes |
| --- | --- | --- |
| `SUPABASE_URL` | `https://uchldpjskfpteunzpvvs.supabase.co` | Project URL from Supabase → Settings → API |
| `SUPABASE_PUBLISHABLE_KEY` | *(your publishable key)* | Optional for this app |
| `SUPABASE_SERVICE_ROLE_KEY` | *(your service role key)* | **Secret.** Server only. Never put in the frontend. |
| `GOVERNMENT_VERIFY_MODE` | `mock` | Use `live` when the government API is ready |
| `GOVERNMENT_VERIFY_API_URL` | *(blank until live)* | Required only when mode is `live` |
| `GOVERNMENT_VERIFY_API_KEY` | *(blank until live)* | Required only when mode is `live` |
| `GOVERNMENT_VERIFY_TIMEOUT_MS` | `15000` | Optional |
| `IPO_REDIRECT_URL` | `https://ipo.vetiva.com/` | Post-submit redirect |

Tips:

- Mark `SUPABASE_SERVICE_ROLE_KEY` as **Sensitive**.
- After saving env vars, trigger a **Redeploy** so the new values apply.
- Do not commit real keys; they live only in Vercel / local `.env`.

## 3. Connect the Vercel project to GitHub

1. Vercel → **Add New… → Project** (or open the existing linked project).
2. Import `vetiva/adf-fme-DPRPIPO`.
3. **Root Directory**: leave as `.` (this repo *is* the app root).
4. Framework Preset: **Other**.
5. Build Command: `npm run build` (TypeScript check).
6. Output / Install: defaults are fine (`npm install`).
7. Deploy.

Confirm the GitHub integration is connected under **Settings → Git**.

## 4. Custom domain `adf-fme-DPRPIPO.com` (Azure DNS → Vercel)

### A. Add the domain in Vercel

1. Vercel project → **Settings → Domains**.
2. Add `adf-fme-DPRPIPO.com`.
3. Also add `www.adf-fme-DPRPIPO.com` if you want www (optional; redirect www → apex or the reverse).
4. Vercel will show the DNS records it expects (usually an **A** record for the apex and a **CNAME** for `www`).

Typical Vercel targets (confirm in the Domains UI — they can change):

| Host / name | Type | Value |
| --- | --- | --- |
| `@` (apex / root) | **A** | `76.76.21.21` |
| `www` | **CNAME** | `cname.vercel-dns.com` |

Use the exact values Vercel displays for your project.

### B. Create the records in Azure DNS

1. Azure Portal → **DNS zones** → select the zone for `adf-fme-DPRPIPO.com`  
   (If the domain is only in App Service Domains / registrar and not yet a DNS zone: create a **DNS zone** named `adf-fme-DPRPIPO.com`, then set the domain’s name servers at the registrar to Azure’s NS records.)
2. **+ Record set**:
   - Name: `@` (or blank) · Type: **A** · IP: Vercel’s apex A record (e.g. `76.76.21.21`) · TTL: 3600
   - Name: `www` · Type: **CNAME** · Alias: `cname.vercel-dns.com` (or the value Vercel shows) · TTL: 3600
3. Save. DNS can take a few minutes to a few hours.

### C. Verify in Vercel

1. Back in **Settings → Domains**, wait until the domain shows **Valid**.
2. Open `https://adf-fme-DPRPIPO.com` and `https://adf-fme-DPRPIPO.com/api/health`.
3. Submit the student form once and confirm a row in Supabase.

### Optional: HTTPS / www redirect

Vercel issues certificates automatically once DNS validates. In Domains, set the preferred redirect (apex ↔ www).

## 5. Smoke test checklist

- [ ] `GET https://adf-fme-DPRPIPO.com/api/health` → `{ "ok": true, ... }`
- [ ] Landing page loads with logos and form
- [ ] Form submit → Supabase row → redirect to `https://ipo.vetiva.com/`
- [ ] Service role key is **not** visible in browser Network payloads for static assets

## Security

If a service role key was shared in chat or email, **rotate it** in Supabase (**Project Settings → API**), then update Vercel env vars and redeploy.
