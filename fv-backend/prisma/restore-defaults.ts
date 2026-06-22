import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL ?? 'postgresql://postgres:2007@localhost:5432/FinanzaViva?schema=public';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const DEFAULT_NAMES = [
  'Salario', 'Freelance', 'Inversiones',
  'Alimentación', 'Transporte', 'Entretenimiento',
  'Salud', 'Educación', 'Servicios', 'Ropa',
];

const DEFAULTS: { name: string; icon: string; color: string; type: 'INCOME' | 'EXPENSE' }[] = [
  { name: 'Salario',         icon: '💼', color: '#10B981', type: 'INCOME'  },
  { name: 'Freelance',       icon: '💻', color: '#10B981', type: 'INCOME'  },
  { name: 'Inversiones',     icon: '📈', color: '#10B981', type: 'INCOME'  },
  { name: 'Alimentación',    icon: '🍔', color: '#EF4444', type: 'EXPENSE' },
  { name: 'Transporte',      icon: '🚌', color: '#EF4444', type: 'EXPENSE' },
  { name: 'Entretenimiento', icon: '🎮', color: '#EF4444', type: 'EXPENSE' },
  { name: 'Salud',           icon: '🏥', color: '#EF4444', type: 'EXPENSE' },
  { name: 'Educación',       icon: '📚', color: '#EF4444', type: 'EXPENSE' },
  { name: 'Servicios',       icon: '💡', color: '#EF4444', type: 'EXPENSE' },
  { name: 'Ropa',            icon: '👕', color: '#EF4444', type: 'EXPENSE' },
];

async function main() {
  console.log('Restaurando categorías predefinidas...\n');

  // 1. Delete global categories that were renamed (not in defaults list)
  const corrupted = await prisma.category.findMany({
    where: { isGlobal: true, NOT: { name: { in: DEFAULT_NAMES } } },
  });
  for (const c of corrupted) {
    console.log(`  ✗ "${c.name}" → eliminada (fue renombrada/modificada).`);
    await prisma.category.delete({ where: { id: c.id } });
  }

  // 2. Create missing default categories
  for (const cat of DEFAULTS) {
    const exists = await prisma.category.findFirst({
      where: { name: cat.name, isGlobal: true },
    });
    if (!exists) {
      await prisma.category.create({
        data: { ...cat, isGlobal: true },
      });
      console.log(`  + "${cat.name}" creada.`);
    } else {
      console.log(`  ✓ "${cat.name}" ya existe.`);
    }
  }

  // 3. Remove duplicates (keep the first one by id order)
  for (const name of DEFAULT_NAMES) {
    const all = await prisma.category.findMany({
      where: { name, isGlobal: true },
      orderBy: { id: 'asc' },
    });
    if (all.length > 1) {
      const [, ...rest] = all;
      await prisma.category.deleteMany({
        where: { id: { in: rest.map(r => r.id) } },
      });
      console.log(`  ~ ${rest.length} duplicado(s) de "${name}" eliminado(s).`);
    }
  }

  console.log('\n✅ Categorías predefinidas restauradas.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
