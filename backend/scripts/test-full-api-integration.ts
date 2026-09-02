import http from "http";
import app from "../src/server";
import { documentStore } from "../src/services/document/documentStore";

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

async function runApiIntegrationTests(): Promise<void> {
  console.log("==================================================");
  console.log("STARTING FULL END-TO-END REST API INTEGRATION TEST");
  console.log("==================================================");

  // Initialize sample data
  await documentStore.initialize();

  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));

  try {
    // 1. Root & Retrieval Health
    {
      const res = await makeRequest(server, "/health");
      assert(res.status === 200, "GET /health should return 200");
      assert(res.data.status === "ok", "Service status should be ok");
      console.log("1. GET /health: Passed");
    }

    // 2. Documents List
    let existingDocId = "";
    {
      const res = await makeRequest(server, "/api/documents");
      assert(res.status === 200, "GET /api/documents should return 200");
      assert(Array.isArray(res.data.documents), "documents should be an array");
      assert(res.data.documents.length >= 3, "should list seeded fixtures");
      existingDocId = res.data.documents[0].id;
      console.log(`2. GET /api/documents: Passed (${res.data.documents.length} docs found)`);
    }

    // 3. Document Details by ID
    {
      const res = await makeRequest(server, `/api/documents/${existingDocId}`);
      assert(res.status === 200, `GET /api/documents/${existingDocId} should return 200`);
      assert(res.data.document.id === existingDocId, "Returned doc ID should match");
      assert(res.data.chunks.length > 0, "Document chunks should be returned");
      console.log("3. GET /api/documents/:id: Passed");
    }

    // 4. Document Ingestion / Upload (POST /api/documents/upload)
    let newDocId = "";
    {
      const payload = {
        documentName: "Japan Aviation Compliance Agreement",
        fileName: "japan-aviation.txt",
        fileType: "txt",
        fileContent:
          "TEST FIXTURE: Japan Civil Aviation Bureau requires all air cargo containing hazardous goods to carry JCAB Form A-19 and airway bill declaration effective 2026-05-01.",
        country: "Japan",
        carrier: "All",
        documentType: "Aviation Agreement",
        effectiveDate: "2026-05-01",
        version: "v1.0",
      };

      const res = await makeRequest(server, "/api/documents/upload", "POST", payload);
      assert(res.status === 201, "POST /api/documents/upload should return 201");
      assert(res.data.document.status === "indexed", "Document status should be indexed");
      newDocId = res.data.document.id;
      console.log(`4. POST /api/documents/upload: Passed (created ${newDocId})`);
    }

    // 5. RAG Question Answering (POST /api/rag/ask)
    {
      const payload = {
        question: "What form is required by Japan Civil Aviation Bureau for air cargo?",
        filters: { country: "Japan" },
      };

      const res = await makeRequest(server, "/api/rag/ask", "POST", payload);
      assert(res.status === 200, "POST /api/rag/ask should return 200");
      assert(res.data.success === true, "Response should indicate success");
      assert(res.data.sources.length > 0, "Should return grounded sources");
      assert(
        res.data.sources[0].documentTitle === "Japan Aviation Compliance Agreement",
        "Top source should be Japan Aviation Agreement"
      );
      console.log("5. POST /api/rag/ask: Passed (Grounded answer returned with citations)");
    }

    // 6. Query History Audit Trail (GET /api/history)
    {
      const res = await makeRequest(server, "/api/history");
      assert(res.status === 200, "GET /api/history should return 200");
      assert(res.data.queries.length > 0, "History should contain the recent query");
      assert(
        res.data.queries[0].question.includes("Japan"),
        "History item question matches"
      );
      console.log(`6. GET /api/history: Passed (${res.data.queries.length} query records recorded)`);
    }

    // 7. Dashboard Metrics & Stats (GET /api/dashboard/stats)
    {
      const res = await makeRequest(server, "/api/dashboard/stats");
      assert(res.status === 200, "GET /api/dashboard/stats should return 200");
      assert(res.data.kpi.length === 4, "Should return 4 KPI cards");
      assert(res.data.recentDocuments.length > 0, "Recent documents list returned");
      assert(res.data.recentQueries.length > 0, "Recent queries list returned");
      console.log("7. GET /api/dashboard/stats: Passed");
    }

    // 8. Coverage Endpoints (GET /api/coverage/countries & /api/coverage/carriers)
    {
      const resCountries = await makeRequest(server, "/api/coverage/countries");
      assert(resCountries.status === 200, "GET /api/coverage/countries should return 200");
      assert(resCountries.data.countries.length > 0, "Countries list returned");

      const resCarriers = await makeRequest(server, "/api/coverage/carriers");
      assert(resCarriers.status === 200, "GET /api/coverage/carriers should return 200");
      assert(resCarriers.data.carriers.length > 0, "Carriers list returned");

      console.log("8. GET /api/coverage/*: Passed");
    }

    // 9. Document Deletion (DELETE /api/documents/:id)
    {
      const res = await makeRequest(server, `/api/documents/${newDocId}`, "DELETE");
      assert(res.status === 200, "DELETE /api/documents/:id should return 200");
      console.log("9. DELETE /api/documents/:id: Passed");
    }

    console.log("\n==================================================");
    console.log("ALL REST API INTEGRATION TESTS PASSED SUCCESSFULLY");
    console.log("==================================================");
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

runApiIntegrationTests().catch((err) => {
  console.error("API Integration Test Failed:", err);
  process.exitCode = 1;
});
