# BE
back-end

## DB: Prisma + PostgreSQL

This backend uses **Prisma** with **PostgreSQL** (no MySQL).

### Setup

1. **Environment**
   - Copy `.env.example` to `.env`.
   - Set `DATABASE_URL` to your PostgreSQL connection string, e.g.:
     ```bash
     DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
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

### If you see connection errors

- Ensure PostgreSQL is running and reachable at the host/port in `DATABASE_URL`.
- For local Docker PostgreSQL, start the container and use its host/port in `DATABASE_URL`.
