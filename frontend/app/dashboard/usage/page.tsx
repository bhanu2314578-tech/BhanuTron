'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Hash,
  HardDrive,
  FileText,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartTooltip,
} from '@/components/ui/chart';
import {
  LineChart as RechartsLineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import { usageService } from '@/services/api.service';
import type { UsageResponse } from '@/types';
import type { ChartConfig } from '@/components/ui/chart';

const iconMap: Record<string, typeof MessageSquare> = {
  messages: MessageSquare,
  tokens: Hash,
  storage: HardDrive,
  documents: FileText,
};

const tokenChartConfig: ChartConfig = {
  tokens: { label: 'Tokens (K)', color: 'hsl(var(--primary))' },
};

const messageChartConfig: ChartConfig = {
  messages: { label: 'Messages', color: 'hsl(var(--success))' },
};

export default function UsagePage() {
  const [usage, setUsage] = React.useState<UsageResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void usageService.get().then(setUsage).catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to load usage');
    });
  }, []);

  const stats = usage?.stats ?? [];
  const tokenUsage = (usage?.tokenUsage ?? []).map((point) => ({
    day: point.date,
    tokens: point.tokens ?? 0,
  }));
  const messageUsage = (usage?.messageUsage ?? []).map((point) => ({
    week: point.date,
    messages: point.messages ?? 0,
  }));

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">Usage</h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Track your chat usage, document storage, and API consumption.
        </p>

        {error && <p className="mb-6 text-sm text-destructive">{error}</p>}

        {/* Usage stat cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => {
            const Icon = iconMap[stat.icon];
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">{stat.change}</span>
                    </div>
                    <p className="mt-4 text-2xl font-semibold tracking-tight">
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {stat.icon}
                    </p>
                    <div
                      className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary"
                      role="progressbar"
                      aria-valuenow={0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${stat.label} usage`}
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: '0%' }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Token Usage</CardTitle>
                <CardDescription>Daily token consumption this week</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={tokenChartConfig}
                  className="h-[240px] w-full"
                >
                  <RechartsLineChart data={tokenUsage}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={40} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      dataKey="tokens"
                      stroke="var(--color-tokens)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </RechartsLineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Message Volume</CardTitle>
                <CardDescription>Weekly message count this month</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={messageChartConfig}
                  className="h-[240px] w-full"
                >
                  <RechartsLineChart data={messageUsage}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="week" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={40} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      dataKey="messages"
                      stroke="var(--color-messages)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </RechartsLineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage source</CardTitle>
            <CardDescription>Values above come from your authenticated account.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Billing limits will be connected when subscription management is enabled.
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
