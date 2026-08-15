import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventDto, RsvpEventDto } from './dto/events.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(type?: string) {
    const filter = type && type !== 'All Events' ? { type } : {};
    let events = await (this.prisma as any).event.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
    });

    if (events.length === 0 && (!type || type === 'All Events')) {
      const initialEvents = [
        {
          title: 'Global Demo Day Q3 2026',
          date: 'AUG 28',
          time: '16:00 UTC',
          location: 'Virtual + Dubai Studio',
          type: 'Pitch Event',
          speakers: '12 Portfolio Startups & 200+ VCs',
          desc: 'Watch 12 high-growth startups pitch live to tier-1 venture capital partners and angel syndicates.',
          status: 'RSVP Open',
        },
        {
          title: 'DeepTech Founder Office Hours with TimeValley Partners',
          date: 'SEP 04',
          time: '14:00 UTC',
          location: 'Riyadh Tech Hub',
          type: 'Workshop',
          speakers: 'Dr. Wael & Aisha Al-Mansoor',
          desc: '1-on-1 pitch teardowns, term sheet reviews, and technical architecture feedback for early-stage teams.',
          status: 'Limited Seats',
        },
        {
          title: 'AI & Autonomous Agents Engineering Masterclass',
          date: 'SEP 12',
          time: '18:00 UTC',
          location: 'Cairo AI Studio',
          type: 'Masterclass',
          speakers: 'Fatima Al-Hassan & Omar Al-Farsi',
          desc: 'Deep-dive into multi-agent LLM orchestration, vector databases, and production RAG pipeline architecture.',
          status: 'RSVP Open',
        },
        {
          title: 'Pre-Seed SAFE & Cap Table Structuring Roundtable',
          date: 'SEP 19',
          time: '15:00 UTC',
          location: 'London Hub + Zoom',
          type: 'Legal Clinic',
          speakers: 'Layla Al-Kaabi & Legal Counsel',
          desc: 'Master post-money SAFE math, option pool sizing, and founder vesting schedules to avoid cap table debt.',
          status: 'Registration Open',
        },
        {
          title: 'MENA Enterprise SaaS Go-To-Market Summit',
          date: 'OCT 02',
          time: '11:00 UTC',
          location: 'Abu Dhabi Hub',
          type: 'Summit',
          speakers: 'Venture Partners & SaaS Founders',
          desc: 'Strategies for closing enterprise B2B pilots across Gulf corporations and government innovation labs.',
          status: 'Upcoming',
        },
        {
          title: 'TimeValley Alumni Founder Dinner & Deal Night',
          date: 'OCT 15',
          time: '19:00 UTC',
          location: 'DIFC Dubai',
          type: 'Networking',
          speakers: 'TimeValley Cohort Alumni',
          desc: 'Exclusive gathering for cohort graduates, angel syndicates, and corporate venture partners.',
          status: 'Invite Only',
        },
      ];

      for (const e of initialEvents) {
        await (this.prisma as any).event.create({ data: e });
      }

      events = await (this.prisma as any).event.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }

    return events;
  }

  async create(dto: CreateEventDto) {
    return (this.prisma as any).event.create({ data: dto });
  }

  async rsvp(eventId: string, userId: string, dto: RsvpEventDto) {
    const event = await (this.prisma as any).event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const ticketCode = `TV-PASS-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      return await (this.prisma as any).eventRSVP.create({
        data: {
          eventId,
          userId,
          userEmail: dto.userEmail,
          ticketCode,
        },
      });
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new ConflictException('You have already RSVPed for this event');
      }
      throw err;
    }
  }

  async getUserRsvps(userId: string) {
    return (this.prisma as any).eventRSVP.findMany({
      where: { userId },
      include: { event: true },
    });
  }
}
