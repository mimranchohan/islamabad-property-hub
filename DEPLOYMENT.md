# 🚀 Deployment Guide — Islamabad Property Hub

Next.js 16 + Prisma 7 + Supabase (Postgres) + NextAuth v5, deployed on Vercel.

---

## ⚠️ Step 0 — Security first (zaroori, sab se pehle)

Purana database password git history me leak ho chuka tha. Code se hata diya gaya hai,
lekin history se nahi jata — isliye password **rotate** karna zaroori hai.

1. **Supabase password reset karein**
   Supabase Dashboard → Settings → Database → **Reset database password**
   → naya password copy karein.

2. **`.env` ki dono URLs me naya password daalein** (`DATABASE_URL` aur `DIRECT_URL`).
   Agar password me `@ ! # $` jaise characters hain to URL-encode karein
   (`@` → `%40`, `!` → `%21`, `#` → `%23`).

3. **Purani dead files git se hata dein:**
   ```bash
   git rm prisma/seed.ts prisma/dev.db
   git commit -m "chore: remove deprecated sqlite seed + dev.db"
   ```

---

## Step 1 — Environment variables

`.env` (local) aur Vercel dono me yeh same honi chahiye:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase pooled URL (port **6543**, `?pgbouncer=true`) — runtime |
| `DIRECT_URL` | Supabase session URL (port **5432**) — migrations/seed |
| `AUTH_SECRET` | `openssl rand -base64 32` se generate |
| `NEXTAUTH_SECRET` | same value as `AUTH_SECRET` |
| `NEXTAUTH_URL` | `https://<your-app>.vercel.app` |
| `AUTH_TRUST_HOST` | `true` |
| `CRON_SECRET` | `openssl rand -base64 24` se generate |
| `NEXT_PUBLIC_SUPABASE_URL` | public, safe |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public, safe |

> Naye secrets generate karne ke liye:
> ```bash
> openssl rand -base64 32   # AUTH_SECRET
> openssl rand -base64 24   # CRON_SECRET
> ```

---

## Step 2 — Local par test

```bash
npm install
npm run db:push     # schema Supabase par bana deta hai
npm run db:seed     # super admin banata hai
npm run build       # production build verify
npm run start       # http://localhost:3000
```

Login: `changeyurstyle@gmail.com` / `admin123` → **foran password change karein.**

---

## Step 3 — Database setup (Supabase par)

```bash
npm run db:push     # tables banata hai (User, Property, Sector, ActivityLog, Backup)
npm run db:seed     # super admin seed
```

`db:push` `DIRECT_URL` (port 5432) use karta hai — yeh sahi hona zaroori hai.

---

## Step 4 — Vercel par deploy

1. Code GitHub par push karein.
2. Vercel par repo import karein.
3. **Settings → Environment Variables** me Step 1 ki saari values daalein
   (Production + Preview dono).
4. **Deploy** dabayein.
5. Framework auto-detect (Next.js). Build command: `next build` (default).

### Cron job
`vercel.json` me already configured hai:
- `/api/admin/backup/auto` — roz raat 2 baje (auto backup record).
Vercel automatically `Authorization: Bearer <CRON_SECRET>` header bhejta hai, isliye
`CRON_SECRET` Vercel env me set hona zaroori hai warna 401 aayega.

---

## Step 5 — Go-live checklist

- [ ] Supabase password rotate ho gaya
- [ ] Saari env vars Vercel me set hain
- [ ] `db:push` + `db:seed` chal gaye
- [ ] `npm run build` bina error pass hua
- [ ] Login chal raha hai, admin password change ho gaya
- [ ] `prisma/seed.ts` aur `prisma/dev.db` git se delete ho gaye
- [ ] Security headers/CSP active (already `next.config.ts` me set hain)

---

## Roles
- **Super Admin** (`changeyurstyle@gmail.com`): sirf yeh admins add/remove kar sakta hai
- **ADMIN**: agents manage, backups, sectors, sab properties
- **AGENT**: apni properties manage; default `isActive=false` (admin approve karta hai)

## Useful commands
```bash
npm run dev         # local dev server
npm run db:studio   # Prisma Studio (DB GUI)
npm run lint        # ESLint
```
