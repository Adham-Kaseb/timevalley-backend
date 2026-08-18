import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { CertificatesService, IssueCertificateDto } from './certificates.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  /**
   * PUBLIC ENDPOINT: Open access for certificate verification by serial code or ID
   * Accessible by anyone without login
   */
  @Get('verify/:code')
  async verifyCertificate(@Param('code') code: string) {
    return this.certificatesService.verifyCertificate(code);
  }

  /**
   * AUTHENTICATED ENDPOINT: Get all certificates for logged-in user
   */
  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyCertificates(@Request() req: any) {
    return this.certificatesService.getUserCertificates(req.user.id);
  }

  /**
   * AUTHENTICATED ENDPOINT: Check eligibility and auto-issue if course completed
   */
  @Post('check-eligibility')
  @UseGuards(JwtAuthGuard)
  async checkEligibility(@Request() req: any, @Body() dto: { courseId?: string }) {
    return this.certificatesService.checkAndIssueIfCompleted(
      req.user.id,
      dto.courseId || 'venture-architect-diploma',
    );
  }

  /**
   * ADMIN ENDPOINT: Manually issue a certificate for any student
   */
  @Post('admin/issue')
  @UseGuards(JwtAuthGuard)
  async adminIssueCertificate(@Body() dto: IssueCertificateDto) {
    return this.certificatesService.issueCertificateForUser(dto);
  }

  /**
   * ADMIN ENDPOINT: Resend certificate email notification
   */
  @Post('admin/resend-email/:id')
  @UseGuards(JwtAuthGuard)
  async adminResendEmail(@Param('id') id: string) {
    return this.certificatesService.resendCertificateEmail(id);
  }
}
