import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto, UpdateConsultationDto, BookConsultationDto } from './dto/consultation.dto';

@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Get()
  async getPublicConsultations(@Query('category') category?: string) {
    return this.consultationsService.findPublished(category);
  }

  @Get('admin/all')
  async getAllAdmin() {
    return this.consultationsService.findAllAdmin();
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.consultationsService.findOne(id);
  }

  @Post('admin')
  async create(@Body() dto: CreateConsultationDto) {
    return this.consultationsService.create(dto);
  }

  @Patch('admin/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateConsultationDto) {
    return this.consultationsService.update(id, dto);
  }

  @Delete('admin/:id')
  async remove(@Param('id') id: string) {
    return this.consultationsService.remove(id);
  }

  @Post('book')
  async bookConsultation(@Body() dto: BookConsultationDto) {
    return this.consultationsService.bookConsultation(dto);
  }
}
