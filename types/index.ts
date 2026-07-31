export type ApiResponse<T = unknown> = {
  data?: T;
  error?: string;
  status: number;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type Status = 'idle' | 'loading' | 'success' | 'error';

export type UserRole = 'admin' | 'member' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DocumentItem {
  id: string;
  name: string;
  pages: number;
  uploadDate: string;
  status: 'processed' | 'processing' | 'failed';
  size: string;
  type: 'pdf' | 'docx' | 'txt';
}

export interface ChatRequest {
  question: string;
  conversationId?: string;
  documentId?: string;
}

export interface ChatSource {
  id: string;
  document: string;
  page: number;
  section: string;
  snippet: string;
}

export interface ChatResponse {
  answer: string;
  sources?: ChatSource[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
  firstName?: string;
  lastName?: string;
}

export interface UpdateProfileInput {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

export interface HistoryMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  timestamp: string;
}

export interface HistoryConversation {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  messages?: HistoryMessage[];
}

export interface UsageStat {
  label: string;
  value: string;
  change: string;
  icon: string;
}

export interface UsageSeriesPoint {
  date: string;
  tokens?: number;
  messages?: number;
}

export interface UsageResponse {
  stats: UsageStat[];
  tokenUsage: UsageSeriesPoint[];
  messageUsage: UsageSeriesPoint[];
}
