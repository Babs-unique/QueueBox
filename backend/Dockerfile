# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.16.0

# =========================
# Build stage
# =========================
FROM node:${NODE_VERSION}-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

RUN npm run build


# =========================
# Production stage
# =========================
FROM node:${NODE_VERSION}-alpine AS production

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/generated ./generated

RUN mkdir -p storage/tmp storage/files \
    && chown -R node:node /usr/src/app

EXPOSE 3000

USER node

CMD ["npm", "run", "start:prod"]