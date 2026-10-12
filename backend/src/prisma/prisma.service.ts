import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(private readonly configService?: ConfigService) {
    const connectionString =
      configService?.get<string>('DATABASE_URL') ??
      process.env.DATABASE_URL ??
      'postgresql://postgres:postgres@localhost:5432/postgres';

    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }
}