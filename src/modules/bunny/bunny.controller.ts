import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { BunnyService } from './bunny.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('bunny')
export class BunnyController {
  constructor(
    private readonly bunnyService: BunnyService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Generates a signed stream playback URL & token for authorized users.
   */
  @UseGuards(JwtAuthGuard)
  @Get('playback/:videoId')
  async getSignedPlayback(@Param('videoId') videoId: string, @Req() req: any) {
    const user = req.user;
    const userIp = req.ip || req.headers['x-forwarded-for'] || '';

    // Check if user is enrolled or SUPER_ADMIN / ADMIN
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      const enrollment = await (this.prisma as any).enrollment.findFirst({
        where: {
          userId: user.id,
          courseId: 'venture-architect-diploma',
          status: 'ACTIVE',
        },
      });

      // Also check explicit lesson unlocks
      const unlock = await (this.prisma as any).studentLessonUnlock.findFirst({
        where: {
          userId: user.id,
        },
      });

      if (!enrollment && !unlock && !user.hasDiplomaAccess) {
        throw new ForbiddenException('Access restricted to enrolled diploma students.');
      }
    }

    return this.bunnyService.generateSignedPlayback(videoId, {
      userIp: typeof userIp === 'string' ? userIp.split(',')[0].trim() : '',
      expiresMinutes: 180, // 3 hours
    });
  }

  /**
   * Creates a new video record in Bunny Stream for admin uploading.
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @RequirePermission('MANAGE_DIPLOMAS')
  @Post('videos')
  async createVideo(@Body() dto: { title: string; collectionId?: string }) {
    return this.bunnyService.createVideo(dto.title, dto.collectionId);
  }

  /**
   * Retrieves video status from Bunny Stream.
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Get('videos/:videoId')
  async getVideo(@Param('videoId') videoId: string) {
    return this.bunnyService.getVideo(videoId);
  }

  /**
   * Deletes a video from Bunny Stream.
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @RequirePermission('MANAGE_DIPLOMAS')
  @Delete('videos/:videoId')
  async deleteVideo(@Param('videoId') videoId: string) {
    const success = await this.bunnyService.deleteVideo(videoId);
    return { success };
  }

  /**
   * Webhook endpoint to receive processing updates from Bunny Stream.
   */
  @Post('webhook')
  async handleWebhook(@Body() payload: any) {
    // Bunny Stream Webhook payload includes VideoGuid, Status, etc.
    const { VideoGuid, Status } = payload || {};
    if (VideoGuid && Status === 4) { // Status 4 = Finished Transcoding
      try {
        await (this.prisma as any).diplomaLesson.updateMany({
          where: {
            videoUrl: {
              contains: VideoGuid,
            },
          },
          data: {
            videoProvider: 'BUNNY',
          },
        });
      } catch {}
    }
    return { received: true };
  }
}
