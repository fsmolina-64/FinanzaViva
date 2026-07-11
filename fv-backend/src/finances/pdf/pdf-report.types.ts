export interface PdfAccount {
  id: string;
  name: string;
  type: 'CASH' | 'BANK' | 'DIGITAL_WALLET';
  balance: string;
  createdAt: string;
}

export interface PdfTransaction {
  id: string;
  accountId: string;
  categoryId: string | null;
  amount: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  description: string | null;
  date: string;
  transferGroupId: string | null;
  isInitialBalance: boolean;
}

export interface PdfCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'INCOME' | 'EXPENSE';
  isGlobal: boolean;
  userId: string | null;
}

export interface PdfBudget {
  id: string;
  categoryId: string | null;
  amount: string;
  period: 'MONTHLY' | 'WEEKLY';
  startDate: string;
  endDate: string | null;
}

export interface PdfGoal {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  deadline: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface PdfTransferGroup {
  groupId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string | null;
  date: string;
}

export interface PdfReportData {
  userName: string;
  accounts: PdfAccount[];
  transactions: PdfTransaction[];
  budgets: PdfBudget[];
  goals: PdfGoal[];
  categories: PdfCategory[];
  transferGroups: PdfTransferGroup[];
}

/**
 * NOTA: el PdfReportData del frontend (pdf-export.service.ts) también declara
 * `summary: FinanceSummary` y `health: BudgetHealth` como campos obligatorios,
 * pero generateReport() nunca los lee (0 matches de `data.summary` / `data.health`
 * en todo el archivo — el health se recalcula localmente vía deriveHealth() a partir
 * del income/expenses ya filtrados por período). Se omiten acá para no traer de
 * Prisma datos que después no se usan.
 */

export const C = {
  blue: [96, 165, 250] as [number, number, number],
  dark: [30, 41, 59] as [number, number, number],
  green: [52, 211, 153] as [number, number, number],
  red: [248, 113, 113] as [number, number, number],
  orange: [251, 191, 36] as [number, number, number],
  purple: [167, 139, 250] as [number, number, number],
  slate: [51, 65, 85] as [number, number, number],
  gray: [148, 163, 184] as [number, number, number],
  muted: [148, 163, 184] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  bgGray: [248, 250, 252] as [number, number, number],
  bgNeutral: [243, 244, 246] as [number, number, number],
  bgBlue: [239, 246, 255] as [number, number, number],
  bgGreen: [240, 253, 244] as [number, number, number],
  bgRed: [254, 242, 242] as [number, number, number],
  bgPurple: [245, 243, 255] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  blueAcc: [191, 219, 254] as [number, number, number],
  bdrBlue: [147, 197, 253] as [number, number, number],
};

export const CHART_COLORS = [
  '#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA',
  '#F472B6', '#22D3EE', '#A3E635', '#FB923C', '#818CF8',
  '#2DD4BF', '#C084FC',
];

export const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  CASH: 'Efectivo', BANK: 'Banco', DIGITAL_WALLET: 'Billetera Digital',
};

export const ACCOUNT_TYPE_COLOR: Record<string, [number, number, number]> = {
  CASH: C.green, BANK: C.blue, DIGITAL_WALLET: C.purple,
};
