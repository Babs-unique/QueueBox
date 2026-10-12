// import { ConfigService } from '@nestjs/config';

// const configService = new ConfigService();

// interface JwtConfig {
//     secret: string;
// }

// export const jwtConstants: JwtConfig = {
//     secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
// };
export const AUTH_COOKIE_NAME = 'access_token';
export const REFRESH_COOKIE_NAME = 'refresh_token';
