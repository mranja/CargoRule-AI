import { promises as fs } from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { ExtractedDocument, SupportedDocumentType } from "../../types/document";

function resolveDocumentType(filePath: string, fileType?: string): SupportedDocumentType {
  const normalizedType = (fileType || path.extname(filePath).slice(1)).toLowerCase();
  if (normalizedType === "pdf" || normalizedType === "docx" || normalizedType === "txt") {
    return normalizedType;
  }
  throw new Error(`Unsupported document type: ${normalizedType || "unknown"}`);
}

export async function extractText(filePath: string, fileType?: string): Promise<ExtractedDocument> {
  const resolvedType = resolveDocumentType(filePath, fileType);
  const buffer = await fs.readFile(filePath);
  let text: string;
  let pageCount: number | undefined;

  try {
    if (resolvedType === "txt") {
      text = buffer.toString("utf8");
    } else if (resolvedType === "pdf") {
      const result = await pdfParse(buffer);
      text = result.text;
      pageCount = result.numpages;
    } else {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown parser error";
    throw new Error(`Failed to extract ${resolvedType} document: ${reason}`);
  }

  if (!text.trim()) {
    throw new Error(`No text could be extracted from ${path.basename(filePath)}`);
  }

  return {
    text,
    metadata: {
      fileName: path.basename(filePath),
      fileType: resolvedType,
      ...(pageCount === undefined ? {} : { pageCount }),
    },
  };
}