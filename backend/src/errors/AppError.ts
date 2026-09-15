export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
    isOperational = true,
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required. Please provide a valid Bearer token.", details?: unknown) {
    super(message, 401, "AUTHENTICATION_REQUIRED", true, details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Access denied. Insufficient permissions for this resource.", details?: unknown) {
    super(message, 403, "FORBIDDEN", true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "The requested resource was not found.", code = "NOT_FOUND", details?: unknown) {
    super(message, 404, code, true, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 409, "CONFLICT", true, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests. Please slow down and try again later.", details?: unknown) {
    super(message, 429, "RATE_LIMITED", true, details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, statusCode = 502, code = "EXTERNAL_SERVICE_ERROR", details?: unknown) {
    super(message, statusCode, code, true, details);
  }
}

export class EmbeddingError extends AppError {
  constructor(message = "The embedding service is temporarily unavailable or returned invalid output.", statusCode = 503, details?: unknown) {
    super(message, statusCode, "EMBEDDING_SERVICE_UNAVAILABLE", true, details);
  }
}

export class VectorStoreError extends AppError {
  constructor(message = "The vector database service encountered an error.", statusCode = 503, details?: unknown) {
    super(message, statusCode, "VECTOR_DB_UNAVAILABLE", true, details);
  }
}

export class LLMError extends AppError {
  constructor(message = "The AI service is temporarily unavailable. Please try again.", statusCode = 503, details?: unknown) {
    super(message, statusCode, "LLM_SERVICE_UNAVAILABLE", true, details);
  }
}

export class RetrievalError extends AppError {
  constructor(message = "Failed to retrieve relevant compliance documents.", statusCode = 500, details?: unknown) {
    super(message, statusCode, "RETRIEVAL_FAILED", true, details);
  }
}

export class DocumentProcessingError extends AppError {
  constructor(message: string, statusCode = 422, details?: unknown) {
    super(message, statusCode, "DOCUMENT_PROCESSING_FAILED", true, details);
  }
}
