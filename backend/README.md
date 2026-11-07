# QueueBox backend

NestJS API and standalone queue worker for QueueBox. The API uses Prisma with PostgreSQL for persistence and BullMQ with Redis to process invoice jobs.

## Requirements

- Node.js 22 or newer and npm
- PostgreSQL
- Redis

## Configure

Create `backend/.env` and set:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection URL |
| `JWT_ACCESS_SECRET` | Yes | Signs access tokens |
| `JWT_REFRESH_SECRET` | Yes | Signs refresh tokens |
| `REDIS_URL` | Production | Redis URL (`redis://` or `rediss://`) |
| `REDIS_HOST` | No | Redis host when `REDIS_URL` is not set; defaults to `localhost` |
| `REDIS_PORT` | No | Redis port when `REDIS_URL` is not set; defaults to `6379` |
| `REDIS_PASSWORD` | No | Redis password when using host/port configuration |
| `PORT` | No | API port; defaults to `3000` |
| `FRONTEND_URL` | No | Allowed credentialed CORS origin; defaults to `http://localhost:8443` |
| `COOKIE_SECRET` | No | Signs cookies |

Do not commit environment files or production secrets. For local PostgreSQL and Redis containers, see [Docker setup](./README.Docker.md).

## Install, migrate, and run

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

The API listens on port `3000` by default. Run the standalone invoice worker in a separate terminal:

```bash
npm run start:worker:dev
```

Both processes need access to the same PostgreSQL database and Redis instance.

## API

Successful responses are wrapped as `{ statusCode, success, data }`. Authentication uses HTTP-only cookies; the frontend must send credentialed requests and the configured `FRONTEND_URL` must match its origin.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/auth/register` | Register an account |
| `POST` | `/auth/login` | Sign in |
| `POST` | `/auth/refresh` | Refresh the session |
| `POST` | `/auth/logout` | Sign out |
| `GET` | `/auth/me` | Get the current account |
| `PATCH` | `/auth/:id` | Update the current account |
| `DELETE` | `/auth/:id` | Delete the current account |
| `GET`, `POST` | `/customers` | List or create customers |
| `GET`, `PATCH`, `DELETE` | `/customers/:id` | Read, update, or delete a customer |
| `GET` | `/billings` | List billing operations |
| `GET` | `/billings/:id` | Read a billing operation |
| `GET` | `/billings/invoices` | List invoices |
| `GET` | `/billings/jobs` | List invoice jobs |
| `POST` | `/billings` | Submit a billing operation |
| `POST` | `/billings/dlq/:id/replay` | Replay a failed invoice job |

Billing submission requires an `X-Idempotency-Key` header. Protected routes are scoped to the authenticated user.

## Scripts

- `npm run build` — compile the API and worker
- `npm run start:dev` — run the API in watch mode
- `npm run start:worker:dev` — run the worker in watch mode
- `npm run start:prod` — run the compiled API
- `npm run start:worker:prod` — run the compiled worker
- `npm test` — run unit tests
- `npm run test:e2e` — run end-to-end tests
- `npm run test:cov` — run tests with coverage
- `npm run prisma:studio` — open Prisma Studio
