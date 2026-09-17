import fs from "fs";
import { DocumentChunk, DocumentMetadata } from "../../types/document";
import { getDefaultVectorStore, VectorStore } from "../retrieval/vectorStore";
import { embedChunks } from "./embedding";
import { cleanText } from "./cleaning";
import { chunkDocument } from "./chunking";
import { extractTextFromBuffer } from "./extraction";
import { SAMPLE_DOCUMENTS } from "../../../tests/fixtures/rag";
import { normalizeCountry } from "../../utils/country";
import { normalizeCarrier } from "../../utils/carrier";
import { validateUploadInput } from "./validation";

export interface DocumentRecord {
  id: string;
  title: string;
  status: "indexed" | "processing" | "error" | "processed" | "failed";
  type: string;
  country?: string;
  carrier?: string;
  uploadedAt: string;
  updatedAt?: string;
  effectiveDate?: string;
  expiryDate?: string;
  version?: string;
  chunkCount: number;
  fileName?: string;
  fileSize?: number;
  summary?: string;
  keyRequirements?: string[];
  errorMessage?: string;
}

export interface IngestDocumentInput {
  documentId?: string;
  documentName: string;
  fileBuffer?: Buffer;
  fileContent?: string;
  fileName: string;
  fileType?: string;
  country?: string;
  carrier?: string;
  documentType?: string;
  effectiveDate?: string;
  expiryDate?: string;
  version?: string;
}

export interface UpdateDocumentInput {
  documentName?: string;
  title?: string;
  country?: string | null;
  carrier?: string | null;
  documentType?: string;
  type?: string;
  effectiveDate?: string;
  expiryDate?: string;
  version?: string;
}

export interface DocumentSummaryResult {
  summary: string;
  keyRequirements: string[];
}

export function extractDocumentSummary(
  text: string,
  title: string,
  country?: string,
  carrier?: string
): DocumentSummaryResult {
  // Strip fixture metadata headers while preserving empty lines for paragraph separation
  const rawLines = text.split(/\r?\n/);
  const cleanLines: string[] = [];

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    const lower = line.toLowerCase();
    if (
      lower.startsWith("test fixture:") ||
      lower.startsWith("document classification:") ||
      lower.startsWith("regulatory authority:") ||
      lower.startsWith("operational protocol:") ||
      lower.startsWith("document reference:") ||
      lower.startsWith("document id:") ||
      lower.startsWith("country:") ||
      lower.startsWith("carrier:") ||
      lower.startsWith("document type:") ||
      lower.startsWith("effective date:") ||
      lower.startsWith("version:")
    ) {
      continue;
    }
    cleanLines.push(line);
  }

  const cleanedText = cleanLines.join("\n");
  // Split into paragraphs by 2 or more newlines
  const paragraphs = cleanedText.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  let summary = "";
  const keyRequirements: string[] = [];

  // 1. First pass: look specifically for SECTION 1: OVERVIEW / SCOPE / INTRODUCTION
  for (const para of paragraphs) {
    const lines = para.split("\n").map((l) => l.trim()).filter(Boolean);
    const firstLine = lines[0] || "";

    if (/overview|scope|summary|purpose|introduction/i.test(firstLine)) {
      const bodyLines = lines.slice(1).filter((l) => !/^[A-Z0-9\s_:-]+:?$/i.test(l));
      if (bodyLines.length > 0) {
        summary = bodyLines.join(" ");
        break;
      }
    }
  }

  // 2. Second pass: extract key requirements / numbered list items / bullet points
  for (const para of paragraphs) {
    const lines = para.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const match = line.match(/^(?:(?:\d+\.|\*|-|•)\s+)(.+)$/);
      if (match) {
        const item = match[1].trim();
        if (item.length > 15 && keyRequirements.length < 8 && !keyRequirements.includes(item)) {
          keyRequirements.push(item);
        }
      } else if (
        /^(?:Commercial Invoice|Packing List|Customs Declaration|Certificate of Origin|Tariff|Import duty|Value-Added Tax|VAT|Inner Packaging|Outer Packaging|Cushioning|Gross Weight|Lithium Battery|Shipper's Declaration|Safety Data Sheet|SDS|DELTA-G|EUR\.1|Triman|PHYTO|Customs audits|Documentation retention)/i.test(line) &&
        line.includes(":")
      ) {
        if (line.length > 20 && keyRequirements.length < 8 && !keyRequirements.includes(line)) {
          keyRequirements.push(line);
        }
      }
    }
  }

  // If summary not found, find the first non-header, non-bullet paragraph
  if (!summary) {
    for (const para of paragraphs) {
      const lines = para.split("\n").map((l) => l.trim()).filter(Boolean);
      const firstLine = lines[0] || "";
      if (/^section\s+\d+/i.test(firstLine)) {
        const bodyLines = lines.slice(1);
        if (bodyLines.length > 0 && !bodyLines[0].startsWith("1.")) {
          summary = bodyLines.join(" ");
          break;
        }
      } else if (!firstLine.startsWith("1.") && !firstLine.startsWith("-") && firstLine.length > 30) {
        summary = lines.join(" ");
        break;
      }
    }
  }

  // Fallback if still empty
  if (!summary) {
    const entity = country ? `for ${country}` : carrier ? `for ${carrier}` : "for global logistics lanes";
    summary = `Customs clearance protocols, import statutory obligations, and operational compliance specifications outlined in ${title} ${entity}.`;
  }

  // Fallback keyRequirements if empty
  if (keyRequirements.length === 0) {
    const sentences = cleanedText.match(/[^.!?]+[.!?]+/g) || [];
    for (const s of sentences) {
      const trimmed = s.trim();
      if (
        /\b(must|required|mandatory|restricted|prohibited|requires|applies to|declaration|inspection)\b/i.test(trimmed) &&
        trimmed.length >= 25 &&
        trimmed.length <= 250
      ) {
        if (keyRequirements.length < 6 && !keyRequirements.includes(trimmed)) {
          keyRequirements.push(trimmed);
        }
      }
    }
  }

  return { summary, keyRequirements };
}

