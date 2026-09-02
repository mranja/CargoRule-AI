export interface QueryRecord {
  id: string;
  question: string;
  answer: string;
  country: string;
  carrier: string;
  documentType?: string;
  date: string;
  status: "completed" | "processing" | "failed";
  sources: Array<{
    id: string;
    documentTitle: string;
    section?: string;
    pageNumber?: number | string;
    country?: string;
    carrier?: string;
    snippet?: string;
    relevanceScore?: number;
  }>;
  confidenceScore?: number;
  model?: string;
}

class QueryHistoryStoreManager {
  private history: QueryRecord[] = [];

  public addQuery(record: QueryRecord): QueryRecord {
    this.history.unshift(record);
    // Keep max 200 recent queries in memory
    if (this.history.length > 200) {
      this.history.pop();
    }
    return record;
  }

  public getAll(): QueryRecord[] {
    return [...this.history];
  }

  public getById(id: string): QueryRecord | undefined {
    return this.history.find((q) => q.id === id);
  }

  public getCount(): number {
    return this.history.length;
  }

  public clear(): void {
    this.history = [];
  }
}

export const queryHistoryStore = new QueryHistoryStoreManager();
