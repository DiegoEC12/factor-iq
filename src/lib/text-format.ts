export function textAsPoints(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const explicit = normalized
    .split(/\n+|\s*\*\s*|\s*\|\s*/)
    .map((item) => item.replace(/^\s*\d+[.)-]\s*/, "").trim())
    .filter(Boolean);
  if (explicit.length > 1) return explicit;
  return normalized
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿])/)
    .map((item) => item.trim())
    .filter(Boolean);
}
