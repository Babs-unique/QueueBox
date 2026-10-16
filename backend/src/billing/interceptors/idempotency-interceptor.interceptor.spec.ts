import { IdempotencyInterceptorInterceptor } from './idempotency-interceptor.interceptor';

describe('IdempotencyInterceptorInterceptor', () => {
  it('should be defined', () => {
    expect(new IdempotencyInterceptorInterceptor()).toBeDefined();
  });
});
