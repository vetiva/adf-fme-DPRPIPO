# Student Opportunity Initiative — application

Express API + static landing page. Student rows are written to Supabase via the **service role** key (server-side only).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local server (http://localhost:3080) |
| `npm run build` / `npm run typecheck` | TypeScript check (Vercel build) |

See [DEPLOYMENT.md](./DEPLOYMENT.md).

## API

### `POST /api/v1/student-applications`

```json
{ "university": "University of Lagos", "matric": "CSC/2021/001", "surname": "Adeyemi" }
```

Success `201`: `{ "ok": true, "applicationId": "…", "redirectUrl": "https://ipo.vetiva.com/" }`
