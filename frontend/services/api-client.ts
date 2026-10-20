import { toast } from 'sonner';

import { tokenStorage } from '@/lib/token';
import type { ApiResponse } from '@/types';

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
export const API_BASE_URL = (
  configuredApiUrl ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '')
).replace(/\/+$/, '');

function buildApiUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_URL must be set for production');
  }
  return `${API_BASE_URL}${path}`;
}

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

function buildHeaders(options?: RequestOptions): HeadersInit {
  const headers: Record<string, string> = {};
  const token = tokenStorage.get();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!options?.isMultipart) headers['Content-Type'] = 'application/json';
  return headers;
}

let isHandling401 = false;

function handleUnauthorized() {
  if (isHandling401) return;
  isHandling401 = true;
  tokenStorage.clear();
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
  const { isMultipart, ...fetchOptions } = options ?? {};

  try {
    const url = buildApiUrl(path);
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...buildHeaders(options),
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
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const message =
        (typeof data === 'object' && data !== null && 'message' in data
          ? String((data as { message: unknown }).message)
          : typeof data === 'object' &&
              data !== null &&
              'detail' in data &&
              typeof (data as { detail: unknown }).detail === 'string'
            ? String((data as { detail: string }).detail)
          : null) ?? `Request failed (${response.status})`;
      if (response.status >= 500) {
        toast.error('Server error', {
          description: message,
          action: {
            label: 'Retry',
            onClick: () => apiRequest<T>(path, options),
          },
        });
      }
      return { error: message, status: response.status };
    }

    return { data: data as T, status: response.status };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const message =
      error instanceof Error ? error.message : 'Network request failed';
    toast.error('Network error', {
      description: 'Unable to reach the server. Check your connection.',
      action: {
        label: 'Retry',
        onClick: () => apiRequest<T>(path, options),
      },
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
    let url: string;
    try {
      url = buildApiUrl(path);
    } catch (error) {
      resolve({
        error: error instanceof Error ? error.message : 'API URL is missing',
        status: 0,
      });
      return;
    }
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    const token = tokenStorage.get();
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
        const responseData =
          typeof data === 'object' && data !== null
            ? (data as { message?: unknown; detail?: unknown })
            : {};
        resolve({
          error:
            (typeof responseData.message === 'string'
              ? responseData.message
              : typeof responseData.detail === 'string'
                ? responseData.detail
                : null) ?? `Upload failed (${xhr.status})`,
          status: xhr.status,
        });
      }
    };

    xhr.onerror = () => {
      toast.error('Network error', {
        description: 'Unable to upload file. Check your connection.',
        action: {
          label: 'Retry',
          onClick: () => uploadFile(path, file, onProgress),
        },
      });
      resolve({ error: 'Network error', status: 0 });
    };

    xhr.send(formData);
  });
}
