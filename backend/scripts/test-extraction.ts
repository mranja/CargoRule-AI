import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { extractText } from "../src/services/document/extraction";

async function main(): Promise<void> {
  const filePath = path.join(os.tmpdir(), `cargorule-extraction-${process.pid}.txt`);
  await fs.writeFile(filePath, "Customs Documentation\n\nA commercial invoice is required.", "utf8");
  try {
    const document = await extractText(filePath);
    if (!document.text.trim() || document.metadata.fileType !== "txt" || !document.metadata.fileName) {
      throw new Error("Extraction validation failed");
    }
    console.log("Text extraction test passed");
  } finally {
    await fs.rm(filePath, { force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});