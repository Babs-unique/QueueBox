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
  private recoveryInFlight = false;

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('InvoiceJob') private invoiceJobQueue: Queue,
  ) {}

  private async recoverOutboxByStatus(outboxStatus: 'PENDING' | 'FAILED'): Promise<void> {
    if (this.recoveryInFlight) {
      this.logger.debug(`Recovery already in flight for ${outboxStatus} outbox events; skipping duplicate run.`);
      return;
    }

    this.recoveryInFlight = true;

    try {
      const recoveryData: { events: any[]; jobs: any[] } | null = await this.prisma.$transaction(async (tx) => {
        const events: any[] = await tx.$queryRaw`
          SELECT * FROM "OutboxEvent"
          WHERE "status" = ${outboxStatus}
          FOR UPDATE SKIP LOCKED
        `;

        if (events.length === 0) {
          this.logger.log(`No ${outboxStatus.toLowerCase()} outbox events found for recovery.`);
          return null;
        }

        const billingOperationIds = events
          .map((event) => (event.payload as unknown as OutboxPayload)?.billingOperationId)
          .filter(Boolean);

        if (billingOperationIds.length === 0) {
          return null;
        }

        const matchingJobs = await tx.invoiceJob.findMany({
          where: {
            billingOperationId: { in: billingOperationIds },
            status: { in: ['QUEUED', 'FAILED'] },
          },
        });

        const outboxIds = events.map((event) => event.id);

        if (matchingJobs.length === 0) {
          this.logger.log(
            `Outbox entries exist for ${outboxStatus.toLowerCase()} state, but matching DB jobs were already processed.`,
          );
          await tx.outboxEvent.updateMany({
            where: { id: { in: outboxIds } },
            data: { status: 'PROCESSED' },
          });
          return null;
        }

        await tx.outboxEvent.updateMany({
          where: { id: { in: outboxIds } },
          data: { status: 'PROCESSING' },
        });

        return { events, jobs: matchingJobs };
      });

      if (!recoveryData) {
        return;
      }

      const jobs = recoveryData.jobs;
      const outboxIds = recoveryData.events.map((event) => event.id);

      const bulkJobs = jobs.map((job) => ({
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

      try {
        await this.invoiceJobQueue.addBulk(bulkJobs);
        await this.prisma.outboxEvent.updateMany({
          where: { id: { in: outboxIds } },
          data: { status: 'PROCESSED', attempts: { increment: 1 } },
        });
        this.logger.log(
          `Successfully recovered ${bulkJobs.length} individual jobs across ${outboxStatus.toLowerCase()} outbox events.`,
        );
      } catch (error) {
        await this.prisma.outboxEvent.updateMany({
          where: { id: { in: outboxIds } },
          data: {
            status: 'FAILED',
            attempts: { increment: 1 },
            lastError: error instanceof Error ? error.message : String(error),
          },
        });
        throw error;
      }
    } catch (error) {
      this.logger.error(`Error recovering ${outboxStatus.toLowerCase()} outbox events:`, error instanceof Error ? error.stack : error);
    } finally {
      this.recoveryInFlight = false;
    }
  }

  async recoverPendingOutbox(): Promise<void> {
    await this.recoverOutboxByStatus('PENDING');
  }

  async recoverFailedOutbox(): Promise<void> {
    await this.recoverOutboxByStatus('FAILED');
  }
}
