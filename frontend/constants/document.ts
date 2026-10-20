import type { DocStatus } from '@/lib/mock-data';

export const statusVariant: Record<DocStatus, 'success' | 'warning' | 'destructive'> = {
  processed: 'success',
  processing: 'warning',
  failed: 'destructive',
};

export const statusLabel: Record<DocStatus, string> = {
  processed: 'Processed',
  processing: 'Processing',
  failed: 'Failed',
};
