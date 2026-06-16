import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Transaction, Account, Budget, Goal,
  Category, FinanceSummary, BudgetHealth
} from '../../core/models/finance.model';

export interface PdfReportData {
  userName:     string;
  transactions: Transaction[];
  accounts:     Account[];
  budgets:      Budget[];
  goals:        Goal[];
  categories:   Category[];
  summary:      FinanceSummary;
  health:       BudgetHealth;
  accountInceptionDates?: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class PdfExportService {

  private readonly CHART_COLORS = [
    '#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6',
    '#EC4899','#06B6D4','#84CC16','#F97316','#6366F1',
    '#14B8A6','#A855F7'
  ];

  async generateReport(data: PdfReportData, period: { from: string; to: string }): Promise<void> {
    const doc = new jsPDF('p', 'mm', 'a4');
    const PW  = doc.internal.pageSize.getWidth();
    const PH  = doc.internal.pageSize.getHeight();

    const inception = data.accountInceptionDates ?? {};

    const activeAccounts = data.accounts.filter(a => {
      const d = inception[a.id];
      return !d || d <= period.to;
    });

    const txs = data.transactions.filter(t => {
      const d = t.date.substring(0, 10);
      if (d < period.from || d > period.to) return false;
      const accIncept = inception[t.accountId];
      return !accIncept || d >= accIncept;
    });

    const income   = txs.filter(t => t.type === 'INCOME') .reduce((s, t) => s + parseFloat(String(t.amount)), 0);
    const expenses = txs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + parseFloat(String(t.amount)), 0);
    const savings  = income - expenses;
    const savingsRate = income > 0 ? Math.max(0, Math.round((savings / income) * 100)) : 0;
    const totalBal = activeAccounts.reduce((s, a) => s + parseFloat(String(a.balance)), 0);

    const incCat = this.groupByCategory(txs.filter(t => t.type === 'INCOME'  ), data.categories);
    const expCat = this.groupByCategory(txs.filter(t => t.type === 'EXPENSE' ), data.categories);

    const incChart = incCat.length > 0 ? this.drawDonutChart(incCat, '#10B981') : null;
    const expChart = expCat.length > 0 ? this.drawDonutChart(expCat, '#EF4444') : null;

    this.buildCover(doc, data.userName, period, PW, PH);

    doc.addPage();
    this.buildSummary(doc, { income, expenses, savings, savingsRate, totalBal, txCount: txs.length }, data.health, PW);

    doc.addPage();
    this.buildCategoryPage(doc, 'Analisis de Gastos', expCat, expChart, expenses, '#EF4444', [220,38,38], [254,242,242], PW);

    doc.addPage();
    this.buildCategoryPage(doc, 'Analisis de Ingresos', incCat, incChart, income, '#10B981', [5,150,105], [240,253,244], PW);

    doc.addPage();
    this.buildAccounts(doc, activeAccounts, PW);

    if (data.budgets.length > 0) {
      doc.addPage();
      this.buildBudgets(doc, data.budgets, data.categories, txs, PW);
    }

    if (data.goals.length > 0) {
      doc.addPage();
      this.buildGoals(doc, data.goals, PW);
    }

    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      this.buildFooter(doc, i, totalPages, period, PW, PH);
    }

