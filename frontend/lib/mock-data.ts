export type DocStatus = 'processed' | 'processing' | 'failed';

export interface MockDocument {
  id: string;
  name: string;
  pages: number;
  uploadDate: string;
  status: DocStatus;
  size: string;
  type: 'pdf' | 'docx' | 'txt';
}

export interface MockActivity {
  id: string;
  action: string;
  target: string;
  time: string;
}

export interface MockStat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
}

export const mockStats: MockStat[] = [
  { label: 'Documents', value: '24', change: '+12%', trend: 'up' },
  { label: 'Chats', value: '148', change: '+23%', trend: 'up' },
  { label: 'Citations', value: '1,204', change: '+8%', trend: 'up' },
  { label: 'Storage', value: '4.2 GB', change: '-3%', trend: 'down' },
];

export const mockActivity: MockActivity[] = [
  { id: '1', action: 'Uploaded', target: 'Q3-Invoice.pdf', time: '2 min ago' },
  { id: '2', action: 'Chatted with', target: 'Employee-Manual.pdf', time: '1 hour ago' },
  { id: '3', action: 'Downloaded', target: 'Research-Paper.pdf', time: '3 hours ago' },
  { id: '4', action: 'Renamed', target: 'Invoice-2024.docx', time: '5 hours ago' },
  { id: '5', action: 'Deleted', target: 'Old-Draft.txt', time: '1 day ago' },
];

export const mockDocuments: MockDocument[] = [
  { id: '1', name: 'Q3-Invoice.pdf', pages: 12, uploadDate: '2025-07-12', status: 'processed', size: '1.2 MB', type: 'pdf' },
  { id: '2', name: 'Employee-Manual.pdf', pages: 84, uploadDate: '2025-07-10', status: 'processed', size: '3.4 MB', type: 'pdf' },
  { id: '3', name: 'Research-Paper.pdf', pages: 32, uploadDate: '2025-07-09', status: 'processed', size: '2.1 MB', type: 'pdf' },
  { id: '4', name: 'Contract-2024.docx', pages: 18, uploadDate: '2025-07-08', status: 'processing', size: '0.8 MB', type: 'docx' },
  { id: '5', name: 'Meeting-Notes.txt', pages: 4, uploadDate: '2025-07-07', status: 'processed', size: '24 KB', type: 'txt' },
  { id: '6', name: 'Tax-Filing.pdf', pages: 56, uploadDate: '2025-07-05', status: 'processed', size: '4.1 MB', type: 'pdf' },
  { id: '7', name: 'Onboarding-Guide.pdf', pages: 22, uploadDate: '2025-07-03', status: 'failed', size: '1.8 MB', type: 'pdf' },
  { id: '8', name: 'Vendor-Agreement.docx', pages: 14, uploadDate: '2025-07-01', status: 'processed', size: '0.6 MB', type: 'docx' },
  { id: '9', name: 'Spec-Draft.txt', pages: 8, uploadDate: '2025-06-28', status: 'processed', size: '18 KB', type: 'txt' },
  { id: '10', name: 'Annual-Report.pdf', pages: 120, uploadDate: '2025-06-25', status: 'processed', size: '8.2 MB', type: 'pdf' },
  { id: '11', name: 'Privacy-Policy.pdf', pages: 6, uploadDate: '2025-06-20', status: 'processed', size: '0.4 MB', type: 'pdf' },
  { id: '12', name: 'Budget-Proposal.docx', pages: 28, uploadDate: '2025-06-18', status: 'processing', size: '1.1 MB', type: 'docx' },
];

export const mockUsageData = [
  { month: 'Jan', chats: 45, documents: 8 },
  { month: 'Feb', chats: 62, documents: 10 },
  { month: 'Mar', chats: 58, documents: 9 },
  { month: 'Apr', chats: 78, documents: 14 },
  { month: 'May', chats: 95, documents: 18 },
  { month: 'Jun', chats: 112, documents: 20 },
  { month: 'Jul', chats: 148, documents: 24 },
];

export const storageUsedGB = 4.2;
export const storageTotalGB = 10;

/* ── History ── */

export type ConversationGroup = 'Today' | 'Yesterday' | 'Last Week';

export interface MockHistoryConversation {
  id: string;
  title: string;
  preview: string;
  group: ConversationGroup;
  timestamp: string;
  messageCount: number;
  document?: string;
}

