import { Controller, UseGuards, UseInterceptors, Post } from '@nestjs/common';
import { BillingService } from './billing.service';
import { IdempotencyInterceptor } from './interceptors/idempotency-interceptor.interceptor';
import { CreateBillingDto } from './dto/create-billing.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { BillingGuard } from './guards/billing-guard.guard';
import { AuthenticatedRequest } from '../utils/auth-request';


@Controller('billing')
export class BillingController {
    constructor( private readonly billingService: BillingService) {}


    @Post()
    @UseGuards(AuthGuard, BillingGuard)
    @UseInterceptors(IdempotencyInterceptor)
    async create(@Body() createBillingDto: CreateBillingDto, @Req() req: AuthenticatedRequest) {
        const userId = req.user.sub;
        if(!userId){
            throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }
        const idempotencyKey = req.idempotencyKey;
        if (!idempotencyKey) {
            throw new BadRequestException('X-Idempotency-Key header is required.');
        }
        return await this.billingService.create(createBillingDto, userId , idempotencyKey);
    }

}
