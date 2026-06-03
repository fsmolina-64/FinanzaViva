import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const mods = await prisma.module.findMany({
        where: { order: { in: [1, 2, 3] } },
        select: { id: true, order: true }
    });
    for (const m of mods) {
        const deleted = await prisma.lesson.deleteMany({ where: { moduleId: m.id } });
        console.log(`Modulo ${m.order}: ${deleted.count} lecciones borradas`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());