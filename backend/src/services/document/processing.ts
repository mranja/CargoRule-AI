import { extractText } from "./extraction";
import { cleanText } from "./cleaning";
import { chunkDocument } from "./chunking";
import { DocumentChunk, DocumentMetadata } from "../../types/document";

export interface ProcessDocumentOptions {
  filePath: string;
  documentId: string;
  metadata: Omit<DocumentMetadata, "documentName"> & { documentName?: string };
  fileType?: string;
  sizeTokens?: number;
  overlapTokens?: number;
}

export interface ProcessedDocumentResult {
  documentId: string;
  chunks: DocumentChunk[];
  stats: {
    rawCharacterCount: number;
    cleanedCharacterCount: number;
    chunkCount: number;
    fileName: string;
    fileType: string;
    pageCount?: number;
  };
}

export async function processDocument(
  options: ProcessDocumentOptions
): Promise<ProcessedDocumentResult> {
  const extracted = await extractText(options.filePath, options.fileType);
  const cleaned = cleanText(extracted.text);

  if (!cleaned) {
    throw new Error(`Document produced no usable text after cleaning: ${extracted.metadata.fileName}`);
  }

  const chunks = chunkDocument(cleaned, {
    documentId: options.documentId,
    metadata: options.metadata,
    sizeTokens: options.sizeTokens,
    overlapTokens: options.overlapTokens,
  });

  if (chunks.length === 0) {
    throw new Error(`Document produced no chunks: ${extracted.metadata.fileName}`);
  }

  return {
    documentId: options.documentId,
    chunks,
    stats: {
      rawCharacterCount: extracted.text.length,
      cleanedCharacterCount: cleaned.length,
      chunkCount: chunks.length,
      fileName: extracted.metadata.fileName,
      fileType: extracted.metadata.fileType,
      pageCount: extracted.metadata.pageCount,
    },
  };
}
