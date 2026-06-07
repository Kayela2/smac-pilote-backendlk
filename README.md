# SMAC-PILOTE — API

Node.js + Express + PostgreSQL backend for the SMAC-PILOTE React app.
It implements the exact contracts the frontend services expect.

## Stack

- **Express 4** — HTTP routing
- **PostgreSQL** (`pg`) — persistence
- **JWT** (`jsonwebtoken`) — stateless auth, `bcryptjs` for password hashing
- **TypeScript** — run with `tsx` in dev, compiled with `tsc` for production

## Setup

```bash
cd server
npm install
cp .env.example .env   # then edit credentials
npm run db:seed        # creates the schema + demo data (DESTRUCTIVE)
npm run dev            # starts the API on http://localhost:8080
```

### Database connection

`.env` defaults to a **local Unix socket with peer authentication**
(`DB_HOST=/var/run/postgresql`) — no password needed when the OS user matches
the PostgreSQL role. For a TCP connection set `DB_HOST=localhost` and provide
`DB_USER` / `DB_PASSWORD`.

The target database (`DB_NAME`, default `smac_pilote_database`) must already
exist and be writable by `DB_USER`.

## Scripts

| Command             | Description                         |
|---------------------|-------------------------------------|
| `npm run dev`       | Start with hot reload (`tsx watch`) |
| `npm run build`     | Compile TypeScript to `dist/`       |
| `npm start`         | Run the compiled build              |
| `npm run typecheck` | Type-check without emitting         |
| `npm run db:seed`   | Drop, recreate and seed all tables  |

## Demo accounts

| Matricule | Password | Role  |
|-----------|----------|-------|
| 10001     | pass01   | ADMIN |
| 10002     | pass02   | USER  |

## API

All routes are prefixed with `/api`. Every response uses the envelope
`{ data, message, type }` where `type` is `SUCCESS | ERROR | WARNING | INFO`.

| Method | Route                            | Auth | Description                       |
|--------|----------------------------------|------|-----------------------------------|
| GET    | `/api/health`                    | —    | Liveness + DB connectivity probe  |
| POST   | `/api/auth/login`                | —    | `{ login, password }` → token     |
| POST   | `/api/auth/logout`               | —    | Stateless no-op                   |
| GET    | `/api/auth/check`                | ✓    | Validate the bearer token         |
| GET    | `/api/users`                     | ✓    | List user profiles                |
| GET    | `/api/users/:id/photo`           | ✓    | Profile picture (id or matricule) |
| GET    | `/api/chantiers?page&size`        | ✓    | Paginated chantiers                |
| GET    | `/api/chantiers/:id`              | ✓    | Single chantier (or `null`)        |
| GET    | `/api/chantiers/:id/intervenants` | ✓    | Chantier intervenants              |
| GET    | `/api/actions?page&size`           | ✓    | Paginated actions                   |
| GET    | `/api/actions/:id`                 | ✓    | Single action (or `null`)           |

Protected routes require an `Authorization: Bearer <token>` header.

## Schema

`users`, `chantiers`, `chantier_intervenants`, `actions`, `action_predecessors`.
The full DDL lives in [`src/db/schema.ts`](src/db/schema.ts).
