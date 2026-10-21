import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { join } from 'node:path' 

@Module({
    imports: [
        PrismaModule,
        BullModule.registerQueue({
            name: 'InvoiceJob',
        }),
    ],
    controllers: [BillingController],
    providers: [BillingService],
})
export class BillingModule {}
