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
  // Read file as base64 or text depending on type
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
 * Deletes a document and removes its vectors from the index.
 */
export async function deleteDocument(documentId: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
    method: 'DELETE',
  });
  return response.ok;
}

/**
 * Fetches compliance query history audit logs.
 */
export async function getQueryHistory(): Promise<QueryRecord[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/history`, {
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
 * Fetches dashboard KPIs, metrics, recent docs and queries.
 */
export async function getDashboardStats(): Promise<{
  kpi?: any[];
  recentDocuments?: DocumentRecord[];
  recentQueries?: QueryRecord[];
  stats?: any;
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
