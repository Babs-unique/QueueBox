import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { parseRedisUrl } from './redis-connection';

function validateEnvironment(environment: Record<string, unknown>): Record<string, unknown> {
  const databaseUrl = environment.DATABASE_URL;
  if (typeof databaseUrl !== 'string' || databaseUrl.trim().length === 0) {
    throw new Error('Invalid environment configuration: DATABASE_URL is required.');
  }

  let parsedDatabaseUrl: URL;
  try {
    parsedDatabaseUrl = new URL(databaseUrl);
  } catch {
    throw new Error('Invalid environment configuration: DATABASE_URL must be a valid PostgreSQL URL.');
  }

  if (!['postgres:', 'postgresql:'].includes(parsedDatabaseUrl.protocol)) {
    throw new Error('Invalid environment configuration: DATABASE_URL must use PostgreSQL.');
  }

  const redisUrl = environment.REDIS_URL;
  if (typeof redisUrl === 'string' && redisUrl.trim().length > 0) {
    parseRedisUrl(redisUrl);
  } else if (environment.NODE_ENV === 'production') {
    throw new Error('Invalid environment configuration: REDIS_URL is required in production.');
  }

  const redisPort = environment.REDIS_PORT;
  if (redisPort !== undefined && redisPort !== '') {
    const parsedRedisPort = Number(redisPort);
    if (!Number.isInteger(parsedRedisPort) || parsedRedisPort < 1 || parsedRedisPort > 65535) {
      throw new Error('Invalid environment configuration: REDIS_PORT must be an integer from 1 to 65535.');
    }
  }

  const port = environment.PORT;
  if (port !== undefined && port !== '') {
    const parsedPort = Number(port);
    if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
      throw new Error('Invalid environment configuration: PORT must be an integer from 1 to 65535.');
    }
  }

  const nodeEnvironment = environment.NODE_ENV;
  if (
    nodeEnvironment !== undefined &&
    !['development', 'production', 'test'].includes(String(nodeEnvironment))
  ) {
    throw new Error('Invalid environment configuration: NODE_ENV must be development, production, or test.');
  }

  return environment;
}

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnvironment,
    }),
  ],
  exports: [ConfigModule],
})
export class AppConfigurationModule {}
