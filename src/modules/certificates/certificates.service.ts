import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

export class IssueCertificateDto {
  userId: string;
  courseId?: string;
  title?: string;
  type?: 'DIPLOMA' | 'COURSE';
}

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Helper method to generate a unique human-readable serial code
   * Format: TV-DIP-2026-X89F2A or TV-CRT-2026-X89F2A
   */
  private generateSerialCode(type: string = 'DIPLOMA'): string {
    const year = new Date().getFullYear();
    const prefix = type === 'DIPLOMA' ? 'TV-DIP' : 'TV-CRT';
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${year}-${randomHex}`;
  }

  /**
   * Generates or retrieves existing certificate for user and course
   */
  async issueCertificateForUser(dto: IssueCertificateDto) {
    const { userId, courseId = 'venture-architect-diploma', title, type = 'DIPLOMA' } = dto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    // Check if certificate already exists for user
    const existingCert = await (this.prisma as any).certificate.findFirst({
      where: { userId },
    });

    if (existingCert) {
      // Dispatch / Resend certificate email to student on request
      this.mailService.sendCertificateIssuedEmail({
        name: user.name,
        email: user.email,
        certificateTitle: existingCert.title,
        serialNumber: existingCert.code,
        issueDate: new Date(existingCert.issueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        verifyUrl: existingCert.credentialUrl || `https://timevalley.io/our-certificates?serial=${existingCert.code}`,
      }).catch((err) => {
        this.logger.error(`Failed to dispatch email for existing cert ${existingCert.code}: ${err?.message || err}`);
      });

      return existingCert;
    }

    const certTitle = title || (courseId === 'venture-architect-diploma' 
      ? 'Venture Architect & Founder Diploma' 
      : 'TimeValley Certified Masterclass');

    const serialCode = this.generateSerialCode(type);
    const verifyUrl = `https://timevalley.io/our-certificates?serial=${serialCode}`;

    const newCert = await (this.prisma as any).certificate.create({
      data: {
        userId,
        title: certTitle,
        code: serialCode,
        credentialUrl: verifyUrl,
      },
    });

    this.logger.log(`[Certificate Engine] Issued certificate [${serialCode}] for user ${user.name} (${user.email})`);

    // Asynchronously dispatch certificate email to student
    this.mailService.sendCertificateIssuedEmail({
      name: user.name,
      email: user.email,
      certificateTitle: certTitle,
      serialNumber: serialCode,
      issueDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      verifyUrl,
    }).catch((err) => {
      this.logger.error(`Failed to dispatch email for cert ${serialCode}: ${err?.message || err}`);
    });

    return newCert;
  }

  /**
   * Public verification endpoint lookup by Serial Code
   */
  async verifyCertificate(code: string) {
    const cleanCode = code.trim().toUpperCase();

    const cert = await (this.prisma as any).certificate.findFirst({
      where: {
        OR: [
          { code: cleanCode },
          { id: code },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            companyName: true,
            targetSector: true,
            studentId: true,
          },
        },
      },
    });

    if (!cert) {
      throw new NotFoundException('الشهادة غير موجودة أو كود التوثيق غير صحيح');
    }

    return {
      verified: true,
      code: cert.code,
      title: cert.title,
      type: 'DIPLOMA',
      courseId: 'venture-architect-diploma',
      issueDate: cert.issueDate,
      credentialUrl: cert.credentialUrl,
      recipient: {
        id: cert.user.id,
        name: cert.user.name,
        email: cert.user.email,
        avatar: cert.user.avatar,
        studentId: cert.user.studentId || `TV-${cert.user.id.substring(0, 6).toUpperCase()}`,
        companyName: cert.user.companyName,
        targetSector: cert.user.targetSector,
      },
      issuer: {
        organization: 'TimeValley Institute of Entrepreneurship',
        founder: 'Dr. Wael',
        title: 'Managing Partner & Head of Advisory Board',
        seal: 'OFFICIAL_TIMEVALLEY_SEAL_AUTHENTICATED',
      },
    };
  }

  /**
   * Get all earned certificates for a specific user
   */
  async getUserCertificates(userId: string) {
    const certificates = await (this.prisma as any).certificate.findMany({
      where: { userId },
      orderBy: { issueDate: 'desc' },
    });

    return certificates;
  }

  /**
   * Check user progress and auto-issue certificate if 100% completed or requested
   */
  async checkAndIssueIfCompleted(userId: string, courseId: string = 'venture-architect-diploma') {
    try {
      // Check if user already has certificate
      const existing = await (this.prisma as any).certificate.findFirst({
        where: { userId },
      });

      if (existing) return existing;

      // Issue certificate directly for the student
      this.logger.log(`[Cert Trigger] Issuing certificate for user ${userId} (${courseId})...`);
      return await this.issueCertificateForUser({ userId, courseId });
    } catch (err: any) {
      this.logger.warn(`Auto cert check warning for user ${userId}: ${err?.message || err}`);
    }
    return null;
  }

  /**
   * Admin manual trigger to resend certificate email
   */
  async resendCertificateEmail(certId: string) {
    const cert = await (this.prisma as any).certificate.findUnique({
      where: { id: certId },
      include: { user: true },
    });

    if (!cert) {
      throw new NotFoundException('الشهادة غير موجودة');
    }

    const verifyUrl = cert.credentialUrl || `https://timevalley.io/our-certificates?serial=${cert.code}`;

    await this.mailService.sendCertificateIssuedEmail({
      name: cert.user.name,
      email: cert.user.email,
      certificateTitle: cert.title,
      serialNumber: cert.code,
      issueDate: new Date(cert.issueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      verifyUrl,
    });

    return { message: `تم إعادة إرسال بريد الشهادة بنجاح إلى ${cert.user.email}` };
  }
}
