import { ChunkingConfig } from "../../config/rag.config";
import { DocumentChunk, DocumentMetadata } from "../../types/document";

export interface ChunkingOptions {
  documentId: string;
  metadata: Omit<DocumentMetadata, "documentName"> & { documentName?: string };
  sizeTokens?: number;
  overlapTokens?: number;
}

export function chunkDocument(text: string, options: ChunkingOptions): DocumentChunk[] {
  const paragraphs = text.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const targetCharacters = (options.sizeTokens || ChunkingConfig.sizeTokens) * 4;
  const overlapCharacters = (options.overlapTokens || ChunkingConfig.overlapTokens) * 4;
  const chunks: DocumentChunk[] = [];
  let current = "";

  const addChunk = (content: string) => {
    const normalized = content.trim();
    if (!normalized) return;
    chunks.push({
      id: `${options.documentId}_${chunks.length}`,
      documentId: options.documentId,
      content: normalized,
      chunkIndex: chunks.length,
      metadata: { ...options.metadata, documentName: options.metadata.documentName || options.documentId },
    });
  };

  for (const paragraph of paragraphs) {
    if (current && current.length + paragraph.length + 2 > targetCharacters) {
      addChunk(current);
      current = current.slice(Math.max(0, current.length - overlapCharacters));
    }
    current = current ? `${current}\n\n${paragraph}` : paragraph;
  }
  addChunk(current);
  return chunks;
}