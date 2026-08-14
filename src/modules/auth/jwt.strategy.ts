import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'timevalley_jwt_secret_key_2026',
    });
  }

  async validate(payload: JwtPayload) {
    let user: any;
    try {
      user = await (this.prisma.user as any).findUnique({
        where: { id: payload.sub },
        include: {
          enrollments: {
            where: { courseId: 'venture-architect-diploma', status: 'ACTIVE' },
          },
        },
      });
    } catch {
      user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
    }

    if (!user) {
      throw new UnauthorizedException('المستخدم غير موجود أو انتهت صلاحية الجلسة');
    }

    const { password: _, enrollments, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      hasPurchasedDiploma: (enrollments && Array.isArray(enrollments) && enrollments.length > 0) || false,
    };
  }
}
