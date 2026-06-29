import { Transaction, Account, TransferDisplay } from '../../core/models/finance.model';

export function buildTransferDisplay(transactions: Transaction[], accounts: Account[]): (Transaction | TransferDisplay)[] {
  const transferGroups = new Map<string, Transaction[]>();
  const result: (Transaction | TransferDisplay)[] = [];

  for (const tx of transactions) {
    if (tx.type === 'TRANSFER' && tx.transferGroupId) {
      const g = transferGroups.get(tx.transferGroupId) || [];
      g.push(tx);
      transferGroups.set(tx.transferGroupId, g);
    } else {
      result.push(tx);
    }
  }

  for (const [, group] of transferGroups) {
    if (group.length >= 2) {
      const from = group.find(t => {
        const other = group.find(o => o.id !== t.id);
        return other && t.accountId !== other.accountId;
      }) ?? group[0];
      const to = group.find(t => t.id !== from.id)!;
      const fromAcc = accounts.find(a => a.id === from.accountId);
      const toAcc = accounts.find(a => a.id === to.accountId);
      result.push({
        groupId: from.transferGroupId!,
        type: 'TRANSFER' as const,
        fromAccountId: from.accountId,
        toAccountId: to.accountId,
        fromAccountName: fromAcc?.name ?? 'Cuenta origen',
        toAccountName: toAcc?.name ?? 'Cuenta destino',
        amount: parseFloat(String(from.amount)),
        description: from.description || to.description,
        date: from.date,
        fromTxId: from.id,
        toTxId: to.id,
      });
    } else if (group.length === 1) {
      result.push(group[0]);
    }
  }

  return result.sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    const aMs = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
    const bMs = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
    return bMs - aMs;
  });
}
