import { Injectable } from '@nestjs/common';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createCanvas, SKRSContext2D } from '@napi-rs/canvas';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  PdfReportData, PdfAccount, PdfTransaction, PdfCategory, PdfBudget, PdfGoal, PdfTransferGroup,
  C, CHART_COLORS, ACCOUNT_TYPE_LABEL, ACCOUNT_TYPE_COLOR,
} from './pdf-report.types';

interface HealthLike {
  income: number;
  expenses: number;
  available: number;
  percentage: number;
  status: string;
  message: string;
  breakdown: Record<string, number>;
}

@Injectable()
export class PdfReportService {

  private logoDataUrl: string | null = null;

  async generateReportBuffer(data: PdfReportData, period: { from: string; to: string }): Promise<Buffer> {
    const doc = new jsPDF('p', 'mm', 'a4');
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();

    const logoUrl = await this.loadLogo();

    const inception: Record<string, string> = {};
    for (const a of data.accounts) {
      inception[a.id] = a.createdAt.substring(0, 10);
    }

    const activeAccounts = data.accounts.filter(a => {
      const d = inception[a.id];
      return !d || d <= period.to;
    });

    const txs = data.transactions.filter(t => {
      const d = t.date.substring(0, 10);
      if (d < period.from || d > period.to) return false;
      const acc = inception[t.accountId];
      return !acc || d >= acc;
    });

    const income = txs.filter(t => t.type === 'INCOME' && !t.isInitialBalance).reduce((s, t) => s + parseFloat(String(t.amount)), 0);
    const expenses = txs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + parseFloat(String(t.amount)), 0);
    const savings = income - expenses;
    const savingsRate = income > 0 ? Math.max(0, Math.round((savings / income) * 100)) : 0;
    const histBal = this.calcHistoricalBalances(data.transactions, data.accounts, period.to);
    const totalBal = activeAccounts.reduce((s, a) => s + (histBal[a.id] ?? parseFloat(String(a.balance))), 0);
    const health = this.deriveHealth(income, expenses);
    const kpis = { income, expenses, savings, savingsRate, totalBal, txCount: txs.length };

    const periodGoals = data.goals.filter(g => g.createdAt.substring(0, 10) <= period.to);
    const tfs = (data.transferGroups ?? []).filter(tf => {
      const d = tf.date.substring(0, 10);
      return d >= period.from && d <= period.to;
    });
    const nonTransferTxs = txs.filter(t => t.type !== 'TRANSFER');

    const tocItems: string[] = [
      '1. Resumen ejecutivo',
      '2. Analisis de gastos',
      '3. Analisis de ingresos',
      '4. Estado de cuentas',
    ];
    let pg = 5;
    if (data.budgets.length > 0) tocItems.push(`${pg++}. Presupuestos`);
    if (periodGoals.length > 0) tocItems.push(`${pg++}. Metas financieras`);
    if (tfs.length > 0) tocItems.push(`${pg++}. Transferencias`);
    if (nonTransferTxs.length > 0) tocItems.push(`${pg++}. Detalle de transacciones`);

    const incCat = this.groupByCategory(txs.filter(t => t.type === 'INCOME' && !t.isInitialBalance), data.categories);
    const expCat = this.groupByCategory(txs.filter(t => t.type === 'EXPENSE'), data.categories);

    const incChart = incCat.length > 0 ? this.drawDonutChart(incCat) : null;
    const expChart = expCat.length > 0 ? this.drawDonutChart(expCat) : null;
    const compareChart = this.drawCompareChart(income, expenses);

    this.buildCover(doc, data.userName, period, kpis, PW, PH, logoUrl, tocItems);

    doc.addPage();
    this.buildSummary(doc, kpis, health, incCat, expCat, compareChart, PW);

    doc.addPage();
    this.buildCategoryPage(doc, 'Analisis de Gastos', expCat, expChart, expenses, C.red, C.bgRed, PW);

    doc.addPage();
    this.buildCategoryPage(doc, 'Analisis de Ingresos', incCat, incChart, income, C.green, C.bgGreen, PW);

    doc.addPage();
    this.buildAccounts(doc, activeAccounts, histBal, PW);

    if (data.budgets.length > 0) {
      doc.addPage();
      this.buildBudgets(doc, data.budgets, data.categories, txs, PW, period);
    }

    if (periodGoals.length > 0) {
      doc.addPage();
      this.buildGoals(doc, periodGoals, PW);
    }

    if (tfs.length > 0) {
      doc.addPage();
      this.buildTransfers(doc, tfs, data.accounts, PW);
    }

