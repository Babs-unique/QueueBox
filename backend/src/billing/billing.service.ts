import { HttpStatus, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BillingOperation } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';
import { billingDtos } from './dto/billing.dto';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('InvoiceJob') private invoiceJob: Queue
) {}
  async findKey(userId: string, idempotencyKey: string): Promise<BillingOperation | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.billingOperation.findFirst({
      where: { idempotencyKey, userId },
    });
  }

  async create(
    billingDtos: billingDtos,
    userId: string,
    idempotencyKey: string,
    res,
  ): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const customers = await this.prisma.customer.findMany({
      where: { userId },
    });

    if (customers.length === 0) {
      throw new BadRequestException('Cannot initiate billing: No eligible customers found.');
    }

    const { operation , dbJobs} = await this.prisma.$transaction(async (tx) => {
      const operation = await tx.billingOperation.create({
        data: {
          ...billingDtos,
          idempotencyKey,
          userId,
          status: 'QUEUED',
          totalJobs: customers.length, 
          processingJobs: 0,
          completedJobs: 0,
          failedJobs: 0,
        },
      });

      await tx.invoiceJob.createMany({
        data: customers.map((customer) => ({
          billingOperationId: operation.id,
          customerId: customer.id,
          status: 'QUEUED',
        })),
      });

      const dbJobs = await tx.invoiceJob.findMany({
        where: { billingOperationId: operation.id },
      });

      return { operation , dbJobs};
    });

    const bulkJobs = dbJobs.map((job) => ({
      name: 'process-invoice',
      data: {
        invoiceJobId: job.id, 
        customerId: job.customerId,
        billingOperationId: job.billingOperationId,
      },
      opts: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, 
        },
      },
    }));
    await this.invoiceJob.addBulk(bulkJobs)
    res.set('X-Idempotency-Key', operation.idempotencyKey);
    res.status(HttpStatus.ACCEPTED); 

    return {
      id: operation.id,
      idempotencyKey: operation.idempotencyKey,
      status: operation.status,
      createdAt: operation.createdAt,
    };
  }
}
