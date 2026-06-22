import { Component, output } from '@angular/core';

interface TransactionType {
  label: string;
  desc: string;
  examples: string[];
  iconPath: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  labelColor: string;
}

@Component({
  selector: 'app-step-transactions',
  standalone: true,
  templateUrl: './step-transactions.component.html',
})
export class StepTransactionsComponent {
  next = output<void>();

  types: TransactionType[] = [
    {
      label: 'Ingreso',
      desc: 'Dinero que entra a una cuenta. Aumenta tu balance.',
      examples: ['Salario mensual', 'Pagos recibidos', 'Intereses bancarios'],
      iconPath: 'M7 11l5-5m0 0l5 5m-5-5v12',
      borderColor: '#065f46',
      iconBg: 'rgba(16,185,129,0.12)',
      iconColor: '#34d399',
      labelColor: '#34d399',
    },
    {
      label: 'Gasto',
      desc: 'Dinero que sale de una cuenta. Disminuye tu balance.',
      examples: ['Supermercado', 'Servicios basicos', 'Suscripciones'],
      iconPath: 'M17 13l-5 5m0 0l-5-5m5 5V6',
      borderColor: '#7f1d1d',
      iconBg: 'rgba(239,68,68,0.12)',
      iconColor: '#f87171',
      labelColor: '#f87171',
    },
    {
      label: 'Transferencia',
      desc: 'Mover dinero entre tus cuentas. No afecta ingresos ni gastos.',
      examples: ['Banco a efectivo', 'Ahorros a corriente', 'Billetera a banco'],
      iconPath: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
      borderColor: '#1e3a5f',
      iconBg: 'rgba(99,102,241,0.12)',
      iconColor: '#818cf8',
      labelColor: '#818cf8',
    },
  ];
}
