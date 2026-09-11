import path from "path";
import { SupportedDocumentType } from "../../types/document";

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
export const SUPPORTED_EXTENSIONS: SupportedDocumentType[] = ["pdf", "docx", "txt"];

export class ValidationError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = statusCode;
  }
}

/**
 * Sanitizes a filename to avoid directory traversal, dangerous characters,
 * and malformed paths.
 */
export function sanitizeFileName(fileName?: string): string {
  if (!fileName || typeof fileName !== "string") {
    throw new ValidationError("Filename must be a non-empty string.");
  }

  // Extract basename to prevent directory traversal
  const baseName = path.basename(fileName.trim());
  if (!baseName || baseName === "." || baseName === "..") {
    throw new ValidationError("Invalid or unsafe filename.");
  }

  // Remove control characters and replace illegal path characters
  const sanitized = baseName.replace(/[^a-zA-Z0-9._-]/g, "_");
  if (!sanitized.trim()) {
    throw new ValidationError("Filename contains only invalid characters.");
  }

  return sanitized;
}

/**
 * Resolves and validates the document extension/type.
 */
export function validateDocumentType(fileName: string, fileType?: string): SupportedDocumentType {
  const rawType = (fileType || path.extname(fileName).slice(1)).toLowerCase().trim();
  if (!rawType) {
    throw new ValidationError(
      `Could not determine document type. Supported types are: ${SUPPORTED_EXTENSIONS.join(", ")}.`
    );
  }

  if (!SUPPORTED_EXTENSIONS.includes(rawType as SupportedDocumentType)) {
    throw new ValidationError(
      `Unsupported document type: '${rawType}'. Supported formats are: ${SUPPORTED_EXTENSIONS.join(", ")}.`
    );
  }

  return rawType as SupportedDocumentType;
}

export interface ValidatedUpload {
  documentName: string;
  sanitizedFileName: string;
  fileType: SupportedDocumentType;
  fileSize: number;
  effectiveDate?: string;
  expiryDate?: string;
}

/**
 * Validates document upload payload before text extraction, chunking, or embedding.
 */
export function validateUploadInput(input: {
  documentName?: string;
  fileName?: string;
  fileType?: string;
  fileContent?: string;
  fileBuffer?: Buffer;
  effectiveDate?: string;
  expiryDate?: string;
}): ValidatedUpload {
  // 1. Document Name
  if (!input.documentName || typeof input.documentName !== "string" || !input.documentName.trim()) {
    throw new ValidationError("documentName is required and must be a non-empty string.");
  }
  const documentName = input.documentName.trim();
  if (documentName.length > 200) {
    throw new ValidationError("documentName must not exceed 200 characters.");
  }

  // 2. Safe Filename
  const fallbackFileName = `${documentName.replace(/\s+/g, "-").toLowerCase()}.txt`;
  const sanitizedFileName = sanitizeFileName(input.fileName || fallbackFileName);

  // 3. Document Format/Extension
  const resolvedType = validateDocumentType(sanitizedFileName, input.fileType);

  // 4. File Content & Size
  let fileSize = 0;
  if (input.fileBuffer) {
    fileSize = input.fileBuffer.length;
  } else if (input.fileContent !== undefined && input.fileContent !== null) {
    fileSize = Buffer.byteLength(input.fileContent, "utf8");
  } else {
    throw new ValidationError("Document file content or buffer must be provided.");
  }

  if (fileSize === 0) {
    throw new ValidationError("Uploaded file is empty (0 bytes).");
  }

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    throw new ValidationError(
      `File size (${(fileSize / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum allowed limit of ${
        MAX_FILE_SIZE_BYTES / (1024 * 1024)
      } MB.`
    );
  }

  // For text uploads, ensure text content is not just empty whitespace
  if (resolvedType === "txt" && input.fileContent !== undefined && !input.fileContent.trim()) {
    throw new ValidationError("Uploaded text document contains only whitespace.");
  }

  // Validate magic bytes for binary files to prevent disguised file attacks
  if (input.fileBuffer && input.fileBuffer.length >= 4) {
    if (resolvedType === "pdf") {
      const header = input.fileBuffer.subarray(0, 5).toString("latin1");
      if (!header.startsWith("%PDF")) {
        throw new ValidationError("Invalid PDF file: Missing %PDF header magic bytes.");
      }
    } else if (resolvedType === "docx") {
      // DOCX files are zip containers starting with PK\x03\x04
      const isZip =
        input.fileBuffer[0] === 0x50 &&
        input.fileBuffer[1] === 0x4b &&
        (input.fileBuffer[2] === 0x03 || input.fileBuffer[2] === 0x05) &&
        (input.fileBuffer[3] === 0x04 || input.fileBuffer[3] === 0x06);
      if (!isZip) {
        throw new ValidationError("Invalid DOCX file: Missing PK zip header magic bytes.");
      }
    }
  }

  // 5. Date Validation
  if (input.effectiveDate !== undefined && input.effectiveDate !== null && input.effectiveDate !== "") {
    if (typeof input.effectiveDate !== "string" || isNaN(new Date(input.effectiveDate).getTime())) {
      throw new ValidationError("effectiveDate must be a valid date string.");
    }
  }

  if (input.expiryDate !== undefined && input.expiryDate !== null && input.expiryDate !== "") {
    if (typeof input.expiryDate !== "string" || isNaN(new Date(input.expiryDate).getTime())) {
      throw new ValidationError("expiryDate must be a valid date string.");
    }
  }

  if (input.effectiveDate && input.expiryDate) {
    const start = new Date(input.effectiveDate).getTime();
    const end = new Date(input.expiryDate).getTime();
    if (!isNaN(start) && !isNaN(end) && end < start) {
      throw new ValidationError("Expiry date cannot be earlier than effective date.");
    }
  }

  return {
    documentName,
    sanitizedFileName,
    fileType: resolvedType,
    fileSize,
    effectiveDate: input.effectiveDate,
    expiryDate: input.expiryDate,
  };
}
