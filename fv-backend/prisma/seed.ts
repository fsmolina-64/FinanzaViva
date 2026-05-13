import 'dotenv/config';
import { PrismaClient, UserRank } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {

  // ── NIVELES ───────────────────────────────────────
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

  for (const level of levels) {
    await prisma.level.upsert({
      where: { number: level.number },
      update: {},
      create: level,
    });
  }
  console.log('✅ Niveles creados');

  // ── CATEGORÍAS ────────────────────────────────────
  const categories = [
    { name: 'Salario',         icon: '💼', color: '#10B981', type: 'INCOME',  isGlobal: true },
    { name: 'Freelance',       icon: '💻', color: '#10B981', type: 'INCOME',  isGlobal: true },
    { name: 'Inversiones',     icon: '📈', color: '#10B981', type: 'INCOME',  isGlobal: true },
    { name: 'Alimentación',    icon: '🍔', color: '#EF4444', type: 'EXPENSE', isGlobal: true },
    { name: 'Transporte',      icon: '🚌', color: '#EF4444', type: 'EXPENSE', isGlobal: true },
    { name: 'Entretenimiento', icon: '🎮', color: '#EF4444', type: 'EXPENSE', isGlobal: true },
    { name: 'Salud',           icon: '🏥', color: '#EF4444', type: 'EXPENSE', isGlobal: true },
    { name: 'Educación',       icon: '📚', color: '#EF4444', type: 'EXPENSE', isGlobal: true },
    { name: 'Servicios',       icon: '💡', color: '#EF4444', type: 'EXPENSE', isGlobal: true },
    { name: 'Ropa',            icon: '👕', color: '#EF4444', type: 'EXPENSE', isGlobal: true },
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

  // ── MÓDULOS ACADEMIA ──────────────────────────────
  const academyModules = [
    {
      title: 'Presupuesto Personal',
      description: 'Aprende a controlar tus gastos e ingresos.',
      icon: '📊',
      order: 1,
      xpReward: 100,
      isPublished: true,
      lessons: [
        {
          title: '¿Qué es un presupuesto?',
          type: 'READING',
          order: 1,
          xpReward: 20,
          duration: 5,
          content: { blocks: [{ type: 'text', data: 'Un presupuesto es un plan financiero que te permite controlar tus ingresos y gastos.' }] },
        },
        {
          title: 'Cómo crear tu presupuesto',
          type: 'READING',
          order: 2,
          xpReward: 30,
          duration: 8,
          content: { blocks: [{ type: 'text', data: 'Registra todos tus ingresos y clasifica tus gastos por categorías.' }] },
        },
      ],
    },
    {
      title: 'Ahorro Inteligente',
      description: 'Estrategias prácticas para ahorrar dinero.',
      icon: '💰',
      order: 2,
      xpReward: 150,
      isPublished: true,
      lessons: [
        {
          title: '¿Por qué ahorrar?',
          type: 'READING',
          order: 1,
          xpReward: 25,
          duration: 5,
          content: { blocks: [{ type: 'text', data: 'El ahorro te da seguridad financiera ante imprevistos y te permite alcanzar metas.' }] },
        },
        {
          title: 'Regla del 50/30/20',
          type: 'READING',
          order: 2,
          xpReward: 35,
          duration: 10,
          content: { blocks: [{ type: 'text', data: '50% necesidades, 30% deseos, 20% ahorro. Una regla simple para organizar tu dinero.' }] },
        },
      ],
    },
    {
      title: 'Interés Compuesto',
      description: 'Entiende cómo crece tu dinero con el tiempo.',
      icon: '📈',
      order: 3,
      xpReward: 200,
      isPublished: true,
      lessons: [
        {
          title: '¿Qué es el interés compuesto?',
          type: 'READING',
          order: 1,
          xpReward: 30,
          duration: 7,
          content: { blocks: [{ type: 'text', data: 'El interés compuesto es ganar intereses sobre tus intereses. Es la base del crecimiento financiero.' }] },
        },
        {
          title: 'Ejemplos prácticos',
          type: 'READING',
          order: 2,
          xpReward: 40,
          duration: 10,
          content: { blocks: [{ type: 'text', data: '$100 al 10% anual: año 1 = $110, año 2 = $121, año 3 = $133. El dinero crece exponencialmente.' }] },
        },
      ],
    },
  ];

  for (const mod of academyModules) {
    const exists = await prisma.module.findFirst({ where: { title: mod.title } });
    if (!exists) {
      await prisma.module.create({
        data: {
          title: mod.title,
          description: mod.description,
          icon: mod.icon,
          order: mod.order,
          xpReward: mod.xpReward,
          isPublished: mod.isPublished,
          lessons: { create: mod.lessons as any },
        },
      });
    }
  }
  console.log('✅ Módulos de academia creados');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());