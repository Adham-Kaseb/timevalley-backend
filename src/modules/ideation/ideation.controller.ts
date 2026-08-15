import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { IdeationService } from './ideation.service';
import { SaveVentureIdeaDto, SaveMarketCalculationDto } from './dto/ideation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('ideation')
export class IdeationController {
  constructor(private readonly ideationService: IdeationService) {}

  @UseGuards(JwtAuthGuard)
  @Post('ideas')
  async saveIdea(@Req() req: any, @Body() dto: SaveVentureIdeaDto) {
    return this.ideationService.saveIdea(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('ideas')
  async getUserIdeas(@Req() req: any) {
    return this.ideationService.getUserIdeas(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('market-calculations')
  async saveMarketCalculation(@Req() req: any, @Body() dto: SaveMarketCalculationDto) {
    return this.ideationService.saveMarketCalculation(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('market-calculations')
  async getUserCalculations(@Req() req: any) {
    return this.ideationService.getUserCalculations(req.user.id);
  }
}
