import assert from "assert";
import http from "http";
import express from "express";
import { documentStore } from "../src/services/document/documentStore";
import { createInMemoryVectorStore, getDefaultVectorStore } from "../src/services/retrieval/vectorStore";
import { AdminStatsService } from "../src/services/admin/adminStats.service";
import statsRoutes from "../src/routes/stats.routes";

async function runAdminStatsTests() {
  console.log("==================================================");
  console.log("TESTING ADMIN DASHBOARD STATISTICS SERVICE & API");
  console.log("==================================================");

  // -------------------------------------------------------------
  // Test 1: Isolated Vector Store & AdminStatsService with controlled documents
  // -------------------------------------------------------------
  console.log("1. Testing AdminStatsService with controlled store...");
  const customVectorStore = createInMemoryVectorStore();

  // Initialize document store with default documents
  await documentStore.initialize();
  const initialDocs = documentStore.getAllDocuments();
  console.log(`   Initial seeded documents in documentStore: ${initialDocs.length}`);

  const initialStats = await AdminStatsService.getAdminDashboardStats(getDefaultVectorStore());
  
  // Validate structure of processing stats
  assert(typeof initialStats.processing.totalDocuments === "number", "totalDocuments should be number");
  assert(typeof initialStats.processing.processedDocuments === "number", "processedDocuments should be number");
  assert(typeof initialStats.processing.processingDocuments === "number", "processingDocuments should be number");
  assert(typeof initialStats.processing.failedDocuments === "number", "failedDocuments should be number");
  assert(typeof initialStats.processing.successRate === "number", "successRate should be number");
  assert(typeof initialStats.processing.failureRate === "number", "failureRate should be number");
  assert(!isNaN(initialStats.processing.successRate), "successRate must not be NaN");
  assert(!isNaN(initialStats.processing.failureRate), "failureRate must not be NaN");
  assert(Array.isArray(initialStats.processing.recentActivity), "recentActivity must be array");
  assert(Array.isArray(initialStats.processing.processingOverTime), "processingOverTime must be array");

  // Validate structure of vector database stats
  assert(typeof initialStats.vectorDatabase.totalDocumentsStored === "number", "totalDocumentsStored should be number");
  assert(typeof initialStats.vectorDatabase.totalChunksGenerated === "number", "totalChunksGenerated should be number");
  assert(typeof initialStats.vectorDatabase.totalVectorsStored === "number", "totalVectorsStored should be number");
  assert(typeof initialStats.vectorDatabase.averageVectorsPerDocument === "number", "averageVectorsPerDocument should be number");
  assert(typeof initialStats.vectorDatabase.averageChunksPerDocument === "number", "averageChunksPerDocument should be number");
  assert(!isNaN(initialStats.vectorDatabase.averageVectorsPerDocument), "avg vectors must not be NaN");
  assert(!isNaN(initialStats.vectorDatabase.averageChunksPerDocument), "avg chunks must not be NaN");

  // Validate indexing consistency stats
  const consistency = initialStats.vectorDatabase.indexingConsistency;
  assert(typeof consistency.successfullyIndexed === "number", "successfullyIndexed should be number");
  assert(typeof consistency.missingOrInconsistent === "number", "missingOrInconsistent should be number");
  assert(typeof consistency.orphanedVectors === "number", "orphanedVectors should be number");
  assert(typeof consistency.isConsistent === "boolean", "isConsistent should be boolean");
  assert(Array.isArray(consistency.perDocument), "perDocument must be array");

  // Validate distributions
  assert(Array.isArray(initialStats.vectorDatabase.distributions.byCarrier), "byCarrier must be array");
  assert(Array.isArray(initialStats.vectorDatabase.distributions.byCountry), "byCountry must be array");
  assert(Array.isArray(initialStats.vectorDatabase.distributions.byDocumentType), "byDocumentType must be array");

  // Validate vector DB health check
  const health = initialStats.vectorDatabase.vectorDbHealth;
  assert(health.status === "connected" || health.status === "degraded", "health status must be connected or degraded");
  assert(typeof health.latencyMs === "number", "latencyMs should be number");
  assert(health.latencyMs >= 0, "latencyMs must be >= 0");
  assert(typeof health.lastChecked === "string", "lastChecked should be string");
  console.log("   ✓ Baseline AdminStatsService structure validated");

  // -------------------------------------------------------------
  // Test 2: Ingest Document & verify real-time stat updates
  // -------------------------------------------------------------
  console.log("2. Testing real-time statistic updates upon ingestion...");
  const initialTotalDocs = initialStats.processing.totalDocuments;
  const initialTotalChunks = initialStats.vectorDatabase.totalChunksGenerated;
  const initialTotalVectors = initialStats.vectorDatabase.totalVectorsStored;

  const testDocId = `test-admin-doc-${Date.now()}`;
  const testDocContent = `
# Singapore Customs Import Guidelines 2026
Singapore Customs requires all high-value electronics and batteries to be declared prior to arrival.
Permits must be obtained through TradeNet.
Carrier agreement mandates express logistics clearance within 24 hours.
`;

  const newDoc = await documentStore.ingestDocument({
    documentId: testDocId,
    documentName: "Singapore Import Guidelines 2026",
    fileName: "singapore-guidelines.txt",
    fileContent: testDocContent,
    country: "Singapore",
    carrier: "Singapore Airlines Cargo",
    documentType: "Customs Regulation",
    version: "1.0",
  });

  assert.strictEqual(newDoc.status, "indexed", "Document status should be indexed");

  const updatedStats = await AdminStatsService.getAdminDashboardStats();
  assert.strictEqual(
    updatedStats.processing.totalDocuments,
    initialTotalDocs + 1,
    "totalDocuments should increase by 1"
  );
  assert(
    updatedStats.vectorDatabase.totalChunksGenerated > initialTotalChunks,
    "totalChunksGenerated should increase"
  );
  assert(
    updatedStats.vectorDatabase.totalVectorsStored > initialTotalVectors,
    "totalVectorsStored should increase"
  );
  assert(
    updatedStats.processing.successRate > 0,
    "successRate should be > 0"
  );

  // Check that Singapore appears in country distribution
  const sgDist = updatedStats.vectorDatabase.distributions.byCountry.find(
    (c) => c.name === "Singapore"
  );
  assert(sgDist, "Singapore should be present in byCountry distribution");
  assert(sgDist.documentCount >= 1, "Singapore docCount should be >= 1");
  assert(sgDist.chunkCount >= 1, "Singapore chunkCount should be >= 1");
  assert(sgDist.vectorCount >= 1, "Singapore vectorCount should be >= 1");

  // Check carrier distribution
  const carrierDist = updatedStats.vectorDatabase.distributions.byCarrier.find(
    (c) => c.name === "Singapore Airlines Cargo"
  );
  assert(carrierDist, "Singapore Airlines Cargo should be present in byCarrier distribution");

  // Check recent activity contains new document
  const recentItem = updatedStats.processing.recentActivity.find((r) => r.id === testDocId);
  assert(recentItem, "Newly ingested doc should appear in recentActivity");
  assert.strictEqual(recentItem.country, "Singapore");

  console.log("   ✓ Ingestion updates documents, vectors, chunks, distributions and recent activity");

  // -------------------------------------------------------------
  // Test 3: Failure handling and failure rate calculation
  // -------------------------------------------------------------
  console.log("3. Testing failure handling and failure rate calculation...");
  let failedCaught = false;
  try {
    await documentStore.ingestDocument({
      documentName: "Corrupted File Ingestion",
      fileName: "corrupt.pdf",
      fileBuffer: Buffer.from("invalid-binary-pdf-header-12345"),
      country: "Germany",
    });
  } catch (err) {
    failedCaught = true;
  }
  assert(failedCaught, "Ingestion of empty content should fail");

  const failedStats = await AdminStatsService.getAdminDashboardStats();
  assert(failedStats.processing.failedDocuments >= 1, "failedDocuments should be >= 1");
  assert(failedStats.processing.failureRate > 0, "failureRate should be > 0");

  const failedActivity = failedStats.processing.recentActivity.find(
    (r) => r.status === "error" || r.status === "failed"
  );
  assert(failedActivity, "Failed document should be logged in recentActivity with status error");
  assert(failedActivity.errorMessage, "Failed activity should record errorMessage");
  console.log("   ✓ Failed ingestion recorded in failure rate and recent activity feed");

  // -------------------------------------------------------------
  // Test 4: Document Deletion & Vector purge consistency
  // -------------------------------------------------------------
  console.log("4. Testing deletion and synchronization consistency...");
  const beforeDeleteStats = await AdminStatsService.getAdminDashboardStats();
  const deleteResult = await documentStore.deleteDocument(testDocId);
  assert(deleteResult.success, "deleteDocument should succeed");

  const afterDeleteStats = await AdminStatsService.getAdminDashboardStats();
  assert.strictEqual(
    afterDeleteStats.processing.totalDocuments,
    beforeDeleteStats.processing.totalDocuments - 1,
    "totalDocuments should decrement after deletion"
  );
  assert.strictEqual(
    afterDeleteStats.vectorDatabase.indexingConsistency.orphanedVectors,
    0,
    "orphanedVectors must be 0 after clean deletion"
  );
  console.log("   ✓ Deletion safely synchronized vector store with 0 orphaned vectors");

  // -------------------------------------------------------------
  // Test 5: REST API HTTP Endpoint (GET /api/admin/stats)
  // -------------------------------------------------------------
  console.log("5. Testing REST API endpoint GET /api/admin/stats...");
  const app = express();
  app.use(express.json());
  app.use("/api", statsRoutes);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as { port: number }).port;

  const res = await fetch(`http://localhost:${port}/api/admin/stats`);
  assert.strictEqual(res.status, 200, "GET /api/admin/stats must return HTTP 200");

  const data = await res.json();
  assert.strictEqual(data.success, true, "Response must indicate success: true");
  assert(data.stats, "Response must include stats object");
  assert(data.stats.processing, "stats.processing must be defined");
  assert(data.stats.vectorDatabase, "stats.vectorDatabase must be defined");
  assert(data.stats.generatedAt, "stats.generatedAt must be defined");
  assert(typeof data.stats.vectorDatabase.vectorDbHealth.latencyMs === "number");

  server.close();
  console.log("   ✓ REST API GET /api/admin/stats successfully served real data");

  console.log("\n==================================================");
  console.log("ALL ADMIN DASHBOARD STATISTICS TESTS PASSED!");
  console.log("==================================================");
}

runAdminStatsTests().catch((error) => {
  console.error("ADMIN STATS TESTS FAILED:", error);
  process.exit(1);
});
