import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { BillingService } from '../billing.service';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly billingService: BillingService) {}
  async intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const idempotencyKey = request.idempotencyKey;
    const userId = request.user?.sub;

    const existing = await this.billingService.findKey( userId , idempotencyKey);

    if(existing){
      return of({
            id: billing.id,
            idempotencyKey: billing.idempotencyKey,
            status: billing.status,
            createdAt: billing.createdAt
      })
    }

    return next.handle();

  }
}
