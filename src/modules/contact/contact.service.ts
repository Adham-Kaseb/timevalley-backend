import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateContactDto } from './dto/contact.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async submitContact(dto: CreateContactDto) {
    this.logger.log(`Received contact form submission from ${dto.name} (${dto.email})`);

    // Persist submission to database
    await (this.prisma as any).contactSubmission.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone || null,
        subject: dto.subject || null,
        message: dto.message,
        type: dto.subject?.includes('Pitch') ? 'PITCH' : 'CONTACT',
      },
    }).catch((err: any) => this.logger.error('Failed to persist contact submission:', err));

    // Non-blocking trigger to send email notification to admin
    this.mailService.sendContactUsEmail({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      subject: dto.subject,
      message: dto.message,
    });

    return {
      success: true,
      message: 'Thank you for contacting TimeValley. Our team will reach out to you shortly.',
    };
  }

  async subscribeNewsletter(email: string) {
    try {
      return await (this.prisma as any).newsletterSubscription.create({
        data: { email: email.toLowerCase().trim() },
      });
    } catch (err: any) {
      if (err.code === 'P2002') {
        return { message: 'You are already subscribed to the TimeValley newsletter.' };
      }
      throw err;
    }
  }
}
