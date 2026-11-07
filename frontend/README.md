# QueueBox frontend

React 19 and TypeScript web app built with Vite. Navigation uses React Router's browser router; Redux Toolkit Query handles API requests and cache updates.

## Development

```bash
npm install
npm run dev
```

Vite listens on `http://localhost:8443` by default. Set `VITE_API_URL` if the API is not at `http://localhost:3000`. The backend must allow this frontend origin through credentialed CORS; configure its `FRONTEND_URL` when the origin differs from the default.

Authentication uses HTTP-only cookies. The shared RTK Query base API includes credentials and attempts session refresh on an unauthorized response.

## Routes and features

- `/` — public landing page
- `/login` and `/register` — account access
- Protected workspace routes — `/overview`, `/operations`, `/operations/:id`, `/customers`, `/invoices`, `/jobs`, `/failed`, and `/settings`

The route definitions and protected layout are in `src/routes.tsx` and `src/Protected.tsx`.

## Source structure

- `src/api` — shared RTK Query base API and response handling
- `src/app` — Redux store
- `src/features/auth` — authentication and account API endpoints
- `src/features/customers` — customer API endpoints
- `src/features/billing` — billing operations, invoices, jobs, and failed-job replay
- `src/pages` — landing, authentication, and workspace screens

Workspace data is loaded from the backend API. Billing submission requires an `X-Idempotency-Key`; the backend API guide documents the endpoints and response envelope.

## Build and UI tests

```bash
npm run build
```

Start the Vite server before running Playwright UI tests. The test configuration defaults to port `3000`, so set `TEST_BASE_URL` to the Vite URL unless the server is running on that port:

```sh
TEST_BASE_URL=http://localhost:8443 npm run test:ui
```

In PowerShell, set the variable before running the test command:

```powershell
$env:TEST_BASE_URL = "http://localhost:8443"
npm run test:ui
```

Other scripts: `npm run preview` serves a production build locally, and `npm run format` formats source files with Oxfmt.
