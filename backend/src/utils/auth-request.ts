import type { Request } from 'express'
export type AuthenticatedRequest = Request & {
  user: {
    sub: string;
    email: string;
    refreshToken?: string;
};
  idempotencyKey?: string
};