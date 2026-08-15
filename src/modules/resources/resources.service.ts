import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePublicResourceDto } from './dto/resources.dto';

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(category?: string, search?: string) {
    const where: any = {};
    if (category && category !== 'All Resources') {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { desc: { contains: search, mode: 'insensitive' } },
      ];
    }

    let resources = await (this.prisma as any).publicResource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    if (resources.length === 0 && (!category || category === 'All Resources') && !search) {
      const initialResources = [
        {
          title: 'The Day Zero Founder Playbook 2026',
          category: 'Venture Strategy',
          format: 'PDF Guide (48 Pages)',
          fileUrl: 'https://cdn.timevalley.co/playbook-2026.pdf',
          desc: 'Step-by-step blueprint for co-founder matchmaking, thesis validation, and initial GTM sprint execution.',
          downloadsCount: 3820,
        },
        {
          title: 'TimeValley Pre-Seed Standard Term Sheet',
          category: 'Legal & Equity',
          format: 'DOCX / PDF Template',
          fileUrl: 'https://cdn.timevalley.co/term-sheet-template.docx',
          desc: 'Clean, founder-friendly SAFE & equity investment agreement template used across our global cohorts.',
          downloadsCount: 5110,
        },
        {
          title: 'The 10-Slide Investor Deck Master Template',
          category: 'Pitch & Fundraising',
          format: 'Figma / Keynote Template',
          fileUrl: 'https://cdn.timevalley.co/investor-deck-template.fig',
          desc: 'Battle-tested pitch deck layout designed to communicate market size, unit economics, and technical moat.',
          downloadsCount: 6490,
        },
        {
          title: 'SaaS Unit Economics & Financial Cash Model',
          category: 'Financial Modeling',
          format: 'Excel / Google Sheets',
          fileUrl: 'https://cdn.timevalley.co/saas-financial-model.xlsx',
          desc: 'Interactive 3-year financial model with automated LTV/CAC calculations, burn runway, and hiring schedules.',
          downloadsCount: 4230,
        },
        {
          title: 'Co-Founder Equity Split & Vesting Calculator',
          category: 'Legal & Equity',
          format: 'Web Tool / Calculator',
          fileUrl: 'https://cdn.timevalley.co/equity-calculator.xlsx',
          desc: 'Algorithmic framework to calculate fair co-founder equity splits based on domain expertise and risk commitment.',
          downloadsCount: 2940,
        },
        {
          title: 'GTM Growth Experiment & Lead Generation Matrix',
          category: 'Growth & Sales',
          format: 'Notion Dashboard',
          fileUrl: 'https://cdn.timevalley.co/gtm-matrix.pdf',
          desc: 'Framework for running 14-day growth experiments, outbound B2B cadence tracking, and customer interviews.',
          downloadsCount: 3150,
        },
      ];

      for (const r of initialResources) {
        await (this.prisma as any).publicResource.create({ data: r });
      }

      resources = await (this.prisma as any).publicResource.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }

    return resources;
  }

  async create(dto: CreatePublicResourceDto) {
    return (this.prisma as any).publicResource.create({ data: dto });
  }

  async recordDownload(resourceId: string, userId?: string) {
    const resource = await (this.prisma as any).publicResource.findUnique({
      where: { id: resourceId },
    });
    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    const updated = await (this.prisma as any).publicResource.update({
      where: { id: resourceId },
      data: { downloadsCount: { increment: 1 } },
    });

    if (userId) {
      await (this.prisma as any).resourceDownloadLog.create({
        data: {
          resourceId,
          userId,
        },
      });
    }

    return updated;
  }
}
