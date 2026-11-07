# Frontend Docker setup

The checked-in frontend Docker setup is a development template, but it does not currently run as configured:

- The Dockerfile runs `npm ci --omit=dev`, but Vite is a development dependency, so `npm run dev` does not have its executable installed.
- The Compose file publishes host port `5173` to container port `5173`, while Vite's default port is `8443`.

For local development, use `npm run dev` on the host as described in the [frontend guide](./README.md). To make the container setup usable, install development dependencies in the Dockerfile and either set `PORT=5173` in the container environment or change the Compose port mapping to match Vite's port.

The frontend Dockerfile is not a production static-site deployment configuration.
