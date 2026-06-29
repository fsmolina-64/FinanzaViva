import { Component, input, output, signal, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-numpad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './numpad.component.html',
})
export class NumpadComponent implements OnInit {
  amountType = input<'EXPENSE' | 'INCOME' | 'TRANSFER' | 'BALANCE'>('EXPENSE');
  amountChange = output<number>();

  integerStr = '0';
  decimalStr: string | null = null;
  pressedKey = signal<string | null>(null);
  private pressedTimer: ReturnType<typeof setTimeout> | null = null;

  readonly numpadKeys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '<'];

  get inDecimalMode(): boolean { return this.decimalStr !== null; }

  ngOnInit(): void {
    this.amountChange.emit(0);
  }

  setFromNumber(amount: number): void {
    const whole = Math.floor(amount);
    const cents = Math.round((amount - whole) * 100);
    this.integerStr = String(whole);
    this.decimalStr = cents > 0 ? String(cents).padStart(2, '0') : null;
    this.amountChange.emit(this.getAmount());
  }

  private visualPress(key: string): void {
    if (this.pressedTimer) clearTimeout(this.pressedTimer);
    this.pressedKey.set(key);
    this.pressedTimer = setTimeout(() => this.pressedKey.set(null), 200);
  }

  pad(key: string): void {
    if (key === '<') {
      if (this.inDecimalMode) {
        if (this.decimalStr!.length === 0) {
          this.decimalStr = null;
        } else {
          this.decimalStr = this.decimalStr!.slice(0, -1);
        }
      } else {
        this.integerStr = this.integerStr.length <= 1 ? '0' : this.integerStr.slice(0, -1);
      }
      this.amountChange.emit(this.getAmount());
      return;
    }

    if (key === '.') {
      if (!this.inDecimalMode) this.decimalStr = '';
      return;
    }

    if (!/^\d$/.test(key)) return;

    if (this.inDecimalMode) {
      if (this.decimalStr!.length >= 2) return;
      this.decimalStr = this.decimalStr + key;
    } else {
      if (this.integerStr === '0') {
        this.integerStr = key;
      } else {
        const next = this.integerStr + key;
        if (parseInt(next) > 9_999_999) return;
        this.integerStr = next;
      }
    }
    this.amountChange.emit(this.getAmount());
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') { return; }

    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault(); this.visualPress('<'); this.pad('<'); return;
    }
    if (e.key === '.' || e.key === ',' || e.code === 'NumpadDecimal') {
      e.preventDefault(); this.visualPress('.'); this.pad('.'); return;
    }

    const map: Record<string, string> = {
      '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
      'Numpad0': '0', 'Numpad1': '1', 'Numpad2': '2', 'Numpad3': '3', 'Numpad4': '4',
      'Numpad5': '5', 'Numpad6': '6', 'Numpad7': '7', 'Numpad8': '8', 'Numpad9': '9',
    };
    const mapped = map[e.key] ?? map[e.code];
    if (mapped) { e.preventDefault(); this.visualPress(mapped); this.pad(mapped); }
  }

  getAmount(): number {
    const integer = parseInt(this.integerStr) || 0;
    if (this.decimalStr === null || this.decimalStr === '') return integer;
    return integer + parseInt(this.decimalStr.padEnd(2, '0')) / 100;
  }

  getIntegerDisplay(): string {
    return parseInt(this.integerStr).toLocaleString('en-US');
  }

  getDecimalDisplay(): string {
    if (this.decimalStr === null) return '__';
    const filled = this.decimalStr;
    const placeholder = '__'.slice(filled.length);
    return filled + placeholder;
  }

  formatAmount(): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(this.getAmount());
  }

  amountColorClass(): string {
    switch (this.amountType()) {
      case 'EXPENSE': return 'text-red-400';
      case 'INCOME': return 'text-emerald-400';
      case 'TRANSFER': return 'text-blue-400';
      default: return 'text-purple-400';
    }
  }

  amountCardClass(): string {
    switch (this.amountType()) {
      case 'EXPENSE': return 'border-red-500/15 from-red-500/5';
      case 'INCOME': return 'border-emerald-500/15 from-emerald-500/5';
      case 'TRANSFER': return 'border-blue-500/15 from-blue-500/5';
      default: return 'border-purple-500/15 from-purple-500/5';
    }
  }
}