export const mockHistoryConversations: MockHistoryConversation[] = [
  { id: 'h1', title: 'Q3 Invoice Analysis', preview: 'What are the key findings from the Q3 invoice?', group: 'Today', timestamp: '10:32 AM', messageCount: 4, document: 'Q3-Invoice.pdf' },
  { id: 'h2', title: 'Employee Manual Q&A', preview: 'What is the remote work policy?', group: 'Today', timestamp: '9:15 AM', messageCount: 2, document: 'Employee-Manual.pdf' },
  { id: 'h3', title: 'Contract Review', preview: 'Summarize the key clauses in the vendor agreement', group: 'Today', timestamp: '8:48 AM', messageCount: 6, document: 'Vendor-Agreement.docx' },
  { id: 'h4', title: 'Research Paper Review', preview: 'Summarize the methodology section', group: 'Yesterday', timestamp: '4:20 PM', messageCount: 3, document: 'Research-Paper.pdf' },
  { id: 'h5', title: 'Budget Discussion', preview: 'What are the projected costs for Q4?', group: 'Yesterday', timestamp: '2:10 PM', messageCount: 5, document: 'Budget-Proposal.docx' },
  { id: 'h6', title: 'Tax Filing Questions', preview: 'What deductions are available this year?', group: 'Yesterday', timestamp: '11:05 AM', messageCount: 4, document: 'Tax-Filing.pdf' },
  { id: 'h7', title: 'Onboarding Guide Help', preview: 'What are the steps for new employee setup?', group: 'Last Week', timestamp: 'Fri 3:30 PM', messageCount: 2, document: 'Onboarding-Guide.pdf' },
  { id: 'h8', title: 'Annual Report Summary', preview: 'Give me a high-level overview of the annual report', group: 'Last Week', timestamp: 'Thu 1:15 PM', messageCount: 8, document: 'Annual-Report.pdf' },
  { id: 'h9', title: 'Privacy Policy Review', preview: 'What data do we collect from users?', group: 'Last Week', timestamp: 'Wed 9:00 AM', messageCount: 3, document: 'Privacy-Policy.pdf' },
  { id: 'h10', title: 'Meeting Notes Recap', preview: 'What were the action items from the last meeting?', group: 'Last Week', timestamp: 'Tue 4:45 PM', messageCount: 2, document: 'Meeting-Notes.txt' },
];

/* ── Usage ── */

export interface MockUsageStat {
  label: string;
  value: string;
  sublabel: string;
  percent: number;
  icon: 'messages' | 'tokens' | 'storage' | 'documents';
  color: string;
}

export const mockUsageStats: MockUsageStat[] = [
  { label: 'Messages', value: '1,847', sublabel: 'of 5,000 monthly', percent: 37, icon: 'messages', color: 'hsl(var(--primary))' },
  { label: 'Tokens', value: '892K', sublabel: 'of 2M monthly', percent: 45, icon: 'tokens', color: 'hsl(var(--success))' },
  { label: 'Storage', value: '4.2 GB', sublabel: 'of 10 GB', percent: 42, icon: 'storage', color: 'hsl(var(--warning))' },
  { label: 'Documents', value: '24', sublabel: 'of 50 max', percent: 48, icon: 'documents', color: 'hsl(var(--accent))' },
];

export const mockTokenUsage = [
  { day: 'Mon', tokens: 120 },
  { day: 'Tue', tokens: 185 },
  { day: 'Wed', tokens: 142 },
  { day: 'Thu', tokens: 210 },
  { day: 'Fri', tokens: 268 },
  { day: 'Sat', tokens: 95 },
  { day: 'Sun', tokens: 130 },
];

export const mockMessageUsage = [
  { week: 'W1', messages: 210 },
  { week: 'W2', messages: 285 },
  { week: 'W3', messages: 340 },
  { week: 'W4', messages: 412 },
];

export interface MockSubscription {
  plan: string;
  price: string;
  renewsOn: string;
  status: 'active' | 'trial';
  features: string[];
}

export const mockSubscription: MockSubscription = {
  plan: 'Pro',
  price: '$24/mo',
  renewsOn: 'Aug 12, 2025',
  status: 'active',
  features: [
    '5,000 messages / month',
    '2M tokens / month',
    '10 GB document storage',
    'Priority support',
    'Advanced analytics',
  ],
};

/* ── Settings ── */

export interface MockNotificationPref {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export const mockNotificationPrefs: MockNotificationPref[] = [
  { id: 'n1', label: 'Email notifications', description: 'Receive emails about your account activity', enabled: true },
  { id: 'n2', label: 'Chat responses', description: 'Get notified when a chat completes', enabled: true },
  { id: 'n3', label: 'Document processing', description: 'Alerts when documents finish processing', enabled: false },
  { id: 'n4', label: 'Usage limits', description: 'Warnings when approaching monthly limits', enabled: true },
  { id: 'n5', label: 'Product updates', description: 'News about new features and improvements', enabled: false },
];

export interface MockApiKey {
  id: string;
  name: string;
  createdOn: string;
  lastUsed: string;
}

export const mockApiKeys: MockApiKey[] = [
  { id: 'k1', name: 'Production', createdOn: 'Jul 1, 2025', lastUsed: '2 hours ago' },
  { id: 'k2', name: 'Development', createdOn: 'Jun 15, 2025', lastUsed: '3 days ago' },
];
