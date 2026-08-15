import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../socket/events.gateway';
import { CouponsService } from '../coupons/coupons.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
    private readonly couponsService: CouponsService,
  ) {}

  async purchaseDiploma(userId: string, paymentDetails?: any) {
    const rawAmount = Number(paymentDetails?.amount) || 5000;
    const paymentMethod = paymentDetails?.paymentMethod || paymentDetails?.method || 'CARD';
    const senderRef = paymentDetails?.senderRef || paymentDetails?.reference || '';
    const promoCode = paymentDetails?.promoCode || '';

    // Calculate effective price & discounts dynamically via CouponsService
    let finalAmount = rawAmount;
    let discountApplied = 0;
    if (promoCode) {
      try {
        const validated = await this.couponsService.validateCoupon(promoCode, rawAmount, 'DIPLOMA');
        if (validated && validated.isValid) {
          discountApplied = validated.discountAmount;
          finalAmount = validated.finalPrice;
          await this.couponsService.recordRedemption(promoCode);
        }
      } catch (err: any) {
        console.warn('Coupon validation fallback during payment:', err?.message);
        if (promoCode.toUpperCase() === 'FOUNDER2026') {
          discountApplied = 500;
          finalAmount = Math.max(0, rawAmount - 500);
        } else if (promoCode.toUpperCase() === 'EARLYBIRD') {
          discountApplied = 1000;
          finalAmount = Math.max(0, rawAmount - 1000);
        }
      }
    }

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
        transactionRef: existing.id || `TXN-${Date.now()}`,
        finalAmount: existing.pricePaid || 5000,
      };
    }

    // Update User.hasDiplomaAccess column in DB
    await (this.prisma as any).user.update({
      where: { id: userId },
      data: { hasDiplomaAccess: true },
    }).catch(() => {});

    // Create or update enrollment
    const enrollment = await (this.prisma as any).enrollment.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId: 'venture-architect-diploma',
        },
      },
      update: {
        status: 'ACTIVE',
        pricePaid: finalAmount,
        currency: 'LE',
      },
      create: {
        userId,
        courseId: 'venture-architect-diploma',
        pricePaid: finalAmount,
        currency: 'LE',
        status: 'ACTIVE',
      },
    });

    // Create transaction log
    const transactionRef = senderRef ? `TXN-${senderRef.toUpperCase()}-${Date.now().toString().slice(-4)}` : `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    await (this.prisma as any).paymentTransaction.create({
      data: {
        userId,
        courseId: 'venture-architect-diploma',
        amount: finalAmount,
        currency: 'LE',
        paymentMethod: paymentMethod.toUpperCase(),
        transactionRef,
        status: 'SUCCESS',
      },
    }).catch((err: any) => console.error('Failed to log payment transaction:', err));

    // Broadcast real-time access update
    this.eventsGateway.emitDiplomaAccessUpdated(userId, {
      userId,
      courseId: 'venture-architect-diploma',
      status: 'ACTIVE',
      hasDiplomaAccess: true,
    });

    return {
      message: `تم شراء وتفعيل الدبلومة بنجاح بمبلغ ${finalAmount.toLocaleString()} ج.م`,
      enrollment,
      transactionRef,
      paymentMethod: paymentMethod.toUpperCase(),
      finalAmount,
      discountApplied,
      hasPurchasedDiploma: true,
      timestamp: new Date().toISOString(),
    };
  }
}
