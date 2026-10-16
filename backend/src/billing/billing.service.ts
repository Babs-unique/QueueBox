import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { BillingOperation } from '../../generated/prisma/client.js'
import { PrismaService } from '../prisma/prisma.service';
import { CreateBillingDto } from './dto/create-billing.dto';

@Injectable()
export class BillingService {
    constructor( private readonly prisma: PrismaService) {}

    async findKey(userId, idempotencyKey): Promise<BillingOperation> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        const existing = await this.prisma.billingOperation.findFirst({ where: { idempotencyKey, userId } });
        if (!existing) {
            throw new NotFoundException('Key not found');
        }

        return existing;
    }

    async create( createBillingDto: CreateBillingDto, userId: string, idempotencyKey: string, res): Promise<BillingOperation> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const billing = await this.prisma.billingOperation.create({ data: { ...createBillingDto, idempotencyKey, userId } });

        res.set('X-Idempotency-Key', billing.idempotencyKey);
        res.status(HttpStatus.ACCEPTED);
        return {
            id: billing.id,
            idempotencyKey: billing.idempotencyKey,
            status: billing.status,
            createdAt: billing.createdAt
        }
       
    }
}
