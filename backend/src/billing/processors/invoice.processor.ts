import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';

interface InvoiceJobData {
  invoiceJobId: string;
}

@Injectable()
@Processor('InvoiceJob', { concurrency: 3 })
export class InvoiceJobProcessor extends WorkerHost {
  private readonly logger = new Logger(InvoiceJobProcessor.name);
  private readonly FIXED_MONTHLY_FEE = 25000;

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<InvoiceJobData>): Promise<void> {
    const invoiceData = job.data;
    this.logger.log(`Processing Job ID: ${job.id} (Attempt ${job.attemptsMade})`);

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

    if (!invoiceData || !invoiceData.invoiceJobId) {
      throw new Error('Invalid job data: Missing invoiceJobId');
    }

    const invoiceJobId = invoiceData.invoiceJobId;
    const invoiceJob = await this.prisma.invoiceJob.findUnique({
      where: { id: invoiceJobId },
      include: { billingOperation: true },
    });

    if (!invoiceJob) {
      throw new Error(`Invoice job ${invoiceJobId} not found in database`);
    }

    const { billingOperationId, customerId, status: currentStatus } = invoiceJob;
    const billingPeriod = invoiceJob.billingOperation.billingPeriod;

    if (currentStatus === 'COMPLETED') {
      this.logger.log(`Job ${invoiceJobId} is already COMPLETED. Skipping.`);
      return;
    }

    // Set processing status safely
    if (job.attemptsMade <= 1 && currentStatus !== 'PROCESSING') {
      await this.prisma.$transaction([
        this.prisma.invoiceJob.update({
          where: { id: invoiceJobId },
          data: { status: 'PROCESSING' },
        }),
        this.prisma.billingOperation.update({
          where: { id: billingOperationId },
          data: { processingJobs: { increment: 1 }, status: 'PROCESSING' },
        }),
      ]);
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        let invoice = await tx.invoice.findFirst({
          where: {
            customerId: customerId,
            billingPeriod: billingPeriod,
          },
        });

        if (!invoice) {
          invoice = await tx.invoice.create({
            data: {
              customerId: customerId,
              billingPeriod: billingPeriod,
              amount: this.FIXED_MONTHLY_FEE,
              status: 'GENERATED',
              dueDate: dueDate,
            },
          });
        }

        // 3. Update the invoice job status to COMPLETED and link the generated invoice
        await tx.invoiceJob.update({
          where: { id: invoiceJobId },
          data: {
            invoiceId: invoice.id,
            status: 'COMPLETED',
            processedAt: new Date(),
          },
        });

        // 4. Update parent structural counters atomically
        const updatedOperation = await tx.billingOperation.update({
          where: { id: billingOperationId },
          data: {
            processingJobs: { decrement: 1 },
            completedJobs: { increment: 1 },
          },
        });

        // 5. Evaluate and update Terminal Parent State if this was the final job
        const activeJobsCount = updatedOperation.processingJobs;
        const totalAccounted = updatedOperation.completedJobs + updatedOperation.failedJobs;

        if (totalAccounted === updatedOperation.totalJobs && activeJobsCount === 0) {
          let terminalStatus: 'COMPLETED' | 'FAILED' | 'PARTIALLY_COMPLETED' = 'COMPLETED';
          if (updatedOperation.failedJobs === updatedOperation.totalJobs) {
            terminalStatus = 'FAILED';
          } else if (updatedOperation.failedJobs > 0) {
            terminalStatus = 'PARTIALLY_COMPLETED';
          }
          await tx.billingOperation.update({
            where: { id: billingOperationId },
            data: { status: terminalStatus },
          });
        }
      });

      this.logger.log(`Successfully generated invoice for Job ${invoiceJobId}`);
    } catch (error: any) {
      this.logger.error(`Error processing invoice job ${invoiceJobId}:`, error);

      // 6. Manage failures and check retry context limits
      const maxAttempts = job.opts.attempts || 1;
      const isPermanentFailure = job.attemptsMade >= maxAttempts;

      try {
        if (isPermanentFailure) {
          await this.handlePermanentFailure(job, invoiceJobId, billingOperationId, error.message);
        } else {
          await this.prisma.invoiceJob.update({
            where: { id: invoiceJobId },
            data: { lastError: error.message },
          });
        }
      } catch (dbError: any) {
        this.logger.error(`Failed to record error state to DB for Job ${invoiceJobId}: ${dbError.message}`);
      }

      // Bubble exception upward so BullMQ marks the attempt as failed and schedules backoff
      throw error;
    }
  }

  private async handlePermanentFailure(
    job: Job<InvoiceJobData>,
    invoiceJobId: string,
    billingOperationId: string,
    errorMessage: string
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Update job to FAILED status
      await tx.invoiceJob.update({
        where: { id: invoiceJobId },
        data: {
          status: 'FAILED',
          lastError: errorMessage,
        },
      });

      // Update parent counters
      const updatedOperation = await tx.billingOperation.update({
        where: { id: billingOperationId },
        data: {
          processingJobs: { decrement: 1 },
          failedJobs: { increment: 1 },
        },
      });

      // 1. Create the DLQ record safely outside of the terminal-parent block
      await tx.invoiceJobDlq.upsert({
        where: { invoiceJobId: invoiceJobId },
        update: {
          originalQueueJobId: String(job.id),
          failureReason: errorMessage,
          status: 'FAILED_PERMANENTLY',
          attemptsMade: job.attemptsMade,
          failedAt: new Date(),
        },
        create: {
          invoiceJobId: invoiceJobId,
          originalQueueJobId: String(job.id),
          failureReason: errorMessage,
          status: 'FAILED_PERMANENTLY',
          attemptsMade: job.attemptsMade,
          failedAt: new Date(),
        },
      });

      // 2. Evaluate if this specific failure ends the broader billing run
      const activeJobsCount = updatedOperation.processingJobs;
      const totalAccounted = updatedOperation.completedJobs + updatedOperation.failedJobs;

      if (totalAccounted === updatedOperation.totalJobs && activeJobsCount === 0) {
        let terminalStatus: 'COMPLETED' | 'FAILED' | 'PARTIALLY_COMPLETED' = 'FAILED';
        if (updatedOperation.completedJobs > 0) {
          terminalStatus = 'PARTIALLY_COMPLETED';
        }
        await tx.billingOperation.update({
          where: { id: billingOperationId },
          data: { status: terminalStatus },
        });
      }
    });
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}...`);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number) {
    this.logger.debug(`Job ${job.id} is ${progress}% complete.`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed with error: ${error.message}`);
  }
}
