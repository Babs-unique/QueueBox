import { CanActivate, ExecutionContext, Injectable, BadRequestException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class BillingGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
      const request = context.switchToHttp().getRequest();
      const idempotencyKey = request.headers['idempotency-key'] as string;
      if (!idempotencyKey) {
      throw new BadRequestException('X-Idempotency-Key header is required.');
      }
      request.idempotencyKey = idempotencyKey
      return true;

  }
}
