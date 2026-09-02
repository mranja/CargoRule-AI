import fs from "fs";
import { DocumentChunk, DocumentMetadata } from "../../types/document";
import { getDefaultVectorStore, VectorStore } from "../retrieval/vectorStore";
import { embedChunks } from "./embedding";
import { cleanText } from "./cleaning";
import { chunkDocument } from "./chunking";
import { extractTextFromBuffer } from "./extraction";
import { SAMPLE_DOCUMENTS } from "../../../tests/fixtures/rag";

export interface DocumentRecord {
  id: string;
  title: string;
  status: "indexed" | "processing" | "error";
  type: string;
  country: string;
  carrier: string;
  uploadedAt: string;
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

    const record: DocumentRecord = {
      id: documentId,
      title: input.documentName,
      status: "processing",
      type: input.documentType || "Customs Regulation",
      country: input.country || "Global",
      carrier: input.carrier || "All",
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
        country: input.country,
        carrier: input.carrier,
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

  public async deleteDocument(
    id: string,
    vectorStore: VectorStore = getDefaultVectorStore()
  ): Promise<boolean> {
    if (!this.documents.has(id)) return false;

    // Delete chunks from vector store
    await vectorStore.deleteByDocumentId(id);
    this.documents.delete(id);
    this.documentChunks.delete(id);
    return true;
  }

  public getStats() {
    const docs = this.getAllDocuments();
    const indexedDocs = docs.filter((d) => d.status === "indexed");
    const totalChunks = indexedDocs.reduce((acc, d) => acc + d.chunkCount, 0);

    const countries = new Set<string>();
    const carriers = new Set<string>();

    for (const d of indexedDocs) {
      if (d.country && d.country !== "Global") countries.add(d.country);
      if (d.carrier && d.carrier !== "All") carriers.add(d.carrier);
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
