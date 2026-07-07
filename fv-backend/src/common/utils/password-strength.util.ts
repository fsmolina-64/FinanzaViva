const COMMON_PASSWORDS = new Set([
  '12345678', 'password', 'contraseña', 'qwerty123', '11111111',
  'password123', 'abc12345', '123456789', 'admin123', 'letmein',
]);

export function getPasswordStrengthScore(password: string): number {
  if (!password) return 0;

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  const variety = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (variety >= 3) score++;
  if (!/(.)\1{2,}/.test(password)) score++;
  if (COMMON_PASSWORDS.has(password.toLowerCase())) score = 0;

  return Math.min(score, 4);
}
