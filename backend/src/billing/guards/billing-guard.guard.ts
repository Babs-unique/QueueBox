import { CanActivate, ExecutionContext, Injectable, BadRequestException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class BillingGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const headerName = Object.keys(request.headers).find(
      (key) => key.toLowerCase() === 'x-idempotency-key' || key.toLowerCase() === 'idempotency-key',
    );
    const idempotencyKey = headerName ? request.headers[headerName] : undefined;

    if (!idempotencyKey || Array.isArray(idempotencyKey)) {
      throw new BadRequestException('X-Idempotency-Key header is required.');
    }

    request.idempotencyKey = idempotencyKey;
    return true;
  }
}
