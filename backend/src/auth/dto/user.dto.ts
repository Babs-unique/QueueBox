    import { Transform } from 'class-transformer';
    import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class userDtos {
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    name: string;

    @IsEmail()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    password: string;
}


export class updateUserDtos {
    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    name: string;

    @IsEmail()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
    email: string;
    }

    export class loginDtos {
    @IsEmail()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    password: string;
}