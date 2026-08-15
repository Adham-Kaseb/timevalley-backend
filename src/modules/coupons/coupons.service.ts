import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CouponsService {
  private memoryCoupons: any[] = [];

  constructor(private readonly prisma: PrismaService) {}

  private get couponDelegate() {
    return (this.prisma as any)?.coupon;
  }

  // List all coupons with redemption statistics
  async findAll() {
    try {
      if (this.couponDelegate) {
        return await this.couponDelegate.findMany({
          orderBy: { createdAt: 'desc' },
        });
      }
    } catch (err: any) {
      console.warn('Prisma coupon findAll fallback:', err?.message);
    }
    return this.memoryCoupons;
  }

  // Create a new coupon with rules
  async create(data: {
    code: string;
    discountType?: string;
    discountValue: number;
    minPurchaseAmount?: number;
    validFrom?: string | Date;
    validUntil?: string | Date;
    maxRedemptions?: number;
    allowStacking?: boolean;
    applicableScope?: string;
  }) {
    const cleanCode = (data.code || '').trim().toUpperCase();
    if (!cleanCode) {
      throw new BadRequestException('Coupon code is required');
    }

    const newCoupon = {
      id: `coupon-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      code: cleanCode,
      discountType: data.discountType || 'FIXED',
      discountValue: Number(data.discountValue) || 500,
      minPurchaseAmount: Number(data.minPurchaseAmount) || 0,
      validFrom: data.validFrom ? new Date(data.validFrom) : new Date(),
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      maxRedemptions: data.maxRedemptions ? Number(data.maxRedemptions) : null,
      timesRedeemed: 0,
      allowStacking: Boolean(data.allowStacking),
      applicableScope: data.applicableScope || 'DIPLOMA',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      if (this.couponDelegate) {
        const existing = await this.couponDelegate.findUnique({
          where: { code: cleanCode },
        });

        if (existing) {
          throw new BadRequestException(`Coupon with code "${cleanCode}" already exists`);
        }

        const created = await this.couponDelegate.create({
          data: {
            code: cleanCode,
            discountType: data.discountType || 'FIXED',
            discountValue: Number(data.discountValue) || 500,
            minPurchaseAmount: Number(data.minPurchaseAmount) || 0,
            validFrom: data.validFrom ? new Date(data.validFrom) : new Date(),
            validUntil: data.validUntil ? new Date(data.validUntil) : null,
            maxRedemptions: data.maxRedemptions ? Number(data.maxRedemptions) : null,
            allowStacking: Boolean(data.allowStacking),
            applicableScope: data.applicableScope || 'DIPLOMA',
            status: 'ACTIVE',
          },
        });
        return created;
      }
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      console.warn('Prisma coupon create fallback:', err?.message);
    }

    // In-Memory Fallback
    const existingMem = this.memoryCoupons.find((c) => c.code === cleanCode);
    if (existingMem) {
      throw new BadRequestException(`Coupon with code "${cleanCode}" already exists`);
    }

    this.memoryCoupons.unshift(newCoupon);
    return newCoupon;
  }

  // Update coupon rules or status
  async update(id: string, data: any) {
    try {
      if (this.couponDelegate) {
        const coupon = await this.couponDelegate.findUnique({ where: { id } });
        if (coupon) {
          const updateData: any = {};
          if (data.code) updateData.code = data.code.trim().toUpperCase();
          if (data.discountType) updateData.discountType = data.discountType;
          if (data.discountValue !== undefined) updateData.discountValue = Number(data.discountValue);
          if (data.status) updateData.status = data.status;
          if (data.maxRedemptions !== undefined) updateData.maxRedemptions = data.maxRedemptions ? Number(data.maxRedemptions) : null;
          if (data.allowStacking !== undefined) updateData.allowStacking = Boolean(data.allowStacking);
          if (data.validUntil !== undefined) updateData.validUntil = data.validUntil ? new Date(data.validUntil) : null;

          return await this.couponDelegate.update({
            where: { id },
            data: updateData,
          });
        }
      }
    } catch (err: any) {
      console.warn('Prisma coupon update fallback:', err?.message);
    }

    const item = this.memoryCoupons.find((c) => c.id === id);
    if (!item) {
      throw new NotFoundException(`Coupon not found`);
    }
    if (data.status) item.status = data.status;
    if (data.code) item.code = data.code.trim().toUpperCase();
    if (data.discountValue !== undefined) item.discountValue = Number(data.discountValue);
    item.updatedAt = new Date();
    return item;
  }

  // Delete a coupon
  async remove(id: string) {
    try {
      if (this.couponDelegate) {
        return await this.couponDelegate.delete({ where: { id } });
      }
    } catch (err: any) {
      console.warn('Prisma coupon remove fallback:', err?.message);
    }
    this.memoryCoupons = this.memoryCoupons.filter((c) => c.id !== id);
    return { success: true };
  }

  // Validate coupon code against an order/checkout
  async validateCoupon(code: string, basePrice: number = 5000, scope: string = 'DIPLOMA') {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      throw new BadRequestException('Coupon code is empty');
    }

    let coupon: any = null;

    try {
      if (this.couponDelegate) {
        coupon = await this.couponDelegate.findUnique({
          where: { code: cleanCode },
        });
      }
    } catch (err: any) {
      console.warn('Prisma coupon validate lookup fallback:', err?.message);
    }

    if (!coupon) {
      coupon = this.memoryCoupons.find((c) => c.code === cleanCode);
    }

    if (!coupon) {
      // Fallback compatibility check for hardcoded legacy codes
      if (cleanCode === 'FOUNDER2026') {
        return {
          isValid: true,
          code: 'FOUNDER2026',
          discountType: 'FIXED',
          discountValue: 500,
          discountAmount: 500,
          finalPrice: Math.max(0, basePrice - 500),
          message: 'Founders Promo applied! (-500 LE)',
        };
      }
      if (cleanCode === 'EARLYBIRD') {
        return {
          isValid: true,
          code: 'EARLYBIRD',
          discountType: 'FIXED',
          discountValue: 1000,
          discountAmount: 1000,
          finalPrice: Math.max(0, basePrice - 1000),
          message: 'Early Bird Promo applied! (-1,000 LE)',
        };
      }
      throw new BadRequestException(`Coupon "${cleanCode}" is invalid or does not exist`);
    }

    // Status check
    if (coupon.status !== 'ACTIVE') {
      throw new BadRequestException(`Coupon "${cleanCode}" is currently inactive or disabled`);
    }

    // Expiration date check
    const now = new Date();
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      throw new BadRequestException(`Coupon "${cleanCode}" is not active yet`);
    }
    if (coupon.validUntil && new Date(coupon.validUntil) < now) {
      coupon.status = 'EXPIRED';
      try {
        if (this.couponDelegate) {
          await this.couponDelegate.update({
            where: { id: coupon.id },
            data: { status: 'EXPIRED' },
          });
        }
      } catch (err: any) {}
      throw new BadRequestException(`Coupon "${cleanCode}" has expired`);
    }

    // Redemption limit check
    if (coupon.maxRedemptions !== null && coupon.maxRedemptions !== undefined && coupon.timesRedeemed >= coupon.maxRedemptions) {
      throw new BadRequestException(`Coupon "${cleanCode}" has reached its maximum redemption limit`);
    }

    // Minimum purchase check
    if (coupon.minPurchaseAmount && basePrice < coupon.minPurchaseAmount) {
      throw new BadRequestException(`Coupon requires a minimum purchase amount of ${coupon.minPurchaseAmount.toLocaleString()} LE`);
    }

    // Compute discount calculation
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = Math.round((basePrice * coupon.discountValue) / 100);
    } else {
      discountAmount = coupon.discountValue;
    }

    const finalPrice = Math.max(0, basePrice - discountAmount);

    return {
      isValid: true,
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      finalPrice,
      allowStacking: coupon.allowStacking,
      message: `Coupon "${coupon.code}" applied (-${discountAmount.toLocaleString()} LE)!`,
    };
  }

  // Increment redemption count on checkout completion
  async recordRedemption(code: string) {
    if (!code) return;
    const cleanCode = code.trim().toUpperCase();
    try {
      if (this.couponDelegate) {
        await this.couponDelegate.updateMany({
          where: { code: cleanCode },
          data: {
            timesRedeemed: { increment: 1 },
          },
        });
      }
    } catch (err: any) {
      console.warn('Prisma record redemption fallback:', err?.message);
    }
    const memItem = this.memoryCoupons.find((c) => c.code === cleanCode);
    if (memItem) {
      memItem.timesRedeemed = (memItem.timesRedeemed || 0) + 1;
    }
  }
}
