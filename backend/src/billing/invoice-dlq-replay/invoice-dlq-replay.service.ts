import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';

// Define the exact payload contract your worker requires
interface InvoiceJobPayload {
  invoiceJobId: string;
  billingOperationId: string;
  customerId: string;
}

@Injectable()
export class InvoiceDlqReplayService {
  private readonly logger = new Logger(InvoiceDlqReplayService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('InvoiceJob') private readonly invoiceQueue: Queue<InvoiceJobPayload>
  ) {}

  /**
   * Replays a single permanently failed job from the DLQ, passing the full context payload
   */
  async replayJob(dlqRecordId: string): Promise<{ success: boolean; newQueueJobId: string }> {
    this.logger.log(`Initiating manual replay for DLQ Record ID: ${dlqRecordId}`);

    // 1. Fetch DLQ record
    const dlqRecord = await this.prisma.invoiceJobDlq.findUnique({
      where: { id: dlqRecordId },
    });

    if (!dlqRecord) {
      throw new NotFoundException(`DLQ record with ID ${dlqRecordId} not found`);
    }

    if (dlqRecord.status !== 'FAILED_PERMANENTLY') {
      throw new BadRequestException(
        `Job cannot be replayed. Current DLQ status is ${dlqRecord.status}, expected FAILED_PERMANENTLY`
      );
    }

    const { invoiceJobId } = dlqRecord;

    // 2. Fetch the target business job to obtain relational contexts needed by the queue processor
    const invoiceJob = await this.prisma.invoiceJob.findUnique({
      where: { id: invoiceJobId },
    });

    if (!invoiceJob) {
      throw new NotFoundException(`Associated InvoiceJob ${invoiceJobId} no longer exists in the system`);
    }

    const { billingOperationId, customerId } = invoiceJob;

    // 3. Perform safe, atomic database transformations
    await this.prisma.$transaction(async (tx) => {
      // Transition DLQ tracking state
      await tx.invoiceJobDlq.update({
        where: { id: dlqRecordId },
        data: {
          status: 'REPLAYING',
          replayCount: { increment: 1 },
          lastReplayAt: new Date(),
        },
      });

      // Revert status to QUEUED
      await tx.invoiceJob.update({
        where: { id: invoiceJobId },
        data: {
          status: 'QUEUED', 
          lastError: null,
        },
      });

      // Rewind parent counters safely
      await tx.billingOperation.update({
        where: { id: billingOperationId },
        data: {
          failedJobs: { decrement: 1 },
          processingJobs: { increment: 1 },
          status: 'PROCESSING', // Open the run back up out of terminal status
        },
      });
    });

    try {
      // 4. Re-inject into BullMQ architecture with all required fields
      const jobOptions = {
        attempts: 3,
        backoff: {
          type: 'exponential' as const,
          delay: 5000,
        },
      };

      // Construct payload
      const freshQueueJob = await this.invoiceQueue.add(
        'process-invoice',
        { 
          invoiceJobId,
          billingOperationId,
          customerId,
        },
        jobOptions
      );

      this.logger.log(`Job ${invoiceJobId} successfully re-injected as Queue ID: ${freshQueueJob.id}`);

      return {
        success: true,
        newQueueJobId: String(freshQueueJob.id),
      };
    } catch (queueError: any) {
      this.logger.error(`Critical error re-injecting job ${invoiceJobId} into queue: ${queueError.message}`);
      
      // Fallback Rollback: Restore failure tracking consistency if BullMQ is completely unreachable
      try {
        await this.prisma.$transaction([
          this.prisma.invoiceJobDlq.update({
            where: { id: dlqRecordId },
            data: { status: 'FAILED_PERMANENTLY' },
          }),
          this.prisma.invoiceJob.update({
            where: { id: invoiceJobId },
            data: { status: 'FAILED', lastError: `Queue Re-injection Failed: ${queueError.message}` },
          }),
          this.prisma.billingOperation.update({
            where: { id: billingOperationId },
            data: {
              failedJobs: { increment: 1 },
              processingJobs: { decrement: 1 },
            },
          }),
        ]);
      } catch (rollbackError: any) {
        this.logger.error(`Catastrophic failure: State desynchronized during queue failure rollback: ${rollbackError.message}`);
      }

      throw queueError;
    }
  }
}
