import { apiRequest, streamChat, uploadFile } from '@/services/api-client';
import { API_ROUTES } from '@/constants/api-routes';
import type {
  ChatRequest,
  DocumentItem,
  HistoryConversation,
  UpdateProfileInput,
  UsageResponse,
  UserProfile,
} from '@/types';

export const documentService = {
  async list(): Promise<DocumentItem[]> {
    const res = await apiRequest<DocumentItem[]>(API_ROUTES.documents);
    if (res.error || !res.data) {
      throw new Error(res.error ?? 'Failed to fetch documents');
    }
    return res.data;
  },

  async upload(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<DocumentItem> {
    const res = await uploadFile(API_ROUTES.documents, file, onProgress);
    if (res.error || !res.data) {
      throw new Error(res.error ?? 'Upload failed');
    }
    return res.data as DocumentItem;
  },

  async delete(id: string): Promise<void> {
    const res = await apiRequest<void>(`${API_ROUTES.documents}/${id}`, {
      method: 'DELETE',
    });
    if (res.error) {
      throw new Error(res.error);
    }
  },
};

export const chatService = {
  stream(request: ChatRequest, handlers: Parameters<typeof streamChat>[1]) {
    return streamChat(request, handlers);
  },
};

export const userService = {
  async getProfile(): Promise<UserProfile> {
    const res = await apiRequest<UserProfile>(API_ROUTES.profile);
    if (res.error || !res.data) {
      throw new Error(res.error ?? 'Failed to fetch profile');
    }
    return res.data;
  },

  async update(data: UpdateProfileInput): Promise<UserProfile> {
    const res = await apiRequest<UserProfile>(API_ROUTES.profile, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (res.error || !res.data) {
      throw new Error(res.error ?? 'Failed to update profile');
    }
    return res.data;
  },
};

export const historyService = {
  async list(): Promise<HistoryConversation[]> {
    const res = await apiRequest<HistoryConversation[]>(API_ROUTES.history);
    if (res.error || !res.data) {
      throw new Error(res.error ?? 'Failed to fetch history');
    }
    return res.data;
  },

  async get(id: string): Promise<HistoryConversation> {
    const res = await apiRequest<HistoryConversation>(`${API_ROUTES.history}/${id}`);
    if (res.error || !res.data) {
      throw new Error(res.error ?? 'Failed to fetch conversation');
    }
    return res.data;
  },

  async create(title = 'New Chat'): Promise<HistoryConversation> {
    const res = await apiRequest<HistoryConversation>(API_ROUTES.history, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
    if (res.error || !res.data) {
      throw new Error(res.error ?? 'Failed to create conversation');
    }
    return res.data;
  },

  async rename(id: string, title: string): Promise<HistoryConversation> {
    const res = await apiRequest<HistoryConversation>(`${API_ROUTES.history}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
    if (res.error || !res.data) {
      throw new Error(res.error ?? 'Failed to rename conversation');
    }
    return res.data;
  },

  async delete(id: string): Promise<void> {
    const res = await apiRequest<void>(`${API_ROUTES.history}/${id}`, {
      method: 'DELETE',
    });
    if (res.error) {
      throw new Error(res.error);
    }
  },
};

export const usageService = {
  async get(): Promise<UsageResponse> {
    const res = await apiRequest<UsageResponse>(API_ROUTES.usage);
    if (res.error || !res.data) {
      throw new Error(res.error ?? 'Failed to fetch usage');
    }
    return res.data;
  },
};
