import { ChunkingConfig } from "../../config/rag.config";
import { DocumentChunk, DocumentMetadata } from "../../types/document";

export interface ChunkingOptions {
  documentId: string;
  metadata: Omit<DocumentMetadata, "documentName"> & { documentName?: string };
  sizeTokens?: number;
  overlapTokens?: number;
}

const HEADING_PATTERNS = [
  /^#{1,6}\s+.+$/, // Markdown headings (# Heading)
  /^(?:SECTION|ARTICLE|CHAPTER|PART|CLAUSE|POLICY|REGULATION|APPENDIX|SCHEDULE|RULE)\s+[0-9A-Z\.\-_:]*(?:\s*[-:–—]\s*.*)?$/i,
  /^(?:\d+(?:\.\d+)*[\.\)]?\s+[A-Za-z0-9\s\-:–—]{3,})$/, // Numbered headings: 1.1 Requirements
  /^[A-Z][A-Z0-9\s\-:–—]{3,50}$/, // ALL CAPS headings
];

function isLikelyHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 120) return false;
  return HEADING_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function splitOversizedParagraph(paragraph: string, maxChars: number): string[] {
  if (paragraph.length <= maxChars) return [paragraph];

  const sentences = paragraph.match(/[^.!?]+[.!?]+|\S+/g) ?? [paragraph];
  const parts: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (current && current.length + sentence.length + 1 > maxChars) {
      parts.push(current.trim());
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }

  if (current.trim()) parts.push(current.trim());
  return parts.length > 0 ? parts : [paragraph];
}

export function chunkDocument(text: string, options: ChunkingOptions): DocumentChunk[] {
  if (!text.trim()) return [];

  const rawParagraphs = text.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const targetCharacters = (options.sizeTokens || ChunkingConfig.sizeTokens) * 4;
  const overlapCharacters = (options.overlapTokens || ChunkingConfig.overlapTokens) * 4;
  const preserveHeadings = ChunkingConfig.preserveHeadings;

  const paragraphs: string[] = [];
  for (const paragraph of rawParagraphs) {
    if (paragraph.length > targetCharacters) {
      paragraphs.push(...splitOversizedParagraph(paragraph, targetCharacters));
    } else {
      paragraphs.push(paragraph);
    }
  }

  const chunks: DocumentChunk[] = [];
  let current = "";
  let currentHeading: string | undefined;

  const MAX_CHUNKS_PER_DOCUMENT = 500;

  const addChunk = (content: string, heading?: string) => {
    if (chunks.length >= MAX_CHUNKS_PER_DOCUMENT) {
      return; // Cap to prevent memory/embedding resource exhaustion
    }
    const normalized = content.trim();
    if (!normalized) return;
    const chunkIndex = chunks.length;
    chunks.push({
      id: `${options.documentId}_${chunkIndex}`,
      documentId: options.documentId,
      content: normalized,
      chunkIndex,
      metadata: {
        ...options.metadata,
        documentName: options.metadata.documentName || options.documentId,
        chunkIndex,
        expiryDate: options.metadata.expiryDate,
        ...(heading && preserveHeadings ? { section: heading } : {}),
      },
    });
  };

  for (const paragraph of paragraphs) {
    const firstLine = paragraph.split("\n")[0]?.trim() ?? "";
    const isHeading = isLikelyHeading(firstLine);

    if (isHeading && current.trim()) {
      addChunk(current, currentHeading);
      current = "";
      currentHeading = firstLine;
    } else if (isHeading) {
      currentHeading = firstLine;
    }

    if (current && current.length + paragraph.length + 2 > targetCharacters) {
      addChunk(current, currentHeading);
      current = current.slice(Math.max(0, current.length - overlapCharacters));
    }
    current = current ? `${current}\n\n${paragraph}` : paragraph;
  }

  if (current.trim()) {
    addChunk(current, currentHeading);
  }
  return chunks;
}
