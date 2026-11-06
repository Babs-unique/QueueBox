import { Controller, UseGuards, UseInterceptors, Post, Req, Res, Body, HttpException, HttpStatus, BadRequestException, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import type  { Response } from 'express'
import { BillingService } from './billing.service';
import { InvoiceDlqReplayService } from './invoice-dlq-replay/invoice-dlq-replay.service';
import { IdempotencyInterceptor } from './interceptors/idempotency-interceptor.interceptor';
import { billingDtos } from './dto/billing.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { BillingGuard } from './guards/billing-guard.guard';
import type { AuthenticatedRequest } from '../utils/auth-request';


@Controller('billings')
export class BillingController {
    constructor(
        private readonly billingService: BillingService,
        private readonly invoiceDlqReplayService: InvoiceDlqReplayService,
    ) {}

    @Get()
    @UseGuards(AuthGuard)
    findOperations(@Req() req: AuthenticatedRequest) {
        return this.billingService.findOperations(req.user.sub);
    }

    @Get('invoices')
    @UseGuards(AuthGuard)
    findInvoices(@Req() req: AuthenticatedRequest) {
        return this.billingService.findInvoices(req.user.sub);
    }

    @Get('jobs')
    @UseGuards(AuthGuard)
    findInvoiceJobs(@Req() req: AuthenticatedRequest) {
        return this.billingService.findInvoiceJobs(req.user.sub);
    }

    @Post('dlq/:id/replay')
    @UseGuards(AuthGuard)
    replayInvoiceJob(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: AuthenticatedRequest,
    ) {
        return this.invoiceDlqReplayService.replayJob(id, req.user.sub);
    }

    @Get(':id')
    @UseGuards(AuthGuard)
    findOperation(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: AuthenticatedRequest,
    ) {
        return this.billingService.findOperation(req.user.sub, id);
    }

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
