import { RetrievedChunk, RetrievalContextForLLM } from "../../types/retrieval";

/**
 * Builds structured LLM context from an array of retrieved document chunks.
 *
 * Formats chunks with numbering, document metadata, citations, token estimation,
 * and retrieval confidence.
 *
 * @param chunks - Array of retrieved chunks ranked by relevance
 * @returns Structured RetrievalContextForLLM
 */
export function buildRetrievalContext(chunks: RetrievedChunk[]): RetrievalContextForLLM {
  if (!chunks || chunks.length === 0) {
    return {
      context: "No relevant documents found in the database.",
      chunks: [],
      sourcesSummary: "No sources retrieved.",
      sourcesList: [],
      estimatedTokenCount: 0,
      confidenceScore: 0,
      recommendations: [
        "No matching regulations or policies found. Please consult your compliance officer or upload relevant documents.",
      ],
    };
  }

  const contextSegments: string[] = [];
  const sourcesList: RetrievalContextForLLM["sourcesList"] = [];
  const documentNames = new Set<string>();

  chunks.forEach((chunk, index) => {
    const meta = chunk.metadata;
    const docName = meta?.documentName || "Unknown Document";
    documentNames.add(docName);

    const sectionStr = meta?.section ? `Section: ${meta.section}` : undefined;
    const pageStr = meta?.pageNumber !== undefined ? `Page: ${meta.pageNumber}` : undefined;
    const versionStr = meta?.version ? `Version: ${meta.version}` : undefined;
    const countryStr = meta?.country ? `Country: ${meta.country}` : undefined;
    const carrierStr = meta?.carrier ? `Carrier: ${meta.carrier}` : undefined;

    const metaParts = [docName, sectionStr, pageStr, versionStr, countryStr, carrierStr].filter(
      Boolean
    );
    const header = `[${index + 1}] ${metaParts.join(", ")}`;

    contextSegments.push(`${header}\nContent:\n${chunk.content.trim()}`);

    sourcesList.push({
      documentName: docName,
      section: meta?.section,
      pageNumber: meta?.pageNumber,
      relevanceScore: chunk.relevanceScore,
    });
  });

  const formattedContext = [
    "=== RETRIEVED LOGISTICS CONTEXT ===",
    "",
    ...contextSegments,
    "",
    "=== END CONTEXT ===",
  ].join("\n");

  // Rough estimation: ~4 characters per token
  const estimatedTokenCount = Math.ceil(formattedContext.length / 4);

  // Calculate confidence score based on average relevance score
  const avgScore =
    chunks.reduce((sum, chunk) => sum + chunk.relevanceScore, 0) / chunks.length;
  const confidenceScore = Math.max(0, Math.min(1, avgScore));

  const sourcesSummary = `Retrieved ${chunks.length} chunk${
    chunks.length > 1 ? "s" : ""
  } from ${documentNames.size} document${documentNames.size > 1 ? "s" : ""}: ${Array.from(
    documentNames
  ).join(", ")}`;

  const recommendations: string[] = [];
  if (avgScore < 0.3) {
    recommendations.push(
      "The retrieved documents have relatively low relevance scores. Results should be verified carefully."
    );
  }

  return {
    context: formattedContext,
    chunks,
    sourcesSummary,
    sourcesList,
    estimatedTokenCount,
    confidenceScore,
    recommendations: recommendations.length > 0 ? recommendations : undefined,
  };
}
