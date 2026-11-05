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
import { ConfigService } from '@nestjs/config';
import { createRedisConnection } from './config/redis-connection';


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
    BullModule.forRootAsync({
      imports: [AppConfigurationModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: createRedisConnection(config),
      }),
    }),
    PrismaModule, 
    AuthModule, BillingModule, CustomerModule, 
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}