class DocumentStoreManager {
  private documents = new Map<string, DocumentRecord>();
  private documentChunks = new Map<string, DocumentChunk[]>();
  private initialized = false;

  public async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    // Seed default sample documents from fixtures if files exist
    try {
      for (const doc of SAMPLE_DOCUMENTS) {
        let content = "";
        if (fs.existsSync(doc.filePath)) {
          content = fs.readFileSync(doc.filePath, "utf-8");
        }
        if (content) {
          await this.ingestDocument({
            documentId: doc.id,
            documentName: doc.documentName,
            fileContent: content,
            fileName: doc.fileName,
            fileType: "txt",
            country: doc.country,
            carrier: doc.carrier,
            documentType: doc.documentType,
            effectiveDate: doc.effectiveDate,
            version: doc.version,
          });
        }
      }
    } catch (err) {
      console.warn("Could not seed default documents on startup:", err);
    }
  }

  public async ingestDocument(
    input: IngestDocumentInput,
    vectorStore: VectorStore = getDefaultVectorStore()
  ): Promise<DocumentRecord> {
    const documentId = input.documentId || `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const normalizedCountry = normalizeCountry(input.country);
    const normalizedCarrier = normalizeCarrier(input.carrier);

    const record: DocumentRecord = {
      id: documentId,
      title: input.documentName || input.fileName || "Untitled Document",
      status: "processing",
      type: input.documentType || "Customs Regulation",
      country: normalizedCountry,
      carrier: normalizedCarrier,
      uploadedAt: now,
      effectiveDate: input.effectiveDate,
      expiryDate: input.expiryDate,
      version: input.version || "1.0",
      chunkCount: 0,
      fileName: input.fileName || "document",
      fileSize: input.fileBuffer ? input.fileBuffer.length : (input.fileContent ? Buffer.byteLength(input.fileContent) : 0),
    };

    this.documents.set(documentId, record);

    try {
      // Validate input payload before processing
      const validated = validateUploadInput({
        documentName: input.documentName,
        fileName: input.fileName,
        fileType: input.fileType,
        fileContent: input.fileContent,
        fileBuffer: input.fileBuffer,
        effectiveDate: input.effectiveDate,
        expiryDate: input.expiryDate,
      });

      record.title = validated.documentName;
      record.fileName = validated.sanitizedFileName;
      record.fileSize = validated.fileSize;
      record.effectiveDate = validated.effectiveDate;
      record.expiryDate = validated.expiryDate;
      // 1. Text Extraction
      let rawText = input.fileContent || "";
      if (!rawText && input.fileBuffer) {
        const extracted = await extractTextFromBuffer(
          input.fileBuffer,
          validated.sanitizedFileName,
          validated.fileType
        );
        rawText = extracted.text;
      }

      if (!rawText.trim()) {
        throw new Error("No readable text found in document.");
      }

      // 2. Text Cleaning
      const cleaned = cleanText(rawText);
      if (!cleaned.trim()) {
        throw new Error("No usable text content after cleaning.");
      }

      // 3. Document Chunking
      const metadata: DocumentMetadata = {
        documentName: validated.documentName,
        country: normalizedCountry,
        carrier: normalizedCarrier,
        documentType: input.documentType,
        effectiveDate: validated.effectiveDate,
        expiryDate: validated.expiryDate,
        version: input.version || "1.0",
      };

      const chunks = chunkDocument(cleaned, {
        documentId,
        metadata,
      });

      if (chunks.length === 0) {
        throw new Error("Document chunking produced 0 chunks.");
      }

      // 4. Embedding Generation
      const embeddings = await embedChunks(chunks);

      // 5. Vector Store Upsert
      await vectorStore.upsert(chunks, embeddings);

      // 6. Update Record Status & Extract Content Summary
      const { summary, keyRequirements } = extractDocumentSummary(
        cleaned,
        record.title,
        record.country,
        record.carrier
      );
      record.summary = summary;
      record.keyRequirements = keyRequirements;
      record.status = "indexed";
      record.chunkCount = chunks.length;
      this.documentChunks.set(documentId, chunks);
      this.documents.set(documentId, record);

      return record;
    } catch (error) {
      record.status = "error";
      record.errorMessage = error instanceof Error ? error.message : String(error);
      this.documents.set(documentId, record);

      // Rollback any partial vector store insertions
      try {
        await vectorStore.deleteByDocumentId(documentId);
      } catch {
        // ignore rollback errors
      }
      this.documentChunks.delete(documentId);
      throw error;
    }
  }

  public getAllDocuments(): DocumentRecord[] {
    return Array.from(this.documents.values()).sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  }

  public getDocumentById(id: string): DocumentRecord | undefined {
    return this.documents.get(id);
  }

  public getDocumentChunks(id: string): DocumentChunk[] {
    return this.documentChunks.get(id) || [];
  }

  public getAllChunks(): DocumentChunk[] {
    const all: DocumentChunk[] = [];
    for (const chunks of this.documentChunks.values()) {
      all.push(...chunks);
    }
    return all;
  }

  public getTotalChunksCount(): number {
    let count = 0;
    for (const chunks of this.documentChunks.values()) {
      count += chunks.length;
    }
    return count;
  }

  public async updateDocument(
    id: string,
    updates: UpdateDocumentInput,
    vectorStore: VectorStore = getDefaultVectorStore()
  ): Promise<DocumentRecord | null> {
    const existing = this.documents.get(id);
    if (!existing) {
      return null;
    }

    // Determine updated values
    const effectiveDate =
      updates.effectiveDate !== undefined ? updates.effectiveDate : existing.effectiveDate;
    const expiryDate =
      updates.expiryDate !== undefined ? updates.expiryDate : existing.expiryDate;

    // Validate date sequence if both dates exist
    if (effectiveDate && expiryDate) {
      const start = new Date(effectiveDate).getTime();
      const end = new Date(expiryDate).getTime();
      if (!isNaN(start) && !isNaN(end) && end < start) {
        throw new Error("Expiry date cannot be earlier than effective date");
      }
    }

    const title =
      updates.title?.trim() || updates.documentName?.trim() || existing.title;
    const country =
      updates.country !== undefined ? normalizeCountry(updates.country) : existing.country;
    const carrier =
      updates.carrier !== undefined ? normalizeCarrier(updates.carrier) : existing.carrier;
    const type =
      updates.documentType?.trim() || updates.type?.trim() || existing.type;
    const version =
      updates.version?.trim() || existing.version;

    // Update document record
    existing.title = title;
    existing.country = country;
    existing.carrier = carrier;
    existing.type = type;
    existing.effectiveDate = effectiveDate;
    existing.expiryDate = expiryDate;
    existing.version = version;
    existing.updatedAt = new Date().toISOString();

    // Update in-memory documentChunks
    const chunks = this.documentChunks.get(id) || [];
    for (const chunk of chunks) {
      chunk.metadata = {
        ...chunk.metadata,
        documentName: title,
        country,
        carrier,
        documentType: type,
        effectiveDate,
        version,
      };
    }

    // Synchronize vector store metadata
    await vectorStore.updateMetadataByDocumentId(id, {
      documentName: title,
      country,
      carrier,
      documentType: type,
      effectiveDate,
      version,
    });

    this.documents.set(id, existing);
    return existing;
  }

  public async deleteDocument(
    id: string,
    vectorStore: VectorStore = getDefaultVectorStore()
  ): Promise<{ success: boolean; deletedChunks: number }> {
    if (!this.documents.has(id)) {
      return { success: false, deletedChunks: 0 };
    }

    // Delete chunks from vector store first
    const deletedChunks = await vectorStore.deleteByDocumentId(id);

    // Delete from document maps
    this.documents.delete(id);
    this.documentChunks.delete(id);

    return { success: true, deletedChunks };
  }

  public getStats() {
    const docs = this.getAllDocuments();
    const indexedDocs = docs.filter((d) => d.status === "indexed");
    const totalChunks = indexedDocs.reduce((acc, d) => acc + d.chunkCount, 0);

    const countries = new Set<string>();
    const carriers = new Set<string>();

    for (const d of indexedDocs) {
      if (d.country) countries.add(d.country);
      if (d.carrier) carriers.add(d.carrier);
    }

    return {
      totalDocuments: docs.length,
      indexedDocuments: indexedDocs.length,
      failedDocuments: docs.filter((d) => d.status === "error").length,
      totalChunks,
      countriesCount: countries.size,
      carriersCount: carriers.size,
      countries: Array.from(countries),
      carriers: Array.from(carriers),
    };
  }
}

export const documentStore = new DocumentStoreManager();
