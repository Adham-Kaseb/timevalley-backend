import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { CreatePublicResourceDto } from './dto/resources.dto';

@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  async getResources(@Query('category') category?: string, @Query('search') search?: string) {
    return this.resourcesService.findAll(category, search);
  }

  @Post()
  async createResource(@Body() dto: CreatePublicResourceDto) {
    return this.resourcesService.create(dto);
  }

  @Post(':id/download')
  async recordDownload(@Param('id') id: string, @Body() body?: { userId?: string }) {
    return this.resourcesService.recordDownload(id, body?.userId);
  }
}
