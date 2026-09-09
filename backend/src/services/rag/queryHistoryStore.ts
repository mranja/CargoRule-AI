export interface StoredSourceRecord {
  id: string;
  chunkId: string;
  documentId: string;
  documentName: string;
  documentTitle?: string; // Backwards compatible alias
  section?: string;
  pageNumber?: number | string;
  country?: string;
  carrier?: string;
  documentType?: string;
  snippet?: string;
  relevanceScore?: number;
}

export interface QueryRecord {
  id: string;
  userId?: string;
  question: string;
  answer: string;
  country?: string;
  carrier?: string;
  documentType?: string;
  date: string;
  createdAt: string;
  status: "completed" | "processing" | "failed";
  sources: StoredSourceRecord[];
  retrievedSources?: StoredSourceRecord[];
  confidenceScore?: number;
  model?: string;
  errorMessage?: string;
}

class QueryHistoryStoreManager {
  private history: QueryRecord[] = [];

  public addQuery(record: QueryRecord): QueryRecord {
    const enrichedRecord: QueryRecord = {
      ...record,
      createdAt: record.createdAt || new Date().toISOString(),
      retrievedSources: record.retrievedSources || record.sources,
    };

    this.history.unshift(enrichedRecord);
    // Keep max 200 recent queries in memory
    if (this.history.length > 200) {
      this.history.pop();
    }
    return enrichedRecord;
  }

  public getAll(userId?: string): QueryRecord[] {
    if (userId) {
      return this.history.filter((q) => !q.userId || q.userId === userId);
    }
    return [...this.history];
  }

  public getById(id: string, userId?: string): QueryRecord | undefined {
    if (!id || typeof id !== "string") return undefined;
    const query = this.history.find((q) => q.id === id);
    if (!query) return undefined;
    if (userId && query.userId && query.userId !== userId) {
      return undefined;
    }
    return query;
  }

  public deleteById(id: string, userId?: string): boolean {
    if (!id || typeof id !== "string") return false;
    const index = this.history.findIndex((q) => q.id === id);
    if (index === -1) return false;

    const query = this.history[index];
    if (userId && query.userId && query.userId !== userId) {
      return false; // Unauthorized
    }

    this.history.splice(index, 1);
    return true;
  }

  public getCount(userId?: string): number {
    return this.getAll(userId).length;
  }

  public clear(userId?: string): void {
    if (userId) {
      this.history = this.history.filter((q) => q.userId && q.userId !== userId);
    } else {
      this.history = [];
    }
  }
}

export const queryHistoryStore = new QueryHistoryStoreManager();
