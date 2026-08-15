import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SaveVentureIdeaDto, SaveMarketCalculationDto } from './dto/ideation.dto';

@Injectable()
export class IdeationService {
  constructor(private readonly prisma: PrismaService) {}

  async saveIdea(userId: string, dto: SaveVentureIdeaDto) {
    return (this.prisma as any).ventureIdea.create({
      data: {
        userId,
        title: dto.title,
        sector: dto.sector,
        icpTarget: dto.icpTarget,
        problemStatement: dto.problemStatement,
        tamEstimate: dto.tamEstimate,
        pitchScore: dto.pitchScore || 85,
      },
    });
  }

  async getUserIdeas(userId: string) {
    return (this.prisma as any).ventureIdea.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async saveMarketCalculation(userId: string, dto: SaveMarketCalculationDto) {
    return (this.prisma as any).marketResearchCalculation.create({
      data: {
        userId,
        title: dto.title,
        tamAmount: dto.tamAmount,
        samAmount: dto.samAmount,
        somAmount: dto.somAmount,
        defensibilityScore: dto.defensibilityScore || 90,
      },
    });
  }

  async getUserCalculations(userId: string) {
    return (this.prisma as any).marketResearchCalculation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
