import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigurationModule } from './config/app-configuration.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module'; 
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq'
import { BillingController } from './billing/billing.controller';
import { BillingService } from './billing/billing.service';
import { BillingModule } from './billing/billing.module';
import { CustomerController } from './customer/customer.controller';
import { CustomerService } from './customer/customer.service';
import { CustomerModule } from './customer/customer.module';
import { ConfigService } from '@nestjs/config'


@Module({
  imports: [
    AppConfigurationModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
        maxRetryRequest: 3,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        connectionTimeout: 1000,
        disconnectTimeout: 2000,
        enableOfflineQueue: false
      },
    }),
    PrismaModule, 
    AuthModule, BillingModule, CustomerModule, 
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}