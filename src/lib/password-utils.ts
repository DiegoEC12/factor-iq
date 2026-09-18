/**
 * Utilidades para generación y validación de contraseñas seguras
 */

export interface PasswordOptions {
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
}

const UPPERCASE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Excluidos caracteres confusos como O, I
const LOWERCASE_CHARS = "abcdefghijkmnopqrstuvwxyz"; // Excluido l
const NUMBER_CHARS = "23456789"; // Excluidos 0, 1
const SYMBOL_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

/**
 * Genera una contraseña criptográficamente aleatoria y segura
 */
export function generateSecurePassword(options: PasswordOptions = {}): string {
  const {
    length = 16,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
  } = options;

  let validChars = "";
  const guaranteedChars: string[] = [];

  if (includeUppercase) {
    validChars += UPPERCASE_CHARS;
    guaranteedChars.push(getRandomChar(UPPERCASE_CHARS));
  }
  if (includeLowercase) {
    validChars += LOWERCASE_CHARS;
    guaranteedChars.push(getRandomChar(LOWERCASE_CHARS));
  }
  if (includeNumbers) {
    validChars += NUMBER_CHARS;
    guaranteedChars.push(getRandomChar(NUMBER_CHARS));
  }
  if (includeSymbols) {
    validChars += SYMBOL_CHARS;
    guaranteedChars.push(getRandomChar(SYMBOL_CHARS));
  }

  if (validChars.length === 0) {
    validChars = LOWERCASE_CHARS + NUMBER_CHARS;
  }

  const remainingLength = Math.max(0, length - guaranteedChars.length);
  const randomChars: string[] = [];

  for (let i = 0; i < remainingLength; i++) {
    randomChars.push(getRandomChar(validChars));
  }

  // Mezclar los caracteres garantizados con los aleatorios usando Fisher-Yates
  const passwordArray = [...guaranteedChars, ...randomChars];
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = passwordArray[i]!;
    passwordArray[i] = passwordArray[j]!;
    passwordArray[j] = temp;
  }

  return passwordArray.join("");
}

function getRandomChar(charSet: string): string {
  const randomIndex = Math.floor(Math.random() * charSet.length);
  return charSet[randomIndex]!;
}

/**
 * Evalúa la fortaleza de una contraseña devolviendo un nivel y porcentaje
 */
export function evaluatePasswordStrength(password: string): {
  score: number; // 0 - 4
  label: "Muy débil" | "Débil" | "Aceptable" | "Fuerte" | "Muy fuerte";
  color: string;
} {
  if (!password) {
    return { score: 0, label: "Muy débil", color: "bg-red-500" };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 14) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) {
    return { score: 1, label: "Débil", color: "bg-red-500" };
  }
  if (score === 2) {
    return { score: 2, label: "Aceptable", color: "bg-amber-500" };
  }
  if (score === 3) {
    return { score: 3, label: "Fuerte", color: "bg-emerald-500" };
  }
  return { score: 4, label: "Muy fuerte", color: "bg-teal-400" };
}
