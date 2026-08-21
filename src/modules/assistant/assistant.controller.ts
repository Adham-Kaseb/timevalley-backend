import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { AssistantService, ChatQueryDto } from './assistant.service';

@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Get('faqs')
  getFaqs(@Query('lang') lang: 'en' | 'ar') {
    return this.assistantService.getInitialFaqs(lang);
  }

  @Post('chat')
  chat(@Body() dto: ChatQueryDto) {
    return this.assistantService.handleChatQuery(dto);
  }
}
