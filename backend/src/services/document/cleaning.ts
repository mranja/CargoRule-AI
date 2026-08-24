function removeControlCharacters(text: string): string {
  return text
    .replace(/^\uFEFF/, "")
    .replace(/\0/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
}

export function cleanText(text: string): string {
  const normalized = removeControlCharacters(text);

  return normalized
    .replace(/\r\n?/g, "\n")
    .replace(/[\t ]+/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export interface CleanedDocument {
  text: string;
  originalLength: number;
  cleanedLength: number;
}

export function cleanDocument(text: string): CleanedDocument {
  const cleaned = cleanText(text);
  return {
    text: cleaned,
    originalLength: text.length,
    cleanedLength: cleaned.length,
  };
}
