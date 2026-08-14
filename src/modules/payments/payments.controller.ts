import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('checkout-diploma')
  async checkoutDiploma(@Req() req: any, @Body() body: any) {
    const userId = req.user.id;
    return this.paymentsService.purchaseDiploma(userId, body);
  }
}
