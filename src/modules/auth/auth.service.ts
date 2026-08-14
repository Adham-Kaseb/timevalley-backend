import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse, JwtPayload, UserResponse } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });

      if (existingUser) {
        throw new ConflictException('البريد الإلكتروني مستخدم بالفعل');
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email.toLowerCase(),
          password: hashedPassword,
          phone: dto.phone,
        },
      });

      // Trigger non-blocking email notification to admin
      this.mailService.sendNewStudentNotification({
        name: user.name,
        email: user.email,
        phone: user.phone || undefined,
      });

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(payload);

      await this.redisService.setUserSession(user.id, accessToken);

      const { password: _, ...userWithoutPassword } = user;

      return {
        accessToken,
        user: userWithoutPassword as UserResponse,
      };
    } catch (err: any) {
      if (err instanceof ConflictException || err instanceof UnauthorizedException) throw err;
      console.error('Registration error in AuthService:', err);

      if (err?.code === 'P2002') {
        throw new ConflictException('البريد الإلكتروني مستخدم بالفعل');
      }
      if (err?.code === 'P2021' || err?.message?.includes('does not exist')) {
        throw new InternalServerErrorException('جدول المستخدمين غير موجود، يرجى تشغيل npx prisma db push في المجلد timevally-backend');
      }
      throw new InternalServerErrorException(err?.message || 'حدث خطأ في قاعدة البيانات');
    }
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });

      if (!user) {
        throw new UnauthorizedException('بيانات الدخول غير صحيحة');
      }

      const isPasswordValid = await bcrypt.compare(dto.password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('بيانات الدخول غير صحيحة');
      }

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(payload);

      await this.redisService.setUserSession(user.id, accessToken);

      const { password: _, ...userWithoutPassword } = user;

      return {
        accessToken,
        user: userWithoutPassword as UserResponse,
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      console.error('Login failed error in AuthService:', err);
      throw err;
    }
  }
}
