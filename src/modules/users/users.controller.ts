import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserResponse } from '../auth/interfaces/jwt-payload.interface';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('profile')
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto): Promise<UserResponse> {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Post('avatar')
  @Patch('avatar')
  async uploadAvatar(@Request() req: any, @Body() dto: UpdateProfileDto): Promise<UserResponse> {
    const avatar = dto.avatar ?? req.body?.avatar ?? '';
    return this.usersService.uploadAvatar(req.user.id, avatar);
  }

  @Patch('change-password')
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto): Promise<{ message: string }> {
    return this.usersService.changePassword(req.user.id, dto);
  }

  @Get('certificates')
  async getCertificates(@Request() req: any) {
    return this.usersService.getCertificates(req.user.id);
  }

  // --- ADMIN USER MANAGEMENT ENDPOINTS ---

  @Get('admin/list')
  async listUsersForAdmin() {
    return this.usersService.listAllUsersForAdmin();
  }

  @Patch('admin/permissions')
  async updatePermissions(
    @Body() dto: { userId: string; role: string; permissionKeys?: string[] },
  ) {
    return this.usersService.updateUserRoleAndPermissions(
      dto.userId,
      dto.role,
      dto.permissionKeys,
    );
  }

  @Post('admin/create-user')
  async createUserByAdmin(@Body() dto: any) {
    return this.usersService.createUserByAdmin(dto);
  }

  @Post('admin/toggle-enrollment')
  async toggleEnrollment(@Body() dto: { userId: string; courseId?: string; status: string }) {
    return this.usersService.toggleStudentEnrollment(dto);
  }

  @Post('admin/unlock-module')
  async unlockModule(@Request() req: any, @Body() dto: { userId: string; moduleId: string; unlock: boolean; notes?: string }) {
    return this.usersService.unlockStudentModule(dto, req.user.id);
  }

  @Post('admin/unlock-lesson')
  async unlockLesson(@Request() req: any, @Body() dto: { userId: string; lessonId: string; unlock: boolean; notes?: string }) {
    return this.usersService.unlockStudentLesson(dto, req.user.id);
  }

  @Post('admin/assign-content')
  async assignContent(@Request() req: any, @Body() dto: { userId: string; title: string; description: string; attachmentUrl?: string; dueDate?: string }) {
    return this.coursesServiceAssignContent(req, dto);
  }

  private async coursesServiceAssignContent(req: any, dto: any) {
    return this.usersService.assignCustomContent(dto, req.user.id);
  }

  @Get('admin/student-detail/:id')
  async getStudentDetail(@Param('id') id: string) {
    return this.usersService.getStudentFullDetail(id);
  }
}
