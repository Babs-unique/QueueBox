# Frontend with Docker Compose

The root Compose file starts the frontend together with the backend API, worker, PostgreSQL, and Redis:

```bash
docker compose up --build
```

Open `http://localhost:8443`. This is a Vite development server intended for local development, not a production static-site image. See the [frontend guide](./README.md) for running Vite directly with npm.