    const fn = `FinanzaViva_${period.from}_${period.to}.pdf`;
    doc.save(fn);
  }

  private buildCover(doc: jsPDF, userName: string, period: { from: string; to: string }, PW: number, PH: number): void {
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, PW, 85, 'F');

    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.4);
    doc.circle(PW - 18, 16, 32, 'S');
    doc.circle(PW - 6,  58, 22, 'S');
    doc.circle(12, 72, 18, 'S');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(34);
    doc.setFont('helvetica', 'bold');
    doc.text('FinanzaViva', PW / 2, 36, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Reporte Financiero Personal', PW / 2, 50, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(186, 210, 255);
    doc.text('Educacion financiera gamificada', PW / 2, 62, { align: 'center' });

    const cardY = 98;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(20, cardY, PW - 40, 48, 5, 5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(20, cardY, PW - 40, 48, 5, 5, 'S');

    doc.setFillColor(37, 99, 235);
    doc.rect(20, cardY, 3, 48, 'F');

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('PERIODO ANALIZADO', PW / 2, cardY + 11, { align: 'center' });

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `${this.fmtDate(period.from)}  al  ${this.fmtDate(period.to)}`,
      PW / 2, cardY + 24, { align: 'center' }
    );

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`${this.daysBetween(period.from, period.to)} dias analizados`, PW / 2, cardY + 35, { align: 'center' });

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Preparado para: ${userName || 'Usuario'}`, PW / 2, cardY + 64, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generado el ${this.fmtDate(new Date().toISOString().split('T')[0])}`, PW / 2, cardY + 74, { align: 'center' });

    const idxY = cardY + 90;
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(20, idxY, PW - 40, 80, 5, 5, 'F');
    doc.setDrawColor(191, 219, 254);
    doc.setLineWidth(0.3);
    doc.roundedRect(20, idxY, PW - 40, 80, 5, 5, 'S');

    doc.setTextColor(37, 99, 235);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTENIDO DEL REPORTE', 30, idxY + 12);

    const items = [
      'Resumen ejecutivo', 'Analisis de gastos',
      'Analisis de ingresos', 'Estado de cuentas',
      'Presupuestos', 'Metas financieras'
    ];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    items.forEach((item, i) => {
      const col = i < 3 ? 30        : PW / 2 + 5;
      const row = idxY + 22 + (i % 3) * 18;
      doc.setFillColor(37, 99, 235);
      doc.circle(col + 2.5, row - 2, 1.5, 'F');
      doc.setTextColor(51, 65, 85);
      doc.text(`${i + 1}. ${item}`, col + 7, row);
    });

    doc.setFillColor(37, 99, 235);
    doc.rect(0, PH - 16, PW, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('FinanzaViva  |  Tu camino hacia la libertad financiera', PW / 2, PH - 6, { align: 'center' });
  }

  private buildSummary(
    doc: jsPDF,
    kpis: { income: number; expenses: number; savings: number; savingsRate: number; totalBal: number; txCount: number },
    health: BudgetHealth,
    PW: number
  ): void {
    this.buildHeader(doc, 'Resumen Ejecutivo', PW);
    let y = 42;

    const W2 = (PW - 48) / 2;
    const cards = [
      { label: 'Balance Total',   value: this.fmt(kpis.totalBal),  sub: 'Todas las cuentas',  rgb: [37,99,235] as [number,number,number] },
      { label: 'Ingresos',        value: this.fmt(kpis.income),    sub: 'Total percibido',     rgb: [5,150,105] as [number,number,number] },
      { label: 'Gastos',          value: this.fmt(kpis.expenses),  sub: 'Total gastado',       rgb: [220,38,38] as [number,number,number] },
      { label: 'Ahorro Neto',     value: this.fmt(kpis.savings),   sub: `Tasa: ${kpis.savingsRate}%`, rgb: kpis.savings >= 0 ? [37,99,235] as [number,number,number] : [234,88,12] as [number,number,number] },
    ];

    cards.forEach((c, i) => {
      const x   = 20 + (i % 2) * (W2 + 8);
      const cy  = y + Math.floor(i / 2) * 42;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(x, cy, W2, 36, 3, 3, 'F');
      doc.setFillColor(...c.rgb);
      doc.roundedRect(x, cy, 3, 36, 1, 1, 'F');
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(7); doc.setFont('helvetica', 'normal');
      doc.text(c.label.toUpperCase(), x + 8, cy + 9);
      doc.setTextColor(...c.rgb);
      doc.setFontSize(15); doc.setFont('helvetica', 'bold');
      doc.text(c.value, x + 8, cy + 22);
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(7); doc.setFont('helvetica', 'normal');
      doc.text(c.sub, x + 8, cy + 31);
    });

    y += 2 * 42 + 6;

    doc.setFillColor(239, 246, 255);
    doc.roundedRect(20, y, PW - 40, 12, 3, 3, 'F');
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text(`${kpis.txCount} transacciones en el periodo`, PW / 2, y + 8, { align: 'center' });
    y += 18;

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('Salud Financiera', 20, y);
    y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(health.message, 20, y);
    y += 6;

    const [hr, hg, hb] = this.healthRgb(health.status);
    const barW = PW - 40;
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(20, y, barW, 7, 3, 3, 'F');
    doc.setFillColor(hr, hg, hb);
    doc.roundedRect(20, y, barW * Math.min(100, health.percentage) / 100, 7, 3, 3, 'F');
    y += 11;
    doc.setFontSize(8); doc.setTextColor(hr, hg, hb); doc.setFont('helvetica', 'bold');
    doc.text(`${health.percentage}% usado  —  ${health.status}`, PW - 20, y, { align: 'right' });
    y += 14;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(20, y, PW - 40, 32, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3);
    doc.roundedRect(20, y, PW - 40, 32, 3, 3, 'S');

    const rClr: [number,number,number] = kpis.savingsRate >= 20 ? [5,150,105] : kpis.savingsRate >= 10 ? [245,158,11] : [220,38,38];
    const rLbl = kpis.savingsRate >= 20 ? 'Excelente' : kpis.savingsRate >= 10 ? 'Aceptable' : kpis.savingsRate > 0 ? 'Mejorable' : 'Deficit';
    const tip  = kpis.savingsRate >= 20 ? 'Manten este ritmo de ahorro.'
               : kpis.savingsRate >= 10 ? 'Apunta al 20% de ahorro mensual.'
               : 'Revisa tus gastos para mejorar el ahorro.';

    doc.setTextColor(148, 163, 184); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
    doc.text('TASA DE AHORRO', 30, y + 9);
    doc.setTextColor(...rClr);
    doc.setFontSize(20); doc.setFont('helvetica', 'bold');
    doc.text(`${kpis.savingsRate}%`, 30, y + 24);
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text(rLbl, 58, y + 24);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(tip, 30, y + 34);
  }

  private buildCategoryPage(
    doc: jsPDF,
    title: string,
    data: { name: string; amount: number; count: number }[],
    chart: string | null,
    total: number,
    accentHex: string,
    rgb: [number, number, number],
    altRow: [number, number, number],
    PW: number
  ): void {
    this.buildHeader(doc, title, PW);
    let y = 42;

    if (data.length === 0) {
      doc.setTextColor(148, 163, 184); doc.setFontSize(10);
      doc.text('Sin registros en el periodo.', PW / 2, y + 30, { align: 'center' });
      return;
    }

    doc.setFillColor(...altRow);
    doc.roundedRect(20, y, PW - 40, 13, 3, 3, 'F');
    doc.setTextColor(...rgb); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${this.fmt(total)}`, PW / 2, y + 9, { align: 'center' });
    y += 18;

    if (chart) {
      doc.addImage(chart, 'PNG', 20, y, PW - 40, 82);
      y += 88;
    }

    autoTable(doc, {
      startY: y,
      head: [['#', 'Categoria', 'Monto', '% del total', 'Transacciones']],
      body: data.map((d, i) => [
        String(i + 1),
        d.name,
        this.fmt(d.amount),
        `${Math.round((d.amount / total) * 100)}%`,
        String(d.count)
      ]),
      foot: [['', 'TOTAL', this.fmt(total), '100%', String(data.reduce((s,d)=>s+d.count,0))]],
      headStyles:     { fillColor: rgb, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      footStyles:     { fillColor: altRow, textColor: rgb, fontStyle: 'bold', fontSize: 8 },
      bodyStyles:     { textColor: [51, 65, 85] as [number,number,number], fontSize: 8 },
      alternateRowStyles: { fillColor: altRow },
      columnStyles: {
        0: { cellWidth: 8,  halign: 'center' },
        2: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
        3: { cellWidth: 22, halign: 'center' },
        4: { cellWidth: 28, halign: 'center' },
      },
      margin: { left: 20, right: 20 },
      styles: { cellPadding: 3, overflow: 'linebreak' },
      didParseCell: (d) => {
        if (d.section === 'body' && d.column.index === 0) {
          const i = d.row.index;
          const color = this.CHART_COLORS[i % this.CHART_COLORS.length];
          d.cell.styles.fillColor = this.hexToRgb(color);
          d.cell.styles.textColor = [255,255,255];
          d.cell.styles.fontStyle = 'bold';
        }
      }
    });
  }

  private buildAccounts(doc: jsPDF, accounts: Account[], PW: number): void {
    this.buildHeader(doc, 'Estado de Cuentas', PW);
    const total = accounts.reduce((s, a) => s + parseFloat(String(a.balance)), 0);
    const typeMap: Record<string, string> = { CASH: 'Efectivo', BANK: 'Banco', DIGITAL_WALLET: 'Billetera Digital' };

    autoTable(doc, {
      startY: 42,
      head: [['Cuenta', 'Tipo', 'Balance', '% del total']],
      body: accounts.map(a => {
        const bal = parseFloat(String(a.balance));
        return [a.name, typeMap[a.type] ?? a.type, this.fmt(bal), `${total ? Math.round((bal/total)*100) : 0}%`];
      }),
      foot: [['TOTAL CONSOLIDADO', '', this.fmt(total), '100%']],
      headStyles:     { fillColor: [37,99,235], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      footStyles:     { fillColor: [239,246,255], textColor: [37,99,235], fontStyle: 'bold', fontSize: 9 },
      bodyStyles:     { textColor: [51,65,85], fontSize: 9 },
      alternateRowStyles: { fillColor: [239,246,255] },
      columnStyles: {
        2: { halign: 'right', fontStyle: 'bold' },
        3: { halign: 'center' },
      },
      margin: { left: 20, right: 20 },
      styles: { cellPadding: 4 },
    });
  }

  private buildBudgets(doc: jsPDF, budgets: Budget[], categories: Category[], txs: Transaction[], PW: number): void {
    this.buildHeader(doc, 'Presupuestos', PW);
    const now = new Date();

    autoTable(doc, {
      startY: 42,
      head: [['Categoria', 'Presupuesto', 'Gastado', 'Disponible', '%', 'Estado']],
      body: budgets.map(b => {
        const catName = categories.find(c => c.id === b.categoryId)?.name ?? 'Sin nombre';
        const budget  = parseFloat(String(b.amount));
        const spent   = txs.filter(t =>
          t.type === 'EXPENSE' && t.categoryId === b.categoryId &&
          new Date(t.date).getMonth() === now.getMonth() &&
          new Date(t.date).getFullYear() === now.getFullYear()
        ).reduce((s, t) => s + parseFloat(String(t.amount)), 0);
        const pct   = budget > 0 ? Math.round((spent / budget) * 100) : 0;
        const avail = budget - spent;
        const st    = pct >= 100 ? 'Excedido' : pct >= 80 ? 'Alerta' : 'OK';
        return [catName, this.fmt(budget), this.fmt(spent), this.fmt(avail), `${pct}%`, st];
      }),
      headStyles:     { fillColor: [124,58,237], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles:     { textColor: [51,65,85], fontSize: 8 },
      alternateRowStyles: { fillColor: [245,243,255] },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right', fontStyle: 'bold' },
        3: { halign: 'right' },
        4: { halign: 'center' },
        5: { halign: 'center', fontStyle: 'bold' },
      },
      margin: { left: 20, right: 20 },
      styles: { cellPadding: 3 },
      didParseCell: (d) => {
        if (d.column.index === 5 && d.section === 'body') {
          const v = String(d.cell.raw);
          d.cell.styles.textColor = v === 'Excedido' ? [220,38,38] : v === 'Alerta' ? [245,158,11] : [5,150,105];
        }
      }
    });
  }

  private buildGoals(doc: jsPDF, goals: Goal[], PW: number): void {
    this.buildHeader(doc, 'Metas Financieras', PW);

    autoTable(doc, {
      startY: 42,
      head: [['Meta', 'Objetivo', 'Ahorrado', '%', 'Vence', 'Estado']],
      body: goals.map(g => {
        const target  = parseFloat(String(g.targetAmount));
        const current = parseFloat(String(g.currentAmount));
        const pct     = target > 0 ? Math.round((current / target) * 100) : 0;
        const dl      = g.deadline ? this.fmtDate(g.deadline.substring(0,10)) : 'Sin fecha';
        return [g.name, this.fmt(target), this.fmt(current), `${pct}%`, dl, g.status];
      }),
      headStyles:     { fillColor: [16,185,129], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles:     { textColor: [51,65,85], fontSize: 8 },
      alternateRowStyles: { fillColor: [240,253,244] },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right', fontStyle: 'bold' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center', fontStyle: 'bold' },
      },
      margin: { left: 20, right: 20 },
      styles: { cellPadding: 3 },
      didParseCell: (d) => {
        if (d.column.index === 5 && d.section === 'body') {
          const v = String(d.cell.raw);
          d.cell.styles.textColor = v === 'COMPLETED' ? [5,150,105] : v === 'ACTIVE' ? [37,99,235] : [148,163,184];
        }
      }
    });
  }

  private drawDonutChart(
    data: { name: string; amount: number; count: number }[],
    _accent: string
  ): string {
    const W = 960, H = 380;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    const total  = data.reduce((s, d) => s + d.amount, 0);
    const slices = [...data].sort((a, b) => b.amount - a.amount).slice(0, 10);

    const cx = 210, cy = H / 2, outer = 160, inner = 70;
    let angle = -Math.PI / 2;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(cx, cy, outer + 4, 0, Math.PI * 2);
    ctx.fillStyle = '#F1F5F9';
    ctx.fill();
    ctx.restore();

    slices.forEach((slice, i) => {
      const sweep = (slice.amount / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outer, angle, angle + sweep);
      ctx.closePath();
      ctx.fillStyle = this.CHART_COLORS[i % this.CHART_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();

      const pct = (slice.amount / total) * 100;
      if (pct > 5) {
        const mid = angle + sweep / 2;
        const lr  = (outer + inner) / 2;
        const tx  = cx + Math.cos(mid) * lr;
        const ty  = cy + Math.sin(mid) * lr;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round(pct)}%`, tx, ty);
      }
      angle += sweep;
    });

    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 22px Arial';
    ctx.fillText(this.fmtCompact(total), cx, cy - 8);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '13px Arial';
    ctx.fillText('Total', cx, cy + 14);

    let ly = 30;
    const lx = 420;

    slices.forEach((item, i) => {
      const pct   = Math.round((item.amount / total) * 100);
      const color = this.CHART_COLORS[i % this.CHART_COLORS.length];

      ctx.fillStyle = color;
      this.rrectCanvas(ctx, lx, ly, 20, 20, 4);
      ctx.fill();

      const label = item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name;
      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 15px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(label, lx + 28, ly + 14);

      ctx.fillStyle = '#64748B';
      ctx.font = '13px Arial';
      ctx.fillText(`$${item.amount.toFixed(2)}   ${pct}%`, lx + 28, ly + 30);

      ly += 38;
    });

    return canvas.toDataURL('image/png', 1.0);
  }

  private buildHeader(doc: jsPDF, title: string, PW: number): void {
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, PW, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text('FinanzaViva', 8, 11);
    doc.setFont('helvetica', 'normal');
    doc.text(title, PW - 8, 11, { align: 'right' });

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text(title, 20, 32);

    const tw = doc.getTextWidth(title);
    doc.setDrawColor(37, 99, 235); doc.setLineWidth(0.8);
    doc.line(20, 35, 20 + tw, 35);
  }

  private buildFooter(doc: jsPDF, page: number, total: number, period: { from: string; to: string }, PW: number, PH: number): void {
    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3);
    doc.line(20, PH - 12, PW - 20, PH - 12);
    doc.setTextColor(148, 163, 184); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text('FinanzaViva - Reporte Confidencial', 20, PH - 6);
    doc.text(`${this.fmtDate(period.from)} al ${this.fmtDate(period.to)}`, PW / 2, PH - 6, { align: 'center' });
    doc.text(`Pag. ${page} / ${total}`, PW - 20, PH - 6, { align: 'right' });
  }

  private rrectCanvas(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y,     x + w, y + r,     r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x,      y + h, x, y + h - r,    r);
    ctx.lineTo(x,     y + r);
    ctx.arcTo(x,      y,     x + r, y,         r);
    ctx.closePath();
  }

  private groupByCategory(
    txs: Transaction[],
    categories: Category[]
  ): { name: string; amount: number; count: number }[] {
    const map = new Map<string, { name: string; amount: number; count: number }>();
    for (const tx of txs) {
      const name = categories.find(c => c.id === tx.categoryId)?.name ?? 'Sin categoria';
      const prev = map.get(tx.categoryId) ?? { name, amount: 0, count: 0 };
      map.set(tx.categoryId, { name, amount: prev.amount + parseFloat(String(tx.amount)), count: prev.count + 1 });
    }
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }

  private fmt(n: number): string {
    return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
  }

  private fmtCompact(n: number): string {
    return n >= 1000 ? '$' + (n / 1000).toFixed(1) + 'k' : '$' + n.toFixed(0);
  }

  private fmtDate(d: string): string {
    return new Date(d + 'T12:00:00').toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private daysBetween(from: string, to: string): number {
    return Math.round((new Date(to + 'T00:00:00').getTime() - new Date(from + 'T00:00:00').getTime()) / 86400000) + 1;
  }

  private healthRgb(status: string): [number, number, number] {
    const m: Record<string, [number, number, number]> = {
      HEALTHY: [5,150,105], WARNING: [245,158,11], DANGER: [234,88,12], CRITICAL: [220,38,38]
    };
    return m[status] ?? [148,163,184];
  }

  private hexToRgb(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return [r, g, b];
  }
}
