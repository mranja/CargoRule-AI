import { LLMConfig } from "../../config/rag.config";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  timeoutMs?: number;
}

export interface ChatCompletionUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  usage?: ChatCompletionUsage;
}

export interface LLMClient {
  generateChatCompletion(
    messages: ChatMessage[],
    options?: ChatCompletionOptions
  ): Promise<ChatCompletionResult>;
}

type OpenAIChatChoice = {
  index?: number;
  message?: {
    role?: string;
    content?: string;
  };
  finish_reason?: string;
};

type OpenAIChatResponse = {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: OpenAIChatChoice[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

function assertValidMessages(messages: ChatMessage[]): void {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("At least one chat message is required for completion");
  }

  for (const message of messages) {
    if (!message || typeof message.content !== "string" || !message.role) {
      throw new Error("Each chat message must have a valid role and string content");
    }
  }
}

/**
 * Creates an OpenAI-compatible LLM client for chat completions.
 *
 * Uses environment variables for defaults and supports custom endpoint/model configuration.
 */
export function createOpenAICompatibleLLMClient(
  options: {
    endpoint?: string;
    apiKey?: string;
    model?: string;
    timeoutMs?: number;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  } = {}
): LLMClient {
  const endpoint = options.endpoint || LLMConfig.apiEndpoint;
  const apiKey = options.apiKey || LLMConfig.apiKey;
  const defaultModel = options.model || LLMConfig.model;
  const defaultTimeoutMs = options.timeoutMs || LLMConfig.timeoutMs;
  const defaultTemperature = options.temperature ?? LLMConfig.temperature;
  const defaultMaxTokens = options.maxTokens ?? LLMConfig.maxTokens;
  const defaultTopP = options.topP ?? LLMConfig.topP;

  return {
    async generateChatCompletion(
      messages: ChatMessage[],
      callOptions: ChatCompletionOptions = {}
    ): Promise<ChatCompletionResult> {
      if (!apiKey) {
        throw new Error("LLM API key is not configured");
      }

      assertValidMessages(messages);

      const model = callOptions.model || defaultModel;
      const temperature = callOptions.temperature ?? defaultTemperature;
      const maxTokens = callOptions.maxTokens ?? defaultMaxTokens;
      const topP = callOptions.topP ?? defaultTopP;
      const timeoutMs = callOptions.timeoutMs || defaultTimeoutMs;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      let response: Response;
      try {
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            top_p: topP,
            stream: false,
          }),
          signal: controller.signal,
        });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw new Error(`LLM request timed out after ${timeoutMs}ms`);
        }
        throw error;
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        let errorBody = "";
        try {
          errorBody = await response.text();
        } catch {
          // Ignore read error
        }
        throw new Error(
          `LLM request failed with status ${response.status}${errorBody ? `: ${errorBody}` : ""}`
        );
      }

      const payload = (await response.json()) as OpenAIChatResponse;
      const choice = payload.choices?.[0];

      if (!choice?.message?.content) {
        throw new Error("LLM service returned an empty or invalid response");
      }

      return {
        content: choice.message.content,
        model: payload.model || model,
        usage: payload.usage
          ? {
              promptTokens: payload.usage.prompt_tokens,
              completionTokens: payload.usage.completion_tokens,
              totalTokens: payload.usage.total_tokens,
            }
          : undefined,
      };
    },
  };
}

let defaultLLMClientInstance: LLMClient | null = null;

/**
 * Returns the shared LLM client instance.
 */
export function getDefaultLLMClient(): LLMClient {
  if (!defaultLLMClientInstance) {
    defaultLLMClientInstance = createOpenAICompatibleLLMClient();
  }
  return defaultLLMClientInstance;
}
