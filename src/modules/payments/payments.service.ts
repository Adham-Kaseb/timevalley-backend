import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../socket/events.gateway';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async purchaseDiploma(userId: string, paymentDetails?: any) {
    // Check existing active enrollment
    const existing = await (this.prisma as any).enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: 'venture-architect-diploma',
        },
      },
    });

    if (existing && existing.status === 'ACTIVE') {
      return {
        message: 'تم تفعيل الدبلومة بنجاح من قبل',
        enrollment: existing,
        hasPurchasedDiploma: true,
      };
    }

    // Update User.hasDiplomaAccess column in DB
    await (this.prisma as any).user.update({
      where: { id: userId },
      data: { hasDiplomaAccess: true },
    }).catch(() => {});

    // Create or update enrollment for 5000 LE
    const enrollment = await (this.prisma as any).enrollment.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId: 'venture-architect-diploma',
        },
      },
      update: {
        status: 'ACTIVE',
        pricePaid: 5000,
        currency: 'LE',
      },
      create: {
        userId,
        courseId: 'venture-architect-diploma',
        pricePaid: 5000,
        currency: 'LE',
        status: 'ACTIVE',
      },
    });

    // Broadcast real-time access update
    this.eventsGateway.emitDiplomaAccessUpdated(userId, {
      userId,
      courseId: 'venture-architect-diploma',
      status: 'ACTIVE',
      hasDiplomaAccess: true,
    });

    return {
      message: 'تم شراء وتفعيل الدبلومة بنجاح بمبلغ 5,000 ج.م',
      enrollment,
      hasPurchasedDiploma: true,
    };
  }
}
