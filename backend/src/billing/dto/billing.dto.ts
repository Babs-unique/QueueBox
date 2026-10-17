import { Transform } from 'class-transformer';
import { IsNotEmpty, Matches, IsString } from 'class-validator';

export class billingDtos {
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
        message: 'billingPeriod must be in YYYY-MM format (e.g., 2026-10)',
    })
    billingPeriod: string;
}
