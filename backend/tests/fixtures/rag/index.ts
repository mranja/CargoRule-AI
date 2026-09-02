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

export const FIXTURES_DIR = path.resolve(__dirname);

export const SAMPLE_DOCUMENTS: TestDocumentFixture[] = [
  {
    id: "doc_germany_customs_001",
    filePath: path.join(FIXTURES_DIR, "germany-customs.txt"),
    fileName: "germany-customs.txt",
    documentName: "Germany Customs Regulation",
    country: "Germany",
    documentType: "Customs Regulation",
    effectiveDate: "2026-01-01",
    version: "v2.4",
  },
  {
    id: "doc_dhl_lithium_002",
    filePath: path.join(FIXTURES_DIR, "dhl-lithium-policy.txt"),
    fileName: "dhl-lithium-policy.txt",
    documentName: "DHL Express Lithium Battery Shipping Policy",
    carrier: "DHL",
    documentType: "Shipping Policy",
    effectiveDate: "2025-06-01",
    version: "v3.1",
  },
  {
    id: "doc_france_import_003",
    filePath: path.join(FIXTURES_DIR, "france-import-policy.txt"),
    fileName: "france-import-policy.txt",
    documentName: "France Import Customs Policy",
    country: "France",
    documentType: "Customs Regulation",
    effectiveDate: "2026-03-01",
    version: "v1.8",
  },
];
