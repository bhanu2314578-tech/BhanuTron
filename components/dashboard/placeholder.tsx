'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

import { EmptyState } from '@/components/shared/empty-state';

interface DashboardPlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
}

export function DashboardPlaceholder({
  title,
  description,
  icon: Icon,
  actionLabel,
}: DashboardPlaceholderProps) {
  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mb-8 text-sm text-muted-foreground">{description}</p>

        <EmptyState
          icon={<Icon className="h-5 w-5" />}
          title={`${title} coming soon`}
          description="This section is under active development. Check back shortly."
          action={
            actionLabel ? (
              <span className="text-sm font-medium text-primary">{actionLabel}</span>
            ) : undefined
          }
        />
      </motion.div>
    </div>
  );
}
