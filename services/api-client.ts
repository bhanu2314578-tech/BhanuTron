import { toast } from 'sonner';

import { tokenStorage } from '@/lib/token';
import type { ApiResponse } from '@/types';

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
  const url = `${API_BASE_URL}${path}`;
  const { isMultipart, ...fetchOptions } = options ?? {};

  try {
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
    const url = `${API_BASE_URL}${path}`;
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
        resolve({
          error:
            (typeof data === 'object' && data !== null && 'message' in data
              ? String((data as { message: unknown }).message)
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
