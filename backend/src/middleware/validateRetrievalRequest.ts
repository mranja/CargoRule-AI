import { Request, Response, NextFunction } from "express";

/**
 * Validates request payload for retrieval search endpoints.
 */
export function validateRetrievalRequest(req: Request, res: Response, next: NextFunction): void {
  const body = req.body;

  if (!body || typeof body !== "object") {
    res.status(400).json({
      success: false,
      error: "Request body must be a valid JSON object",
    });
    return;
  }

  const { question, query, queryVector, topK, filters, parameters } = body;
  const queryString = question || query;

  // Must provide either a text query or a pre-computed vector
  const hasTextQuery = typeof queryString === "string" && queryString.trim().length > 0;
  const hasVector = Array.isArray(queryVector) && queryVector.length > 0;

  if (!hasTextQuery && !hasVector) {
    res.status(400).json({
      success: false,
      error: "Either 'question'/'query' (non-empty string) or 'queryVector' (array of numbers) must be provided",
    });
    return;
  }

  // Validate queryVector if provided
  if (queryVector !== undefined) {
    if (!Array.isArray(queryVector) || queryVector.length === 0) {
      res.status(400).json({
        success: false,
        error: "'queryVector' must be a non-empty array of numbers",
      });
      return;
    }

    if (queryVector.some((val) => typeof val !== "number" || !Number.isFinite(val))) {
      res.status(400).json({
        success: false,
        error: "All elements in 'queryVector' must be finite numbers",
      });
      return;
    }
  }

  // Validate topK if provided
  const requestedTopK = topK !== undefined ? topK : parameters?.topK;
  if (requestedTopK !== undefined) {
    if (typeof requestedTopK !== "number" || !Number.isInteger(requestedTopK) || requestedTopK <= 0) {
      res.status(400).json({
        success: false,
        error: "'topK' must be a positive integer",
      });
      return;
    }
  }

  // Validate filters if provided
  if (filters !== undefined) {
    if (typeof filters !== "object" || filters === null) {
      res.status(400).json({
        success: false,
        error: "'filters' must be an object",
      });
      return;
    }

    const arrayFields = ["country", "carrier", "documentType", "version"] as const;
    for (const field of arrayFields) {
      if (filters[field] !== undefined) {
        if (!Array.isArray(filters[field]) || filters[field].some((item: unknown) => typeof item !== "string")) {
          res.status(400).json({
            success: false,
            error: `Filter '${field}' must be an array of strings`,
          });
          return;
        }
      }
    }

    if (filters.dateRange !== undefined) {
      if (typeof filters.dateRange !== "object" || filters.dateRange === null) {
        res.status(400).json({
          success: false,
          error: "Filter 'dateRange' must be an object with optional 'from' and 'to' string properties",
        });
        return;
      }

      if (filters.dateRange.from && typeof filters.dateRange.from !== "string") {
        res.status(400).json({
          success: false,
          error: "'dateRange.from' must be an ISO date string",
        });
        return;
      }

      if (filters.dateRange.to && typeof filters.dateRange.to !== "string") {
        res.status(400).json({
          success: false,
          error: "'dateRange.to' must be an ISO date string",
        });
        return;
      }
    }
  }

  next();
}

/**
 * Validates request payload for vector-only retrieval search.
 */
export function validateVectorSearchRequest(req: Request, res: Response, next: NextFunction): void {
  const body = req.body;

  if (!body || typeof body !== "object") {
    res.status(400).json({
      success: false,
      error: "Request body must be a valid JSON object",
    });
    return;
  }

  const { queryVector, topK } = body;

  if (!Array.isArray(queryVector) || queryVector.length === 0) {
    res.status(400).json({
      success: false,
      error: "'queryVector' must be a non-empty array of numbers",
    });
    return;
  }

  if (queryVector.some((val) => typeof val !== "number" || !Number.isFinite(val))) {
    res.status(400).json({
      success: false,
      error: "All elements in 'queryVector' must be finite numbers",
    });
    return;
  }

  if (topK !== undefined) {
    if (typeof topK !== "number" || !Number.isInteger(topK) || topK <= 0) {
      res.status(400).json({
        success: false,
        error: "'topK' must be a positive integer",
      });
      return;
    }
  }

  next();
}
