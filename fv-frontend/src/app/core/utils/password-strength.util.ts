export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  suggestions: string[];
}

const COMMON_PASSWORDS = new Set([
  '12345678', 'password', 'contraseña', 'qwerty123', '11111111',
  'password123', 'abc12345', '123456789', 'admin123', 'letmein',
]);

export function getPasswordStrength(password: string): PasswordStrengthResult {
  if (!password) return { score: 0, label: 'Muy débil', suggestions: [] };

  const suggestions: string[] = [];
  let score = 0;

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  const variety = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;

  if (password.length >= 8) score++;
  else suggestions.push('Usa al menos 8 caracteres');

  if (password.length >= 12) score++;

  if (variety >= 3) score++;
  else suggestions.push('Combina mayúsculas, minúsculas, números y símbolos');

  if (!/(.)\1{2,}/.test(password)) score++;
  else suggestions.push('Evita repetir el mismo carácter varias veces');

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    score = 0;
    suggestions.unshift('Esta contraseña es muy común, elige otra');
  }

  const clampedScore = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const labels = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte'];

  return { score: clampedScore, label: labels[clampedScore], suggestions };
}
