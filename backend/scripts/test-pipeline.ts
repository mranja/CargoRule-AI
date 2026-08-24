import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { cleanText } from "../src/services/document/cleaning";
import { chunkDocument } from "../src/services/document/chunking";
import { processDocument } from "../src/services/document/processing";

async function testCleaning(): Promise<void> {
  const messy = "Line one\r\n\r\nLine   two\t\twith   spaces";
  const cleaned = cleanText(messy);
  if (!cleaned.includes("Line one") || cleaned.includes("   ")) {
    throw new Error("Cleaning test failed");
  }
  console.log("Cleaning test passed");
}

async function testChunking(): Promise<void> {
  const text = "Section A\n\nParagraph one content here.\n\nParagraph two content here.";
  const chunks = chunkDocument(text, {
    documentId: "test_doc",
    metadata: { documentName: "Test Document", documentType: "Test" },
    sizeTokens: 50,
    overlapTokens: 10,
  });
  if (chunks.length === 0 || chunks[0].chunkIndex !== 0) {
    throw new Error("Chunking test failed");
  }
  console.log("Chunking test passed");
}

async function testFullPipeline(): Promise<void> {
  const filePath = path.join(os.tmpdir(), `cargorule-pipeline-${process.pid}.txt`);
  const content = [
    "Document Title",
    "",
    "Section 1.1 Requirements",
    "",
    "First paragraph of requirements text.",
    "",
    "Second paragraph with additional detail.",
  ].join("\n");

  await fs.writeFile(filePath, content, "utf8");
  try {
    const result = await processDocument({
      filePath,
      documentId: "test_doc",
      metadata: {
        documentName: "Pipeline Test",
        documentType: "Test",
      },
    });

    if (result.chunks.length === 0 || result.stats.chunkCount === 0) {
      throw new Error("Pipeline produced no chunks");
    }
    console.log("Full pipeline test passed", result.stats);
  } finally {
    await fs.rm(filePath, { force: true });
  }
}

async function main(): Promise<void> {
  await testCleaning();
  await testChunking();
  await testFullPipeline();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
