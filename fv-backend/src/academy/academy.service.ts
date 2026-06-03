import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { XpSource } from '@prisma/client';

@Injectable()
export class AcademyService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
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

    return Promise.all(modules.map(async (m) => {
      const completedLessons = await this.prisma.userLessonProgress.count({
        where: { userId, status: 'COMPLETED', lesson: { moduleId: m.id } },
      });
      return {
        id: m.id,
        title: m.title,
        description: m.description,
        icon: m.icon,
        order: m.order,
        xpReward: m.xpReward,
        totalLessons: m.lessons.length,
        completedLessons,
        progress: m.moduleProgress[0] ?? null,
      };
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
      },
    });

    if (!lesson) throw new NotFoundException('Lección no encontrada');

    return {
      ...lesson,
      progress: lesson.lessonProgress[0] ?? null,
    };
  }

  async completeLesson(userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lección no encontrada');

    await this.prisma.userLessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { status: 'COMPLETED', completedAt: new Date() },
      create: { userId, lessonId, status: 'COMPLETED', completedAt: new Date() },
    });

    await this.prisma.userStatistics.update({
      where: { userId },
      data: { lessonsCompleted: { increment: 1 } },
    });

    await this.gamification.addXp(userId, {
      amount: lesson.xpReward,
      source: XpSource.LESSON_COMPLETED,
      referenceId: lessonId,
      description: `Lección completada: ${lesson.title}`,
    });

    const moduleCompleted = await this.checkModuleCompletion(userId, lesson.moduleId);

    const nextLesson = await this.prisma.lesson.findFirst({
      where: { moduleId: lesson.moduleId, order: { gt: lesson.order } },
      orderBy: { order: 'asc' },
    });

    return {
      xpEarned: lesson.xpReward,
      moduleCompleted,
      nextLesson: nextLesson ? { ...nextLesson, status: 'AVAILABLE' as const } : null,
    };
  }


  private async checkModuleCompletion(userId: string, moduleId: string): Promise<boolean> {
    const totalLessons = await this.prisma.lesson.count({ where: { moduleId } });
    const completedLessons = await this.prisma.userLessonProgress.count({
      where: { userId, status: 'COMPLETED', lesson: { moduleId } },
    });

    if (totalLessons > 0 && totalLessons === completedLessons) {
      const module = await this.prisma.module.findUnique({ where: { id: moduleId } });
      await this.prisma.userModuleProgress.upsert({
        where: { userId_moduleId: { userId, moduleId } },
        update: { status: 'COMPLETED', completedAt: new Date() },
        create: { userId, moduleId, status: 'COMPLETED', completedAt: new Date() },
      });
      await this.prisma.userStatistics.update({
        where: { userId },
        data: { modulesCompleted: { increment: 1 } },
      });
      if (module) {
        await this.gamification.addXp(userId, {
          amount: module.xpReward,
          source: XpSource.LESSON_COMPLETED,
          referenceId: moduleId,
          description: `Módulo completado: ${module.title}`,
        });
      }
      return true;
    }
    return false;
  }
}