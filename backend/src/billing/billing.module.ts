import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { join } from 'node:path' 
import { InvoiceDlqReplayService } from './invoice-dlq-replay/invoice-dlq-replay.service';

@Module({
    imports: [
        PrismaModule,
        BullModule.registerQueue({
            name: 'InvoiceJob',
        }),
    ],
    controllers: [BillingController],
    providers: [BillingService, InvoiceDlqReplayService],
})
export class BillingModule {}
