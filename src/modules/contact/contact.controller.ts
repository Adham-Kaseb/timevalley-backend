import { Body, Controller, Post } from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  async submitContact(@Body() dto: CreateContactDto) {
    return this.contactService.submitContact(dto);
  }

  @Post('newsletter')
  async subscribeNewsletter(@Body('email') email: string) {
    return this.contactService.subscribeNewsletter(email);
  }
}
