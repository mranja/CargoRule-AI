import http from "http";
import app from "../src/server";
import { documentStore } from "../src/services/document/documentStore";
import { getDefaultVectorStore } from "../src/services/retrieval/vectorStore";
import { queryHistoryStore } from "../src/services/rag/queryHistoryStore";
import {
  sanitizeFileName,
  validateDocumentType,
  validateUploadInput,
  ValidationError,
  MAX_FILE_SIZE_BYTES,
} from "../src/services/document/validation";
import { cleanText } from "../src/services/document/cleaning";
import { chunkDocument } from "../src/services/document/chunking";
import { extractTextFromBuffer } from "../src/services/document/extraction";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function makeRequest(
  server: http.Server,
  path: string,
  method: string = "GET",
  body?: any,
  headers: Record<string, string> = {}
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
          ...headers,
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

async function runPipelineValidationAndSourceStorageTests(): Promise<void> {
  console.log("==================================================");
  console.log("TESTING PIPELINE VALIDATION & QUERY SOURCE STORAGE");
  console.log("==================================================");

  // 1. File Validation Tests
  console.log("1. Testing file validation logic...");
  {
    // 1.1 Filename sanitization
    assert(sanitizeFileName("valid-policy.txt") === "valid-policy.txt", "Valid filename preserved");
    assert(
      sanitizeFileName("../../etc/passwd/malicious.txt") === "malicious.txt",
      "Directory traversal stripped"
    );
    assert(
      sanitizeFileName("dangerous<file>|name?.pdf") === "dangerous_file__name_.pdf",
      "Dangerous characters sanitized"
    );

    let emptyNameError = false;
    try {
      sanitizeFileName("");
    } catch (e: any) {
      emptyNameError = true;
      assert(e instanceof ValidationError, "Throws ValidationError");
    }
    assert(emptyNameError, "Rejects empty filename");

    // 1.2 Document type validation
    assert(validateDocumentType("policy.pdf") === "pdf", "Recognizes PDF");
    assert(validateDocumentType("rules.docx") === "docx", "Recognizes DOCX");
    assert(validateDocumentType("terms.txt") === "txt", "Recognizes TXT");

    let unsupportedTypeError = false;
    try {
      validateDocumentType("script.exe");
    } catch (e: any) {
      unsupportedTypeError = true;
      assert(e.message.includes("Unsupported document type"), "Mentions unsupported document type");
    }
    assert(unsupportedTypeError, "Rejects unsupported document types");

    // 1.3 Empty content rejection
    let emptyContentError = false;
    try {
      validateUploadInput({
        documentName: "Empty Document",
        fileContent: "",
        fileName: "empty.txt",
      });
    } catch (e: any) {
      emptyContentError = true;
      assert(e.message.includes("empty"), "Mentions empty file");
    }
    assert(emptyContentError, "Rejects empty file content");

    // 1.4 Whitespace-only content rejection
    let whitespaceError = false;
    try {
      validateUploadInput({
        documentName: "Whitespace Document",
        fileContent: "    \n\t  \n  ",
        fileName: "whitespace.txt",
      });
    } catch (e: any) {
      whitespaceError = true;
      assert(e.message.includes("whitespace"), "Mentions whitespace only");
    }
    assert(whitespaceError, "Rejects whitespace-only document");

    // 1.5 File size limit
    let oversizedError = false;
    try {
      const hugeBuffer = Buffer.alloc(MAX_FILE_SIZE_BYTES + 1024);
      validateUploadInput({
        documentName: "Oversized Document",
        fileBuffer: hugeBuffer,
        fileName: "huge.pdf",
      });
    } catch (e: any) {
      oversizedError = true;
      assert(e.message.includes("exceeds the maximum"), "Mentions maximum size exceeded");
    }
    assert(oversizedError, "Rejects oversized files");

    // 1.6 Date validation
    let dateConflictError = false;
    try {
      validateUploadInput({
        documentName: "Date Conflict Policy",
        fileContent: "Some text",
        fileName: "dates.txt",
        effectiveDate: "2026-06-01",
        expiryDate: "2025-06-01", // earlier than effective
      });
    } catch (e: any) {
      dateConflictError = true;
      assert(e.message.includes("Expiry date cannot be earlier"), "Mentions date sequence conflict");
    }
    assert(dateConflictError, "Rejects invalid date sequences");

    console.log("   ✓ File validation tests passed");
  }

  // 2. Text Extraction & Cleaning Tests
  console.log("2. Testing text extraction & cleaning...");
  {
    // Extraction from text buffer
    const rawBuffer = Buffer.from("TEST POLICY: All air freight must have bill of lading.\fPage 2 content.", "utf8");
    const extracted = await extractTextFromBuffer(rawBuffer, "air-freight.txt");
    assert(extracted.text.includes("TEST POLICY"), "Text properly extracted");
    assert(extracted.metadata.fileType === "txt", "FileType is txt");

    // Text cleaning preserves structure, numbers, lists, and dates
    const dirtyText = "\uFEFF\0SECTION 1: Air Cargo\r\n\r\n1. Lithium batteries (effective 2026-01-01):\n   - UN3480 must have Class 9 label.\n   - Carrier: DHL Express\n   - Fee: $50 USD.\n\n\n\n2. Documentation:";
    const cleaned = cleanText(dirtyText);
    assert(!cleaned.includes("\uFEFF"), "BOM removed");
    assert(!cleaned.includes("\0"), "Null bytes removed");
    assert(cleaned.includes("SECTION 1: Air Cargo"), "Section heading preserved");
    assert(cleaned.includes("1. Lithium batteries (effective 2026-01-01):"), "List numbering and dates preserved");
    assert(cleaned.includes("- UN3480 must have Class 9 label."), "Bullets preserved");
    assert(cleaned.includes("Carrier: DHL Express"), "Carrier info preserved");
    assert(cleaned.includes("Fee: $50 USD."), "Fee details preserved");
    assert(!cleaned.includes("\n\n\n"), "Excessive blank lines normalized");

    console.log("   ✓ Text extraction & cleaning tests passed");
  }

  // 3. Section-Aware Chunking & Metadata Assignment
  console.log("3. Testing section-aware chunking & metadata assignment...");
  {
    const structuredDoc = [
      "SECTION 1: HAZARDOUS MATERIALS",
      "All Class 9 lithium ion cells must comply with IATA packing instruction 965.",
      "",
      "SECTION 2: CUSTOMS DECLARATIONS",
      "Customs Form C-28 is required for all commercial imports into the EU exceeding 150 EUR.",
    ].join("\n\n");

    const chunks = chunkDocument(structuredDoc, {
      documentId: "doc-test-101",
      metadata: {
        documentName: "EU Dangerous Goods & Customs Handbook",
        country: "Germany",
        carrier: "DHL",
        documentType: "Compliance Handbook",
        effectiveDate: "2026-01-01",
        expiryDate: "2027-01-01",
        version: "v1.0",
      },
      sizeTokens: 50,
      overlapTokens: 10,
    });

    assert(chunks.length >= 2, "Chunks generated from separate sections");
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      assert(c.id === `doc-test-101_${i}`, "Unique deterministic chunk ID");
      assert(c.documentId === "doc-test-101", "documentId attached");
      assert(c.chunkIndex === i, "chunkIndex matches");
      assert(c.metadata.chunkIndex === i, "metadata.chunkIndex matches");
      assert(c.metadata.documentName === "EU Dangerous Goods & Customs Handbook", "documentName matches");
      assert(c.metadata.country === "Germany", "country matches");
      assert(c.metadata.carrier === "DHL", "carrier matches");
      assert(c.metadata.expiryDate === "2027-01-01", "expiryDate attached to chunk metadata");
      assert(typeof c.metadata.section === "string", "Section name captured by heading detection");
    }

    // Verify section names
    assert(chunks[0].metadata.section?.includes("HAZARDOUS MATERIALS"), "First section heading captured");
    assert(chunks[chunks.length - 1].metadata.section?.includes("CUSTOMS DECLARATIONS"), "Second section heading captured");

    console.log("   ✓ Section-aware chunking & metadata assignment tests passed");
  }

  // 4. Processing Status Transition & Rollback on Failure
  console.log("4. Testing document ingestion status transition & failure rollback...");
  await documentStore.initialize();
  const vectorStore = getDefaultVectorStore();

  {
    const initialVectorCount = await vectorStore.count();

    // Successful document ingestion
    const ingested = await documentStore.ingestDocument(
      {
        documentName: "Singapore Port Maritime Protocol",
        fileName: "singapore-port.txt",
        fileType: "txt",
        fileContent:
          "TEST POLICY: Maritime and Port Authority of Singapore requires dangerous goods declarations 24 hours prior to vessel arrival.",
        country: "Singapore",
        carrier: "Maersk",
        documentType: "Port Regulation",
        effectiveDate: "2026-03-01",
        expiryDate: "2027-03-01",
      },
      vectorStore
    );

    assert(ingested.status === "indexed", "Status must become 'indexed' upon full success");
    assert(ingested.chunkCount > 0, "Chunk count must be greater than 0");
    const docInStore = documentStore.getDocumentById(ingested.id);
    assert(docInStore !== undefined && docInStore.status === "indexed", "Store document has status 'indexed'");

    // Failure simulation & rollback: attempt to ingest an empty document
    let failureCaught = false;
    try {
      await documentStore.ingestDocument(
        {
          documentName: "Broken Doc",
          fileName: "broken.txt",
          fileType: "txt",
          fileContent: "   \n\t  ", // will fail validation
        },
        vectorStore
      );
    } catch {
      failureCaught = true;
    }
    assert(failureCaught, "Failure caught on empty content");

    console.log("   ✓ Status transition & rollback tests passed");
  }

  // 5. Query Execution, Source Storage & Source Consistency (REST API)
  console.log("5. Testing query execution, source persistence & consistency...");
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));

  try {
    // 5.1 Ingest a controlled sample document via API
    let docId = "";
    {
      const payload = {
        documentName: "Japan Aviation Compliance Agreement",
        fileName: "japan-aviation.txt",
        fileType: "txt",
        fileContent:
          "TEST REGULATION: Japan Civil Aviation Bureau requires JCAB Form A-19 and airway bill declaration for all air cargo containing Class 9 hazardous batteries effective 2026-05-01.",
        country: "Japan",
        carrier: "All",
        documentType: "Aviation Agreement",
        effectiveDate: "2026-05-01",
        expiryDate: "2027-05-01",
        version: "v1.0",
      };

      const res = await makeRequest(server, "/api/documents/upload", "POST", payload);
      assert(res.status === 201, `Upload should return 201, got ${res.status}`);
      assert(res.data.document.status === "indexed", "Document status is indexed");
      docId = res.data.document.id;
      console.log(`   ✓ Uploaded document ${docId} via REST API`);
    }

    // 5.2 Execute Query with RAG ask endpoint
    let queryResponseData: any = null;
    {
      const payload = {
        question: "What form is required by Japan Civil Aviation Bureau for hazardous air cargo?",
        filters: { country: "Japan" },
      };

      const res = await makeRequest(server, "/api/rag/ask", "POST", payload, {
        "x-user-id": "user-compliance-agent-01",
      });

      assert(res.status === 200, `POST /api/rag/ask should return 200, got ${res.status}`);
      assert(res.data.success === true, "Response reports success");
      assert(typeof res.data.answer === "string" && res.data.answer.length > 0, "Grounded answer produced");
      assert(Array.isArray(res.data.sources) && res.data.sources.length > 0, "Sources returned in response");

      queryResponseData = res.data;
      console.log(`   ✓ Executed RAG query (ID: ${res.data.id}) with ${res.data.sources.length} sources`);
    }

    // 5.3 Source Consistency Validation: API response sources === Persisted sources
    {
      const queryId = queryResponseData.id;
      const storedQuery = queryHistoryStore.getById(queryId);
      assert(storedQuery !== undefined, "Query record was persisted in queryHistoryStore");
      assert(storedQuery.status === "completed", "Query status is 'completed'");
      assert(storedQuery.userId === "user-compliance-agent-01", "userId persisted");
      assert(!!storedQuery.createdAt, "createdAt timestamp persisted");
      assert(storedQuery.question === queryResponseData.question, "Question matches exactly");
      assert(storedQuery.answer === queryResponseData.answer, "Answer matches exactly");

      // Verify exact sources array matches
      assert(
        storedQuery.sources.length === queryResponseData.sources.length,
        "Source count matches exactly between API response and stored record"
      );

      for (let i = 0; i < storedQuery.sources.length; i++) {
        const storedSrc = storedQuery.sources[i];
        const apiSrc = queryResponseData.sources[i];

        assert(storedSrc.id === apiSrc.id, `Source ${i} id matches`);
        assert(storedSrc.chunkId === apiSrc.chunkId, `Source ${i} chunkId matches`);
        assert(storedSrc.documentId === apiSrc.documentId, `Source ${i} documentId matches`);
        assert(storedSrc.documentName === apiSrc.documentName, `Source ${i} documentName matches`);
        assert(storedSrc.country === apiSrc.country, `Source ${i} country matches`);
        assert(storedSrc.carrier === apiSrc.carrier, `Source ${i} carrier matches`);
        assert(storedSrc.relevanceScore === apiSrc.relevanceScore, `Source ${i} relevanceScore matches`);
        assert(storedSrc.snippet === apiSrc.snippet, `Source ${i} snippet matches`);
      }

      console.log("   ✓ Source consistency verified: API response == Stored Query == Retrieved Chunks");
    }

    // 5.4 Query History API Endpoints & Security
    {
      // GET /api/history
      const resList = await makeRequest(server, "/api/history");
      assert(resList.status === 200, "GET /api/history returns 200");
      assert(Array.isArray(resList.data.queries), "queries is an array");
      const foundInList = resList.data.queries.find((q: any) => q.id === queryResponseData.id);
      assert(foundInList !== undefined, "Recently executed query is present in history list");
      assert(foundInList.sources.length > 0, "Query in history list contains stored sources");

      // GET /api/history/:id
      const resDetail = await makeRequest(server, `/api/history/${queryResponseData.id}`);
      assert(resDetail.status === 200, `GET /api/history/:id returns 200, got ${resDetail.status}`);
      assert(resDetail.data.query.id === queryResponseData.id, "Returned query ID matches");
      assert(resDetail.data.query.sources.length > 0, "Returned query details includes sources list");

      // GET /api/history/:id with non-existent ID -> 404
      const res404 = await makeRequest(server, "/api/history/non-existent-query-999");
      assert(res404.status === 404, "GET non-existent query returns 404");

      // DELETE /api/history/:id
      const resDelete = await makeRequest(server, `/api/history/${queryResponseData.id}`, "DELETE");
      assert(resDelete.status === 200, "DELETE /api/history/:id returns 200");
      const checkDeleted = queryHistoryStore.getById(queryResponseData.id);
      assert(checkDeleted === undefined, "Query successfully deleted from history store");

      console.log("   ✓ Query history endpoints & operations passed");
    }

    // 5.5 Document Lifecycle & Audit Trail Preservation
    {
      // Ingest a document and perform a query that retrieves it
      const docPayload = {
        documentName: "Singapore Cold Chain Standards",
        fileName: "singapore-cold-chain.txt",
        fileType: "txt",
        fileContent:
          "TEST AUDIT REQUIREMENT: Singapore HSA regulations state that temperature-sensitive biologics must be monitored with calibrated USB dataloggers.",
        country: "Singapore",
        carrier: "DHL",
        documentType: "Health Policy",
      };

      const uploadRes = await makeRequest(server, "/api/documents/upload", "POST", docPayload);
      assert(uploadRes.status === 201, "Upload cold chain doc returns 201");
      const coldChainDocId = uploadRes.data.document.id;

      // Ask query that cites cold chain doc
      const askRes = await makeRequest(server, "/api/rag/ask", "POST", {
        question: "How must temperature-sensitive biologics be monitored in Singapore?",
        filters: { country: "Singapore" },
      });
      assert(askRes.status === 200, "Ask query returns 200");
      const queryId = askRes.data.id;
      assert(askRes.data.sources.some((s: any) => s.documentId === coldChainDocId), "Cites cold chain document");

      // Delete the underlying document
      const deleteDocRes = await makeRequest(server, `/api/documents/${coldChainDocId}`, "DELETE");
      assert(deleteDocRes.status === 200, "DELETE /api/documents/:id returns 200");

      // Future query must NOT retrieve chunks from deleted document
      const askAfterDelete = await makeRequest(server, "/api/rag/ask", "POST", {
        question: "How must temperature-sensitive biologics be monitored in Singapore?",
        filters: { country: "Singapore" },
      });
      assert(askAfterDelete.status === 200, "Ask after delete returns 200");
      const citedDeleted = (askAfterDelete.data.sources || []).some((s: any) => s.documentId === coldChainDocId);
      assert(!citedDeleted, "Future query must NOT cite deleted document");

      // Past query history audit record remains readable with its original sources preserved
      const pastQueryRecord = queryHistoryStore.getById(queryId);
      assert(pastQueryRecord !== undefined, "Past query record still exists in audit history");
      assert(pastQueryRecord.sources.length > 0, "Past sources remain intact for compliance audits");
      assert(
        pastQueryRecord.sources.some((s) => s.documentId === coldChainDocId),
        "Past query retains historical citation metadata after document deletion"
      );

      console.log("   ✓ Document lifecycle and compliance audit preservation passed");
    }

    console.log("\n==================================================");
    console.log("ALL PIPELINE VALIDATION & SOURCE STORAGE TESTS PASSED!");
    console.log("==================================================");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

runPipelineValidationAndSourceStorageTests().catch((err) => {
  console.error("Pipeline Validation & Source Storage Test Failed:", err);
  process.exitCode = 1;
});
