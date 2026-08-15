import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { CouponsService } from './coupons.service';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  async findAll() {
    return this.couponsService.findAll();
  }

  @Post()
  async create(@Body() body: any) {
    return this.couponsService.create(body);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.couponsService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.couponsService.remove(id);
  }

  @Post('validate')
  async validate(@Body() body: { code: string; basePrice?: number; scope?: string }) {
    return this.couponsService.validateCoupon(body.code, body.basePrice, body.scope);
  }
}
