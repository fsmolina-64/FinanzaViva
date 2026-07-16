import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserActionEvent } from '../common/events/user-action.event';
import { XpSource } from '@prisma/client';

@Injectable()
export class AcademyService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
    private eventEmitter: EventEmitter2,
  ) { }

  async getModules(userId: string) {
    const modules = await this.prisma.module.findMany({
      where: { isPublished: true },
      orderBy: { order: 'asc' },
      include: {
        lessons: { orderBy: { order: 'asc' } },
        moduleProgress: { where: { userId } },
      },
    });

    const moduleIds = modules.map(m => m.id);
    const completed = await this.prisma.userLessonProgress.findMany({
      where: { userId, status: 'COMPLETED', lesson: { moduleId: { in: moduleIds } } },
      select: { lesson: { select: { moduleId: true } } },
    });
    const completedCountByModule = new Map<string, number>();
    for (const c of completed) {
      const mid = c.lesson.moduleId;
      completedCountByModule.set(mid, (completedCountByModule.get(mid) ?? 0) + 1);
    }

    return modules.map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      icon: m.icon,
      order: m.order,
      xpReward: m.xpReward,
      totalLessons: m.lessons.length,
      completedLessons: completedCountByModule.get(m.id) ?? 0,
      progress: m.moduleProgress[0] ?? null,
    }));
  }

  async getModule(userId: string, moduleId: string) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        lessons: { orderBy: { order: 'asc' } },
        moduleProgress: { where: { userId } },
      },
    });
    if (!module) throw new NotFoundException('Módulo no encontrado');

    const lessonIds = module.lessons.map(l => l.id);
    const completedProgress = await this.prisma.userLessonProgress.findMany({
      where: { userId, lessonId: { in: lessonIds }, status: 'COMPLETED' },
    });
    const completedSet = new Set(completedProgress.map(p => p.lessonId));
    const completedLessons = completedSet.size;

    const lessons = module.lessons.map((l, i) => {
      const isCompleted = completedSet.has(l.id);
      const prevCompleted = i === 0 || completedSet.has(module.lessons[i - 1].id);
      const status = isCompleted ? 'COMPLETED' : prevCompleted ? 'AVAILABLE' : 'LOCKED';
      return { ...l, status };
    });

    return {
      id: module.id,
      title: module.title,
      description: module.description,
      icon: module.icon,
      order: module.order,
      xpReward: module.xpReward,
      totalLessons: module.lessons.length,
      completedLessons,
      lessons,
      progress: module.moduleProgress[0] ?? null,
    };
  }

  async getLesson(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        lessonProgress: { where: { userId } },
        module: { include: { lessons: { orderBy: { order: 'asc' } } } },
      },
    });

    if (!lesson) throw new NotFoundException('Lección no encontrada');

    const progress = lesson.lessonProgress[0] ?? null;

    let status: 'COMPLETED' | 'AVAILABLE' | 'LOCKED';

    if (progress?.status === 'COMPLETED') {
      status = 'COMPLETED';
    } else {
      const idx = lesson.module.lessons.findIndex(l => l.id === lessonId);
      if (idx === 0) {
        status = 'AVAILABLE';
      } else {
        const prevLesson = lesson.module.lessons[idx - 1];
        const prevProgress = await this.prisma.userLessonProgress.findUnique({
          where: { userId_lessonId: { userId, lessonId: prevLesson.id } },
        });
        status = prevProgress?.status === 'COMPLETED' ? 'AVAILABLE' : 'LOCKED';
      }
    }

    return {
      id: lesson.id,
      moduleId: lesson.moduleId,
      title: lesson.title,
      content: lesson.content,
      duration: lesson.duration,
      xpReward: lesson.xpReward,
      order: lesson.order,
      type: lesson.type,
      status,
    };
  }

  async completeLesson(userId: string, lessonId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.findUnique({
        where: { id: lessonId },
        include: {
          module: { include: { lessons: { orderBy: { order: 'asc' } } } },
        },
      });
      if (!lesson) throw new NotFoundException('Lección no encontrada');

      const module = lesson.module;
      const wasEverCompleted = await tx.xpTransaction.findFirst({
        where: { userId, source: XpSource.LESSON_COMPLETED, referenceId: lessonId },
      });
      if (!wasEverCompleted) {
        const idx = module.lessons.findIndex(l => l.id === lessonId);
        if (idx > 0) {
          const prevLesson = module.lessons[idx - 1];
          const prevProgress = await tx.userLessonProgress.findUnique({
            where: { userId_lessonId: { userId, lessonId: prevLesson.id } },
          });
          if (prevProgress?.status !== 'COMPLETED') {
            throw new BadRequestException('Completa la lección anterior primero');
          }
        }
      }

      const existingProgress = await tx.userLessonProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId } },
      });
      const wasAlreadyCompleted = existingProgress?.status === 'COMPLETED';

      await tx.userLessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        update: { status: 'COMPLETED', completedAt: new Date() },
        create: { userId, lessonId, status: 'COMPLETED', completedAt: new Date() },
      });

      if (!wasAlreadyCompleted) {
        await tx.userStatistics.update({
          where: { userId },
          data: { lessonsCompleted: { increment: 1 } },
        });
      }

      let lessonXpEarned = 0;
      let moduleXpEarned = 0;
      let leveledUp = false;

      if (!wasAlreadyCompleted) {
        try {
          await tx.xpTransaction.create({
            data: {
              userId,
              amount: lesson.xpReward,
              source: XpSource.LESSON_COMPLETED,
              referenceId: lessonId,
              description: `Lección completada: ${lesson.title}`,
            },
          });
          await tx.userGameStats.update({
            where: { userId },
            data: { xp: { increment: lesson.xpReward } },
          });
          await tx.userStatistics.update({
            where: { userId },
            data: { totalXpEarned: { increment: lesson.xpReward } },
          });
          lessonXpEarned = lesson.xpReward;
        } catch (err: any) {
          if (err?.code === 'P2002') {
            lessonXpEarned = 0;
          } else {
            throw err;
          }
        }
      }

      const completedCount = await tx.userLessonProgress.count({
        where: { userId, status: 'COMPLETED', lesson: { moduleId: module.id } },
      });
      const totalLessons = module.lessons.length;
      const readingProgress = totalLessons > 0
        ? Math.round((completedCount / totalLessons) * 100)
        : 0;
      const moduleCompleted = completedCount === totalLessons && totalLessons > 0;

      await tx.userModuleProgress.upsert({
        where: { userId_moduleId: { userId, moduleId: module.id } },
        update: { readingProgress },
        create: { userId, moduleId: module.id, readingProgress },
      });

      if (moduleCompleted) {
        await tx.userModuleProgress.upsert({
          where: { userId_moduleId: { userId, moduleId: module.id } },
          update: { status: 'COMPLETED', completedAt: new Date() },
          create: { userId, moduleId: module.id, status: 'COMPLETED', completedAt: new Date() },
        });

        const moduleXpRecord = await tx.xpTransaction.findFirst({
          where: { userId, source: XpSource.MODULE_COMPLETED, referenceId: module.id },
        });

        if (!moduleXpRecord) {
          await tx.xpTransaction.create({
            data: {
              userId,
              amount: module.xpReward,
              source: XpSource.MODULE_COMPLETED,
              referenceId: module.id,
              description: `Módulo completado: ${module.title}`,
            },
          });
          await tx.userGameStats.update({
            where: { userId },
            data: { xp: { increment: module.xpReward } },
          });
          await tx.userStatistics.update({
            where: { userId },
            data: {
              totalXpEarned: { increment: module.xpReward },
              modulesCompleted: { increment: 1 },
            },
          });
          moduleXpEarned = module.xpReward;
        }
      }

      if (lessonXpEarned > 0 || moduleXpEarned > 0) {
        const stats = await tx.userGameStats.findUnique({ where: { userId } });
        if (stats) {
          const nextLevel = await tx.level.findFirst({
            where: { xpRequired: { lte: stats.xp } },
            orderBy: { number: 'desc' },
          });
          if (nextLevel && stats.level < nextLevel.number) {
            await tx.userGameStats.update({
              where: { userId },
              data: { level: nextLevel.number, rank: nextLevel.rank },
            });
            leveledUp = true;
          }
        }
      }

      const nextLesson = !moduleCompleted
        ? await tx.lesson.findFirst({
            where: { moduleId: module.id, order: { gt: lesson.order } },
            orderBy: { order: 'asc' },
          })
        : null;

      return {
        lessonXpEarned,
        moduleXpEarned,
        totalXpEarned: lessonXpEarned + moduleXpEarned,
        moduleCompleted,
        leveledUp,
        nextLesson: nextLesson ? { ...nextLesson, status: 'AVAILABLE' as const } : null,
      };
    });

    if (result.lessonXpEarned > 0 || result.moduleXpEarned > 0) {
      this.eventEmitter.emit('user.action', new UserActionEvent(userId));
    }

    return result;
  }

  async getReadingProgress(userId: string, moduleId: string) {
    const progress = await this.prisma.userModuleProgress.findUnique({
      where: { userId_moduleId: { userId, moduleId } },
    });
    return { readingProgress: progress?.readingProgress ?? 0 };
  }

  async resetLesson(userId: string, lessonId: string) {
    throw new BadRequestException('Las lecciones completadas no se pueden reiniciar');
  }
}