import { Controller, UseGuards, UseInterceptors, Post, Req, Res, Body, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import type  { Response } from 'express'
import { BillingService } from './billing.service';
import { IdempotencyInterceptor } from './interceptors/idempotency-interceptor.interceptor';
import { billingDtos } from './dto/billing.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { BillingGuard } from './guards/billing-guard.guard';
import type { AuthenticatedRequest } from '../utils/auth-request';


@Controller('billings')
export class BillingController {
    constructor( private readonly billingService: BillingService) {}


    @Post()
    @UseGuards(AuthGuard, BillingGuard)
    @UseInterceptors(IdempotencyInterceptor)
    async create(@Body() billingDtos: billingDtos, @Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
        const userId = req.user.sub;
        if(!userId){
            throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }
        const idempotencyKey = req.idempotencyKey;
        if (!idempotencyKey) {
            throw new BadRequestException('X-Idempotency-Key header is required.');
        }
        return await this.billingService.create(billingDtos, userId , idempotencyKey , res);
    }

}
