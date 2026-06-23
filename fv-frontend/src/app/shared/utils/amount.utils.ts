const DECIMAL_SEPARATOR = '.';

export function filterAmountKey(e: KeyboardEvent): void {
  const allowed = [
    'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Home', 'End',
  ];
  if (allowed.includes(e.key)) return;
  if (e.ctrlKey || e.metaKey) return;
  if (e.key === ',' || e.key === 'Comma') { e.preventDefault(); insertAtCursor(e.target as HTMLInputElement, '.'); return; }
  if (e.key === DECIMAL_SEPARATOR) return;
  if (e.key >= '0' && e.key <= '9') return;
  e.preventDefault();
}

function insertAtCursor(input: HTMLInputElement, text: string): void {
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  const before = input.value.substring(0, start);
  const after = input.value.substring(end);
  input.value = before + text + after;
  const pos = start + text.length;
  input.setSelectionRange(pos, pos);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

export function sanitizeNumberInput(val: any): string {
  if (val == null || val === '') return '';
  let str = String(val).replace(/,/g, '.');
  str = str.replace(/[^0-9.]/g, '');
  const parts = str.split('.');
  if (parts.length > 2) str = parts[0] + '.' + parts.slice(1).join('');
  if (parts[0].length > 1 && parts[0].startsWith('0')) parts[0] = parts[0].replace(/^0+/, '');
  if (parts[0] === '' && parts.length > 1) parts[0] = '0';
  str = parts[0] + (parts.length > 1 ? '.' + parts[1] : '');
  if (parts.length > 1 && parts[1].length > 2) str = parts[0] + '.' + parts[1].substring(0, 2);
  return str;
}

export function parseAmount(value: any): number {
  if (value == null || value === '') return 0;
  const str = String(value).replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

export function validateAmount(value: any, options?: { allowZero?: boolean }): string | null {
  const num = parseAmount(value);
  if (isNaN(num)) return 'El monto no es válido';
  if (options?.allowZero) {
    if (num < 0) return 'El monto no puede ser negativo';
  } else {
    if (num <= 0) return 'El monto debe ser mayor a 0';
  }
  const str = String(value).replace(/,/g, '.');
  if (str.includes('.') && str.split('.')[1]?.length > 2) return 'Máximo 2 decimales';
  if (/^0\d+/.test(str.replace(/\./g, ''))) return 'No se permiten ceros a la izquierda';
  return null;
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}