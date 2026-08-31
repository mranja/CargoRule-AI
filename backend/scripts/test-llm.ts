import { LLMConfig, EmbeddingConfig } from "../src/config/rag.config";
import { DocumentChunk, Embedding } from "../src/types/document";
import {
  createOpenAICompatibleLLMClient,
  ChatMessage,
} from "../src/services/llm";
import {
  buildRetrievalContext,
  constructPromptMessages,
  generateAnswer,
  executeRAG,
} from "../src/services/rag";
import { createInMemoryVectorStore } from "../src/services/retrieval";
import {
  FIXTURE_LITHIUM_DOCS,
  FIXTURE_LITHIUM_QUERY,
  FIXTURE_LITHIUM_RELATED,
  FIXTURE_UNRELATED_WAREHOUSE,
} from "./fixtures/embedding-samples";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const FIXTURE_VOCAB = Array.from(
  new Set(
    [
      FIXTURE_LITHIUM_DOCS,
      FIXTURE_LITHIUM_RELATED,
      FIXTURE_UNRELATED_WAREHOUSE,
      FIXTURE_LITHIUM_QUERY,
    ]
      .join(" ")
      .toLowerCase()
      .match(/[a-z0-9]+/g) ?? []
  )
).filter((token) => token !== "test" && token !== "fixture");

function tokenVector(text: string): number[] {
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  const vector = FIXTURE_VOCAB.map((word) => counts.get(word) ?? 0);
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / norm);
}

function createSampleStore() {
  const chunks: DocumentChunk[] = [
    {
      id: "doc_lithium_001",
      documentId: "doc_germany_customs",
      content: FIXTURE_LITHIUM_DOCS,
      chunkIndex: 0,
      metadata: {
        documentName: "Germany Customs Regulation",
        country: "Germany",
        carrier: "DHL",
        documentType: "Customs Regulation",
        section: "Lithium Batteries",
        pageNumber: 14,
        effectiveDate: "2026-01-01",
        version: "v2",
      },
    },
  ];

  const embeddings: Embedding[] = chunks.map((c) => ({
    chunkId: c.id,
    vector: tokenVector(c.content),
    embeddingModel: EmbeddingConfig.model,
  }));

  const store = createInMemoryVectorStore();
  store.upsert(chunks, embeddings);
  return store;
}

