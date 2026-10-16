import { Transform } from "class-transformer";
import { IsDate, IsNotEmpty } from "class-validator";
export class billingDtos {
    @IsDate()
    @IsNotEmpty()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    billingPeriod: Date
}