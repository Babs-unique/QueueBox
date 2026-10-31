import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';

interface OutboxPayload {
  billingOperationId: string;
}

@Injectable()
export class OutboxRecoveryService {
  private readonly logger = new Logger(OutboxRecoveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('InvoiceJob') private invoiceJobQueue: Queue,
  ) {}

  async recoverPendingOutbox(): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const pendingOutboxEvents: any[] = await tx.$queryRaw`
          SELECT * FROM "OutboxEvent" 
          WHERE "status" = 'PENDING' 
          FOR UPDATE SKIP LOCKED
        `;

        if (pendingOutboxEvents.length === 0) {
          this.logger.log('No pending outbox events found for recovery.');
          return;
        }

        const billingOperationIds = pendingOutboxEvents
          .map((event) => (event.payload as unknown as OutboxPayload)?.billingOperationId)
          .filter(Boolean);

        if (billingOperationIds.length === 0) return;

        const pendingDbJobs = await tx.invoiceJob.findMany({
          where: {
            billingOperationId: { in: billingOperationIds },
            status: 'QUEUED',
          },
        });

        const outboxIds = pendingOutboxEvents.map((e) => e.id);

        if (pendingDbJobs.length === 0) {
          this.logger.log('Outbox entries exist, but matching pending DB jobs were already processed.');
          
          await tx.outboxEvent.updateMany({
            where: { id: { in: outboxIds } },
            data: { status: 'PROCESSED' },
          });
          return;
        }

        const bulkJobs = pendingDbJobs.map((job) => ({
          name: 'process-invoice',
          data: {
            invoiceJobId: job.id,
            customerId: job.customerId,
            billingOperationId: job.billingOperationId,
          },
          opts: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: true,
          },
        }));

        await this.invoiceJobQueue.addBulk(bulkJobs);

        await tx.outboxEvent.updateMany({
          where: { id: { in: outboxIds } },
          data: { status: 'PROCESSED' },
        });

        this.logger.log(`Successfully recovered ${bulkJobs.length} individual jobs across pending outbox events.`);
      });
    } catch (e) {
      this.logger.error('Error recovering pending outbox events:', e?.stack || e);
    }
  }

  async recoverFailedOutbox(): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const failedOutboxEvents: any[] = await tx.$queryRaw`
          SELECT * FROM "OutboxEvent" 
          WHERE "status" = 'FAILED' 
          FOR UPDATE SKIP LOCKED
        `;

        if (failedOutboxEvents.length === 0) {
          this.logger.log('No failed outbox events found for recovery.');
          return;
        }

        const billingOperationIds = failedOutboxEvents
          .map((event) => (event.payload as unknown as OutboxPayload)?.billingOperationId)
          .filter(Boolean);

        if (billingOperationIds.length === 0) return;

        const failedDbJobs = await tx.invoiceJob.findMany({
          where: {
            billingOperationId: { in: billingOperationIds },
            status: { in: ['QUEUED', 'FAILED'] },
          },
        });

        const outboxIds = failedOutboxEvents.map((e) => e.id);

        if (failedDbJobs.length === 0) {
          this.logger.log('Failed outbox entries exist, but matching DB jobs were already processed.');
          
          await tx.outboxEvent.updateMany({
            where: { id: { in: outboxIds } },
            data: { status: 'PROCESSED' },
          });
          return;
        }

        const bulkJobs = failedDbJobs.map((job) => ({
          name: 'process-invoice',
          data: {
            invoiceJobId: job.id,
            customerId: job.customerId,
            billingOperationId: job.billingOperationId,
          },
          opts: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: true,
          },
        }));

        await this.invoiceJobQueue.addBulk(bulkJobs);

        await tx.outboxEvent.updateMany({
          where: { id: { in: outboxIds } },
          data: { status: 'PROCESSED' },
        });

        this.logger.log(`Successfully recovered ${bulkJobs.length} individual jobs across failed outbox events.`);
      });
    } catch (e) {
      this.logger.error('Error recovering failed outbox events:', e?.stack || e);
    }
  }
}
