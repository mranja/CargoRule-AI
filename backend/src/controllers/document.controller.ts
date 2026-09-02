import { Request, Response } from "express";
import { documentStore } from "../services/document/documentStore";

export class DocumentController {
  public static async list(_req: Request, res: Response): Promise<void> {
    try {
      const docs = documentStore.getAllDocuments();
      res.status(200).json({
        success: true,
        count: docs.length,
        documents: docs,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to retrieve documents",
      });
    }
  }

  public static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const doc = documentStore.getDocumentById(id);
      if (!doc) {
        res.status(404).json({ success: false, error: "Document not found" });
        return;
      }

      const chunks = documentStore.getDocumentChunks(id);
      res.status(200).json({
        success: true,
        document: doc,
        chunksCount: chunks.length,
        chunks,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get document",
      });
    }
  }

  public static async upload(req: Request, res: Response): Promise<void> {
    try {
      const {
        documentName,
        fileContent,
        fileBase64,
        fileName,
        fileType,
        country,
        carrier,
        documentType,
        effectiveDate,
        expiryDate,
        version,
      } = req.body;

      if (!documentName || typeof documentName !== "string" || !documentName.trim()) {
        res.status(400).json({ success: false, error: "documentName is required" });
        return;
      }

      let buffer: Buffer | undefined;
      let textContent: string | undefined = fileContent;

      if (fileBase64) {
        buffer = Buffer.from(fileBase64, "base64");
      }

      if (!textContent && !buffer) {
        res.status(400).json({
          success: false,
          error: "Either fileContent (text) or fileBase64 must be provided",
        });
        return;
      }

      const resolvedFileName = fileName || `${documentName.replace(/\s+/g, "-").toLowerCase()}.txt`;

      const record = await documentStore.ingestDocument({
        documentName: documentName.trim(),
        fileContent: textContent,
        fileBuffer: buffer,
        fileName: resolvedFileName,
        fileType: fileType || resolvedFileName.split(".").pop(),
        country,
        carrier,
        documentType,
        effectiveDate,
        expiryDate,
        version,
      });

      res.status(201).json({
        success: true,
        message: "Document uploaded, chunked, and indexed successfully",
        document: record,
      });
    } catch (error) {
      console.error("Document upload error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to process and index document",
      });
    }
  }

  public static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const deleted = await documentStore.deleteDocument(id);
      if (!deleted) {
        res.status(404).json({ success: false, error: "Document not found" });
        return;
      }
      res.status(200).json({ success: true, message: "Document deleted successfully" });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete document",
      });
    }
  }
}
