# MastPlayer Admin Panel

Separate admin frontend for `https://admin.mastplayer.in`, backed by the existing MastPlayer API under `/api/admin/*`.

## Local development

### Backend

```bash
cd Backend
# Ensure ADMIN_* vars exist in .env (see .env.example)
npm install
npm run admin:create -- --email=you@example.com --password='YourStrongPass' --name='Super Admin'
npm run dev
```

### Admin frontend

```bash
cd mastplayer-admin
npm install
npm run dev
# → http://localhost:5174
```

Login at `/login` with the super admin credentials.

## Production notes

- Set `ADMIN_FRONTEND_URL=https://admin.mastplayer.in` and include it in CORS (also auto-allowed).
- Set a strong `ADMIN_2FA_ENCRYPTION_KEY` (32+ chars).
- Deploy `mastplayer-admin` to Vercel with `VITE_API_URL=https://api.mastplayer.in/api`.
- Point DNS `admin.mastplayer.in` → Vercel.
- Restart API with PM2 after pull/build so new `/api/admin` routes load.
