import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User authentication required');
    }

    // SUPER_ADMIN (Higher Admin) has full unrestricted access everywhere
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.includes(user.role);
      if (!hasRole) {
        throw new ForbiddenException('Higher Admin privileges required to perform this operation');
      }
    }

    if (user.role === 'ADMIN') {
      // Check if route requires specific sub-admin permission keys
      if (requiredPermissions && requiredPermissions.length > 0) {
        const userPerms = await (this.prisma as any).adminPermission.findMany({
          where: { userId: user.id },
          select: { permissionKey: true },
        }).catch(() => []);

        const keys = userPerms.map((p: any) => p.permissionKey);
        const hasPerm = requiredPermissions.some((perm) => keys.includes(perm));

        if (!hasPerm) {
          throw new ForbiddenException(`Sub-admin requires permission: ${requiredPermissions.join(', ')}`);
        }
      }
      return true;
    }

    throw new ForbiddenException('Admin access required');
  }
}