async function testOpenAICompatibleClientContract(): Promise<void> {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; headers: HeadersInit; body: Record<string, unknown> }> = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    requests.push({ url: String(input), headers: init?.headers ?? {}, body });
    return new Response(
      JSON.stringify({
        id: "chatcmpl-test-123",
        object: "chat.completion",
        created: 1700000000,
        model: "gpt-4",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content:
                "Lithium battery shipments require declaration form LI-001, SDS, and packaging compliance.\n\nSources:\n- Germany Customs Regulation, Section: Lithium Batteries, Page: 14, Version: v2",
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 120,
          completion_tokens: 45,
          total_tokens: 165,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }) as typeof fetch;

  try {
    const client = createOpenAICompatibleLLMClient({
      endpoint: "https://api.openai.com/v1/chat/completions",
      apiKey: "test-key-mock",
      model: "gpt-4",
    });

    const messages: ChatMessage[] = [
      { role: "system", content: "You are a logistics assistant." },
      { role: "user", content: "What are the rules for lithium batteries?" },
    ];

    const result = await client.generateChatCompletion(messages);
    assert(result.content.includes("Lithium battery"), "Generated answer content matches mock");
    assert(result.model === "gpt-4", "Model matches expected");
    assert(result.usage?.totalTokens === 165, "Usage tokens parsed correctly");

    assert(requests.length === 1, "Exactly 1 request made");
    assert(requests[0].url === "https://api.openai.com/v1/chat/completions", "Target URL matches");
    assert(requests[0].body.model === "gpt-4", "Payload model matches");
    assert(requests[0].body.stream === false, "Stream is false for non-streaming");

    console.log("OpenAI-compatible LLM client contract test passed");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testContextBuilder(): Promise<void> {
  const emptyContext = buildRetrievalContext([]);
  assert(emptyContext.chunks.length === 0, "Empty chunks handled cleanly");
  assert(emptyContext.confidenceScore === 0, "Confidence score 0 for empty context");

  const sampleChunk = {
    id: "doc_001",
    documentId: "doc_001",
    content: FIXTURE_LITHIUM_DOCS,
    chunkIndex: 0,
    relevanceScore: 0.88,
    rankingPosition: 1,
    metadata: {
      documentName: "Germany Customs Regulation",
      section: "Lithium Batteries",
      pageNumber: 14,
      country: "Germany",
      carrier: "DHL",
      version: "v2",
    },
  };

  const context = buildRetrievalContext([sampleChunk]);
  assert(context.context.includes("Germany Customs Regulation"), "Context includes document name");
  assert(context.context.includes("Section: Lithium Batteries"), "Context includes section");
  assert(context.sourcesList.length === 1, "Sources list contains 1 item");
  assert(context.sourcesList[0].documentName === "Germany Customs Regulation", "Source document name matches");
  assert(context.confidenceScore === 0.88, "Confidence score matches average relevance");

  console.log("Context builder unit tests passed");
}

async function testPromptConstructionAndAnswerGeneration(): Promise<void> {
  const sampleChunk = {
    id: "doc_001",
    documentId: "doc_001",
    content: FIXTURE_LITHIUM_DOCS,
    chunkIndex: 0,
    relevanceScore: 0.9,
    rankingPosition: 1,
    metadata: {
      documentName: "Germany Customs Regulation",
      section: "Lithium Batteries",
      pageNumber: 14,
      version: "v2",
    },
  };

  const context = buildRetrievalContext([sampleChunk]);
  const messages = constructPromptMessages(FIXTURE_LITHIUM_QUERY, context);

  assert(messages.length === 2, "Prompt contains system and user messages");
  assert(messages[0].role === "system", "First message is system role");
  assert(messages[1].role === "user", "Second message is user role");
  assert(messages[1].content.includes("Context:"), "User prompt includes context");
  assert(messages[1].content.includes(FIXTURE_LITHIUM_QUERY), "User prompt includes question");

  const mockLLMClient = {
    async generateChatCompletion(chatMessages: ChatMessage[]) {
      assert(chatMessages.length === 2, "Received 2 messages");
      return {
        content:
          "Lithium batteries require export declaration and packaging safety compliance.\n\nSources:\n- Germany Customs Regulation, Section: Lithium Batteries, Page: 14, Version: v2",
        model: "gpt-4",
        usage: { promptTokens: 100, completionTokens: 30, totalTokens: 130 },
      };
    },
  };

  const answerResult = await generateAnswer(FIXTURE_LITHIUM_QUERY, context, {
    llmClient: mockLLMClient,
  });

  assert(answerResult.answer.includes("Lithium batteries require"), "Answer generated correctly");
  assert(answerResult.sourcesList.length === 1, "Sources list matches context");
  assert(answerResult.model === "gpt-4", "Model name returned in result");

  console.log("Prompt construction and answer generation unit tests passed");
}

async function testFullRAGPipeline(): Promise<void> {
  const vectorStore = createSampleStore();

  const mockEmbeddingClient = {
    async embed(inputs: string[]) {
      return inputs.map((t) => tokenVector(t));
    },
  };

  const mockLLMClient = {
    async generateChatCompletion() {
      return {
        content:
          "Under Germany Customs Regulation, lithium battery shipments require declaration forms, safety data sheets, and verified packaging compliance.\n\nSources:\n- Germany Customs Regulation, Section: Lithium Batteries, Page: 14, Version: v2",
        model: "gpt-4",
        usage: { promptTokens: 150, completionTokens: 40, totalTokens: 190 },
      };
    },
  };

  const ragResult = await executeRAG(FIXTURE_LITHIUM_QUERY, {
    vectorStore,
    embeddingClient: mockEmbeddingClient,
    llmClient: mockLLMClient,
  });

  assert(ragResult.query === FIXTURE_LITHIUM_QUERY, "Query matches input");
  assert(ragResult.answer.includes("Germany Customs Regulation"), "Answer contains grounded information");
  assert(ragResult.retrievalResponse.retrievedChunksCount > 0, "Retrieval returned chunks");
  assert(ragResult.sourcesList.length > 0, "Sources list populated");
  assert(ragResult.model === "gpt-4", "Model recorded");

  console.log("Full RAG pipeline test passed", {
    query: ragResult.query,
    retrievedCount: ragResult.retrievalResponse.retrievedChunksCount,
    answerPreview: ragResult.answer.substring(0, 80) + "...",
  });
}

async function testLiveLLMIfConfigured(): Promise<void> {
  if (!LLMConfig.apiKey) {
    console.log("Skipping live LLM API call (OPENAI_API_KEY is not set)");
    return;
  }

  const sampleChunk = {
    id: "doc_001",
    documentId: "doc_001",
    content: FIXTURE_LITHIUM_DOCS,
    chunkIndex: 0,
    relevanceScore: 0.95,
    rankingPosition: 1,
    metadata: {
      documentName: "Germany Customs Regulation",
      section: "Lithium Batteries",
      pageNumber: 14,
      version: "v2",
    },
  };

  const context = buildRetrievalContext([sampleChunk]);
  const result = await generateAnswer(FIXTURE_LITHIUM_QUERY, context);

  assert(typeof result.answer === "string" && result.answer.length > 0, "Live answer must be a non-empty string");
  console.log("Live LLM API test passed", {
    model: result.model,
    answerPreview: result.answer.substring(0, 100) + "...",
    usage: result.usage,
  });
}

async function main(): Promise<void> {
  await testOpenAICompatibleClientContract();
  await testContextBuilder();
  await testPromptConstructionAndAnswerGeneration();
  await testFullRAGPipeline();
  await testLiveLLMIfConfigured();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
