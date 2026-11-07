# Backend Docker setup

The [`compose.yaml`](./compose.yaml) file starts PostgreSQL and Redis only. It does not build or run the NestJS API or worker; run those with the npm scripts in the [backend guide](./README.md).

## Start the local dependencies

From `backend/`, provide the Compose variables `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `REDIS_PASSWORD`, then run:

```bash
docker compose up -d
```

PostgreSQL is published on host port `5434` and Redis on `6379`. The PostgreSQL container listens internally on `5432`; use the host port in a local `DATABASE_URL`, for example `localhost:5434`. Configure the backend's Redis settings to match the Redis container, including the same password.

To stop the services without deleting persisted data:

```bash
docker compose down
```

The database and Redis data are stored in named Docker volumes. Removing volumes is destructive and will delete the local data.

## API image

The backend Dockerfile builds the NestJS application and starts the compiled API. The application defaults to port `3000`, while the image declares `3040` as its exposed port; set `PORT=3040` in the container environment when using that declared port. The API image also needs reachable PostgreSQL and Redis services and the required backend environment variables. The Compose file in this directory does not configure or launch that API image.
