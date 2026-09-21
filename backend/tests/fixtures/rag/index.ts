import fs from "fs";
import path from "path";

export interface TestDocumentFixture {
  id: string;
  filePath: string;
  fileName: string;
  documentName: string;
  country?: string;
  carrier?: string;
  documentType: string;
  effectiveDate: string;
  version: string;
}

function resolveFixturePath(filename: string): string {
  // If running from src (dev) or files are colocated with this module
  const directPath = path.join(__dirname, filename);
  if (fs.existsSync(directPath)) return directPath;

  // If running from compiled dist (e.g. dist/tests/fixtures/rag/ -> tests/fixtures/rag/)
  const fromDistPath = path.resolve(__dirname, "../../../tests/fixtures/rag", filename);
  if (fs.existsSync(fromDistPath)) return fromDistPath;

  // Fallback relative to project working directory
  const fromCwdPath = path.resolve(process.cwd(), "tests/fixtures/rag", filename);
  if (fs.existsSync(fromCwdPath)) return fromCwdPath;

  return directPath;
}

export const FIXTURES_DIR = fs.existsSync(path.join(__dirname, "germany-customs.txt"))
  ? path.resolve(__dirname)
  : (fs.existsSync(path.resolve(__dirname, "../../../tests/fixtures/rag", "germany-customs.txt"))
      ? path.resolve(__dirname, "../../../tests/fixtures/rag")
      : path.resolve(process.cwd(), "tests/fixtures/rag"));

export const SAMPLE_DOCUMENTS: TestDocumentFixture[] = [
  {
    id: "doc_germany_customs_001",
    filePath: resolveFixturePath("germany-customs.txt"),
    fileName: "germany-customs.txt",
    documentName: "Germany Customs Regulation",
    country: "Germany",
    documentType: "Customs Regulation",
    effectiveDate: "2026-01-01",
    version: "v2.4",
  },
  {
    id: "doc_dhl_lithium_002",
    filePath: resolveFixturePath("dhl-lithium-policy.txt"),
    fileName: "dhl-lithium-policy.txt",
    documentName: "DHL Express Lithium Battery Shipping Policy",
    carrier: "DHL",
    documentType: "Shipping Policy",
    effectiveDate: "2025-06-01",
    version: "v3.1",
  },
  {
    id: "doc_france_import_003",
    filePath: resolveFixturePath("france-import-policy.txt"),
    fileName: "france-import-policy.txt",
    documentName: "France Import Customs Policy",
    country: "France",
    documentType: "Customs Regulation",
    effectiveDate: "2026-03-01",
    version: "v1.8",
  },
];
