import { toast } from 'sonner';

import { authService } from '@/services/auth.service';
import type { ApiResponse, ChatRequest, ChatSource } from '@/types';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type RequestOptions = RequestInit & {
  isMultipart?: boolean;
};

async function buildHeaders(options?: RequestOptions): Promise<HeadersInit> {
  const headers: Record<string, string> = {};
  const token = await authService.getSessionToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!options?.isMultipart) headers['Content-Type'] = 'application/json';
  return headers;
}

let isHandling401 = false;

function handleUnauthorized() {
  if (isHandling401) return;
  isHandling401 = true;
  authService.logout().finally(() => {
    isHandling401 = false;
  });
  toast.error('Session expired', {
    description: 'Please sign in again to continue.',
  });
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export async function apiRequest<T>(
  path: string,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${path}`;
  const { isMultipart, ...fetchOptions } = options ?? {};

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...(await buildHeaders(options)),
        ...fetchOptions.headers,
      },
    });

    if (response.status === 401) {
      handleUnauthorized();
      return { error: 'Unauthorized', status: 401 };
    }

    let data: unknown;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else if (contentType?.includes('text/event-stream')) {
      return { error: 'Use streamChat for streaming endpoints', status: response.status };
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const message =
        (typeof data === 'object' && data !== null && 'detail' in data
          ? String((data as { detail: unknown }).detail)
          : typeof data === 'object' && data !== null && 'message' in data
            ? String((data as { message: unknown }).message)
            : null) ?? `Request failed (${response.status})`;
      if (response.status >= 500) {
        toast.error('Server error', { description: message });
      }
      return { error: message, status: response.status };
    }

    return { data: data as T, status: response.status };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Network request failed';
    toast.error('Network error', {
      description: 'Unable to reach the server. Check your connection.',
    });
    return { error: message, status: 0 };
  }
}

export function uploadFile(
  path: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<ApiResponse<unknown>> {
  return new Promise((resolve) => {
    void (async () => {
      const url = `${API_BASE_URL}${path}`;
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      const token = await authService.getSessionToken();
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        let data: unknown;
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          data = xhr.responseText;
        }
        if (xhr.status === 401) {
          handleUnauthorized();
          resolve({ error: 'Unauthorized', status: 401 });
          return;
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ data, status: xhr.status });
        } else {
          resolve({
            error:
              (typeof data === 'object' && data !== null && 'detail' in data
                ? String((data as { detail: unknown }).detail)
                : null) ?? `Upload failed (${xhr.status})`,
            status: xhr.status,
          });
        }
      };

      xhr.onerror = () => {
        toast.error('Network error', {
          description: 'Unable to upload file. Check your connection.',
        });
        resolve({ error: 'Network error', status: 0 });
      };

      xhr.send(formData);
    })();
  });
}

export type StreamChatHandlers = {
  onMeta?: (data: { conversationId: string; sources?: ChatSource[] }) => void;
  onToken?: (token: string) => void;
  onDone?: (data: { answer: string; sources?: ChatSource[] }) => void;
  onError?: (message: string) => void;
};

export async function streamChat(
  request: ChatRequest,
  handlers: StreamChatHandlers
): Promise<void> {
  const token = await authService.getSessionToken();
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(request),
  });

  if (response.status === 401) {
    handleUnauthorized();
    handlers.onError?.('Unauthorized');
    return;
  }

  if (!response.ok || !response.body) {
    const message = `Chat request failed (${response.status})`;
    handlers.onError?.(message);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const part of parts) {
      const lines = part.split('\n');
      const eventLine = lines.find((line) => line.startsWith('event: '));
      const dataLine = lines.find((line) => line.startsWith('data: '));
      if (!eventLine || !dataLine) continue;

      const event = eventLine.replace('event: ', '').trim();
      const data = JSON.parse(dataLine.replace('data: ', ''));

      if (event === 'meta') handlers.onMeta?.(data);
      if (event === 'token') handlers.onToken?.(data.content);
      if (event === 'done') handlers.onDone?.(data);
    }
  }
}
