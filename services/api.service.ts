import { apiRequest, uploadFile } from '@/services/api-client';
import { API_ROUTES } from '@/constants/api-routes';
import type {
  ChatRequest,
  ChatResponse,
  DocumentItem,
  UpdateProfileInput,
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
  ): Promise<unknown> {
    const res = await uploadFile(API_ROUTES.upload, file, onProgress);
    if (res.error) {
      throw new Error(res.error);
    }
    return res.data;
  },
};

export const chatService = {
  async send(request: ChatRequest): Promise<ChatResponse> {
    const res = await apiRequest<ChatResponse>(API_ROUTES.chat, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (res.error || !res.data) {
      throw new Error(res.error ?? 'Chat request failed');
    }
    return res.data;
  },
};

export const userService = {
  async getProfile(): Promise<UserProfile> {
    const res = await apiRequest<UserProfile>(API_ROUTES.user.profile);
    if (res.error || !res.data) {
      throw new Error(res.error ?? 'Failed to fetch profile');
    }
    return res.data;
  },

  async update(data: UpdateProfileInput): Promise<UserProfile> {
    const res = await apiRequest<UserProfile>(API_ROUTES.user.update, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.error || !res.data) {
      throw new Error(res.error ?? 'Failed to update profile');
    }
    return res.data;
  },
};
