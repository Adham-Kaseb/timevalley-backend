import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto, RsvpEventDto } from './dto/events.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async getEvents(@Query('type') type?: string) {
    return this.eventsService.findAll(type);
  }

  @Post()
  async createEvent(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/rsvp')
  async rsvpEvent(@Param('id') id: string, @Req() req: any, @Body() dto: RsvpEventDto) {
    return this.eventsService.rsvp(id, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-rsvps')
  async getMyRsvps(@Req() req: any) {
    return this.eventsService.getUserRsvps(req.user.id);
  }
}
