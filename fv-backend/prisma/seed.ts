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
  // ── QUIZZES ───────────────────────────────────────
  const firstModule = await prisma.module.findFirst({ where: { order: 1 } });

  if (firstModule) {
    const existingQuiz = await prisma.quiz.findFirst({ where: { moduleId: firstModule.id } });

    if (!existingQuiz) {
      await prisma.quiz.create({
        data: {
          moduleId: firstModule.id,
          title: 'Quiz: Presupuesto Personal',
          difficulty: 'EASY',
          xpReward: 50,
          passingScore: 70,
          timeLimit: 120,
          questions: {
            create: [
              {
                text: '¿Qué es un presupuesto personal?',
                type: 'MULTIPLE_CHOICE',
                order: 1,
                answers: {
                  create: [
                    { text: 'Un plan para controlar ingresos y gastos', isCorrect: true,  explanation: 'Correcto. El presupuesto organiza tu dinero.' },
                    { text: 'Un préstamo bancario',                     isCorrect: false, explanation: 'No. Un préstamo es deuda, no un plan.' },
                    { text: 'Una cuenta de ahorros',                    isCorrect: false, explanation: 'No. Una cuenta es un producto bancario.' },
                    { text: 'Un estado de cuenta',                      isCorrect: false, explanation: 'No. El estado de cuenta muestra movimientos pasados.' },
                  ],
                },
              },
              {
                text: 'La regla 50/30/20 asigna el 20% al ahorro.',
                type: 'TRUE_FALSE',
                order: 2,
                answers: {
                  create: [
                    { text: 'Verdadero', isCorrect: true,  explanation: 'Correcto. 20% va destinado al ahorro.' },
                    { text: 'Falso',     isCorrect: false, explanation: 'Incorrecto. Sí es el 20% para ahorro.' },
                  ],
                },
              },
              {
                text: 'Tienes $1000 de ingreso. ¿Cuánto deberías ahorrar según la regla 50/30/20?',
                type: 'SCENARIO',
                order: 3,
                answers: {
                  create: [
                    { text: '$200', isCorrect: true,  explanation: 'Correcto. 20% de $1000 = $200.' },
                    { text: '$500', isCorrect: false, explanation: 'Ese sería el 50% para necesidades.' },
                    { text: '$300', isCorrect: false, explanation: 'Ese sería el 30% para deseos.' },
                    { text: '$100', isCorrect: false, explanation: 'Eso sería solo el 10%.' },
                  ],
                },
              },
            ],
          },
        },
      });
    }
  }
  console.log('✅ Quizzes creados');

    const events = [
    {
      name: 'Daño del celular',
      description: 'Tu celular se dañó y necesitas repararlo o reemplazarlo.',
      category: 'RISK',
      probability: 0.30,
      isGlobal: false,
      options: [
        { text: 'Reparar el celular ($150)',        effectMoney: -150, effectIncome: 0,  effectDebt: 0,   effectScore: 5,   explanation: 'Buena decisión. Reparar es más barato que comprar nuevo.' },
        { text: 'Comprar celular nuevo a crédito',  effectMoney: 0,    effectIncome: 0,  effectDebt: 400, effectScore: -20, explanation: 'Cuidado. Endeudarte por un celular afecta tu salud financiera.' },
        { text: 'Usar celular viejo por ahora',     effectMoney: 0,    effectIncome: 0,  effectDebt: 0,   effectScore: 15,  explanation: 'Excelente. Evitar gastos innecesarios es una decisión inteligente.' },
      ],
    },
    {
      name: 'Oportunidad de negocio',
      description: 'Un amigo te invita a invertir en un pequeño negocio.',
      category: 'OPPORTUNITY',
      probability: 0.20,
      isGlobal: false,
      options: [
        { text: 'Invertir $300 de tus ahorros',     effectMoney: -300, effectIncome: 100, effectDebt: 0,   effectScore: 20,  explanation: 'Invertir con dinero propio es lo más seguro.' },
        { text: 'Pedir préstamo para invertir',     effectMoney: 200,  effectIncome: 100, effectDebt: 500, effectScore: -10, explanation: 'Invertir con deuda es riesgoso. El negocio puede fallar.' },
        { text: 'Rechazar la oferta',               effectMoney: 0,    effectIncome: 0,   effectDebt: 0,   effectScore: 0,   explanation: 'Válido. No toda inversión es buena si no tienes capital.' },
      ],
    },
    {
      name: 'Aumento de salario',
      description: 'Tu empleador te ofrece un aumento del 20%.',
      category: 'OPPORTUNITY',
      probability: 0.15,
      isGlobal: false,
      options: [
        { text: 'Aceptar y ahorrar el extra',       effectMoney: 0,    effectIncome: 100, effectDebt: 0,   effectScore: 30,  explanation: 'Perfecto. Ahorrar el aumento acelera tu libertad financiera.' },
        { text: 'Aceptar y gastar el extra',        effectMoney: 0,    effectIncome: 100, effectDebt: 0,   effectScore: 5,   explanation: 'Aceptaste pero no aprovechaste para mejorar tu situación.' },
        { text: 'Negociar un aumento mayor',        effectMoney: 0,    effectIncome: 150, effectDebt: 0,   effectScore: 25,  explanation: 'Negociar tu salario es una habilidad financiera valiosa.' },
      ],
    },
    {
      name: 'Inflación',
      description: 'Los precios subieron un 10% este mes.',
      category: 'CRISIS',
      probability: 0.25,
      isGlobal: true,
      options: [
        { text: 'Ajustar tu presupuesto',           effectMoney: -50,  effectIncome: 0,   effectDebt: 0,   effectScore: 20,  explanation: 'Adaptar tu presupuesto ante la inflación es lo correcto.' },
        { text: 'Ignorar el impacto',               effectMoney: -100, effectIncome: 0,   effectDebt: 0,   effectScore: -15, explanation: 'Ignorar la inflación genera déficit sin darte cuenta.' },
        { text: 'Buscar ingresos extra',            effectMoney: 50,   effectIncome: 50,  effectDebt: 0,   effectScore: 25,  explanation: 'Buscar ingresos adicionales es una respuesta inteligente.' },
      ],
    },
    {
      name: 'Emergencia médica',
      description: 'Tuviste un accidente menor y necesitas atención médica.',
      category: 'RISK',
      probability: 0.20,
      isGlobal: false,
      options: [
        { text: 'Pagar con fondo de emergencia',    effectMoney: -200, effectIncome: 0,   effectDebt: 0,   effectScore: 30,  explanation: 'Para eso existe el fondo de emergencia. Excelente planificación.' },
        { text: 'Pagar con tarjeta de crédito',     effectMoney: 0,    effectIncome: 0,   effectDebt: 200, effectScore: -10, explanation: 'Usa el crédito solo si no tienes otra opción.' },
        { text: 'Pedir dinero prestado a familia',  effectMoney: -200, effectIncome: 0,   effectDebt: 0,   effectScore: -5,  explanation: 'Mezclar dinero y familia puede generar conflictos.' },
      ],
    },
  ];

  for (const event of events) {
    const exists = await prisma.simulatorEvent.findFirst({ where: { name: event.name } });
    if (!exists) {
      await prisma.simulatorEvent.create({
        data: {
          name: event.name,
          description: event.description,
          category: event.category as any,
          probability: event.probability,
          isGlobal: event.isGlobal,
          options: { create: event.options },
        },
      });
    }
  }
  console.log('✅ Eventos del simulador creados');

    const achievements = [
    { key: 'first_quiz_passed',     name: 'Primer Quiz',         description: 'Aprueba tu primer quiz.',              icon: '🎯', category: 'LEARNING',  xpReward: 50,  condition: { metric: 'quizzes_passed',     threshold: 1  } },
    { key: 'quiz_master',           name: 'Quiz Master',         description: 'Aprueba 10 quizzes.',                  icon: '🏆', category: 'LEARNING',  xpReward: 150, condition: { metric: 'quizzes_passed',     threshold: 10 } },
    { key: 'first_lesson',          name: 'Primer Paso',         description: 'Completa tu primera lección.',         icon: '📘', category: 'LEARNING',  xpReward: 30,  condition: { metric: 'lessons_completed',  threshold: 1  } },
    { key: 'module_master',         name: 'Módulo Completo',     description: 'Completa un módulo entero.',           icon: '📗', category: 'LEARNING',  xpReward: 100, condition: { metric: 'modules_completed',  threshold: 1  } },
    { key: 'first_transaction',     name: 'Registro Financiero', description: 'Registra tu primera transacción.',     icon: '💰', category: 'FINANCES',  xpReward: 30,  condition: { metric: 'total_transactions', threshold: 1  } },
    { key: 'transaction_master',    name: 'Contador',            description: 'Registra 50 transacciones.',          icon: '📊', category: 'FINANCES',  xpReward: 100, condition: { metric: 'total_transactions', threshold: 50 } },
    { key: 'first_game',            name: 'Primer Juego',        description: 'Completa tu primera partida.',        icon: '🎮', category: 'SIMULATOR', xpReward: 50,  condition: { metric: 'games_played',       threshold: 1  } },
    { key: 'streak_7',              name: 'Semana Constante',    description: 'Mantén una racha de 7 días.',         icon: '🔥', category: 'STREAK',    xpReward: 100, condition: { metric: 'current_streak',     threshold: 7  } },
    { key: 'streak_30',             name: 'Mes Constante',       description: 'Mantén una racha de 30 días.',        icon: '⚡', category: 'STREAK',    xpReward: 300, condition: { metric: 'current_streak',     threshold: 30 } },
    { key: 'level_5',               name: 'Nivel 5',             description: 'Alcanza el nivel 5.',                 icon: '⭐', category: 'GENERAL',   xpReward: 100, condition: { metric: 'level',              threshold: 5  } },
    { key: 'level_10',              name: 'Leyenda',             description: 'Alcanza el nivel máximo.',            icon: '👑', category: 'GENERAL',   xpReward: 500, condition: { metric: 'level',              threshold: 10 } },
  ];

  for (const achievement of achievements) {
    const exists = await prisma.achievement.findUnique({ where: { key: achievement.key } });
    if (!exists) {
      await prisma.achievement.create({
        data: { ...achievement, category: achievement.category as any },
      });
    }
  }
  console.log('✅ Logros creados');

  // ── RECOMPENSAS ───────────────────────────────────
  const rewards = [
    { name: 'Avatar Inversor',      description: 'Desbloquea el avatar de inversor.',      icon: '👔', type: 'AVATAR', unlockType: 'LEVEL',       unlockValue: '5'              },
    { name: 'Avatar Maestro',       description: 'Desbloquea el avatar de maestro.',       icon: '🎓', type: 'AVATAR', unlockType: 'LEVEL',       unlockValue: '10'             },
    { name: 'Tema Oscuro Premium',  description: 'Desbloquea el tema oscuro premium.',     icon: '🌙', type: 'THEME',  unlockType: 'RANK',        unlockValue: 'INTERMEDIATE'   },
    { name: 'Tema Dorado',          description: 'Desbloquea el tema dorado.',             icon: '✨', type: 'THEME',  unlockType: 'RANK',        unlockValue: 'EXPERT'         },
    { name: 'Marco Plata',          description: 'Marco de perfil plateado.',              icon: '🥈', type: 'FRAME',  unlockType: 'LEVEL',       unlockValue: '3'              },
    { name: 'Marco Oro',            description: 'Marco de perfil dorado.',                icon: '🥇', type: 'FRAME',  unlockType: 'RANK',        unlockValue: 'ADVANCED'       },
    { name: 'Insignia Quiz Master', description: 'Insignia exclusiva de Quiz Master.',     icon: '🏆', type: 'BADGE',  unlockType: 'ACHIEVEMENT', unlockValue: 'quiz_master'    },
    { name: 'Insignia Constante',   description: 'Insignia por racha de 30 días.',         icon: '🔥', type: 'BADGE',  unlockType: 'ACHIEVEMENT', unlockValue: 'streak_30'      },
  ];

  for (const reward of rewards) {
    const exists = await prisma.reward.findFirst({ where: { name: reward.name } });
    if (!exists) {
      await prisma.reward.create({
        data: { ...reward, type: reward.type as any, unlockType: reward.unlockType as any },
      });
    }
  }
  console.log('✅ Recompensas creadas');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());