    if (nonTransferTxs.length > 0) {
      doc.addPage();
      this.buildTransactionDetail(doc, nonTransferTxs, data.categories, data.accounts, PW);
    }

    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 2; i <= totalPages; i++) {
      doc.setPage(i);
      this.buildFooter(doc, i, totalPages, period, PW, PH);
    }

    return Buffer.from(doc.output('arraybuffer'));
  }

  private calcHistoricalBalances(
    transactions: PdfTransaction[],
    accounts: PdfAccount[],
    upTo: string
  ): Record<string, number> {
    const end = upTo.substring(0, 10);
    const result: Record<string, number> = {};
    for (const a of accounts) result[a.id] = parseFloat(String(a.balance));
    for (const tx of transactions) {
      const d = tx.date.substring(0, 10);
      if (d <= end) continue;
      const amt = parseFloat(String(tx.amount));
      if (tx.type === 'INCOME') {
        result[tx.accountId] -= amt;
      } else if (tx.type === 'EXPENSE') {
        result[tx.accountId] += amt;
      } else if (tx.type === 'TRANSFER' && tx.transferGroupId) {
        const pair = transactions.find(t => t.transferGroupId === tx.transferGroupId && t.id !== tx.id);
        if (pair && pair.date.substring(0, 10) > end) continue;
        result[tx.accountId] += amt;
      }
    }
    return result;
  }

  private groupByCategory(
    txs: PdfTransaction[],
    cats: PdfCategory[]
  ): { name: string; amount: number; count: number }[] {
    const map = new Map<string, { name: string; amount: number; count: number }>();
    for (const tx of txs) {
      const key = tx.categoryId ?? '__none__';
      const name = cats.find(c => c.id === tx.categoryId)?.name ?? 'Sin categoria';
      const prev = map.get(key) ?? { name, amount: 0, count: 0 };
      map.set(key, { name, amount: prev.amount + parseFloat(String(tx.amount)), count: prev.count + 1 });
    }
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }

  private deriveHealth(income: number, expenses: number): HealthLike {
    const available = income - expenses;
    const percentage = income > 0 ? Math.round((expenses / income) * 100) : 0;
    let status: string;
    let message: string;
    if (percentage >= 100) {
      status = 'CRITICAL';
      message = `Deficit de ${this.fmt(Math.abs(available))}. Gastos superan los ingresos del periodo.`;
    } else if (percentage >= 90) {
      status = 'DANGER';
      message = `Atencion: ${percentage}% de ingresos destinados a gastos. Disponible: ${this.fmt(available)}`;
    } else if (percentage >= 80) {
      status = 'WARNING';
      message = `Presupuesto al ${percentage}%. Modera tus gastos para fortalecer el ahorro.`;
    } else {
      status = 'HEALTHY';
      message = `Finanzas saludables. Solo el ${percentage}% de tus ingresos en gastos del periodo.`;
    }
    return { income, expenses, available, percentage, status, message, breakdown: {} };
  }

  private drawDonutChart(data: { name: string; amount: number; count: number }[]): string {
    const W = 960, H = 420;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    const total = data.reduce((s, d) => s + d.amount, 0);
    const slices = [...data].sort((a, b) => b.amount - a.amount).slice(0, 12);

    const cx = 205, cy = H / 2, outer = 162, inner = 76;
    let angle = -Math.PI / 2;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.09)';
    ctx.shadowBlur = 24;
    ctx.beginPath(); ctx.arc(cx, cy, outer + 7, 0, Math.PI * 2);
    ctx.fillStyle = '#F1F5F9'; ctx.fill();
    ctx.restore();

    slices.forEach((s, i) => {
      const sweep = (s.amount / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outer, angle, angle + sweep);
      ctx.closePath();
      ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length];
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.fill();
      ctx.stroke();

      const pct = (s.amount / total) * 100;
      if (pct > 5.5) {
        const mid = angle + sweep / 2;
        const lr = (outer + inner) / 2;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round(pct)}%`, cx + Math.cos(mid) * lr, cy + Math.sin(mid) * lr);
      }
      angle += sweep;
    });

    ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF'; ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2C2C2E';
    ctx.font = 'bold 26px Arial';
    const totalLabel = total >= 1000 ? `$${(total / 1000).toFixed(1)}k` : `$${total.toFixed(0)}`;
    ctx.fillText(totalLabel, cx, cy - 12);
    ctx.fillStyle = '#AEAEB2';
    ctx.font = '15px Arial';
    ctx.fillText('Total', cx, cy + 14);

    const useTwoCols = slices.length > 5;
    const half = Math.ceil(slices.length / 2);
    let ly = 28, lx = 415;

    slices.forEach((item, i) => {
      const pct = Math.round((item.amount / total) * 100);
      const color = CHART_COLORS[i % CHART_COLORS.length];
      if (useTwoCols && i === half) { lx = 696; ly = 28; }

      ctx.fillStyle = color;
      ctx.beginPath();
      this.rrectCanvas(ctx, lx, ly, 18, 18, 3);
      ctx.fill();

      const label = item.name.length > 19 ? item.name.substring(0, 18) + '.' : item.name;
      ctx.fillStyle = '#2C2C2E';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(label, lx + 26, ly + 14);

      ctx.fillStyle = '#636366';
      ctx.font = '12px Arial';
      ctx.fillText(`$${item.amount.toFixed(2)}   ${pct}%`, lx + 26, ly + 30);

      ly += 44;
    });

    return canvas.toDataURL('image/png');
  }

  private drawCompareChart(income: number, expenses: number): string {
    const W = 960, H = 130;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    const maxVal = Math.max(income, expenses, 1);
    const barH = 30;
    const trackW = 590;
    const trackX = 236;

    ctx.fillStyle = '#E5E5EA';
    ctx.beginPath(); this.rrectCanvas(ctx, trackX, 16, trackW, barH, 15); ctx.fill();
    const incW = Math.max(10, (income / maxVal) * trackW);
    ctx.fillStyle = '#34C759';
    ctx.beginPath(); this.rrectCanvas(ctx, trackX, 16, incW, barH, 15); ctx.fill();

    ctx.fillStyle = '#2C2C2E';
    ctx.font = 'bold 17px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('INGRESOS', trackX - 14, 16 + barH / 2);

    ctx.fillStyle = '#34C759';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    const incLabelX = Math.min(trackX + incW + 10, trackX + trackW - 70);
    ctx.fillText(`$${income.toFixed(2)}`, incLabelX, 16 + barH / 2);

    ctx.fillStyle = '#E5E5EA';
    ctx.beginPath(); this.rrectCanvas(ctx, trackX, 70, trackW, barH, 15); ctx.fill();
    const expW = Math.max(10, (expenses / maxVal) * trackW);
    ctx.fillStyle = '#FF3B30';
    ctx.beginPath(); this.rrectCanvas(ctx, trackX, 70, expW, barH, 15); ctx.fill();

    ctx.fillStyle = '#2C2C2E';
    ctx.font = 'bold 17px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('GASTOS', trackX - 14, 70 + barH / 2);

    ctx.fillStyle = '#FF3B30';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    const expLabelX = Math.min(trackX + expW + 10, trackX + trackW - 70);
    ctx.fillText(`$${expenses.toFixed(2)}`, expLabelX, 70 + barH / 2);

    return canvas.toDataURL('image/png');
  }

  private rrectCanvas(ctx: SKRSContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  private buildHeader(doc: jsPDF, title: string, PW: number): void {
    doc.setFillColor(...C.dark);
    doc.rect(0, 0, PW, 16, 'F');

    doc.setTextColor(...C.white);
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
    doc.text('FinanzaViva', 8, 10.5);
    doc.setFont('helvetica', 'normal');
    doc.text(title, PW - 8, 10.5, { align: 'right' });

    doc.setTextColor(...C.slate);
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text(title, 16, 29);

    const tw = doc.getTextWidth(title);
    doc.setDrawColor(...C.blue); doc.setLineWidth(0.7);
    doc.line(16, 32.5, 16 + tw, 32.5);
  }

  private buildFooter(
    doc: jsPDF,
    page: number, total: number,
    period: { from: string; to: string },
    PW: number, PH: number
  ): void {
    doc.setDrawColor(...C.border); doc.setLineWidth(0.2);
    doc.line(16, PH - 11, PW - 16, PH - 11);
    doc.setTextColor(...C.muted); doc.setFontSize(6.5); doc.setFont('helvetica', 'normal');
    doc.text('FinanzaViva - Reporte Confidencial', 16, PH - 5.5);
    doc.text(
      `${this.fmtDate(period.from)} al ${this.fmtDate(period.to)}`,
      PW / 2, PH - 5.5, { align: 'center' }
    );
    doc.text(`Pag. ${page} / ${total}`, PW - 16, PH - 5.5, { align: 'right' });
  }

  private buildCover(
    doc: jsPDF,
    userName: string,
    period: { from: string; to: string },
    kpis: { income: number; expenses: number; savings: number; savingsRate: number; totalBal: number; txCount: number },
    PW: number, PH: number,
    logoUrl: string | null,
    tocItems: string[]
  ): void {
    doc.setFillColor(...C.dark);
    doc.rect(0, 0, PW, 80, 'F');

    doc.setDrawColor(...C.white); doc.setLineWidth(0.15);
    doc.line(16, 76, PW - 16, 76);

    if (logoUrl) {
      try { doc.addImage(logoUrl, 'PNG', PW / 2 - 13, 5, 26, 26); } catch { /* skip */ }
    }

    doc.setTextColor(...C.white);
    doc.setFontSize(31); doc.setFont('helvetica', 'bold');
    doc.text('FinanzaViva', PW / 2, 44, { align: 'center' });

    doc.setFontSize(10.5); doc.setFont('helvetica', 'normal');
    doc.text('Reporte Financiero Personal', PW / 2, 57, { align: 'center' });

    doc.setFontSize(8); doc.setTextColor(...C.blueAcc);
    doc.text('Educacion financiera gamificada', PW / 2, 68, { align: 'center' });

    const tileGap = 4;
    const tW = (PW - 32 - tileGap * 3) / 4;
    const tY = 88;
    const tiles = [
      { label: 'BALANCE', value: this.fmt(kpis.totalBal), clr: C.blue },
      { label: 'INGRESOS', value: this.fmt(kpis.income), clr: C.green },
      { label: 'GASTOS', value: this.fmt(kpis.expenses), clr: C.red },
      { label: 'AHORRO', value: `${kpis.savingsRate}%`, clr: kpis.savings >= 0 ? C.green : C.red },
    ];

    tiles.forEach((t, i) => {
      const tx = 16 + i * (tW + tileGap);
      doc.setFillColor(...C.bgGray);
      doc.roundedRect(tx, tY, tW, 26, 2.5, 2.5, 'F');
      doc.setDrawColor(...C.border); doc.setLineWidth(0.15);
      doc.roundedRect(tx, tY, tW, 26, 2.5, 2.5, 'S');
      doc.setFillColor(...t.clr);
      doc.roundedRect(tx, tY, 3, 26, 1, 1, 'F');
      doc.setTextColor(...C.muted); doc.setFontSize(6); doc.setFont('helvetica', 'bold');
      doc.text(t.label, tx + tW / 2, tY + 10, { align: 'center' });
      doc.setTextColor(...t.clr); doc.setFontSize(9.5); doc.setFont('helvetica', 'bold');
      doc.text(t.value, tx + tW / 2, tY + 21, { align: 'center' });
    });

    const cY = tY + 35;
    doc.setFillColor(...C.bgGray);
    doc.roundedRect(16, cY, PW - 32, 42, 4, 4, 'F');
    doc.setDrawColor(...C.border); doc.setLineWidth(0.2);
    doc.roundedRect(16, cY, PW - 32, 42, 4, 4, 'S');
    doc.setFillColor(...C.blue);
    doc.roundedRect(16, cY, 3, 42, 1.5, 1.5, 'F');

    doc.setTextColor(...C.muted); doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
    doc.text('PERIODO ANALIZADO', PW / 2, cY + 10, { align: 'center' });

    doc.setTextColor(...C.slate); doc.setFontSize(13.5); doc.setFont('helvetica', 'bold');
    doc.text(
      `${this.fmtDate(period.from)}  al  ${this.fmtDate(period.to)}`,
      PW / 2, cY + 23, { align: 'center' }
    );

    doc.setTextColor(...C.muted); doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    doc.text(
      `${this.daysBetween(period.from, period.to)} dias analizados  |  ${kpis.txCount} transacciones`,
      PW / 2, cY + 35, { align: 'center' }
    );

    const uY = cY + 52;
    doc.setTextColor(...C.slate); doc.setFontSize(10.5); doc.setFont('helvetica', 'bold');
    doc.text(`Preparado para: ${userName || 'Usuario'}`, PW / 2, uY, { align: 'center' });
    doc.setTextColor(...C.muted); doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    doc.text(
      `Generado el ${this.fmtDate(new Date().toISOString().split('T')[0])}`,
      PW / 2, uY + 10, { align: 'center' }
    );

    const tocY = uY + 22;
    doc.setFillColor(...C.bgGray);
    doc.roundedRect(16, tocY, PW - 32, 72, 4, 4, 'F');
    doc.setDrawColor(...C.border); doc.setLineWidth(0.2);
    doc.roundedRect(16, tocY, PW - 32, 72, 4, 4, 'S');
    doc.setFillColor(...C.dark);
    doc.roundedRect(16, tocY, 3, 72, 2, 2, 'F');

    doc.setTextColor(...C.slate); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text('CONTENIDO DEL REPORTE', 26, tocY + 12);

    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal');
    tocItems.forEach((item, i) => {
      const col = i % 2 === 0 ? 26 : PW / 2 + 4;
      const row = tocY + 22 + Math.floor(i / 2) * 15;
      doc.setFillColor(...C.blue);
      doc.circle(col + 2.5, row - 2.5, 1.5, 'F');
      doc.setTextColor(...C.slate);
      doc.text(item, col + 8, row);
    });

    doc.setFillColor(...C.dark);
    doc.rect(0, PH - 14, PW, 14, 'F');
    doc.setTextColor(...C.white); doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    doc.text('FinanzaViva  |  Tu camino hacia la libertad financiera', PW / 2, PH - 5.5, { align: 'center' });
  }

  private buildSummary(
    doc: jsPDF,
    kpis: { income: number; expenses: number; savings: number; savingsRate: number; totalBal: number; txCount: number },
    health: HealthLike,
    incCat: { name: string; amount: number; count: number }[],
    expCat: { name: string; amount: number; count: number }[],
    compareChart: string,
    PW: number
  ): void {
    this.buildHeader(doc, 'Resumen Ejecutivo', PW);
    let y = 38;

    const W2 = (PW - 40) / 2;
    const cards: { label: string; value: string; sub: string; rgb: [number, number, number] }[] = [
      { label: 'BALANCE TOTAL', value: this.fmt(kpis.totalBal), sub: 'Patrimonio neto', rgb: C.blue },
      { label: 'INGRESOS', value: this.fmt(kpis.income), sub: 'Total del periodo', rgb: C.green },
      { label: 'GASTOS', value: this.fmt(kpis.expenses), sub: 'Total del periodo', rgb: C.red },
      { label: 'AHORRO NETO', value: this.fmt(kpis.savings), sub: `Tasa: ${kpis.savingsRate}%`, rgb: kpis.savings >= 0 ? C.blue : C.red },
    ];

    cards.forEach((c, i) => {
      const cx = 16 + (i % 2) * (W2 + 8);
      const cy = y + Math.floor(i / 2) * 34;
      doc.setFillColor(...C.bgGray);
      doc.roundedRect(cx, cy, W2, 28, 3, 3, 'F');
      doc.setFillColor(...c.rgb);
      doc.roundedRect(cx, cy, 3, 28, 1, 1, 'F');
      doc.setTextColor(...C.muted); doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
      doc.text(c.label, cx + 9, cy + 10);
      doc.setTextColor(...c.rgb); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text(c.value, cx + 9, cy + 22);
      doc.setTextColor(...C.muted); doc.setFontSize(6.5); doc.setFont('helvetica', 'normal');
      doc.text(c.sub, cx + W2 - 7, cy + 22, { align: 'right' });
    });

    y += 2 * 34 + 6;

    doc.setFillColor(...C.bgGray);
    doc.roundedRect(16, y, PW - 32, 9, 2, 2, 'F');
    doc.setDrawColor(...C.border); doc.setLineWidth(0.15);
    doc.roundedRect(16, y, PW - 32, 9, 2, 2, 'S');
    doc.setTextColor(...C.slate); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.text(`${kpis.txCount} transacciones registradas en el periodo`, PW / 2, y + 6.5, { align: 'center' });
    y += 13;

    doc.setTextColor(...C.slate); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('Comparacion de Flujo Financiero', 16, y);
    y += 5;
    doc.addImage(compareChart, 'PNG', 16, y, PW - 32, 26);
    y += 30;

    doc.setTextColor(...C.slate); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('Salud Financiera', 16, y);
    y += 5;
    doc.setTextColor(...C.gray); doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    doc.text(health.message, 16, y);
    y += 5;

    const [hr, hg, hb] = this.healthRgb(health.status);
    const barW = PW - 32;
    doc.setFillColor(...C.border);
    doc.roundedRect(16, y, barW, 5.5, 2.5, 2.5, 'F');
    doc.setFillColor(hr, hg, hb);
    doc.roundedRect(16, y, barW * Math.min(100, health.percentage) / 100, 5.5, 2.5, 2.5, 'F');
    y += 8;
    doc.setFontSize(7); doc.setTextColor(hr, hg, hb); doc.setFont('helvetica', 'bold');
    doc.text(`${health.percentage}% usado  |  ${health.status}`, PW - 16, y, { align: 'right' });
    y += 12;

    const hw = (PW - 40) / 2;

    const rClr: [number, number, number] = kpis.savingsRate >= 20 ? C.green : kpis.savingsRate >= 10 ? C.orange : C.red;
    const rLbl = kpis.savingsRate >= 20 ? 'Excelente' : kpis.savingsRate >= 10 ? 'Aceptable' : kpis.savingsRate > 0 ? 'Mejorable' : 'Deficit';
    const rTip = kpis.savingsRate >= 20
      ? 'Manten este ritmo de ahorro.'
      : kpis.savingsRate >= 10
        ? 'Apunta al 20% de ahorro mensual.'
        : 'Revisa tus gastos para mejorar el ahorro.';

    doc.setFillColor(...C.bgGray);
    doc.roundedRect(16, y, hw, 36, 3, 3, 'F');
    doc.setDrawColor(...C.border); doc.setLineWidth(0.2);
    doc.roundedRect(16, y, hw, 36, 3, 3, 'S');
    doc.setFillColor(...rClr);
    doc.roundedRect(16, y, 3, 36, 1, 1, 'F');

    doc.setTextColor(...C.muted); doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
    doc.text('TASA DE AHORRO', 24, y + 11);
    doc.setTextColor(...rClr);
    doc.setFontSize(19); doc.setFont('helvetica', 'bold');
    doc.text(`${kpis.savingsRate}%`, 24, y + 25);
    const rateW = doc.getTextWidth(`${kpis.savingsRate}%`);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text(rLbl, 24 + rateW + 3, y + 25);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.muted);
    doc.text(rTip, 24, y + 33);

    const rx = 16 + hw + 8;
    doc.setFillColor(...C.bgGray);
    doc.roundedRect(rx, y, hw, 36, 3, 3, 'F');
    doc.setDrawColor(...C.border); doc.setLineWidth(0.2);
    doc.roundedRect(rx, y, hw, 36, 3, 3, 'S');
    doc.setFillColor(...C.dark);
    doc.roundedRect(rx, y, 3, 36, 1, 1, 'F');

    doc.setTextColor(...C.muted); doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
    doc.text('PRINCIPALES MOVIMIENTOS', rx + 8, y + 11);

    if (expCat.length > 0) {
      doc.setTextColor(...C.red); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
      doc.text(`Mayor gasto: ${expCat[0].name}`, rx + 8, y + 21);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.muted);
      doc.text(this.fmt(expCat[0].amount), rx + hw - 8, y + 21, { align: 'right' });
    }
    if (incCat.length > 0) {
      doc.setTextColor(...C.green); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
      doc.text(`Mayor ingreso: ${incCat[0].name}`, rx + 8, y + 30);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.muted);
      doc.text(this.fmt(incCat[0].amount), rx + hw - 8, y + 30, { align: 'right' });
    }
  }

  private buildCategoryPage(
    doc: jsPDF,
    title: string,
    data: { name: string; amount: number; count: number }[],
    chart: string | null,
    total: number,
    rgb: [number, number, number],
    altRow: [number, number, number],
    PW: number
  ): void {
    this.buildHeader(doc, title, PW);
    let y = 38;

    if (data.length === 0) {
      doc.setTextColor(...C.muted); doc.setFontSize(10);
      doc.text('Sin registros en el periodo.', PW / 2, y + 40, { align: 'center' });
      return;
    }

    doc.setFillColor(...altRow);
    doc.roundedRect(16, y, PW - 32, 11, 3, 3, 'F');
    doc.setTextColor(...rgb); doc.setFontSize(9.5); doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${this.fmt(total)}`, PW / 2, y + 8, { align: 'center' });
    y += 15;

    if (chart) {
      doc.addImage(chart, 'PNG', 16, y, PW - 32, 88);
      y += 93;
    }

    autoTable(doc, {
      startY: y,
      head: [['#', 'Categoria', 'Monto', '% del total', 'Transacciones']],
      body: data.map((d, i) => [
        String(i + 1),
        d.name,
        this.fmt(d.amount),
        `${Math.round((d.amount / total) * 100)}%`,
        String(d.count),
      ]),
      foot: [['', 'TOTAL', this.fmt(total), '100%', String(data.reduce((s, d) => s + d.count, 0))]],
      headStyles: { fillColor: rgb, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      footStyles: { fillColor: altRow, textColor: rgb, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { textColor: [51, 65, 85] as [number, number, number], fontSize: 8 },
      alternateRowStyles: { fillColor: altRow },
      columnStyles: {
        0: { cellWidth: 9, halign: 'center' },
        2: { cellWidth: 34, halign: 'right', fontStyle: 'bold' },
        3: { cellWidth: 24, halign: 'center' },
        4: { cellWidth: 30, halign: 'center' },
      },
      margin: { left: 16, right: 16, bottom: 15 },
      styles: { cellPadding: 3.5, overflow: 'linebreak' },
      didParseCell: (d) => {
        if (d.section === 'body' && d.column.index === 0) {
          const color = CHART_COLORS[d.row.index % CHART_COLORS.length];
          d.cell.styles.fillColor = this.hexToRgb(color);
          d.cell.styles.textColor = [255, 255, 255];
          d.cell.styles.fontStyle = 'bold';
        }
      },
    });
  }

  private buildAccounts(
    doc: jsPDF,
    accounts: PdfAccount[],
    histBal: Record<string, number>,
    PW: number
  ): void {
    this.buildHeader(doc, 'Estado de Cuentas', PW);
    let y = 38;

    const renderCardRow = (accts: PdfAccount[], startY: number): number => {
      const n = Math.min(accts.length, 3);
      if (n === 0) return startY;
      const cW = (PW - 32 - 8 * (n - 1)) / n;
      accts.slice(0, 3).forEach((a, i) => {
        const cx = 16 + i * (cW + 8);
        const bal = histBal[a.id] ?? parseFloat(String(a.balance));
        const clr = ACCOUNT_TYPE_COLOR[a.type] ?? C.blue;

        doc.setFillColor(...C.bgGray);
        doc.roundedRect(cx, startY, cW, 32, 3, 3, 'F');
        doc.setDrawColor(...C.border); doc.setLineWidth(0.2);
        doc.roundedRect(cx, startY, cW, 32, 3, 3, 'S');
        doc.setFillColor(...clr);
        doc.roundedRect(cx, startY, 3, 32, 1.5, 1.5, 'F');
        doc.setTextColor(...C.slate); doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
        doc.text(a.name, cx + cW / 2, startY + 14, { align: 'center', maxWidth: cW - 6 });
        doc.setTextColor(...clr); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
        doc.text(this.fmt(bal), cx + cW / 2, startY + 24, { align: 'center' });
        doc.setTextColor(...C.muted); doc.setFontSize(5.5); doc.setFont('helvetica', 'normal');
        doc.text((ACCOUNT_TYPE_LABEL[a.type] ?? a.type).toUpperCase(), cx + cW / 2, startY + 30, { align: 'center' });
      });
      return startY + 40;
    };

    y = renderCardRow(accounts.slice(0, 3), y);
    if (accounts.length > 3) y = renderCardRow(accounts.slice(3, 6), y);
    y += 4;

    const total = accounts.reduce((s, a) => s + (histBal[a.id] ?? parseFloat(String(a.balance))), 0);
    autoTable(doc, {
      startY: y,
      head: [['Cuenta', 'Tipo', 'Balance', '% del total']],
      body: accounts.map(a => {
        const bal = histBal[a.id] ?? parseFloat(String(a.balance));
        return [a.name, ACCOUNT_TYPE_LABEL[a.type] ?? a.type, this.fmt(bal), `${total ? Math.round((bal / total) * 100) : 0}%`];
      }),
      foot: [['TOTAL CONSOLIDADO', '', this.fmt(total), '100%']],
      headStyles: { fillColor: C.dark, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      footStyles: { fillColor: C.bgNeutral, textColor: C.dark, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { textColor: [51, 65, 85] as [number, number, number], fontSize: 9 },
      alternateRowStyles: { fillColor: C.bgNeutral },
      columnStyles: {
        2: { halign: 'right', fontStyle: 'bold' },
        3: { halign: 'center' },
      },
      margin: { left: 16, right: 16, bottom: 15 },
      styles: { cellPadding: 4 },
    });
  }

  private buildBudgets(
    doc: jsPDF,
    budgets: PdfBudget[],
    categories: PdfCategory[],
    txs: PdfTransaction[],
    PW: number,
    period?: { from: string; to: string }
  ): void {
    this.buildHeader(doc, 'Presupuestos', PW);
    const refDate = period ? new Date(period.to + 'T00:00:00') : new Date();

    const rows = budgets.map(b => {
      const catName = categories.find(c => c.id === b.categoryId)?.name ?? 'Sin nombre';
      const budget = parseFloat(String(b.amount));
      const spent = txs.filter(t =>
        t.type === 'EXPENSE' &&
        t.categoryId === b.categoryId &&
        new Date(t.date).getMonth() === refDate.getMonth() &&
        new Date(t.date).getFullYear() === refDate.getFullYear()
      ).reduce((s, t) => s + parseFloat(String(t.amount)), 0);
      const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
      const avail = budget - spent;
      const st = pct >= 100 ? 'Excedido' : pct >= 80 ? 'Alerta' : 'OK';
      return [catName, this.fmt(budget), this.fmt(spent), this.fmt(avail), pct, st];
    });

    autoTable(doc, {
      startY: 38,
      head: [['Categoria', 'Presupuesto', 'Gastado', 'Disponible', 'Progreso', 'Estado']],
      body: rows,
      headStyles: { fillColor: C.purple, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { textColor: [51, 65, 85] as [number, number, number], fontSize: 8 },
      alternateRowStyles: { fillColor: C.bgNeutral },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right', fontStyle: 'bold' },
        3: { halign: 'right' },
        4: { halign: 'center', cellWidth: 32 },
        5: { halign: 'center', fontStyle: 'bold', cellWidth: 22 },
      },
      margin: { left: 16, right: 16, bottom: 15 },
      styles: { cellPadding: 3.5, minCellHeight: 12 },
      didParseCell: (d) => {
        if (d.column.index === 4 && d.section === 'body') {
          d.cell.text = [];
        }
        if (d.column.index === 5 && d.section === 'body') {
          const v = String(d.cell.raw);
          d.cell.styles.textColor = v === 'Excedido' ? C.red : v === 'Alerta' ? C.orange : C.green;
        }
      },
      didDrawCell: (d) => {
        if (d.column.index !== 4 || d.section !== 'body') return;
        const pct = Number(rows[d.row.index][4]) / 100;
        const { x, y: cy, width, height } = d.cell;
        const bH = 4;
        const bW = width - 8;
        const bX = x + 4;
        const bY = cy + (height / 2) - 5;

        d.doc.setFillColor(...C.border);
        d.doc.roundedRect(bX, bY, bW, bH, 2, 2, 'F');

        const fillClr = pct >= 1 ? C.red : pct >= 0.8 ? C.orange : C.green;
        d.doc.setFillColor(...fillClr);
        const fw = Math.min(bW, bW * pct);
        if (fw > 0) d.doc.roundedRect(bX, bY, fw, bH, 2, 2, 'F');

        d.doc.setTextColor(51, 65, 85);
        d.doc.setFontSize(6.5); d.doc.setFont('helvetica', 'bold');
        d.doc.text(`${Math.round(pct * 100)}%`, x + width / 2, bY + bH + 4.5, { align: 'center' });
      },
    });
  }

  private buildGoals(doc: jsPDF, goals: PdfGoal[], PW: number): void {
    this.buildHeader(doc, 'Metas Financieras', PW);

    const rows = goals.map(g => {
      const target = parseFloat(String(g.targetAmount));
      const current = parseFloat(String(g.currentAmount));
      const pct = target > 0 ? Math.round((current / target) * 100) : 0;
      const dl = g.deadline ? this.fmtDate(g.deadline.substring(0, 10)) : 'Sin fecha';
      return [g.name, this.fmt(target), this.fmt(current), pct, dl, g.status];
    });

    autoTable(doc, {
      startY: 38,
      head: [['Meta', 'Objetivo', 'Ahorrado', 'Progreso', 'Vence', 'Estado']],
      body: rows,
      headStyles: { fillColor: C.green, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { textColor: [51, 65, 85] as [number, number, number], fontSize: 8 },
      alternateRowStyles: { fillColor: C.bgNeutral },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right', fontStyle: 'bold' },
        3: { halign: 'center', cellWidth: 32 },
        4: { halign: 'center' },
        5: { halign: 'center', fontStyle: 'bold' },
      },
      margin: { left: 16, right: 16, bottom: 15 },
      styles: { cellPadding: 3.5, minCellHeight: 12 },
      didParseCell: (d) => {
        if (d.column.index === 3 && d.section === 'body') {
          d.cell.text = [];
        }
        if (d.column.index === 5 && d.section === 'body') {
          const v = String(d.cell.raw);
          d.cell.styles.textColor = v === 'COMPLETED' ? C.green : v === 'ACTIVE' ? C.blue : C.muted;
        }
      },
      didDrawCell: (d) => {
        if (d.column.index !== 3 || d.section !== 'body') return;
        const pct = Number(rows[d.row.index][3]) / 100;
        const { x, y: cy, width, height } = d.cell;
        const bH = 4;
        const bW = width - 8;
        const bX = x + 4;
        const bY = cy + (height / 2) - 5;

        d.doc.setFillColor(...C.border);
        d.doc.roundedRect(bX, bY, bW, bH, 2, 2, 'F');
        d.doc.setFillColor(...C.green);
        const fw = Math.min(bW, bW * pct);
        if (fw > 0) d.doc.roundedRect(bX, bY, fw, bH, 2, 2, 'F');

        d.doc.setTextColor(51, 65, 85);
        d.doc.setFontSize(6.5); d.doc.setFont('helvetica', 'bold');
        d.doc.text(`${Math.round(pct * 100)}%`, x + width / 2, bY + bH + 4.5, { align: 'center' });
      },
    });
  }

  private buildTransfers(
    doc: jsPDF,
    transfers: PdfTransferGroup[],
    accounts: PdfAccount[],
    PW: number
  ): void {
    this.buildHeader(doc, 'Transferencias', PW);

    autoTable(doc, {
      startY: 38,
      head: [['#', 'Fecha', 'Origen', 'Destino', 'Monto', 'Descripcion']],
      body: transfers.map((tf, i) => {
        const from = accounts.find(a => a.id === tf.fromAccountId)?.name ?? '?';
        const to = accounts.find(a => a.id === tf.toAccountId)?.name ?? '?';
        return [String(i + 1), this.fmtDate(tf.date.substring(0, 10)), from, to, this.fmt(tf.amount), tf.description ?? '-'];
      }),
      headStyles: { fillColor: C.dark, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { textColor: [51, 65, 85] as [number, number, number], fontSize: 8 },
      alternateRowStyles: { fillColor: C.bgNeutral },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        4: { halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 16, right: 16, bottom: 15 },
      styles: { cellPadding: 3.5 },
    });
  }

  private buildTransactionDetail(
    doc: jsPDF,
    txs: PdfTransaction[],
    categories: PdfCategory[],
    accounts: PdfAccount[],
    PW: number
  ): void {
    this.buildHeader(doc, 'Detalle de Transacciones', PW);

    autoTable(doc, {
      startY: 38,
      showHead: 'everyPage',
      head: [['Fecha', 'Tipo', 'Categoria', 'Cuenta', 'Monto', 'Descripcion']],
      body: txs.map(tx => {
        const catName = categories.find(c => c.id === tx.categoryId)?.name ?? 'Sin categoria';
        const accName = accounts.find(a => a.id === tx.accountId)?.name ?? '?';
        const typeLabel = tx.type === 'INCOME' ? 'Ingreso' : 'Gasto';
        const sign = tx.type === 'INCOME' ? '+' : '-';
        return [
          this.fmtDate(tx.date.substring(0, 10)),
          typeLabel,
          catName,
          accName,
          `${sign}$${parseFloat(String(tx.amount)).toFixed(2)}`,
          tx.description ?? '-',
        ];
      }),
      headStyles: { fillColor: C.dark, textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { textColor: [51, 65, 85] as [number, number, number], fontSize: 7.5 },
      alternateRowStyles: { fillColor: C.bgGray },
      columnStyles: {
        1: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 12, right: 12, bottom: 15 },
      styles: { cellPadding: 2.5, overflow: 'linebreak' },
      didParseCell: (d) => {
        if (d.section !== 'body') return;
        const type = (d.row.raw as string[])?.[1] ?? '';
        if (type === 'Ingreso') {
          d.cell.styles.fillColor = [240, 253, 244] as [number, number, number];
          if (d.column.index === 4) d.cell.styles.textColor = C.green;
        } else if (type === 'Gasto') {
          d.cell.styles.fillColor = [254, 242, 242] as [number, number, number];
          if (d.column.index === 4) d.cell.styles.textColor = C.red;
        }
      },
    });
  }

  private async loadLogo(): Promise<string | null> {
    if (this.logoDataUrl) return this.logoDataUrl;
    try {
      const logoPath = path.join(__dirname, 'assets', 'logo-oficial.png');
      const buf = fs.readFileSync(logoPath);
      this.logoDataUrl = `data:image/png;base64,${buf.toString('base64')}`;
      return this.logoDataUrl;
    } catch {
      return null;
    }
  }

  private fmt(n: number): string {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 2,
    }).format(n);
  }

  private fmtDate(d: string): string {
    return new Date(d + 'T12:00:00').toLocaleDateString('es-EC', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  private daysBetween(from: string, to: string): number {
    return Math.round(
      (new Date(to + 'T00:00:00').getTime() - new Date(from + 'T00:00:00').getTime()) / 86_400_000
    ) + 1;
  }

  private healthRgb(status: string): [number, number, number] {
    const map: Record<string, [number, number, number]> = {
      HEALTHY: C.green, WARNING: C.orange, DANGER: [234, 88, 12], CRITICAL: C.red,
    };
    return map[status] ?? C.muted;
  }

  private hexToRgb(hex: string): [number, number, number] {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
  }
}
