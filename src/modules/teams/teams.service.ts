import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeamDto, ApplyTeamDto } from './dto/teams.dto';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(sector?: string) {
    const filter = sector && sector !== 'All Sectors' ? { sector } : {};
    let teams = await (this.prisma as any).recruitingTeam.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
    });

    if (teams.length === 0 && (!sector || sector === 'All Sectors')) {
      // Seed default initial teams if empty
      const initialTeams = [
        {
          name: 'Project Chronos AI',
          sector: 'Fintech & Risk AI',
          founderName: 'Dr. Sarah Jenkins',
          description: 'Building autonomous risk evaluation engine for cross-border credit underwriting.',
          openRoles: ['Technical Co-Founder / CTO', 'Growth Marketer'],
          equitySplit: '25% - 40% Equity Split',
        },
        {
          name: 'BioPulse Longevity',
          sector: 'BioTech & HealthTech',
          founderName: 'Marcus Vance',
          description: 'Decentralized clinical trial data verification platform backed by TimeValley Studio.',
          openRoles: ['Full-Stack Developer', 'Regulatory Lead'],
          equitySplit: '20% - 35% Equity Split',
        },
        {
          name: 'OmniChain Logistics',
          sector: 'Supply Chain & Logistics',
          founderName: 'Omar Al-Farisi',
          description: 'Cross-border trade finance platform reducing settlement clearance latency.',
          openRoles: ['Smart Contract Engineer', 'Supply Chain Lead'],
          equitySplit: '15% - 30% Equity Split',
        },
        {
          name: 'AetherAI Engine',
          sector: 'Enterprise AI',
          founderName: 'Fatima Al-Hassan',
          description: 'Multi-agent autonomous framework for venture capital due diligence automated workflows.',
          openRoles: ['Machine Learning Scientist', 'Enterprise Sales Lead'],
          equitySplit: '25% - 45% Equity Split',
        },
      ];

      for (const t of initialTeams) {
        await (this.prisma as any).recruitingTeam.create({ data: t });
      }

      teams = await (this.prisma as any).recruitingTeam.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }

    return teams;
  }

  async create(userId: string | null, dto: CreateTeamDto) {
    return (this.prisma as any).recruitingTeam.create({
      data: {
        name: dto.name,
        sector: dto.sector,
        founderId: userId || null,
        founderName: dto.founderName,
        description: dto.description,
        openRoles: dto.openRoles,
        equitySplit: dto.equitySplit,
      },
    });
  }

  async apply(teamId: string, userId: string, dto: ApplyTeamDto) {
    const team = await (this.prisma as any).recruitingTeam.findUnique({
      where: { id: teamId },
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return (this.prisma as any).teamApplication.create({
      data: {
        teamId,
        userId,
        appliedRole: dto.appliedRole,
        coverNote: dto.coverNote || '',
      },
    });
  }
}
