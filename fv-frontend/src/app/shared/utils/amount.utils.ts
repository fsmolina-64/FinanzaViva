const DECIMAL_SEPARATOR = '.';

export function filterAmountKey(e: KeyboardEvent): void {
  const allowed = [
    'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Home', 'End',
  ];
  if (allowed.includes(e.key)) return;
  if (e.ctrlKey || e.metaKey) return;
  if (e.key === ',' || e.key === 'Comma') {
    e.preventDefault();
    const input = e.target as HTMLInputElement;
    if (!input.value.includes('.')) {
      insertAtCursor(e.target as HTMLInputElement, '.');
    }
    return;
  }
  const input = e.target as HTMLInputElement;
  if (e.key === DECIMAL_SEPARATOR) {
    if (input.value.includes('.')) e.preventDefault();
    return;
  }
  if (e.key >= '0' && e.key <= '9') {
    const dotIdx = input.value.indexOf('.');
    const selStart = input.selectionStart ?? 0;
    const selEnd = input.selectionEnd ?? 0;
    const hasSel = selStart !== selEnd;
    if (dotIdx < 0) {
      const newLen = hasSel ? input.value.length - (selEnd - selStart) + 1 : input.value.length + 1;
      if (newLen > 9) { e.preventDefault(); }
    } else if (selStart > dotIdx) {
      const dec = input.value.substring(dotIdx + 1);
      const newLen = hasSel ? dec.length - (selEnd - selStart) + 1 : dec.length + 1;
      if (newLen > 2) { e.preventDefault(); }
    }
    return;
  }
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
  if (parts.length > 2) str = parts[0] + '.' + parts.slice(1).join('').replace(/\./g, '');
  if (parts[0].length > 9) parts[0] = parts[0].substring(0, 9);
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
  const intPart = str.split('.')[0];
  if (intPart.length > 1 && intPart.startsWith('0')) return 'No se permiten ceros a la izquierda';
  return null;
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}