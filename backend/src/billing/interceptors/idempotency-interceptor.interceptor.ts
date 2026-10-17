import { CallHandler, ExecutionContext, Injectable, NestInterceptor, HttpStatus} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { BillingService } from '../billing.service';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly billingService: BillingService) {}
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const idempotencyKey = request.idempotencyKey;
    const userId = request.user?.sub;

    const existing = await this.billingService.findKey( userId , idempotencyKey);

    if(existing){
      response.status(HttpStatus.OK);
      return of({
            id: existing.id,
            idempotencyKey: existing.idempotencyKey,
            status: existing.status,
            createdAt: existing.createdAt
      })
    }

    return next.handle();

  }
}
