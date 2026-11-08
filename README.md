# QueueBox

QueueBox is a billing operations application. Users manage customers and submit billing runs; the backend creates invoice jobs, processes them through a Redis-backed queue, and exposes invoices, job status, and failed-job replay.

## Project layout

- [`frontend/`](./frontend/README.md) — React and TypeScript web application
- [`backend/`](./backend/README.md) — NestJS API, Prisma/PostgreSQL persistence, and BullMQ worker

## Requirements

- Node.js 22 or newer and npm
- Docker Desktop (or PostgreSQL and Redis running locally)

Install dependencies separately in each application directory using the commands below.

## Local development

To start the full application with Docker, run `docker compose up --build` from the repository root. Open `http://localhost:8443`. The stack starts PostgreSQL, Redis, applies database migrations, and launches the API and worker. The Compose file uses local-development credentials and secrets only; override them for local use and do not use the defaults in production. See the [Docker guide](./backend/README.Docker.md).

1. For direct Node.js development, start only PostgreSQL and Redis from the repository root with `docker compose up -d db redis`. PostgreSQL is available on port `5434`; Redis is available on `6379`.
2. Configure `backend/.env` with a `DATABASE_URL` pointing to `localhost:5434`, plus `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`. Set Redis to `localhost:6379` with `REDIS_HOST` and `REDIS_PORT`, or configure `REDIS_URL`.
3. From `backend/`, install dependencies, generate the Prisma client, apply migrations, then start the API and worker in separate terminals:

   ```bash
   npm install
   npm run prisma:generate
   npm run prisma:migrate
   npm run start:dev
   ```

   ```bash
   npm run start:worker:dev
   ```

   The API listens on port `3000` by default. Set `PORT` to change it. By default, credentialed CORS allows the frontend at `http://localhost:8443`; set `FRONTEND_URL` if the frontend uses a different origin.
4. From `frontend/`, install dependencies and start Vite:

   ```bash
   npm install
   npm run dev
   ```

   Vite uses port `8443` by default. Set `VITE_API_URL` if the API is not at `http://localhost:3000`.

The frontend uses HTTP-only authentication cookies and sends credentialed requests. Keep the frontend origin, `FRONTEND_URL`, and API URL aligned for local development.

## API overview

Successful API responses use the standard `{ statusCode, success, data }` envelope.

| Area | Routes |
| --- | --- |
| Authentication | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`; `GET /auth/me`; `PATCH /auth/:id`; `DELETE /auth/:id` |
| Customers | `GET` and `POST /customers`; `GET`, `PATCH`, and `DELETE /customers/:id` |
| Billing | `GET /billings`, `/billings/:id`, `/billings/invoices`, `/billings/jobs`; `POST /billings`; `POST /billings/dlq/:id/replay` |

Billing submission requires an `X-Idempotency-Key` header. The API details and scripts are documented in the [backend guide](./backend/README.md).

## Checks

- Frontend production build: `cd frontend && npm run build`
- Frontend UI tests: start the Vite server, then run `npm run test:ui` from `frontend/` with `TEST_BASE_URL=http://localhost:8443` set in the environment (PowerShell: `$env:TEST_BASE_URL = "http://localhost:8443"`)
- Backend build and tests: `cd backend && npm run build` and `npm test`

See the [frontend guide](./frontend/README.md) and [backend guide](./backend/README.md) for application-specific commands and structure.
