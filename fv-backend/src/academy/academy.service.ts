import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { XpSource } from '@prisma/client';

@Injectable()
export class AcademyService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}


  async getModules(userId: string) {
    const modules = await this.prisma.module.findMany({
      where: { isPublished: true },
      orderBy: { order: 'asc' },
      include: {
        lessons: { orderBy: { order: 'asc' } },
        moduleProgress: { where: { userId } },
      },
    });

    return modules.map((m) => ({
      ...m,
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

    return {
      ...module,
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
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

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

    await this.checkModuleCompletion(userId, lesson.moduleId);

    return { message: 'Lección completada', xpEarned: lesson.xpReward };
  }


  private async checkModuleCompletion(userId: string, moduleId: string) {
    const totalLessons = await this.prisma.lesson.count({
      where: { moduleId },
    });

    const completedLessons = await this.prisma.userLessonProgress.count({
      where: {
        userId,
        status: 'COMPLETED',
        lesson: { moduleId },
      },
    });

    if (totalLessons === completedLessons) {
      const module = await this.prisma.module.findUnique({
        where: { id: moduleId },
      });

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
    }
  }
}