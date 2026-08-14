import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { CreateContactDto } from './dto/contact.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(private readonly mailService: MailService) {}

  async submitContact(dto: CreateContactDto) {
    this.logger.log(`Received contact form submission from ${dto.name} (${dto.email})`);

    // Non-blocking trigger to send email notification to adhamkasebssj4@gmail.com
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
}
