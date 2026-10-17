import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { User } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { loginDtos, updateUserDtos, userDtos } from './dto/user.dto.js';

type PublicUser = Omit<User, 'password' | 'refreshToken' | 'expiresAt' | 'isRevoked'>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async generateAccessToken(userId: string, email: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId, email },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '15m',
      },
    );
  }

  async generateRefreshToken(userId: string, email: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId, email },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      },
    );
  }

  async register(dto: userDtos): Promise<{ id: string; name: string; email: string }> {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newUser = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        password: hashedPassword,
      },
    });

    return { id: newUser.id, name: newUser.name, email: newUser.email };
  }

  async logIn(dto: loginDtos): Promise<{ user: { id: string; name: string; email: string }; accessToken: string; refreshToken: string }> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const accessToken = await this.generateAccessToken(user.id, user.email);
    const refreshToken = await this.generateRefreshToken(user.id, user.email);

    // Securely hash and store the active refresh token in the database
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: hashedRefreshToken,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
      },
    });
    

    return {
      user: { id: user.id, name: user.name, email: user.email },
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(userId: string, rawRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.refreshToken || user.isRevoked || (user.expiresAt && user.expiresAt < new Date())) {
      throw new UnauthorizedException('Access denied. Token is invalid or expired.');
    }


    const isMatch = await bcrypt.compare(rawRefreshToken, user.refreshToken);
    if (!isMatch) throw new UnauthorizedException('Access denied. Invalid token trace.');

    const newAccessToken = await this.generateAccessToken(user.id, user.email);
    const newRefreshToken = await this.generateRefreshToken(user.id, user.email);

    const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: hashedNewRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logOut(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null, isRevoked: true, expiresAt: null },
    });
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        deletedAt: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(userId: string, dto: updateUserDtos): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const normalizedName = dto.name.trim();
    const normalizedEmail = dto.email.trim().toLowerCase();

    if (normalizedEmail !== user.email) {
      const emailTaken = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (emailTaken && emailTaken.id !== userId) {
        throw new ConflictException('Email already exists');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { name: normalizedName, email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        deletedAt: true,
        createdAt: true,
      },
    });
  }

  async deleteUser(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.delete({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        deletedAt: true,
        createdAt: true,
      },
    });
  }
}
