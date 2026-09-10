import { execSync } from "child_process";
import path from "path";

const testScripts = [
  "scripts/test-extraction.ts",
  "scripts/test-pipeline.ts",
  "scripts/test-embeddings.ts",
  "scripts/test-query-embeddings.ts",
  "scripts/test-retrieval.ts",
  "scripts/test-retrieval-api.ts",
  "scripts/test-llm.ts",
  "scripts/test-complete-rag-pipeline.ts",
  "scripts/test-full-api-integration.ts",
  "scripts/test-country-metadata.ts",
  "scripts/test-document-carrier-integration.ts",
  "scripts/test-pipeline-validation-source-storage.ts",
  "scripts/test-admin-stats.ts",
];

console.log("==================================================");
console.log("RUNNING ALL CARGORULE AI TEST SUITES");
console.log("==================================================");

let totalPassed = 0;
let totalFailed = 0;

for (const script of testScripts) {
  const scriptName = path.basename(script);
  console.log(`\n▶ Running ${scriptName}...`);
  try {
    const tsNodeBin = path.join(__dirname, "..", "node_modules", "ts-node", "dist", "bin.js");
    execSync(`node "${tsNodeBin}" "${path.join(__dirname, "..", script)}"`, {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    });
    console.log(`✓ ${scriptName} passed.`);
    totalPassed++;
  } catch (error) {
    console.error(`✗ ${scriptName} failed.`);
    totalFailed++;
    process.exitCode = 1;
    break;
  }
}

console.log("\n==================================================");
console.log(`SUMMARY: ${totalPassed} passed, ${totalFailed} failed.`);
console.log("==================================================");

if (totalFailed > 0) {
  process.exit(1);
}
