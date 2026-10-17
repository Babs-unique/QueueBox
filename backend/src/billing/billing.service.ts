import { HttpStatus, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BillingOperation } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service';
import { billingDtos } from './dto/billing.dto';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

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

    const billing = await this.prisma.$transaction(async (tx) => {
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

      return operation;
    });

    res.set('X-Idempotency-Key', billing.idempotencyKey);
    res.status(HttpStatus.ACCEPTED); 

    return {
      id: billing.id,
      idempotencyKey: billing.idempotencyKey,
      status: billing.status,
      createdAt: billing.createdAt,
    };
  }
}
