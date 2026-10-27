import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'
import { BullModule } from '@nestjs/bullmq';
import { BillingService } from './billing.service';
import { PrismaModule } from '../prisma/prisma.module';
import { InvoiceJobProcessor } from './processors/invoice.processor';
// import { join } from 'node:path';
// import { pathToFileURL } from 'node:url'

@Module({
  imports: [
    PrismaModule,
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
      envFilePath: '.env' 
    })
  ],
  providers: [BillingService, InvoiceJobProcessor],
})
export class BillingWorkerModule {}
