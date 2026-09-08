import http from "http";
import app from "../src/server";
import { documentStore } from "../src/services/document/documentStore";
import { getDefaultVectorStore } from "../src/services/retrieval/vectorStore";
import { normalizeCarrier, normalizeCarrierFilters } from "../src/utils/carrier";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function makeRequest(
  server: http.Server,
  path: string,
  method: string = "GET",
  body?: any
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const port = (server.address() as any).port;
    const bodyString = body ? JSON.stringify(body) : "";

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(bodyString),
        },
      },
      (res) => {
        let responseBody = "";
        res.on("data", (chunk) => (responseBody += chunk));
        res.on("end", () => {
          try {
            const data = responseBody ? JSON.parse(responseBody) : {};
            resolve({ status: res.statusCode || 200, data });
          } catch {
            resolve({ status: res.statusCode || 200, data: responseBody });
          }
        });
      }
    );

    req.on("error", reject);
    if (bodyString) {
      req.write(bodyString);
    }
    req.end();
  });
}

async function runDocumentCarrierIntegrationTests(): Promise<void> {
  console.log("==================================================");
  console.log("TESTING DOCUMENT UPDATE, DELETE & CARRIER INTEGRATION");
  console.log("==================================================");

  // 1. Carrier Normalization Unit Tests
  {
    console.log("1. Testing carrier normalization...");
    assert(normalizeCarrier("DHL") === "DHL", "DHL should normalize to DHL");
    assert(normalizeCarrier("dhl express") === "DHL", "dhl express should normalize to DHL");
    assert(normalizeCarrier("DHL Express") === "DHL", "DHL Express should normalize to DHL");
    assert(normalizeCarrier("FedEx") === "FedEx", "FedEx should normalize to FedEx");
    assert(normalizeCarrier("fedex ground") === "FedEx", "fedex ground should normalize to FedEx");
    assert(normalizeCarrier("Federal Express") === "FedEx", "Federal Express should normalize to FedEx");
    assert(normalizeCarrier("Maersk") === "Maersk", "Maersk should normalize to Maersk");
    assert(normalizeCarrier("Maersk Line") === "Maersk", "Maersk Line should normalize to Maersk");
    assert(normalizeCarrier("A.P. Moller - Maersk") === "Maersk", "A.P. Moller - Maersk should normalize to Maersk");
    assert(normalizeCarrier("UPS") === "UPS", "UPS should normalize to UPS");
    assert(normalizeCarrier("United Parcel Service") === "UPS", "United Parcel Service should normalize to UPS");
    assert(normalizeCarrier("Custom Logistics Corp") === "Custom Logistics Corp", "Unknown carrier should retain formatted name");
    assert(normalizeCarrier(undefined) === undefined, "undefined should remain undefined");
    assert(normalizeCarrier(null) === undefined, "null should return undefined");
    assert(normalizeCarrier("") === undefined, "empty string should return undefined");
    assert(normalizeCarrier("all") === undefined, "'all' should return undefined");
    assert(normalizeCarrier("none") === undefined, "'none' should return undefined");

    const filters = normalizeCarrierFilters(["DHL Express", "fedex", "all", ""]);
    assert(filters !== undefined, "filters should not be undefined");
    assert(filters.length === 2, "filters should only contain normalized valid carriers");
    assert(filters.includes("DHL"), "filters should include DHL");
    assert(filters.includes("FedEx"), "filters should include FedEx");
    console.log("   ✓ Carrier normalization tests passed");
  }

  // Initialize documentStore & vectorStore
  await documentStore.initialize();
  const vectorStore = getDefaultVectorStore();

  // 2. Direct Service-Level Document Update & Vector Sync Tests
  {
    console.log("2. Testing service-level updateDocument and vectorStore sync...");

    // Ingest test document
    const ingested = await documentStore.ingestDocument(
      {
        fileName: "carrier-policy.txt",
        fileType: "txt",
        fileContent: "TEST POLICY: Specific perishable cargo handling requires refrigerated containers.",
        documentName: "Initial Perishable Freight Guidelines",
        carrier: "DHL Express", // should normalize to DHL
        country: "Germany",
        documentType: "Carrier Policy",
        effectiveDate: "2026-01-01",
        expiryDate: "2026-12-31",
      },
      vectorStore
    );

    const docId = ingested.id;
    assert(ingested.carrier === "DHL", "Carrier should be normalized during ingestion");
    assert(ingested.title === "Initial Perishable Freight Guidelines", "Doc title matches");

    // Verify chunks have DHL carrier
    const initialChunks = documentStore.getDocumentChunks(docId) || [];
    assert(initialChunks.length > 0, "Document should have chunks");
    for (const chunk of initialChunks) {
      assert(chunk.metadata.carrier === "DHL", "Chunk metadata carrier should be DHL");
      assert(chunk.metadata.documentName === "Initial Perishable Freight Guidelines", "Doc name matches");
    }

    // Update document metadata: switch carrier to FedEx Ground and change country to France
    const updated = await documentStore.updateDocument(
      docId,
      {
        documentName: "Revised Perishable Freight Guidelines",
        carrier: "FedEx Ground", // should normalize to FedEx
        country: "France",
      },
      vectorStore
    );

    assert(updated !== null, "updateDocument should return updated document");
    assert(updated.title === "Revised Perishable Freight Guidelines", "Title should be updated");
    assert(updated.carrier === "FedEx", "Carrier should be updated to normalized FedEx");
    assert(updated.country === "France", "Country should be updated to France");
    assert(!!updated.updatedAt, "updatedAt timestamp must be set");

    // Verify vector store chunks updated in-place without re-embedding
    const updatedChunks = documentStore.getDocumentChunks(docId) || [];
    for (const chunk of updatedChunks) {
      assert(chunk.metadata.carrier === "FedEx", "Vector chunk metadata carrier should now be FedEx");
      assert(chunk.metadata.country === "France", "Vector chunk metadata country should now be France");
      assert(chunk.metadata.documentName === "Revised Perishable Freight Guidelines", "Vector chunk doc name updated");
    }

    // Test Date Validation: expiryDate < effectiveDate should throw
    let dateErrorThrown = false;
    try {
      await documentStore.updateDocument(
        docId,
        {
          expiryDate: "2025-01-01", // earlier than effectiveDate 2026-01-01
        },
        vectorStore
      );
    } catch (err: any) {
      dateErrorThrown = true;
      assert(err.message.includes("Expiry date cannot be earlier than effective date"), "Error message should mention date validation");
    }
    assert(dateErrorThrown, "updateDocument must reject expiryDate < effectiveDate");

    // Test Updating Non-Existent Document returns null
    const nonExistent = await documentStore.updateDocument(
      "non-existent-id-000",
      { documentName: "Ghost Doc" },
      vectorStore
    );
    assert(nonExistent === null, "Updating non-existent document should return null");

    console.log("   ✓ Service-level updateDocument and vectorStore sync passed");
  }

  // 3. Direct Service-Level Document Delete & Vector Purge Tests
  {
    console.log("3. Testing service-level deleteDocument and vectorStore purge...");

    // Ingest a document to delete
    const ingestedForDelete = await documentStore.ingestDocument(
      {
        fileName: "doc-to-delete.txt",
        fileType: "txt",
        fileContent: "TEST DOC TO DELETE: This document will be completely expunged from store and vector store.",
        documentName: "Temporary Disposable Policy",
        carrier: "Maersk Line",
        country: "Singapore",
      },
      vectorStore
    );

    const deleteDocId = ingestedForDelete.id;
    const initialVectorCount = await vectorStore.count();
    assert((documentStore.getDocumentChunks(deleteDocId) || []).length > 0, "Chunks exist before deletion");

    // Execute deletion
    const deleteResult = await documentStore.deleteDocument(deleteDocId, vectorStore);
    assert(deleteResult.success === true, "deleteDocument should return success: true");
    assert(deleteResult.deletedChunks > 0, "deleteDocument should report deletedChunks > 0");

    // Verify documentStore no longer has it
    assert(documentStore.getDocumentById(deleteDocId) === undefined, "Document should be deleted from documentStore");
    assert(documentStore.getDocumentChunks(deleteDocId).length === 0, "Chunks should be empty in documentChunks map");

    // Verify vectorStore no longer has any chunks for this document
    const finalVectorCount = await vectorStore.count();
    assert(finalVectorCount === initialVectorCount - deleteResult.deletedChunks, "Vector store total count must decrease accurately");

    // Deleting non-existent document
    const ghostDelete = await documentStore.deleteDocument("non-existent-id-999", vectorStore);
    assert(ghostDelete.success === false, "Deleting non-existent document returns success: false");
    assert(ghostDelete.deletedChunks === 0, "Deleted chunks should be 0");

    console.log("   ✓ Service-level deleteDocument and vectorStore purge passed");
  }

  // 4. Full REST API End-to-End Testing
  console.log("4. Starting HTTP Server for REST API testing...");
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));

  try {
    // 4.1 Ingest a document via API
    let apiDocId = "";
    {
      const payload = {
        documentName: "Maersk Reefer Maritime Protocol",
        fileName: "maersk-reefer.txt",
        fileType: "txt",
        fileContent:
          "TEST PROTOCOL: Maersk Line requires all refrigerated container shipments of pharmaceuticals to maintain a temperature between 2 and 8 degrees Celsius.",
        country: "Singapore",
        carrier: "Maersk Line", // should normalize to Maersk
        documentType: "Carrier Standard",
        effectiveDate: "2026-04-01",
        expiryDate: "2027-04-01",
        version: "v1.0",
      };

      const res = await makeRequest(server, "/api/documents/upload", "POST", payload);
      assert(res.status === 201, `Upload should return 201, got ${res.status}`);
      assert(res.data.document.carrier === "Maersk", "Carrier should be normalized to Maersk");
      apiDocId = res.data.document.id;
      console.log(`   ✓ POST /api/documents/upload passed (created ${apiDocId})`);
    }

    // 4.2 Query RAG with Carrier Filter matching initial carrier
    {
      const res = await makeRequest(server, "/api/rag/ask", "POST", {
        question: "What temperature is required for refrigerated container shipments?",
        filters: { carrier: "Maersk Line" }, // Tests carrier filter normalization
      });
      assert(res.status === 200, "RAG ask should return 200");
      assert(res.data.sources.length > 0, "Should find matching sources with Maersk carrier filter");
      assert(res.data.sources[0].carrier === "Maersk", "Source citation should include normalized carrier Maersk");
      console.log("   ✓ RAG retrieval with carrier filter 'Maersk Line' passed");
    }

    // 4.3 Update Document via PATCH /api/documents/:id
    {
      const updatePayload = {
        documentName: "DHL Reefer Maritime Protocol",
        carrier: "DHL Express", // Change carrier to DHL Express -> normalizes to DHL
        country: "Germany",
        version: "v2.0",
      };

      const res = await makeRequest(server, `/api/documents/${apiDocId}`, "PATCH", updatePayload);
      assert(res.status === 200, `PATCH should return 200, got ${res.status}`);
      assert(res.data.success === true, "Response should indicate success");
      assert(res.data.document.carrier === "DHL", "Document carrier should now be DHL");
      assert(res.data.document.country === "Germany", "Document country should now be Germany");
      assert(res.data.document.version === "v2.0", "Document version should now be v2.0");
      assert(res.data.document.title === "DHL Reefer Maritime Protocol", "Document title updated");
      assert(!!res.data.document.updatedAt, "updatedAt should be present");
      console.log("   ✓ PATCH /api/documents/:id passed");
    }

    // 4.4 Verify Vector Store Synchronized via RAG Query
    {
      // Query with old carrier Maersk: should NOT return the updated document chunks
      const resOld = await makeRequest(server, "/api/rag/ask", "POST", {
        question: "What temperature is required for refrigerated container shipments?",
        filters: { carrier: "Maersk" },
      });
      assert(resOld.status === 200, "RAG ask should return 200");
      const foundInOld = (resOld.data.sources || []).some((s: any) => s.documentId === apiDocId);
      assert(!foundInOld, "Document must NOT appear when filtering by old carrier Maersk");

      // Query with new carrier DHL: SHOULD return the updated document chunks
      const resNew = await makeRequest(server, "/api/rag/ask", "POST", {
        question: "What temperature is required for refrigerated container shipments?",
        filters: { carrier: "DHL Express" },
      });
      assert(resNew.status === 200, "RAG ask should return 200");
      const foundInNew = (resNew.data.sources || []).some((s: any) => s.documentId === apiDocId);
      assert(foundInNew, "Document MUST appear when filtering by updated carrier DHL");
      console.log("   ✓ Vector store synchronized: RAG retrieval reflects updated carrier");
    }

    // 4.5 Date Validation via PATCH /api/documents/:id
    {
      const invalidDatePayload = {
        expiryDate: "2025-01-01", // earlier than effectiveDate "2026-04-01"
      };

      const res = await makeRequest(server, `/api/documents/${apiDocId}`, "PATCH", invalidDatePayload);
      assert(res.status === 400, `PATCH with invalid dates should return 400, got ${res.status}`);
      assert(res.data.error.includes("Expiry date cannot be earlier than effective date"), "Error message should explain date conflict");
      console.log("   ✓ PATCH /api/documents/:id date validation (HTTP 400) passed");
    }

    // 4.6 Update Non-Existent Document via PATCH /api/documents/:id returns 404
    {
      const res = await makeRequest(server, "/api/documents/non-existent-uuid-999", "PATCH", {
        documentName: "No Such Document",
      });
      assert(res.status === 404, `PATCH non-existent document should return 404, got ${res.status}`);
      console.log("   ✓ PATCH /api/documents/:id not found (HTTP 404) passed");
    }

    // 4.7 Update via PUT /api/documents/:id (alias to PATCH)
    {
      const res = await makeRequest(server, `/api/documents/${apiDocId}`, "PUT", {
        country: "United States",
      });
      assert(res.status === 200, `PUT should return 200, got ${res.status}`);
      assert(res.data.document.country === "United States", "Country updated via PUT");
      console.log("   ✓ PUT /api/documents/:id passed");
    }

    // 4.8 Delete Document via DELETE /api/documents/:id
    {
      const res = await makeRequest(server, `/api/documents/${apiDocId}`, "DELETE");
      assert(res.status === 200, `DELETE should return 200, got ${res.status}`);
      assert(res.data.success === true, "DELETE response should indicate success");
      assert(res.data.deletedChunks > 0, "DELETE response should report deletedChunks > 0");
      console.log(`   ✓ DELETE /api/documents/:id passed (purged ${res.data.deletedChunks} vector chunks)`);
    }

    // 4.9 Verify Document is 404 on GET
    {
      const res = await makeRequest(server, `/api/documents/${apiDocId}`, "GET");
      assert(res.status === 404, `GET deleted document should return 404, got ${res.status}`);
      console.log("   ✓ GET /api/documents/:id returns 404 after deletion passed");
    }

    // 4.10 Verify No Orphaned Vectors in RAG Query
    {
      const res = await makeRequest(server, "/api/rag/ask", "POST", {
        question: "What temperature is required for refrigerated container shipments?",
        filters: { carrier: "DHL" },
      });
      assert(res.status === 200, "RAG ask should return 200");
      const foundDeleted = (res.data.sources || []).some((s: any) => s.documentId === apiDocId);
      assert(!foundDeleted, "No orphaned vector chunks should be retrieved after document deletion");
      console.log("   ✓ No orphaned vectors: deleted document chunks purged from vector retrieval");
    }

    // 4.11 Delete Non-Existent Document returns 404
    {
      const res = await makeRequest(server, "/api/documents/non-existent-uuid-999", "DELETE");
      assert(res.status === 404, `DELETE non-existent document should return 404, got ${res.status}`);
      console.log("   ✓ DELETE /api/documents/:id not found (HTTP 404) passed");
    }

    console.log("\n==================================================");
    console.log("ALL DOCUMENT & CARRIER INTEGRATION TESTS PASSED!");
    console.log("==================================================");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

runDocumentCarrierIntegrationTests().catch((err) => {
  console.error("Document & Carrier Integration Test Failed:", err);
  process.exitCode = 1;
});
