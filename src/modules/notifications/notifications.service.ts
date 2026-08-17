import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

let webpush: any;
try {
  webpush = require('web-push');
} catch (e) {
  webpush = null;
}

export const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BGztqbsQYPwwK9b0Qinw--Nsq_DL5jVUD1oTYwIlycYCBqcJ8PffysmbjFOPMd_4_5QbALXHXqgaLJvM6XJvbLg';
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'tcc3UABamFeMZ4jj26DWsq_GX_cSaRlwqnjdjXt5_7c';
export const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@timevalley.com';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get db(): any {
    return this.prisma as any;
  }

  onModuleInit() {
    try {
      if (webpush && webpush.setVapidDetails) {
        webpush.setVapidDetails(
          VAPID_SUBJECT,
          VAPID_PUBLIC_KEY,
          VAPID_PRIVATE_KEY,
        );
        this.logger.log('Web-Push VAPID details configured successfully.');
      }
    } catch (err) {
      this.logger.warn('Could not initialize VAPID details:', err);
    }
  }

  /**
   * Get VAPID Public Key for client browser subscription
   */
  getPublicKey() {
    return { publicKey: VAPID_PUBLIC_KEY };
  }

  /**
   * Save or update a user's PWA device push subscription
   */
  async saveSubscription(userId: string, dto: { endpoint: string; keys: { p256dh: string; auth: string }; userAgent?: string }) {
    const { endpoint, keys, userAgent } = dto;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      throw new Error('Invalid subscription keys object.');
    }

    if (!this.db.pushSubscription) {
      return { id: 'mock', endpoint };
    }

    return this.db.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
      },
      create: {
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
      },
    });
  }

  /**
   * Get analytics & statistics for Admin Push Dashboard
   */
  async getNotificationStats() {
    try {
      const [subscribersCount, totalUsersCount, logsCount] = await Promise.all([
        this.db.pushSubscription ? this.db.pushSubscription.count() : Promise.resolve(0),
        this.prisma.user.count(),
        this.db.pushNotificationLog ? this.db.pushNotificationLog.count() : Promise.resolve(0),
      ]);

      return {
        subscribersCount,
        totalUsersCount,
        logsCount,
      };
    } catch (e) {
      return { subscribersCount: 0, totalUsersCount: 0, logsCount: 0 };
    }
  }

  /**
   * Fetch recent broadcast logs for Admin Audit
   */
  async getBroadcastLogs() {
    if (!this.db.pushNotificationLog) return [];
    return this.db.pushNotificationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Broadcast PWA Push Notification to target PWA devices
   */
  async broadcastNotification(
    sentBy: string,
    dto: { title: string; body: string; targetUrl?: string; scope?: string }
  ) {
    const { title, body, targetUrl, scope = 'ALL' } = dto;

    let subscriptions: any[] = [];
    if (this.db.pushSubscription) {
      if (scope === 'STUDENTS') {
        subscriptions = await this.db.pushSubscription.findMany({
          where: { user: { role: 'STUDENT' } },
        });
      } else if (scope === 'ADMINS') {
        subscriptions = await this.db.pushSubscription.findMany({
          where: { user: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } },
        });
      } else {
        subscriptions = await this.db.pushSubscription.findMany();
      }
    }

    const payload = JSON.stringify({
      title: title || 'TimeValley Update 🚀',
      body: body || 'You have a new notification in your workspace.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      url: targetUrl || '/workspace',
      timestamp: Date.now(),
    });

    let successCount = 0;
    const expiredEndpoints: string[] = [];

    if (webpush && webpush.sendNotification) {
      await Promise.all(
        subscriptions.map(async (sub: any) => {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };

          try {
            await webpush.sendNotification(pushSubscription, payload);
            successCount++;
          } catch (err: any) {
            if (err.statusCode === 404 || err.statusCode === 410) {
              expiredEndpoints.push(sub.endpoint);
            } else {
              this.logger.warn(`Failed to push notification to ${sub.endpoint}:`, err.message);
            }
          }
        })
      );
    }

    if (expiredEndpoints.length > 0 && this.db.pushSubscription) {
      await this.db.pushSubscription.deleteMany({
        where: { endpoint: { in: expiredEndpoints } },
      });
    }

    let log = null;
    if (this.db.pushNotificationLog) {
      log = await this.db.pushNotificationLog.create({
        data: {
          title,
          body,
          targetUrl: targetUrl || '/workspace',
          sentBy,
          recipients: successCount,
          status: 'SENT',
        },
      });
    }

    return {
      success: true,
      recipients: successCount,
      totalSubscribers: subscriptions.length,
      log,
    };
  }
}
