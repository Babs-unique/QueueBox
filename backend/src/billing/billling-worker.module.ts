import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { BillingService } from './billing.service';
import { PrismaModule } from '../prisma/prisma.module';
import { InvoiceJobProcessor } from './processors/invoice.processor';
import { OutboxRecoveryService } from './outbox-recovery/outbox-recovery.service';
import { QueueRecovery } from './processors/queue-recovery';
import { TasksService } from './processors/queue-cron-recovery';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'InvoiceJob',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  providers: [BillingService, InvoiceJobProcessor, OutboxRecoveryService, QueueRecovery, TasksService],
})
export class BillingWorkerModule {}
