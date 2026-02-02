# BE
back-end

## DB: Prisma + PostgreSQL

This backend uses **Prisma** with **PostgreSQL** (no MySQL).

### Setup

1. **Environment**
   - Copy `.env.example` to `.env`.
   - Set `DATABASE_URL` to your PostgreSQL connection string, e.g.:
     ```bash
     DATABASE_URL="postgresql://favorite_photo_vjd6_user:4GXHHzBiMCY1lpmeb1VBI96Ya7W7WYQK@dpg-d6023uali9vc73alkfg0-a.singapore-postgres.render.com/favorite_photo_vjd6"
     ```

2. **Install and generate Prisma client**
   ```bash
   npm install
   ```
   (Runs `prisma generate` via `postinstall`.)

3. **Create schema in the database**
   - First time (creates tables):
     ```bash
     npx prisma db push
     ```
   - Or use migrations:
     ```bash
     npx prisma migrate dev --name init
     ```

4. **Run the server**
   ```bash
   npm run dev
   ```

### Scripts

- `npm run start` — run server
- `npm run dev` — run with nodemon
- `npm run db:push` — push schema to DB (no migration history)
- `npm run db:migrate` — run pending migrations (e.g. in production)
- `npm run db:studio` — open Prisma Studio

### Deploy on Render

- **Start Command:** `npm start` (or `node src/server.js`). Do **not** use `node src/app.js`.
- **Environment variables:** Render does **not** use your local `.env` (it’s not in the deploy). Set them in the dashboard:
  - **Dashboard → your Web Service → Environment** → Add environment variables.
  - **Required:** `DATABASE_URL` = your PostgreSQL connection string (e.g. from Render’s PostgreSQL service: use the **Internal** or **External** URL).
  - Also set if you use them: `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL`, `CORS_ORIGIN`, `BACKEND_PUBLIC_URL`.  
  - `PORT` is set by Render; you can leave it unset.
- After adding `DATABASE_URL`, save and redeploy. If the database is new, run `npx prisma db push` once (e.g. from your machine with the same `DATABASE_URL`) to create tables.

### If you see connection errors

- Ensure PostgreSQL is running and reachable at the host/port in `DATABASE_URL`.
- For local Docker PostgreSQL, start the container and use its host/port in `DATABASE_URL`.
