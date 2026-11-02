import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { AppConfigurationModule } from '../config/app-configuration.module';
import { BillingService } from './billing.service';
import { PrismaModule } from '../prisma/prisma.module';
import { InvoiceJobProcessor } from './processors/invoice.processor';
import { OutboxRecoveryService } from './outbox-recovery/outbox-recovery.service';
import { QueueRecovery } from './processors/queue-recovery';
import { TasksService } from './processors/queue-cron-recovery';

@Module({
  imports: [
    AppConfigurationModule,
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
  ],
  providers: [BillingService, InvoiceJobProcessor, OutboxRecoveryService, QueueRecovery, TasksService],
})
export class BillingWorkerModule {}
