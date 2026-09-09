import {
  AskQueryPayload,
  AskQueryResponse,
  DocumentRecord,
  QueryRecord,
  UploadMetadata,
} from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Dispatches a compliance query to the backend RAG pipeline.
 */
export async function askQuestion(
  payload: AskQueryPayload
): Promise<AskQueryResponse> {
  const response = await fetch(`${API_BASE_URL}/rag/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to generate answer (HTTP ${response.status})`
    );
  }

  const data = await response.json();
  return {
    id: data.id,
    question: data.question,
    answer: data.answer,
    sources: data.sources || [],
    timestamp: data.timestamp,
    filtersUsed: data.filtersUsed,
  };
}

/**
 * Fetches all indexed compliance documents from the backend.
 */
export async function getDocuments(): Promise<DocumentRecord[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch documents (HTTP ${response.status})`);
    }

    const data = await response.json();
    return data.documents || [];
  } catch (error) {
    console.warn('Backend documents API unavailable, returning empty list:', error);
    return [];
  }
}

/**
 * Uploads and indexes a compliance document in the backend RAG pipeline.
 */
export async function uploadDocument(
  file: File,
  metadata: UploadMetadata
): Promise<{ success: boolean; documentId?: string; message?: string }> {
  const isText = file.name.endsWith('.txt');
  let fileContent: string | undefined;
  let fileBase64: string | undefined;

  if (isText) {
    fileContent = await file.text();
  } else {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    fileBase64 = btoa(binary);
  }

  const payload = {
    documentName: metadata.documentName,
    fileName: file.name,
    fileType: file.name.split('.').pop()?.toLowerCase(),
    fileContent,
    fileBase64,
    country: metadata.country,
    carrier: metadata.carrier,
    documentType: metadata.documentType,
    effectiveDate: metadata.effectiveDate,
    expiryDate: metadata.expiryDate,
    version: metadata.version,
  };

  const response = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to upload document (HTTP ${response.status})`
    );
  }

  const data = await response.json();
  return {
    success: true,
    documentId: data.document?.id,
    message: data.message,
  };
}

/**
 * Updates document metadata and synchronizes vector store in backend.
 */
export async function updateDocument(
  documentId: string,
  metadata: Partial<UploadMetadata>
): Promise<{ success: boolean; document?: DocumentRecord; message?: string }> {
  const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to update document (HTTP ${response.status})`
    );
  }

  const data = await response.json();
  return {
    success: true,
    document: data.document,
    message: data.message,
  };
}

/**
 * Deletes a document and removes its vectors from the index.
 */
export async function deleteDocument(documentId: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
    method: 'DELETE',
  });
  return response.ok;
}

/**
 * Fetches compliance query history audit logs with optional search & filter parameters.
 */
export async function getQueryHistory(params?: {
  search?: string;
  country?: string;
  carrier?: string;
}): Promise<QueryRecord[]> {
  try {
    const urlParams = new URLSearchParams();
    if (params?.search) urlParams.set('q', params.search);
    if (params?.country && params.country !== 'all') urlParams.set('country', params.country);
    if (params?.carrier && params.carrier !== 'all') urlParams.set('carrier', params.carrier);

    const queryString = urlParams.toString();
    const url = `${API_BASE_URL}/history${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch history (HTTP ${response.status})`);
    }

    const data = await response.json();
    return data.queries || [];
  } catch (error) {
    console.warn('Backend history API unavailable, returning empty list:', error);
    return [];
  }
}

/**
 * Fetches a single query record with full sources detail by ID.
 */
export async function getQueryById(id: string): Promise<QueryRecord | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/history/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.query || null;
  } catch (error) {
    console.warn('Failed to fetch query record:', error);
    return null;
  }
}

/**
 * Deletes a single query record from audit history.
 */
export async function deleteQueryRecord(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/history/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.warn('Failed to delete query record:', error);
    return false;
  }
}

/**
 * Clears all query history records.
 */
export async function clearQueryHistory(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/history`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.warn('Failed to clear query history:', error);
    return false;
  }
}

/**
 * Fetches dashboard KPIs, metrics, recent docs and queries.
 */
export async function getDashboardStats(): Promise<{
  kpi?: Record<string, unknown>[];
  recentDocuments?: DocumentRecord[];
  recentQueries?: QueryRecord[];
  stats?: Record<string, unknown>;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard stats (HTTP ${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.warn('Backend dashboard stats unavailable:', error);
    return {};
  }
}

/**
 * Fetches countries covered with document counts.
 */
export async function getCountries(): Promise<Array<{ country: string; count: number }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/coverage/countries`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch countries (HTTP ${response.status})`);
    }

    const data = await response.json();
    return data.countries || [];
  } catch (error) {
    console.warn('Backend countries API unavailable:', error);
    return [];
  }
}

/**
 * Fetches carriers covered with document counts.
 */
export async function getCarriers(): Promise<Array<{ carrier: string; count: number }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/coverage/carriers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch carriers (HTTP ${response.status})`);
    }

    const data = await response.json();
    return data.carriers || [];
  } catch (error) {
    console.warn('Backend carriers API unavailable:', error);
    return [];
  }
}
