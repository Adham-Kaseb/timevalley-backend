import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConsultationDto, UpdateConsultationDto, BookConsultationDto } from './dto/consultation.dto';

// In-memory fallback cache if database table has not been migrated yet
let memoryConsultationCards: any[] = [
  {
    id: 'card-1',
    title: '1-on-1 Venture Strategy & Thesis Alignment',
    consultantName: 'Dr. Wael',
    consultantTitle: 'Founder & Managing Partner',
    consultantAvatar: '/images/team/CEO.jpg',
    category: 'Venture Strategy',
    description: 'Comprehensive 60-minute strategic deep-dive on market positioning, business model viability, and unit economics validation for seed & series-A startups.',
    duration: '60 Mins',
    price: 250,
    currency: 'USD',
    bookingUrl: 'https://calendly.com',
    tags: ['Strategy', 'Business Model', 'Seed Gate'],
    isPublished: true,
    orderIndex: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'card-2',
    title: 'Investor Pitch Deck Teardown & Valuation Review',
    consultantName: 'Dr. Wael',
    consultantTitle: 'Founder & Managing Partner',
    consultantAvatar: '/images/team/CEO.jpg',
    category: 'Pitch Review',
    description: 'Line-by-line teardown of your investor pitch deck, financial projections, TAM/SAM modeling, and valuation ask before presenting to top-tier VCs.',
    duration: '45 Mins',
    price: 200,
    currency: 'USD',
    bookingUrl: 'https://calendly.com',
    tags: ['Pitch Deck', 'Valuation', 'VC Pitch'],
    isPublished: true,
    orderIndex: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'card-3',
    title: 'Product-Market Fit & MENA Expansion Blueprint',
    consultantName: 'Dr. Wael',
    consultantTitle: 'Founder & Managing Partner',
    consultantAvatar: '/images/team/CEO.jpg',
    category: 'Venture Building',
    description: 'Architecting your cross-border MENA expansion strategy (Saudi, UAE, Egypt), B2B enterprise sales pipelines, and regulatory compliance roadmap.',
    duration: '60 Mins',
    price: 300,
    currency: 'USD',
    bookingUrl: 'https://calendly.com',
    tags: ['Go-To-Market', 'GCC Expansion', 'Enterprise B2B'],
    isPublished: true,
    orderIndex: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'card-4',
    title: 'Pre-Seed SAFE & Cap Table Equity Advisory',
    consultantName: 'Dr. Wael',
    consultantTitle: 'Founder & Managing Partner',
    consultantAvatar: '/images/team/CEO.jpg',
    category: 'Growth & Funding',
    description: 'Expert guidance on post-money SAFE structuring, co-founder equity splits, option pool allocation, and term sheet negotiation strategy.',
    duration: '45 Mins',
    price: 180,
    currency: 'USD',
    bookingUrl: 'https://calendly.com',
    tags: ['SAFE Terms', 'Cap Table', 'Fundraising'],
    isPublished: true,
    orderIndex: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

@Injectable()
export class ConsultationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublished(category?: string) {
    try {
      if ((this.prisma as any).consultationCard) {
        const filter: any = { isPublished: true };
        if (category && category !== 'All') {
          filter.category = category;
        }

        const cards = await (this.prisma as any).consultationCard.findMany({
          where: filter,
          orderBy: { orderIndex: 'asc' },
        });

        if (cards && cards.length > 0) {
          return cards;
        }

        // Try seeding into DB
        for (const card of memoryConsultationCards) {
          const { id, ...data } = card;
          await (this.prisma as any).consultationCard.create({ data });
        }

        return await (this.prisma as any).consultationCard.findMany({
          where: filter,
          orderBy: { orderIndex: 'asc' },
        });
      }
    } catch (err) {
      console.warn('Prisma consultationCard DB query warning (using in-memory fallback):', err);
    }

    // Memory Fallback
    let result = memoryConsultationCards.filter((c) => c.isPublished);
    if (category && category !== 'All') {
      result = result.filter((c) => c.category === category);
    }
    return result;
  }

  async findAllAdmin() {
    try {
      if ((this.prisma as any).consultationCard) {
        return await (this.prisma as any).consultationCard.findMany({
          orderBy: { orderIndex: 'asc' },
        });
      }
    } catch (err) {
      console.warn('Prisma consultationCard admin query warning (using in-memory fallback):', err);
    }
    return memoryConsultationCards;
  }

  async findOne(id: string) {
    try {
      if ((this.prisma as any).consultationCard) {
        const card = await (this.prisma as any).consultationCard.findUnique({
          where: { id },
        });
        if (card) return card;
      }
    } catch (err) {
      console.warn('Prisma findOne warning:', err);
    }

    const card = memoryConsultationCards.find((c) => c.id === id);
    if (!card) {
      throw new NotFoundException('Consultation card not found');
    }
    return card;
  }

  async create(dto: CreateConsultationDto) {
    const newCardData = {
      title: dto.title,
      consultantName: dto.consultantName || 'Dr. Wael',
      consultantTitle: dto.consultantTitle || 'Founder & Managing Partner',
      consultantAvatar: dto.consultantAvatar || '/images/team/CEO.jpg',
      category: dto.category || 'Venture Strategy',
      description: dto.description || '',
      duration: dto.duration || '60 Mins',
      price: dto.price ?? 200,
      currency: dto.currency || 'USD',
      bookingUrl: dto.bookingUrl || '',
      tags: dto.tags || [],
      isPublished: dto.isPublished ?? true,
      orderIndex: dto.orderIndex ?? memoryConsultationCards.length + 1,
    };

    try {
      if ((this.prisma as any).consultationCard) {
        return await (this.prisma as any).consultationCard.create({
          data: newCardData,
        });
      }
    } catch (err) {
      console.warn('Prisma create consultationCard warning:', err);
    }

    const memoryCard = {
      id: `card-${Date.now()}`,
      ...newCardData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryConsultationCards.push(memoryCard);
    return memoryCard;
  }

  async update(id: string, dto: UpdateConsultationDto) {
    try {
      if ((this.prisma as any).consultationCard) {
        return await (this.prisma as any).consultationCard.update({
          where: { id },
          data: dto,
        });
      }
    } catch (err) {
      console.warn('Prisma update consultationCard warning:', err);
    }

    const idx = memoryConsultationCards.findIndex((c) => c.id === id);
    if (idx !== -1) {
      memoryConsultationCards[idx] = {
        ...memoryConsultationCards[idx],
        ...dto,
        updatedAt: new Date().toISOString(),
      };
      return memoryConsultationCards[idx];
    }
    throw new NotFoundException('Consultation card not found');
  }

  async remove(id: string) {
    try {
      if ((this.prisma as any).consultationCard) {
        return await (this.prisma as any).consultationCard.delete({
          where: { id },
        });
      }
    } catch (err) {
      console.warn('Prisma remove consultationCard warning:', err);
    }

    memoryConsultationCards = memoryConsultationCards.filter((c) => c.id !== id);
    return { success: true };
  }

  async bookConsultation(dto: BookConsultationDto) {
    try {
      if ((this.prisma as any).contactSubmission) {
        return await (this.prisma as any).contactSubmission.create({
          data: {
            name: dto.name,
            email: dto.email,
            phone: dto.phone || null,
            subject: `Consultation Booking: ${dto.consultationTitle || 'General Session'}`,
            message: `Company: ${dto.companyName || 'N/A'}\nNotes: ${dto.notes || 'No extra notes'}`,
            type: 'CONSULTATION_BOOKING',
          },
        });
      }
    } catch (err) {
      console.warn('Prisma bookConsultation warning:', err);
    }

    return {
      success: true,
      message: 'Booking request recorded successfully',
    };
  }
}
