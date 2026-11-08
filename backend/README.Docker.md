# Docker Compose

Run the complete local stack from the repository root:

```bash
docker compose up --build
```

This starts PostgreSQL, Redis, applies pending Prisma migrations, and runs the API, worker, and frontend. Open the frontend at `http://localhost:8443`; the API is available at `http://localhost:3000`. The database and Redis ports are published at `5434` and `6379` for local tools.

The stack uses local-only default database credentials and JWT/cookie secrets for convenience. Override them with environment variables for local customization; never use the defaults in a deployed environment.

Stop the stack and keep its data:

```bash
docker compose down
```

PostgreSQL and Redis data persist in named volumes.
