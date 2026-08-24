import { promises as fs } from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { ExtractedDocument, SupportedDocumentType } from "../../types/document";

function resolveDocumentType(fileName: string, fileType?: string): SupportedDocumentType {
  const normalizedType = (fileType || path.extname(fileName).slice(1)).toLowerCase();
  if (normalizedType === "pdf" || normalizedType === "docx" || normalizedType === "txt") {
    return normalizedType;
  }
  throw new Error(`Unsupported document type: ${normalizedType || "unknown"}`);
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  fileName: string,
  fileType?: string
): Promise<ExtractedDocument> {
  const resolvedType = resolveDocumentType(fileName, fileType);
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
    throw new Error(`No text could be extracted from ${path.basename(fileName)}`);
  }

  return {
    text,
    metadata: {
      fileName: path.basename(fileName),
      fileType: resolvedType,
      ...(pageCount === undefined ? {} : { pageCount }),
    },
  };
}

export async function extractText(filePath: string, fileType?: string): Promise<ExtractedDocument> {
  const buffer = await fs.readFile(filePath);
  return extractTextFromBuffer(buffer, path.basename(filePath), fileType);
}
