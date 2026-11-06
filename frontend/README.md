# QueueBox frontend

React 19, TypeScript, Vite, React Router, and Redux Toolkit Query frontend for QueueBox.

## Development

Install dependencies and run the Vite development server:

```bash
npm install
npm run dev
```

Set `VITE_API_URL` to the NestJS API origin when it is not running at
`http://localhost:3000`. The backend must allow the frontend origin through
credentialed CORS; set its `FRONTEND_URL` environment variable when the default
`http://localhost:8443` is not correct. Authentication uses HTTP-only cookies.

```bash
npm run build
npm run test:ui
```

## Structure

- `src/api` — shared RTK Query base API, cookie credentials, and token refresh
- `src/app` — Redux store setup
- `src/features/auth` — login, registration, account, and session endpoints
- `src/features/customers` — customer CRUD endpoints
- `src/features/billing` — billing operations, invoices, jobs, submission, and dead-letter replay
- `src/pages` — landing, account, and workspace routes
- `src/routes.tsx` and `src/Protected.tsx` — browser route definitions and session protection

The backend exposes authenticated customer, billing-operation, invoice, and
invoice-job endpoints. Authentication uses HTTP-only cookies, with refresh
handled centrally by RTK Query.
