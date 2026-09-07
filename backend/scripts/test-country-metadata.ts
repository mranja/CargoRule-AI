import { normalizeCountry, normalizeCountryFilters } from "../src/utils/country";
import { chunkDocument } from "../src/services/document/chunking";
import { createInMemoryVectorStore, matchesFilters } from "../src/services/retrieval/vectorStore";
import { retrieveRelevantChunks } from "../src/services/retrieval/retrieval";
import { buildRetrievalContext } from "../src/services/rag/contextBuilder";
import { executeRAG } from "../src/services/rag/answerGeneration";
import { embedChunks } from "../src/services/document/embedding";
import { generateQueryEmbedding } from "../src/services/query/queryEmbedding";
import { DocumentMetadata } from "../src/types/document";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function runCountryMetadataTests(): Promise<void> {
  console.log("==================================================");
  console.log("RUNNING COUNTRY METADATA & RETRIEVAL FLOW TESTS");
  console.log("==================================================");

  // 1. Country Normalization Utility Tests
  {
    console.log("1. Testing country normalization...");
    assert(normalizeCountry("DE") === "Germany", "DE should normalize to Germany");
    assert(normalizeCountry("deu") === "Germany", "deu should normalize to Germany");
    assert(normalizeCountry("Germany") === "Germany", "Germany should normalize to Germany");
    assert(normalizeCountry("Deutschland") === "Germany", "Deutschland should normalize to Germany");
    assert(normalizeCountry("FR") === "France", "FR should normalize to France");
    assert(normalizeCountry("USA") === "United States", "USA should normalize to United States");
    assert(normalizeCountry("UK") === "United Kingdom", "UK should normalize to United Kingdom");
    assert(normalizeCountry("IN") === "India", "IN should normalize to India");
    assert(normalizeCountry("JP") === "Japan", "JP should normalize to Japan");
    assert(normalizeCountry(undefined) === undefined, "undefined should remain undefined");
    assert(normalizeCountry(null) === undefined, "null should return undefined");
    assert(normalizeCountry("") === undefined, "empty string should return undefined");
    assert(normalizeCountry("all") === undefined, "'all' should return undefined");
    assert(normalizeCountry("none") === undefined, "'none' should return undefined");

    // Filter list normalization
    const filters = normalizeCountryFilters(["de", "FR", "unknownland"]);
    assert(Array.isArray(filters), "filters should be an array");
    assert(filters.includes("Germany"), "filters should contain Germany");
    assert(filters.includes("France"), "filters should contain France");
    assert(filters.includes("Unknownland"), "filters should contain Unknownland");
    console.log("   ✓ Country normalization tests passed");
  }

  // 2. Chunking & Country Metadata Preservation
  {
    console.log("2. Testing chunking with country metadata preservation...");
    const sampleText =
      "TEST FIXTURE SECTION 1: Germany customs requires declaration for all commercial imports.\n\n" +
      "TEST FIXTURE SECTION 2: Hazardous goods must carry JCAB air waybill certificates.";

    // Document with country
    const metaWithCountry: DocumentMetadata = {
      documentName: "Germany Import Guide",
      country: normalizeCountry("DE"),
      carrier: "DHL",
      documentType: "Customs Regulation",
      version: "1.0",
    };

    const chunksWithCountry = chunkDocument(sampleText, {
      documentId: "doc-de-001",
      metadata: metaWithCountry,
    });

    assert(chunksWithCountry.length > 0, "Should generate chunks");
    for (const chunk of chunksWithCountry) {
      assert(chunk.metadata.country === "Germany", "Chunk must retain normalized country 'Germany'");
      assert(chunk.metadata.documentName === "Germany Import Guide", "Chunk must retain documentName");
      assert(chunk.metadata.carrier === "DHL", "Chunk must retain carrier");
    }

    // Document without country
    const metaWithoutCountry: DocumentMetadata = {
      documentName: "Universal Carrier Standard",
      country: normalizeCountry(undefined),
      carrier: "All",
      documentType: "Carrier Agreement",
    };

    const chunksWithoutCountry = chunkDocument(sampleText, {
      documentId: "doc-nocountry-002",
      metadata: metaWithoutCountry,
    });

    assert(chunksWithoutCountry.length > 0, "Should generate chunks without country");
    for (const chunk of chunksWithoutCountry) {
      assert(chunk.metadata.country === undefined, "Chunk without country must have undefined country (not invented value)");
    }
    console.log("   ✓ Chunking and metadata preservation tests passed");
  }

  // 3. Vector Store Ingestion and Filter Matching
  const vectorStore = createInMemoryVectorStore();

  // Create test chunks for Germany, France, and Global (no country)
  const deMeta: DocumentMetadata = {
    documentName: "German Customs Compliance",
    country: "Germany",
    carrier: "DHL",
  };
  const frMeta: DocumentMetadata = {
    documentName: "French Customs Compliance",
    country: "France",
    carrier: "FedEx",
  };
  const globalMeta: DocumentMetadata = {
    documentName: "Global Air Cargo Protocol",
    country: undefined, // missing country
    carrier: "All",
  };

  const deChunks = chunkDocument(
    "TEST FIXTURE: German customs clearance requires electronic ATLAS declaration and VAT ID for commercial goods.",
    { documentId: "doc-de", metadata: deMeta }
  );
  const frChunks = chunkDocument(
    "TEST FIXTURE: French import policies mandate Triman logo recycling declarations and Delta customs filing.",
    { documentId: "doc-fr", metadata: frMeta }
  );
  const globalChunks = chunkDocument(
    "TEST FIXTURE: International air cargo transport rules mandate lithium battery UN3480 packaging standards globally.",
    { documentId: "doc-global", metadata: globalMeta }
  );

  const allChunks = [...deChunks, ...frChunks, ...globalChunks];
  const allEmbeddings = await embedChunks(allChunks);
  await vectorStore.upsert(allChunks, allEmbeddings);

  assert((await vectorStore.count()) === allChunks.length, "All chunks should be indexed");

  // 4. matchesFilters unit checks
  {
    console.log("3. Testing vectorStore filter matching with country...");
    assert(matchesFilters(deMeta, { country: ["Germany"] }) === true, "Germany doc matches ['Germany']");
    assert(matchesFilters(deMeta, { country: ["de"] }) === true, "Germany doc matches ['de'] (ISO code)");
    assert(matchesFilters(deMeta, { country: ["France"] }) === false, "Germany doc does not match ['France']");
    assert(matchesFilters(globalMeta, { country: ["Germany"] }) === false, "Doc without country does not match country filter");
    assert(matchesFilters(globalMeta, undefined) === true, "Doc without country matches when no filter applied");
    assert(matchesFilters(globalMeta, { country: [] }) === true, "Empty country filter matches all");
    console.log("   ✓ Filter matching unit tests passed");
  }

  // 5. Retrieval with Country Filtering
  {
    console.log("4. Testing retrieval pipeline with country filters...");
    const queryVector = await generateQueryEmbedding("What are customs declaration requirements?");

    // Search with country filter: Germany
    const deResults = await retrieveRelevantChunks(
      queryVector,
      { country: ["Germany"] },
      5,
      vectorStore
    );
    assert(deResults.length > 0, "Should retrieve Germany chunks");
    for (const chunk of deResults) {
      assert(chunk.metadata.country === "Germany", "All retrieved chunks must have country='Germany'");
    }

    // Search with country filter using ISO code: "FR"
    const frResults = await retrieveRelevantChunks(
      queryVector,
      { country: ["fr"] },
      5,
      vectorStore
    );
    assert(frResults.length > 0, "Should retrieve France chunks using ISO code");
    for (const chunk of frResults) {
      assert(chunk.metadata.country === "France", "All retrieved chunks must have country='France'");
    }

    // Search with NO country filter
    const allResults = await retrieveRelevantChunks(
      queryVector,
      undefined,
      10,
      vectorStore
    );
    assert(allResults.length === allChunks.length, "Should retrieve chunks from all countries when no filter");
    const retrievedCountries = allResults.map((c) => c.metadata.country);
    assert(retrievedCountries.includes("Germany"), "Results contain Germany chunk");
    assert(retrievedCountries.includes("France"), "Results contain France chunk");
    assert(retrievedCountries.includes(undefined), "Results contain chunk with missing country");
    console.log("   ✓ Retrieval with and without country filters passed");
  }

  // 6. Context Builder & Citation Country Metadata Preservation
  {
    console.log("5. Testing context builder and citations country preservation...");
    const queryVector = await generateQueryEmbedding("customs ATLAS and Triman rules");
    const retrieved = await retrieveRelevantChunks(queryVector, undefined, 5, vectorStore);
    const context = buildRetrievalContext(retrieved);

    assert(context.sourcesList.length === retrieved.length, "sourcesList length matches");
    for (let i = 0; i < context.sourcesList.length; i++) {
      const source = context.sourcesList[i];
      const chunk = retrieved[i];
      assert(source.country === chunk.metadata.country, `Source ${i} country matches chunk country`);
      assert(source.documentName === chunk.metadata.documentName, `Source ${i} documentName matches`);
    }
    console.log("   ✓ Context builder and sourcesList preservation passed");
  }

  // 7. Full RAG Execution Chain (Document -> Chunk -> Vector -> Retrieval -> RAG -> Citation)
  {
    console.log("6. Testing end-to-end RAG with country metadata...");
    const ragResult = await executeRAG(
      {
        question: "What customs declarations are required in Germany?",
        filters: { country: ["Germany"] },
      },
      { vectorStore }
    );

    assert(ragResult.retrievalResponse.retrievedChunks.length > 0, "RAG retrieved chunks");
    assert(
      ragResult.retrievalResponse.retrievedChunks[0].metadata.country === "Germany",
      "Top retrieved chunk has country='Germany'"
    );

    // Citations in sourcesList
    assert(ragResult.context.sourcesList.length > 0, "sourcesList populated");
    assert(
      ragResult.context.sourcesList[0].country === "Germany",
      "Citation sourcesList preserves country='Germany'"
    );

    console.log("   ✓ Full RAG pipeline country preservation passed");
  }

  console.log("\n==================================================");
  console.log("ALL COUNTRY METADATA & RETRIEVAL TESTS PASSED!");
  console.log("==================================================");
}

runCountryMetadataTests().catch((err) => {
  console.error("Country metadata test failed:", err);
  process.exitCode = 1;
});
