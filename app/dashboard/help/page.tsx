'use client';

import { LifeBuoy } from 'lucide-react';
import { DashboardPlaceholder } from '@/components/dashboard/placeholder';

export default function HelpPage() {
  return (
    <DashboardPlaceholder
      title="Help"
      description="Find answers, browse documentation, or contact support."
      icon={LifeBuoy}
    />
  );
}
