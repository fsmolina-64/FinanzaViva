import { Transaction, TransferDisplay, AccountType, Budget, Goal } from '../../core/models/finance.model';

export function formatDateLabel(dateKey: string): string {
  const d = new Date(dateKey + 'T12:00:00');
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateKey === today) return 'Hoy';
  if (dateKey === yesterday) return 'Ayer';
  return d.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function isInitBalanceTx(tx: any): boolean {
  return tx?.isInitialBalance === true;
}

export function getCategoryName(categories: { id: string; name: string }[], categoryId: string): string {
  return categories.find(c => c.id === categoryId)?.name ?? 'Sin categoría';
}

export function getAccountName(accounts: { id: string; name: string }[], accountId: string): string {
  return accounts.find(a => a.id === accountId)?.name ?? '';
}

export function isBalanceAdjustmentTx(tx: any): boolean {
  return !tx.isInitialBalance && (
    tx.description?.startsWith('Ajuste de balance') ||
    tx.description?.startsWith('Balance inicial')
  );
}

export function getTransactionBg(tx: Transaction | TransferDisplay): string {
  if (isInitBalanceTx(tx)) return 'bg-purple-500/20 text-purple-400';
  if (isBalanceAdjustmentTx(tx)) return 'bg-orange-500/20 text-orange-400';
  if (tx.type === 'INCOME') return 'bg-emerald-500/20 text-emerald-400';
  if (tx.type === 'TRANSFER') return 'bg-blue-500/20 text-blue-400';
  return 'bg-red-500/20 text-red-400';
}

export function getTransactionColor(tx: Transaction | TransferDisplay): string {
  if (isInitBalanceTx(tx)) return 'text-purple-400';
  if (isBalanceAdjustmentTx(tx)) return 'text-orange-400';
  if (tx.type === 'INCOME') return 'text-emerald-400';
  if (tx.type === 'TRANSFER') return 'text-blue-400';
  return 'text-red-400';
}

export function getTransactionSign(tx: Transaction | TransferDisplay): string {
  if (isInitBalanceTx(tx)) return '$';
  if (tx.type === 'INCOME') return '+$';
  if (tx.type === 'TRANSFER') return '$';
  return '-$';
}

export function getTransactionLabel(tx: Transaction | TransferDisplay, categories: { id: string; name: string }[]): string {
  if (isInitBalanceTx(tx)) return 'Balance inicial';
  if (tx.type === 'TRANSFER') {
    const td = tx as TransferDisplay;
    return `${td.fromAccountName} → ${td.toAccountName}`;
  }
  return getCategoryName(categories, tx.categoryId);
}

export function getAccountTypeLabel(type: AccountType): string {
  const map: Record<AccountType, string> = { CASH: 'Efectivo', BANK: 'Banco', DIGITAL_WALLET: 'Billetera' };
  return map[type] ?? type;
}

export function getAccountTypeColor(type: AccountType): string {
  if (type === 'CASH') return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  if (type === 'BANK') return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
  return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
}

export function getGoalProgress(g: Goal): number {
  const current = parseFloat(String(g.currentAmount)), target = parseFloat(String(g.targetAmount));
  return target ? Math.min(100, Math.round((current / target) * 100)) : 0;
}

export function computeSpent(transactions: Transaction[], categoryId: string): number {
  const now = new Date();
  return transactions
    .filter(t => t.type === 'EXPENSE'
      && (!categoryId || t.categoryId === categoryId)
      && new Date(t.date).getMonth() === now.getMonth()
      && new Date(t.date).getFullYear() === now.getFullYear())
    .reduce((s, t) => s + parseFloat(String(t.amount)), 0);
}

export function getBudgetPct(b: Budget, transactions: Transaction[]): number {
  const spent = computeSpent(transactions, b.categoryId), amount = parseFloat(String(b.amount));
  return amount ? Math.min(100, Math.round((spent / amount) * 100)) : 0;
}

export function getRecurrenceLabel(recurrenceOptions: { value: string; label: string }[], r: string): string {
  return recurrenceOptions.find(o => o.value === r)?.label ?? r;
}

export function extractError(err: any, fallback: string): string {
  return err?.error?.message ?? fallback;
}
