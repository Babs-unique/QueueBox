import type { ConfigService } from '@nestjs/config';
import type { RedisOptions } from 'bullmq';

function decodeCredential(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new Error('Invalid environment configuration: REDIS_URL contains invalid credentials.');
  }
}

export function parseRedisUrl(redisUrl: string): RedisOptions {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(redisUrl);
  } catch {
    throw new Error('Invalid environment configuration: REDIS_URL must be a valid Redis URL.');
  }

  if (!['redis:', 'rediss:'].includes(parsedUrl.protocol) || !parsedUrl.hostname) {
    throw new Error('Invalid environment configuration: REDIS_URL must use redis:// or rediss://.');
  }

  const port = parsedUrl.port ? Number(parsedUrl.port) : 6379;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Invalid environment configuration: REDIS_URL has an invalid port.');
  }

  let db: number | undefined;
  if (parsedUrl.pathname && parsedUrl.pathname !== '/') {
    if (!/^\/\d+$/.test(parsedUrl.pathname)) {
      throw new Error('Invalid environment configuration: REDIS_URL has an invalid database number.');
    }

    db = Number(parsedUrl.pathname.slice(1));
  }

  const connection: RedisOptions = {
    host: parsedUrl.hostname,
    port,
    enableOfflineQueue: false,
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    connectTimeout: 1000,
  };

  if (parsedUrl.username) {
    connection.username = decodeCredential(parsedUrl.username);
  }
  if (parsedUrl.password) {
    connection.password = decodeCredential(parsedUrl.password);
  }
  if (db !== undefined) {
    connection.db = db;
  }
  if (parsedUrl.protocol === 'rediss:') {
    connection.tls = {};
  }

  return connection;
}

export function createRedisConnection(config: ConfigService): RedisOptions {
  const redisUrl = config.get<string>('REDIS_URL');
  if (redisUrl) {
    return parseRedisUrl(redisUrl);
  }

  const portValue = config.get<string>('REDIS_PORT');
  const port = portValue ? Number(portValue) : 6379;
  const connection: RedisOptions = {
    host: config.get<string>('REDIS_HOST') || 'localhost',
    port,
    enableOfflineQueue: false,
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    connectTimeout: 1000,
  };

  const password = config.get<string>('REDIS_PASSWORD');
  if (password) {
    connection.password = password;
  }

  return connection;
}
