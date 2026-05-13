import 'dotenv/config';
import { PrismaClient, UserRank } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const levels = [
    { number: 1,  name: 'Novato',       xpRequired: 0,    rank: UserRank.ROOKIE,       badge: '🌱' },
    { number: 2,  name: 'Aprendiz',     xpRequired: 100,  rank: UserRank.ROOKIE,       badge: '📘' },
    { number: 3,  name: 'Estudiante',   xpRequired: 250,  rank: UserRank.APPRENTICE,   badge: '📗' },
    { number: 4,  name: 'Ahorrador',    xpRequired: 500,  rank: UserRank.APPRENTICE,   badge: '💰' },
    { number: 5,  name: 'Planificador', xpRequired: 900,  rank: UserRank.INTERMEDIATE, badge: '📊' },
    { number: 6,  name: 'Inversor',     xpRequired: 1400, rank: UserRank.INTERMEDIATE, badge: '📈' },
    { number: 7,  name: 'Estratega',    xpRequired: 2000, rank: UserRank.ADVANCED,     badge: '🧠' },
    { number: 8,  name: 'Experto',      xpRequired: 2800, rank: UserRank.ADVANCED,     badge: '⚡' },
    { number: 9,  name: 'Maestro',      xpRequired: 4000, rank: UserRank.EXPERT,       badge: '🏆' },
    { number: 10, name: 'Leyenda',      xpRequired: 6000, rank: UserRank.MASTER,       badge: '👑' },
  ];

  const categories = [
    { name: 'Salario',        icon: '💼', color: '#10B981', type: 'INCOME',  isGlobal: true },
    { name: 'Freelance',      icon: '💻', color: '#10B981', type: 'INCOME',  isGlobal: true },
    { name: 'Inversiones',    icon: '📈', color: '#10B981', type: 'INCOME',  isGlobal: true },
    { name: 'Alimentación',   icon: '🍔', color: '#EF4444', type: 'EXPENSE', isGlobal: true },
    { name: 'Transporte',     icon: '🚌', color: '#EF4444', type: 'EXPENSE', isGlobal: true },
    { name: 'Entretenimiento',icon: '🎮', color: '#EF4444', type: 'EXPENSE', isGlobal: true },
    { name: 'Salud',          icon: '🏥', color: '#EF4444', type: 'EXPENSE', isGlobal: true },
    { name: 'Educación',      icon: '📚', color: '#EF4444', type: 'EXPENSE', isGlobal: true },
    { name: 'Servicios',      icon: '💡', color: '#EF4444', type: 'EXPENSE', isGlobal: true },
    { name: 'Ropa',           icon: '👕', color: '#EF4444', type: 'EXPENSE', isGlobal: true },
  ];

for (const category of categories) {
    const exists = await prisma.category.findFirst({
      where: { name: category.name, isGlobal: true },
    });
    if (!exists) {
      await prisma.category.create({
        data: { ...category, type: category.type as any },
      });
    }
  }

  console.log('✅ Categorías creadas');

  for (const level of levels) {
    await prisma.level.upsert({
      where: { number: level.number },
      update: {},
      create: level,
    });
  }

  console.log('✅ Niveles creados');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());