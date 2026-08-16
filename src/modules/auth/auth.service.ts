import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
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

  private getTableCandidates(): string[] {
    return [`"PasswordResetToken"`, `passwordresettoken`, `"password_reset_token"`, `"password_reset_tokens"`];
  }

  private async saveResetToken(email: string, code: string, token: string, expiresAt: Date): Promise<void> {
    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.trim();

    console.log(`[RESET DEBUG] saveResetToken START -> Email: "${cleanEmail}", Code: "${cleanCode}"`);

    const delegate = (this.prisma as any).passwordResetToken || (this.prisma as any).PasswordResetToken;
    if (delegate) {
      try {
        await delegate.updateMany({
          where: { email: { equals: cleanEmail, mode: 'insensitive' }, used: false },
          data: { used: true },
        });
        await delegate.create({
          data: { email: cleanEmail, code: cleanCode, token, expiresAt },
        });
        console.log(`[RESET DEBUG] Saved successfully via Prisma delegate.`);
        return;
      } catch (err: any) {
        console.warn('Prisma saveResetToken delegate warning, falling back to SQL:', err?.message || err);
      }
    }

    // Raw SQL Fallback across candidate table names
    const id = crypto.randomBytes ? crypto.randomBytes(16).toString('hex') : Math.random().toString(36).substring(2);
    for (const tbl of this.getTableCandidates()) {
      try {
        await this.prisma.$executeRawUnsafe(
          `UPDATE ${tbl} SET "used" = true WHERE LOWER("email") = LOWER($1) AND "used" = false`,
          cleanEmail,
        );
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO ${tbl} ("id", "email", "code", "token", "expiresAt", "used", "createdAt") VALUES ($1, $2, $3, $4, NOW() + INTERVAL '15 minutes', false, NOW())`,
          id,
          cleanEmail,
          cleanCode,
          token,
        );
        console.log(`[RESET DEBUG] Saved successfully via Raw SQL table: ${tbl}`);
        return;
      } catch (sqlErr: any) {
        console.warn(`[RESET DEBUG] Raw SQL save attempt failed for table ${tbl}:`, sqlErr?.message || sqlErr);
      }
    }

    console.error(`[RESET DEBUG] ERROR: Failed to save reset token on all candidate tables!`);
  }

  private async findResetTokenByCode(email: string, code: string): Promise<any> {
    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.trim();

    console.log(`[RESET DEBUG] Searching for OTP Code: "${cleanCode}" for email: "${cleanEmail}"`);

    const delegate = (this.prisma as any).passwordResetToken || (this.prisma as any).PasswordResetToken;
    let record: any = null;

    if (delegate) {
      try {
        record = await delegate.findFirst({
          where: {
            email: { equals: cleanEmail, mode: 'insensitive' },
            code: cleanCode,
            used: false,
          },
          orderBy: { createdAt: 'desc' },
        });
      } catch (err: any) {
        console.warn('Prisma findResetTokenByCode warning, falling back to SQL:', err?.message || err);
      }
    }

    if (!record) {
      for (const tbl of this.getTableCandidates()) {
        try {
          const rows: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT * FROM ${tbl} WHERE LOWER("email") = LOWER($1) AND "code" = $2 AND "used" = false AND "expiresAt" > NOW() ORDER BY "createdAt" DESC LIMIT 1`,
            cleanEmail,
            cleanCode,
          );
          if (rows && rows.length > 0) {
            record = rows[0];
            console.log(`[RESET DEBUG] Found record via Raw SQL table: ${tbl}`);
            break;
          }
        } catch (sqlErr: any) {
          console.warn(`[RESET DEBUG] Raw SQL find query failed for table ${tbl}:`, sqlErr?.message || sqlErr);
        }
      }
    }

    console.log(`[RESET DEBUG] Found record in DB:`, record ? { id: record.id, code: record.code, used: record.used } : 'NULL (Not Found)');

    if (!record) return null;

    return {
      id: record.id,
      email: record.email,
      code: record.code,
      token: record.token,
      expiresAt: new Date(record.expiresAt || record.expiresat),
      used: Boolean(record.used),
    };
  }

  private async findResetTokenByToken(token: string): Promise<any> {
    const delegate = (this.prisma as any).passwordResetToken || (this.prisma as any).PasswordResetToken;
    let record: any = null;

    if (delegate) {
      try {
        record = await delegate.findUnique({ where: { token } });
      } catch (err: any) {
        console.warn('Prisma findResetTokenByToken warning, falling back to SQL:', err?.message || err);
      }
    }

    if (!record) {
      for (const tbl of this.getTableCandidates()) {
        try {
          const rows: any[] = await this.prisma.$queryRawUnsafe(
            `SELECT * FROM ${tbl} WHERE "token" = $1 LIMIT 1`,
            token,
          );
          if (rows && rows.length > 0) {
            record = rows[0];
            break;
          }
        } catch {
          // try next candidate
        }
      }
    }

    if (!record) return null;

    return {
      id: record.id,
      email: record.email,
      code: record.code,
      token: record.token,
      expiresAt: new Date(record.expiresAt || record.expiresat),
      used: Boolean(record.used),
    };
  }

  private async markTokenUsed(id: string): Promise<void> {
    const delegate = (this.prisma as any).passwordResetToken || (this.prisma as any).PasswordResetToken;
    if (delegate) {
      try {
        await delegate.update({ where: { id }, data: { used: true } });
        return;
      } catch (err: any) {
        console.warn('Prisma markTokenUsed delegate warning, falling back to SQL:', err?.message || err);
      }
    }

    for (const tbl of this.getTableCandidates()) {
      try {
        await this.prisma.$executeRawUnsafe(
          `UPDATE ${tbl} SET "used" = true WHERE "id" = $1`,
          id,
        );
        break;
      } catch {
        // try next candidate
      }
    }
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ success: boolean; message: string }> {
    try {
      const email = dto.email.toLowerCase().trim();
      console.log(`[RESET DEBUG] forgotPassword requested for email: "${email}"`);

      const user = await this.prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
      });

      if (!user) {
        console.warn(`[RESET DEBUG] User NOT found in database for email: "${email}"`);
      } else {
        console.log(`[RESET DEBUG] Found user: "${user.name}" (${user.email})`);
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const token = crypto.randomBytes(16).toString('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        await this.saveResetToken(email, code, token, expiresAt);

        try {
          await this.mailService.sendPasswordResetEmail({
            email: user.email,
            name: user.name,
            code,
            token,
          });
        } catch (mailErr: any) {
          console.warn('Mail dispatch warning in forgotPassword (safe fallback):', mailErr?.message || mailErr);
        }
      }

      return {
        success: true,
        message: 'If an account exists with this email address, a password reset verification code has been sent.',
      };
    } catch (err: any) {
      console.error('Error in forgotPassword AuthService:', err);
      throw new InternalServerErrorException(err?.message || 'Failed to process forgot password request');
    }
  }

  async verifyResetCode(dto: VerifyResetCodeDto): Promise<{ success: boolean; token: string }> {
    try {
      const email = dto.email.toLowerCase().trim();
      const resetRecord = await this.findResetTokenByCode(email, dto.code);

      if (!resetRecord) {
        throw new BadRequestException('Invalid or expired verification code. Please request a new code.');
      }

      return {
        success: true,
        token: resetRecord.token,
      };
    } catch (err: any) {
      if (err instanceof BadRequestException || err instanceof UnauthorizedException) throw err;
      console.error('Error in verifyResetCode AuthService:', err);
      throw new InternalServerErrorException(err?.message || 'Failed to verify reset code');
    }
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ success: boolean; message: string }> {
    try {
      const resetRecord = await this.findResetTokenByToken(dto.token);

      if (!resetRecord) {
        throw new BadRequestException('The reset token is invalid or missing. Please submit a new request.');
      }

      if (resetRecord.used) {
        throw new BadRequestException('This reset token has already been used. Please request a new password reset code.');
      }

      const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

      // Update User Password
      const user = await this.prisma.user.update({
        where: { email: resetRecord.email },
        data: { password: hashedPassword },
      });

      // Mark token as used
      await this.markTokenUsed(resetRecord.id);

      // Clear active sessions
      try {
        await this.redisService.removeUserSession(user.id);
      } catch (redisErr: any) {
        console.warn('Redis session clear warning:', redisErr?.message || redisErr);
      }

      return {
        success: true,
        message: 'Password updated successfully. You can now sign in with your new password.',
      };
    } catch (err: any) {
      if (err instanceof BadRequestException || err instanceof UnauthorizedException) throw err;
      console.error('Error in resetPassword AuthService:', err);
      throw new InternalServerErrorException(err?.message || 'Failed to reset password');
    }
  }
}
