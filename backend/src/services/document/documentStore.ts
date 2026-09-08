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

export interface DocumentRecord {
  id: string;
  title: string;
  status: "indexed" | "processing" | "error";
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
      title: input.documentName,
      status: "processing",
      type: input.documentType || "Customs Regulation",
      country: normalizedCountry,
      carrier: normalizedCarrier,
      uploadedAt: now,
      effectiveDate: input.effectiveDate,
      expiryDate: input.expiryDate,
      version: input.version || "1.0",
      chunkCount: 0,
      fileName: input.fileName,
      fileSize: input.fileBuffer ? input.fileBuffer.length : input.fileContent?.length || 0,
    };

    this.documents.set(documentId, record);

    try {
      // 1. Text Extraction
      let rawText = input.fileContent || "";
      if (!rawText && input.fileBuffer) {
        const extracted = await extractTextFromBuffer(
          input.fileBuffer,
          input.fileName,
          input.fileType || input.fileName.split(".").pop() || "txt"
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
        documentName: input.documentName,
        country: normalizedCountry,
        carrier: normalizedCarrier,
        documentType: input.documentType,
        effectiveDate: input.effectiveDate,
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

      // 6. Update Record
      record.status = "indexed";
      record.chunkCount = chunks.length;
      this.documentChunks.set(documentId, chunks);
      this.documents.set(documentId, record);

      return record;
    } catch (error) {
      record.status = "error";
      record.errorMessage = error instanceof Error ? error.message : String(error);
      this.documents.set(documentId, record);
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
