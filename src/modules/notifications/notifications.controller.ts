import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('public-key')
  getPublicKey() {
    return this.notificationsService.getPublicKey();
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  async saveSubscription(@Request() req: any, @Body() dto: any) {
    return this.notificationsService.saveSubscription(req.user.id, dto);
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard)
  async getStats() {
    return this.notificationsService.getNotificationStats();
  }

  @Get('admin/logs')
  @UseGuards(JwtAuthGuard)
  async getLogs() {
    return this.notificationsService.getBroadcastLogs();
  }

  @Post('admin/broadcast')
  @UseGuards(JwtAuthGuard)
  async broadcast(@Request() req: any, @Body() dto: { title: string; body: string; targetUrl?: string; scope?: string }) {
    const sentBy = req.user?.email || 'Super Admin';
    return this.notificationsService.broadcastNotification(sentBy, dto);
  }
}
