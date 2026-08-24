import { ChunkingConfig } from "../../config/rag.config";
import { DocumentChunk, DocumentMetadata } from "../../types/document";

export interface ChunkingOptions {
  documentId: string;
  metadata: Omit<DocumentMetadata, "documentName"> & { documentName?: string };
  sizeTokens?: number;
  overlapTokens?: number;
}

const HEADING_PATTERN = /^(?:\d+(?:\.\d+)*[\.\)]?\s+|[A-Z][A-Z0-9\s\-]{3,})$/;

function isLikelyHeading(line: string): boolean {
  return HEADING_PATTERN.test(line.trim());
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

  const addChunk = (content: string) => {
    const normalized = content.trim();
    if (!normalized) return;
    chunks.push({
      id: `${options.documentId}_${chunks.length}`,
      documentId: options.documentId,
      content: normalized,
      chunkIndex: chunks.length,
      metadata: {
        ...options.metadata,
        documentName: options.metadata.documentName || options.documentId,
        ...(currentHeading && preserveHeadings ? { section: currentHeading } : {}),
      },
    });
  };

  for (const paragraph of paragraphs) {
    const firstLine = paragraph.split("\n")[0]?.trim() ?? "";
    if (isLikelyHeading(firstLine)) {
      currentHeading = firstLine;
    }

    if (current && current.length + paragraph.length + 2 > targetCharacters) {
      addChunk(current);
      current = current.slice(Math.max(0, current.length - overlapCharacters));
    }
    current = current ? `${current}\n\n${paragraph}` : paragraph;
  }

  addChunk(current);
  return chunks;
}
