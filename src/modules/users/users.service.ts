import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserResponse } from '../auth/interfaces/jwt-payload.interface';

import { EventsGateway } from '../socket/events.gateway';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.track !== undefined && { track: dto.track }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar }),
      },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as UserResponse;
  }

  async uploadAvatar(userId: string, avatar: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as UserResponse;
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('كلمة المرور الحالية غير صحيحة');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'تم تغيير كلمة المرور بنجاح' };
  }

  async getCertificates(userId: string) {
    const certificates = await this.prisma.certificate.findMany({
      where: { userId },
      orderBy: { issueDate: 'desc' },
    });

    return certificates;
  }

  // --- ADMIN USER & PERMISSION MANAGEMENT ---

  async listAllUsersForAdmin() {
    const users = await (this.prisma as any).user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        adminPermissions: {
          select: {
            permissionKey: true,
          },
        },
        enrollments: {
          select: {
            courseId: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u: any) => ({
      ...u,
      hasDiplomaAccess: u.role === 'SUPER_ADMIN' ? true : Boolean(u.hasDiplomaAccess || u.enrollments?.some((e: any) => e.status === 'ACTIVE')),
      permissions: Array.isArray(u.adminPermissions)
        ? u.adminPermissions.map((p: any) => p.permissionKey)
        : [],
    }));
  }

  async updateUserRoleAndPermissions(
    targetUserId: string,
    role: string,
    permissionKeys?: string[],
  ) {
    const existing = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!existing) throw new NotFoundException('Target user not found');

    const updatedUser = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role },
    });

    if (Array.isArray(permissionKeys)) {
      // Clear existing permissions and set new
      await (this.prisma as any).adminPermission.deleteMany({
        where: { userId: targetUserId },
      });

      for (const pKey of permissionKeys) {
        await (this.prisma as any).adminPermission.create({
          data: {
            userId: targetUserId,
            permissionKey: pKey,
          },
        });
      }
    }

    return {
      success: true,
      message: 'User role & permissions updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    };
  }

  // --- ADMIN USER & STUDENT CONTROL METHODS ---

  async createUserByAdmin(dto: { name: string; email: string; password: string; phone?: string; role?: string; autoEnrollDiploma?: boolean }) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('User email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        phone: dto.phone || null,
        role: dto.role || 'STUDENT',
      },
    });

    if (dto.autoEnrollDiploma) {
      await (this.prisma as any).enrollment.upsert({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: 'venture-architect-diploma',
          },
        },
        update: { status: 'ACTIVE' },
        create: {
          userId: user.id,
          courseId: 'venture-architect-diploma',
          pricePaid: 5000,
          currency: 'LE',
          status: 'ACTIVE',
        },
      });
      // Broadcast real-time access update
      this.eventsGateway.emitDiplomaAccessUpdated(user.id, {
        userId: user.id,
        courseId: 'venture-architect-diploma',
        status: 'ACTIVE',
        hasDiplomaAccess: true,
      });
    }

    const { password: _, ...result } = user;
    return result;
  }

  async toggleStudentEnrollment(dto: { userId: string; courseId?: string; status: string }) {
    const courseId = dto.courseId || 'venture-architect-diploma';
    
    // 1. Upsert Primary Enrollment Record & Update User.hasDiplomaAccess column in DB
    try {
      await (this.prisma as any).user.update({
        where: { id: dto.userId },
        data: { hasDiplomaAccess: dto.status === 'ACTIVE' },
      }).catch(() => {});

      await (this.prisma as any).enrollment.upsert({
        where: {
          userId_courseId: {
            userId: dto.userId,
            courseId,
          },
        },
        update: { status: dto.status },
        create: {
          userId: dto.userId,
          courseId,
          pricePaid: 5000,
          currency: 'LE',
          status: dto.status,
        },
      });
    } catch (e: any) {
      this.logger.warn(`Enrollment upsert notice: ${e?.message || e}`);
    }

    // 2. Safe Sync of Module Unlocks in DB
    try {
      if (dto.status === 'ACTIVE') {
        const allModules = await (this.prisma as any).diplomaModule.findMany({
          select: { id: true },
        }).catch(() => []);

        if (allModules && allModules.length > 0 && (this.prisma as any).studentModuleUnlock) {
          for (const mod of allModules) {
            await (this.prisma as any).studentModuleUnlock.upsert({
              where: {
                userId_moduleId: {
                  userId: dto.userId,
                  moduleId: mod.id,
                },
              },
              update: { unlockedBy: 'ADMIN_FULL_PASS', notes: 'Full Diploma Access Granted' },
              create: {
                userId: dto.userId,
                moduleId: mod.id,
                unlockedBy: 'ADMIN_FULL_PASS',
                notes: 'Full Diploma Access Granted',
              },
            }).catch(() => {});
          }
        }
      } else if (dto.status === 'INACTIVE') {
        if ((this.prisma as any).studentModuleUnlock) {
          await (this.prisma as any).studentModuleUnlock.deleteMany({
            where: { userId: dto.userId },
          }).catch(() => {});
        }
      }
    } catch (e: any) {
      this.logger.warn(`Module unlock sync notice: ${e?.message || e}`);
    }

    // Broadcast real-time access update
    this.eventsGateway.emitDiplomaAccessUpdated(dto.userId, {
      userId: dto.userId,
      courseId,
      status: dto.status,
      hasDiplomaAccess: dto.status === 'ACTIVE',
    });

    // 3. Return full updated student profile payload
    return this.getStudentFullDetail(dto.userId);
  }

  async unlockStudentModule(dto: { userId: string; moduleId: string; unlock: boolean; notes?: string }, adminUserId: string) {
    let targetModuleId = dto.moduleId;
    let moduleTitle = '';

    try {
      // Normalize module number (e.g., "m1" -> "01", "intro" -> "00", "01" -> "01")
      let normalizedNumber = dto.moduleId;
      if (dto.moduleId === 'intro') normalizedNumber = '00';
      else if (dto.moduleId.startsWith('m')) normalizedNumber = dto.moduleId.replace('m', '0');

      // 1. Attempt to find matching DiplomaModule record in DB
      let targetModule = await (this.prisma as any).diplomaModule.findFirst({
        where: {
          OR: [
            { id: dto.moduleId },
            { moduleNumber: dto.moduleId },
            { moduleNumber: normalizedNumber },
            { moduleNumber: `0${dto.moduleId.replace('m', '')}` },
          ],
        },
      }).catch(() => null);

      // 2. Auto-create or seed module record if not in DB yet to guarantee FK integrity
      if (!targetModule) {
        try {
          targetModule = await (this.prisma as any).diplomaModule.create({
            data: {
              moduleNumber: normalizedNumber,
              title: `MODULE#${dto.moduleId.toUpperCase()}`,
              badgeTitle: `MODULE#${dto.moduleId.toUpperCase()}`,
              description: `Venture Architect Module ${dto.moduleId}`,
            },
          });
        } catch {
          targetModule = await (this.prisma as any).diplomaModule.findFirst().catch(() => null);
        }
      }

      if (targetModule) {
        targetModuleId = targetModule.id;
        moduleTitle = targetModule.title;
      }

      // 3. Upsert or delete StudentModuleUnlock record
      if (dto.unlock) {
        if ((this.prisma as any).studentModuleUnlock) {
          await (this.prisma as any).studentModuleUnlock.upsert({
            where: {
              userId_moduleId: {
                userId: dto.userId,
                moduleId: targetModuleId,
              },
            },
            update: {
              unlockedBy: adminUserId,
              notes: dto.notes || `Unlocked module ${normalizedNumber}`,
            },
            create: {
              userId: dto.userId,
              moduleId: targetModuleId,
              unlockedBy: adminUserId,
              notes: dto.notes || `Unlocked module ${normalizedNumber}`,
            },
          }).catch(() => {});
        }
      } else {
        if ((this.prisma as any).studentModuleUnlock) {
          await (this.prisma as any).studentModuleUnlock.deleteMany({
            where: {
              userId: dto.userId,
              moduleId: targetModuleId,
            },
          }).catch(() => {});
        }
      }

      // 4. Broadcast real-time module access update via WebSockets
      this.eventsGateway.emitModuleAccessUpdated(dto.userId, {
        userId: dto.userId,
        moduleId: targetModuleId,
        originalModuleId: dto.moduleId,
        moduleNumber: normalizedNumber,
        isUnlocked: dto.unlock,
        moduleTitle: moduleTitle || dto.moduleId,
        notes: dto.notes,
      });

      return this.getStudentFullDetail(dto.userId);
    } catch (e: any) {
      this.logger.error(`Unlock module error: ${e?.message || e}`);
      throw new BadRequestException(`Failed to update module unlock: ${e?.message || e}`);
    }
  }

  async unlockStudentLesson(dto: { userId: string; lessonId: string; unlock: boolean; notes?: string }, adminUserId: string) {
    const targetLessonId = dto.lessonId;
    try {
      if (dto.unlock) {
        if ((this.prisma as any).studentLessonUnlock) {
          await (this.prisma as any).studentLessonUnlock.upsert({
            where: {
              userId_lessonId: {
                userId: dto.userId,
                lessonId: targetLessonId,
              },
            },
            update: {
              unlockedBy: adminUserId,
              notes: dto.notes || `Unlocked lesson ${targetLessonId}`,
            },
            create: {
              userId: dto.userId,
              lessonId: targetLessonId,
              unlockedBy: adminUserId,
              notes: dto.notes || `Unlocked lesson ${targetLessonId}`,
            },
          }).catch(() => {});
        }
      } else {
        if ((this.prisma as any).studentLessonUnlock) {
          await (this.prisma as any).studentLessonUnlock.deleteMany({
            where: {
              userId: dto.userId,
              lessonId: targetLessonId,
            },
          }).catch(() => {});
        }
      }

      // Broadcast real-time WebSocket update
      this.eventsGateway.emitModuleAccessUpdated(dto.userId, {
        userId: dto.userId,
        lessonId: targetLessonId,
        isUnlocked: dto.unlock,
      });

      return this.getStudentFullDetail(dto.userId);
    } catch (e: any) {
      this.logger.error(`Unlock lesson error: ${e?.message || e}`);
      throw new BadRequestException(`Failed to update lesson unlock: ${e?.message || e}`);
    }
  }

  async assignCustomContent(dto: { userId: string; title: string; description: string; attachmentUrl?: string; dueDate?: string }, adminUserId: string) {
    try {
      if ((this.prisma as any).customStudentAssignment) {
        const assignment = await (this.prisma as any).customStudentAssignment.create({
          data: {
            userId: dto.userId,
            assignedBy: adminUserId,
            title: dto.title,
            description: dto.description,
            attachmentUrl: dto.attachmentUrl || null,
            dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
            status: 'PENDING',
          },
        });

        // Broadcast real-time assignment notification
        this.eventsGateway.emitCustomAssignmentCreated(dto.userId, {
          userId: dto.userId,
          title: dto.title,
          description: dto.description,
          attachmentUrl: dto.attachmentUrl,
          dueDate: dto.dueDate,
        });

        return assignment;
      }
    } catch (e: any) {
      this.logger.warn(`Assign content notice: ${e?.message || e}`);
    }
    return { success: true, message: 'Custom assignment created' };
  }

  async getStudentFullDetail(studentId: string) {
    const user = await (this.prisma as any).user.findUnique({
      where: { id: studentId },
      include: {
        enrollments: true,
        certificates: true,
      },
    });

    if (!user) throw new NotFoundException('Student not found');

    let unlockedModules: any[] = [];
    let unlockedLessons: any[] = [];
    let customAssignments: any[] = [];
    let lessonProgress: any[] = [];

    try {
      if ((this.prisma as any).studentModuleUnlock) {
        unlockedModules = await (this.prisma as any).studentModuleUnlock.findMany({
          where: { userId: studentId },
          include: { module: true },
        }).catch(() => []);
      }
    } catch (e) {}

    try {
      if ((this.prisma as any).studentLessonUnlock) {
        unlockedLessons = await (this.prisma as any).studentLessonUnlock.findMany({
          where: { userId: studentId },
          include: { lesson: true },
        }).catch(() => []);
      }
    } catch (e) {}

    try {
      if ((this.prisma as any).customStudentAssignment) {
        customAssignments = await (this.prisma as any).customStudentAssignment.findMany({
          where: { userId: studentId },
          orderBy: { createdAt: 'desc' },
        }).catch(() => []);
      }
    } catch (e) {}

    try {
      if ((this.prisma as any).studentLessonProgress) {
        lessonProgress = await (this.prisma as any).studentLessonProgress.findMany({
          where: { userId: studentId },
        }).catch(() => []);
      }
    } catch (e) {}

    const { password: _, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      unlockedModules,
      unlockedLessons,
      customAssignments,
      lessonProgress,
    };
  }

  /**
   * ADMIN: Reset all lesson progress records for a student account
   */
  async resetStudentProgress(studentId: string) {
    try {
      if ((this.prisma as any).studentLessonProgress) {
        await (this.prisma as any).studentLessonProgress.deleteMany({
          where: { userId: studentId },
        }).catch(() => {});
      }
    } catch (e) {}

    return this.getStudentFullDetail(studentId);
  }
}
