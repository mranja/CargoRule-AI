import { LLMConfig } from "../../config/rag.config";
import {
  RetrievalContextForLLM,
  RetrievalFilters,
  RetrievalParameters,
  RetrievalQuery,
  RetrievalResponse,
} from "../../types/retrieval";
import { EmbeddingClient } from "../document/embedding";
import {
  ChatCompletionOptions,
  ChatCompletionUsage,
  ChatMessage,
  getDefaultLLMClient,
  LLMClient,
} from "../llm";
import { retrieveForQuery, VectorStore } from "../retrieval";
import { buildRetrievalContext } from "./contextBuilder";

export interface AnswerGenerationResult {
  answer: string;
  sourcesSummary: string;
  sourcesList: RetrievalContextForLLM["sourcesList"];
  context: RetrievalContextForLLM;
  model: string;
  usage?: ChatCompletionUsage;
}

export interface RAGExecutionOptions {
  llmClient?: LLMClient;
  embeddingClient?: EmbeddingClient;
  vectorStore?: VectorStore;
  systemPrompt?: string;
  modelOptions?: ChatCompletionOptions;
}

export interface RAGResult {
  query: string;
  answer: string;
  sourcesSummary: string;
  sourcesList: RetrievalContextForLLM["sourcesList"];
  retrievalResponse: RetrievalResponse;
  context: RetrievalContextForLLM;
  model: string;
  usage?: ChatCompletionUsage;
}

/**
 * Constructs chat messages for the OpenAI-compatible chat completions endpoint.
 */
export function constructPromptMessages(
  question: string,
  context: RetrievalContextForLLM,
  systemPrompt: string = LLMConfig.systemPrompt
): ChatMessage[] {
  const userContent = [
    `Context:\n${context.context}`,
    "",
    `Question: ${question.trim()}`,
    "",
    "Answer the question using only the provided context following all instructions.",
  ].join("\n");

  return [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: userContent,
    },
  ];
}

/**
 * Generates an answer from pre-retrieved context using the LLM client.
 */
export async function generateAnswer(
  question: string,
  context: RetrievalContextForLLM,
  options: {
    llmClient?: LLMClient;
    systemPrompt?: string;
    modelOptions?: ChatCompletionOptions;
  } = {}
): Promise<AnswerGenerationResult> {
  const client = options.llmClient || getDefaultLLMClient();
  const systemPrompt = options.systemPrompt || LLMConfig.systemPrompt;

  const messages = constructPromptMessages(question, context, systemPrompt);
  const completion = await client.generateChatCompletion(messages, options.modelOptions);

  return {
    answer: completion.content,
    sourcesSummary: context.sourcesSummary,
    sourcesList: context.sourcesList,
    context,
    model: completion.model,
    usage: completion.usage,
  };
}

/**
 * Executes the full RAG workflow:
 * 1. Retrieves relevant document chunks via vector search & metadata filtering
 * 2. Builds structured context with citations & metadata
 * 3. Constructs formatted prompt messages
 * 4. Calls OpenAI-compatible LLM endpoint to generate answer
 */
export async function executeRAG(
  query: string | RetrievalQuery,
  options: RAGExecutionOptions = {}
): Promise<RAGResult> {
  const questionText = typeof query === "string" ? query : query.question;

  // Step 1: Retrieval
  const retrievalResponse = await retrieveForQuery(query, {
    embeddingClient: options.embeddingClient,
    vectorStore: options.vectorStore,
  });

  // Step 2: Context Construction
  const context = buildRetrievalContext(retrievalResponse.retrievedChunks);

  // Step 3: LLM Generation
  const answerResult = await generateAnswer(questionText, context, {
    llmClient: options.llmClient,
    systemPrompt: options.systemPrompt,
    modelOptions: options.modelOptions,
  });

  return {
    query: questionText,
    answer: answerResult.answer,
    sourcesSummary: answerResult.sourcesSummary,
    sourcesList: answerResult.sourcesList,
    retrievalResponse,
    context,
    model: answerResult.model,
    usage: answerResult.usage,
  };
}
