import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(err: unknown, user: TUser | false, info: unknown): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('غير مصرح بالوصول، يرجى تسجيل الدخول أولاً');
    }
    return user;
  }
}
