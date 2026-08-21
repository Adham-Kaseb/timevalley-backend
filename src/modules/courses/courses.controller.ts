import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { CreateModuleDto, UpdateModuleDto } from './dto/admin-module.dto';
import { CreateLessonDto, UpdateLessonDto } from './dto/admin-lesson.dto';


@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('diploma')
  async getDiplomaCurriculum(@Req() req: any) {
    let userId: string | undefined;

    // Optional auth token parsing
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = this.jwtService.verify(token);
        userId = decoded?.sub;
      } catch (e) {
        // Token expired or invalid, treat as guest
      }
    }

    return this.coursesService.getDiplomaCurriculum(userId);
  }

  // --- ADMIN DIPLOMA BUILDER ENDPOINTS ---

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @RequirePermission('MANAGE_DIPLOMAS')
  @Post('admin/modules')
  async createModule(@Body() dto: CreateModuleDto) {
    return this.coursesService.createModule(dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @RequirePermission('MANAGE_DIPLOMAS')
  @Patch('admin/modules/:id')
  async updateModule(@Param('id') id: string, @Body() dto: UpdateModuleDto) {
    return this.coursesService.updateModule(id, dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @RequirePermission('MANAGE_DIPLOMAS')
  @Delete('admin/modules/:id')
  async deleteModule(@Param('id') id: string) {
    return this.coursesService.deleteModule(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @RequirePermission('MANAGE_DIPLOMAS')
  @Post('admin/lessons')
  async createLesson(@Body() dto: CreateLessonDto) {
    return this.coursesService.createLesson(dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @RequirePermission('MANAGE_DIPLOMAS')
  @Patch('admin/lessons/:id')
  async updateLesson(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    return this.coursesService.updateLesson(id, dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @RequirePermission('MANAGE_DIPLOMAS')
  @Delete('admin/lessons/:id')
  async deleteLesson(@Param('id') id: string) {
    return this.coursesService.deleteLesson(id);
  }


  // --- MODULE RESOURCES & PLAYBOOKS ENDPOINTS ---

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post('admin/resources')
  async createResource(
    @Body() dto: { moduleId: string; title: string; fileUrl: string; fileType?: string; fileSize?: string; description?: string },
  ) {
    return this.coursesService.createResource(dto);
  }

  @Get('modules/:moduleId/resources')
  async getModuleResources(@Param('moduleId') moduleId: string) {
    return this.coursesService.getResourcesByModule(moduleId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Delete('admin/resources/:id')
  async deleteResource(@Param('id') id: string) {
    return this.coursesService.deleteResource(id);
  }

  // --- MODULE QUIZZES ENDPOINTS ---

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post('admin/quizzes')
  async createQuiz(
    @Body() dto: { moduleId: string; title: string; passingScore?: number; questions: any[] },
  ) {
    return this.coursesService.createQuiz(dto);
  }

  @Get('modules/:moduleId/quizzes')
  async getModuleQuizzes(@Param('moduleId') moduleId: string) {
    return this.coursesService.getQuizzesByModule(moduleId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Delete('admin/quizzes/:id')
  async deleteQuiz(@Param('id') id: string) {
    return this.coursesService.deleteQuiz(id);
  }

  // --- STUDENT LESSON PROGRESS ENDPOINTS ---

  @UseGuards(JwtAuthGuard)
  @Post('progress')
  async markProgress(
    @Req() req: any,
    @Body() dto: { lessonId: string; isCompleted: boolean; watchDurationSec?: number },
  ) {
    return this.coursesService.markLessonProgress(
      req.user.id,
      dto.lessonId,
      dto.isCompleted,
      dto.watchDurationSec || 0,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('progress')
  async getStudentProgress(@Req() req: any) {
    return this.coursesService.getStudentProgress(req.user.id);
  }
}
