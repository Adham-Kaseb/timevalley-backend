import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CertificatesService } from '../certificates/certificates.service';
import { CreateModuleDto, UpdateModuleDto } from './dto/admin-module.dto';
import { CreateLessonDto, UpdateLessonDto } from './dto/admin-lesson.dto';

export interface Lesson {
  id: string;
  lessonNumber: number;
  title: string;
  desc: string;
  duration: string;
  videoUrl: string;
  hasQuiz: boolean;
  hasMaterials: boolean;
  materials?: any[];
  statusTag?: string;
  statusType?: string;
}

export interface DiplomaModule {
  id: string;
  moduleNumber: string;
  title: string;
  badgeTitle: string;
  description: string;
  isLocked: boolean;
  lessons: Lesson[];
}

@Injectable()
export class CoursesService implements OnModuleInit {
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly certificatesService: CertificatesService,
  ) {}

  async onModuleInit() {
    try {
      this.logger.log('Initializing Courses Module Service & Seeding Default Modules...');
      const defaultModulesData = [
        { num: '00', title: 'INTRO: Foundation & Day-Zero Orientation', badge: 'INTRO', desc: 'Platform onboarding, Day-Zero founder mindset, venture building methodology, and community rules.' },
        { num: '01', title: 'MODULE#1 DISCOVERY: Thesis & ICP Validation', badge: 'MODULE#1 DISCOVERY', desc: 'Validate B2B/B2C SaaS theses, conduct ICP customer interviews, and compute TAM/SAM/SOM.' },
        { num: '02', title: 'MODULE#2 PRODUCT BUILDING: MVP Architecture', badge: 'MODULE#2 PRODUCT BUILDING', desc: 'Rapid prototyping, microservice architecture, Next.js + NestJS boilerplates, and DB modeling.' },
        { num: '03', title: 'MODULE#3 PMF: Product-Market Fit & Retention', badge: 'MODULE#3 PMF', desc: 'Achieving Product-Market Fit, metric tracking (NPS, retention curves), and feature prioritization.' },
        { num: '04', title: 'MODULE#4 GTM: Go-To-Market Execution', badge: 'MODULE#4 GTM', desc: 'Go-To-Market execution, inbound/outbound funnels, pricing strategy, and initial sales playbook.' },
        { num: '05', title: 'MODULE#5 GROWTH: Unit Economics & CAC', badge: 'MODULE#5 GROWTH', desc: 'Unit economics optimization, CAC payback, viral loops, performance marketing, and retention.' },
        { num: '06', title: 'MODULE#6 SCALING: Operations & Hiring', badge: 'MODULE#6 SCALING', desc: 'Scaling operations, hiring core engineering/sales leadership, and regional GCC/Global expansion.' },
        { num: '07', title: 'MODULE#7 FUNDRAISING: VC Pitch & Cap Tables', badge: 'MODULE#7 FUNDRAISING', desc: 'Mastering the VC pitch deck, SAFEs & Cap Tables, Term Sheets, and closing Pre-Seed/Seed rounds.' },
      ];

      for (const [idx, def] of defaultModulesData.entries()) {
        if ((this.prisma as any).diplomaModule) {
          const existing = await (this.prisma as any).diplomaModule.findFirst({
            where: {
              OR: [
                { moduleNumber: def.num },
                { moduleNumber: `m${idx}` },
              ],
            },
          }).catch(() => null);

          if (!existing) {
            await (this.prisma as any).diplomaModule.create({
              data: {
                moduleNumber: def.num,
                title: def.title,
                badgeTitle: def.badge,
                description: def.desc,
                orderIndex: idx,
                isPublished: true,
              },
            }).catch(() => {});
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`Course initialization notice: ${err?.message || err}`);
    }
  }

  async checkUserEnrollment(userId?: string): Promise<boolean> {
    if (!userId) return false;

    // Check user role: SUPER_ADMIN has full access to all course content
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === 'SUPER_ADMIN') {
      return true;
    }

    const enrollment = await (this.prisma as any).enrollment.findFirst({
      where: {
        userId,
        courseId: 'venture-architect-diploma',
        status: 'ACTIVE',
      },
    });

    return !!enrollment;
  }

  async getDiplomaCurriculum(userId?: string) {
    const hasPurchased = await this.checkUserEnrollment(userId);

    // Query explicit student module & lesson unlocks from DB if userId is present
    let unlockedModuleIds: string[] = [];
    let unlockedLessonIds: string[] = [];
    if (userId) {
      try {
        if ((this.prisma as any).studentModuleUnlock) {
          const userUnlocks = await (this.prisma as any).studentModuleUnlock.findMany({
            where: { userId },
            include: { module: true },
          });

          const unlockedDbIds = userUnlocks.map((u: any) => u.moduleId).filter(Boolean);

          // Query matching DB modules to resolve DB UUIDs to module numbers
          const dbMods = await (this.prisma as any).diplomaModule.findMany({
            where: {
              OR: [
                { id: { in: unlockedDbIds } },
                { moduleNumber: { in: unlockedDbIds } },
              ],
            },
          }).catch(() => []);

          const rawIds: string[] = [];
          userUnlocks.forEach((u: any) => {
            if (u.moduleId) rawIds.push(u.moduleId);
            if (u.notes) rawIds.push(u.notes);
            if (u.module?.id) rawIds.push(u.module.id);
            if (u.module?.moduleNumber) rawIds.push(u.module.moduleNumber);
          });

          dbMods.forEach((dm: any) => {
            if (dm.id) rawIds.push(dm.id);
            if (dm.moduleNumber) {
              rawIds.push(dm.moduleNumber);
              rawIds.push(`m${parseInt(dm.moduleNumber, 10)}`);
              rawIds.push(dm.moduleNumber.length === 1 ? `0${dm.moduleNumber}` : dm.moduleNumber);
            }
          });

          unlockedModuleIds = Array.from(new Set(rawIds.map((id) => String(id).toLowerCase().trim())));
        }
      } catch (e) {
        this.logger.warn(`Fetch student module unlocks notice: ${e}`);
      }

      try {
        if ((this.prisma as any).studentLessonUnlock) {
          const userLessonUnlocks = await (this.prisma as any).studentLessonUnlock.findMany({
            where: { userId },
          });
          unlockedLessonIds = userLessonUnlocks.map((u: any) => u.lessonId).filter(Boolean);
        }
      } catch (e) {
        this.logger.warn(`Fetch student lesson unlocks notice: ${e}`);
      }
    }

    // Standard 8 Diploma Modules Definition
    const defaultModulesData = [
      { id: 'intro', num: '00', title: 'INTRO: Foundation & Day-Zero Orientation', badge: 'INTRO', desc: 'Platform onboarding, Day-Zero founder mindset, venture building methodology, and community rules.' },
      { id: 'm1', num: '01', title: 'MODULE#1 DISCOVERY: Thesis & ICP Validation', badge: 'MODULE#1 DISCOVERY', desc: 'Validate B2B/B2C SaaS theses, conduct ICP customer interviews, and compute TAM/SAM/SOM.' },
      { id: 'm2', num: '02', title: 'MODULE#2 PRODUCT BUILDING: MVP Architecture', badge: 'MODULE#2 PRODUCT BUILDING', desc: 'Rapid prototyping, microservice architecture, Next.js + NestJS boilerplates, and DB modeling.' },
      { id: 'm3', num: '03', title: 'MODULE#3 PMF: Product-Market Fit & Retention', badge: 'MODULE#3 PMF', desc: 'Achieving Product-Market Fit, metric tracking (NPS, retention curves), and feature prioritization.' },
      { id: 'm4', num: '04', title: 'MODULE#4 GTM: Go-To-Market Execution', badge: 'MODULE#4 GTM', desc: 'Go-To-Market execution, inbound/outbound funnels, pricing strategy, and initial sales playbook.' },
      { id: 'm5', num: '05', title: 'MODULE#5 GROWTH: Unit Economics & CAC', badge: 'MODULE#5 GROWTH', desc: 'Unit economics optimization, CAC payback, viral loops, performance marketing, and retention.' },
      { id: 'm6', num: '06', title: 'MODULE#6 SCALING: Operations & Hiring', badge: 'MODULE#6 SCALING', desc: 'Scaling operations, hiring core engineering/sales leadership, and regional GCC/Global expansion.' },
      { id: 'm7', num: '07', title: 'MODULE#7 FUNDRAISING: VC Pitch & Cap Tables', badge: 'MODULE#7 FUNDRAISING', desc: 'Mastering the VC pitch deck, SAFEs & Cap Tables, Term Sheets, and closing Pre-Seed/Seed rounds.' },
    ];

    // Fetch dynamic modules from DB
    let dbModules: any[] = [];
    try {
      dbModules = await (this.prisma as any).diplomaModule.findMany({
        include: {
          lessons: {
            orderBy: { orderIndex: 'asc' },
          },
        },
        orderBy: { orderIndex: 'asc' },
      });
    } catch {
      // Fallback if table not ready
    }

    // Merge default modules with DB modules so full curriculum is ALWAYS complete
    const combinedModulesMap = new Map<string, any>();

    // 1. Insert default modules
    defaultModulesData.forEach((def, defIdx) => {
      const dbMatch = dbModules.find((d) =>
        d.id === def.id ||
        d.moduleNumber === def.num ||
        d.moduleNumber === `0${defIdx}` ||
        d.title.toLowerCase().includes(def.badge.toLowerCase())
      );

      const lessons = dbMatch?.lessons && dbMatch.lessons.length > 0
        ? dbMatch.lessons.map((l: any, lIdx: number) => ({
            id: l.id,
            lessonNumber: l.lessonNumber || defIdx * 5 + lIdx + 1,
            title: l.title,
            desc: l.desc,
            duration: l.duration || '25 Mins',
            videoUrl: l.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            hasQuiz: true,
            hasMaterials: Array.isArray(l.materials) && l.materials.length > 0,
            materials: Array.isArray(l.materials) ? l.materials : [],
          }))
        : Array.from({ length: 5 }).map((_, lIdx) => {
            const globalLessonNum = defIdx * 5 + lIdx + 1;
            return {
              id: `lesson-${def.id}-${lIdx + 1}`,
              lessonNumber: globalLessonNum,
              title: `Lesson ${globalLessonNum}: ${def.badge} - Core Step ${lIdx + 1}`,
              desc: `Applied breakdown of ${def.badge.toLowerCase()} step ${lIdx + 1}.`,
              duration: `${20 + lIdx * 5} Mins`,
              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
              hasQuiz: true,
              hasMaterials: true,
              materials: [
                { name: `${def.badge} Step ${lIdx + 1} Founder Guide (PDF)`, size: '1.2 MB', type: 'pdf' },
              ],
            };
          });

      combinedModulesMap.set(def.num, {
        id: dbMatch?.id || def.id,
        moduleNumber: def.num,
        title: dbMatch?.title || def.title,
        badgeTitle: dbMatch?.badgeTitle || def.badge,
        description: dbMatch?.description || def.desc,
        lessons,
      });
    });

    // 2. Add extra dynamic custom modules created in DB
    dbModules.forEach((dbMod) => {
      const numKey = dbMod.moduleNumber || dbMod.id;
      if (!combinedModulesMap.has(numKey)) {
        const lessons = (dbMod.lessons || []).map((l: any, lIdx: number) => ({
          id: l.id,
          lessonNumber: l.lessonNumber || lIdx + 1,
          title: l.title,
          desc: l.desc,
          duration: l.duration || '25 Mins',
          videoUrl: l.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          hasQuiz: true,
          hasMaterials: Array.isArray(l.materials) && l.materials.length > 0,
          materials: Array.isArray(l.materials) ? l.materials : [],
        }));

        combinedModulesMap.set(numKey, {
          id: dbMod.id,
          moduleNumber: dbMod.moduleNumber,
          title: dbMod.title,
          badgeTitle: dbMod.badgeTitle || dbMod.title,
          description: dbMod.description,
          lessons,
        });
      }
    });

    const combinedList = Array.from(combinedModulesMap.values());
    let totalLessonsCount = 0;

    const curriculum: DiplomaModule[] = combinedList.map((m, mIdx) => {
      const isIntro = mIdx === 0 || m.moduleNumber === '00' || m.id === 'intro';
      const isExplicitlyUnlocked = unlockedModuleIds.some((unlockedId) => {
        if (!unlockedId) return false;
        const uStr = String(unlockedId).toLowerCase().trim();
        const mIdStr = String(m.id).toLowerCase().trim();
        const mNumStr = String(m.moduleNumber || '').toLowerCase().trim();

        if (uStr === mIdStr || uStr === mNumStr) return true;

        const uClean = uStr.replace(/^m|^0+/, '');
        const mNumClean = mNumStr.replace(/^m|^0+/, '');
        const mIdClean = mIdStr.replace(/^m|^0+/, '');

        if (uClean.length > 0 && uClean.length <= 4) {
          if (uClean === mNumClean || uClean === mIdClean) return true;
        }

        return false;
      });

      const isLocked = isIntro ? false : (!hasPurchased && !isExplicitlyUnlocked);
      totalLessonsCount += m.lessons?.length || 0;

      const lessonsWithStatus = (m.lessons || []).map((l: any, lIdx: number) => {
        const isLessonUnlocked = !isLocked || unlockedLessonIds.includes(l.id) || unlockedLessonIds.includes(`lesson-${m.id}-${lIdx + 1}`);
        return {
          ...l,
          isLocked: !isLessonUnlocked,
          statusTag: !isLessonUnlocked ? 'Locked' : lIdx === 0 ? 'Available' : 'Active',
          statusType: !isLessonUnlocked ? 'locked' : 'active',
        };
      });

      return {
        id: m.id,
        moduleNumber: m.moduleNumber || `0${mIdx}`,
        title: m.title,
        badgeTitle: m.badgeTitle || m.title,
        description: m.description,
        isLocked,
        lessons: lessonsWithStatus,
      };
    });

    return {
      diplomaTitle: 'Venture Architect & Founder Diploma',
      price: 5000,
      currency: 'LE',
      hasPurchased,
      unlockedModuleIds,
      unlockedLessonIds,
      totalModules: curriculum.length,
      totalLessons: totalLessonsCount,
      modules: curriculum,
    };
  }

  // --- ADMIN DIPLOMA BUILDER CRUD METHODS ---

  async createModule(dto: CreateModuleDto) {
    const count = await (this.prisma as any).diplomaModule.count().catch(() => 0);
    const moduleNumber = dto.moduleNumber || (count < 10 ? `0${count}` : `${count}`);

    return (this.prisma as any).diplomaModule.create({
      data: {
        moduleNumber,
        title: dto.title,
        badgeTitle: dto.badgeTitle || dto.title,
        description: dto.description,
        durationHours: dto.durationHours || 15,
        orderIndex: dto.orderIndex || count,
        isPublished: true,
      },
    });
  }

  async updateModule(id: string, dto: UpdateModuleDto) {
    return (this.prisma as any).diplomaModule.update({
      where: { id },
      data: {
        moduleNumber: dto.moduleNumber,
        title: dto.title,
        badgeTitle: dto.badgeTitle,
        description: dto.description,
        durationHours: dto.durationHours,
        orderIndex: dto.orderIndex,
        isPublished: dto.isPublished,
      },
    });
  }

  async deleteModule(id: string) {
    return (this.prisma as any).diplomaModule.delete({
      where: { id },
    });
  }

  async createLesson(dto: CreateLessonDto) {
    const count = await (this.prisma as any).diplomaLesson.count({
      where: { moduleId: dto.moduleId },
    }).catch(() => 0);

    return (this.prisma as any).diplomaLesson.create({
      data: {
        moduleId: dto.moduleId,
        lessonNumber: dto.lessonNumber || count + 1,
        title: dto.title,
        desc: dto.desc,
        duration: dto.duration || '25 Mins',
        videoUrl: dto.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        orderIndex: dto.orderIndex || count,
        materials: dto.materials || [],
      },
    });
  }

  async updateLesson(id: string, dto: UpdateLessonDto) {
    return (this.prisma as any).diplomaLesson.update({
      where: { id },
      data: {
        lessonNumber: dto.lessonNumber,
        title: dto.title,
        desc: dto.desc,
        duration: dto.duration,
        videoUrl: dto.videoUrl,
        orderIndex: dto.orderIndex,
        materials: dto.materials,
      },
    });
  }

  async deleteLesson(id: string) {
    return (this.prisma as any).diplomaLesson.delete({
      where: { id },
    });
  }

  // --- MODULE RESOURCES ENDPOINTS ---

  async createResource(dto: { moduleId: string; title: string; fileUrl: string; fileType?: string; fileSize?: string; description?: string }) {
    return (this.prisma as any).moduleResource.create({
      data: {
        moduleId: dto.moduleId,
        title: dto.title,
        fileUrl: dto.fileUrl,
        fileType: dto.fileType || 'pdf',
        fileSize: dto.fileSize || '1.5 MB',
        description: dto.description || '',
      },
    });
  }

  async getResourcesByModule(moduleId: string) {
    return (this.prisma as any).moduleResource.findMany({
      where: { moduleId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteResource(id: string) {
    return (this.prisma as any).moduleResource.delete({
      where: { id },
    });
  }

  // --- MODULE QUIZZES ENDPOINTS ---

  async createQuiz(dto: { moduleId: string; title: string; passingScore?: number; questions: any[] }) {
    return (this.prisma as any).moduleQuiz.create({
      data: {
        moduleId: dto.moduleId,
        title: dto.title,
        passingScore: dto.passingScore || 70,
        questions: dto.questions || [],
      },
    });
  }

  async getQuizzesByModule(moduleId: string) {
    return (this.prisma as any).moduleQuiz.findMany({
      where: { moduleId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteQuiz(id: string) {
    return (this.prisma as any).moduleQuiz.delete({
      where: { id },
    });
  }

  // --- STUDENT LESSON PROGRESS ENDPOINTS ---

  async markLessonProgress(userId: string, lessonId: string, isCompleted: boolean, watchDurationSec: number) {
    const existing = await (this.prisma as any).studentLessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    }).catch(() => null);

    let progressResult;
    if (existing) {
      progressResult = await (this.prisma as any).studentLessonProgress.update({
        where: { id: existing.id },
        data: {
          isCompleted,
          watchDurationSec: Math.max(existing.watchDurationSec, watchDurationSec),
          completedAt: isCompleted ? new Date() : existing.completedAt,
        },
      });
    } else {
      progressResult = await (this.prisma as any).studentLessonProgress.create({
        data: {
          userId,
          lessonId,
          isCompleted,
          watchDurationSec,
          completedAt: isCompleted ? new Date() : null,
        },
      });
    }

    if (isCompleted) {
      this.certificatesService.checkAndIssueIfCompleted(userId).catch((err) => {
        this.logger.warn(`Auto cert check error: ${err?.message || err}`);
      });
    }

    return progressResult;
  }

  async getStudentProgress(userId: string) {
    return (this.prisma as any).studentLessonProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
