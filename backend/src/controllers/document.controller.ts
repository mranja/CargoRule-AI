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

  public static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      if (!id || typeof id !== "string" || !id.trim()) {
        res.status(400).json({ success: false, error: "Valid document ID is required" });
        return;
      }

      if (!req.body || typeof req.body !== "object") {
        res.status(400).json({ success: false, error: "Update payload must be a JSON object" });
        return;
      }

      const {
        documentName,
        title,
        country,
        carrier,
        documentType,
        type,
        effectiveDate,
        expiryDate,
        version,
      } = req.body;

      // Validate name/title if provided
      if (documentName !== undefined && (typeof documentName !== "string" || !documentName.trim())) {
        res.status(400).json({ success: false, error: "documentName must be a non-empty string" });
        return;
      }
      if (title !== undefined && (typeof title !== "string" || !title.trim())) {
        res.status(400).json({ success: false, error: "title must be a non-empty string" });
        return;
      }

      // Validate documentType/type if provided
      if (documentType !== undefined && (typeof documentType !== "string" || !documentType.trim())) {
        res.status(400).json({ success: false, error: "documentType must be a non-empty string" });
        return;
      }
      if (type !== undefined && (typeof type !== "string" || !type.trim())) {
        res.status(400).json({ success: false, error: "type must be a non-empty string" });
        return;
      }

      // Validate date formats
      if (effectiveDate !== undefined && effectiveDate !== null && effectiveDate !== "") {
        if (typeof effectiveDate !== "string" || isNaN(new Date(effectiveDate).getTime())) {
          res.status(400).json({ success: false, error: "effectiveDate must be a valid date string" });
          return;
        }
      }

      if (expiryDate !== undefined && expiryDate !== null && expiryDate !== "") {
        if (typeof expiryDate !== "string" || isNaN(new Date(expiryDate).getTime())) {
          res.status(400).json({ success: false, error: "expiryDate must be a valid date string" });
          return;
        }
      }

      // Update in documentStore
      const updated = await documentStore.updateDocument(id.trim(), {
        documentName,
        title,
        country,
        carrier,
        documentType,
        type,
        effectiveDate,
        expiryDate,
        version,
      });

      if (!updated) {
        res.status(404).json({ success: false, error: "Document not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Document updated successfully",
        document: updated,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update document";
      if (message.includes("Expiry date cannot be earlier")) {
        res.status(400).json({ success: false, error: message });
        return;
      }
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }

  public static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      if (!id || typeof id !== "string" || !id.trim()) {
        res.status(400).json({ success: false, error: "Valid document ID is required" });
        return;
      }

      const result = await documentStore.deleteDocument(id.trim());
      if (!result.success) {
        res.status(404).json({ success: false, error: "Document not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Document deleted successfully",
        id: id.trim(),
        deletedChunks: result.deletedChunks,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete document",
      });
    }
  }
}
