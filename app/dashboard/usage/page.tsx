'use client';

import { motion } from 'framer-motion';
import {
  MessageSquare,
  Hash,
  HardDrive,
  FileText,
  Check,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

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
import { Separator } from '@/components/ui/separator';
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
import {
  mockUsageStats,
  mockTokenUsage,
  mockMessageUsage,
  mockSubscription,
} from '@/lib/mock-data';
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

        {/* Usage stat cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {mockUsageStats.map((stat, i) => {
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
                      <span className="text-xs font-medium text-muted-foreground">
                        {stat.percent}%
                      </span>
                    </div>
                    <p className="mt-4 text-2xl font-semibold tracking-tight">
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {stat.sublabel}
                    </p>
                    <div
                      className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary"
                      role="progressbar"
                      aria-valuenow={stat.percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${stat.label} usage`}
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${stat.percent}%` }}
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
                  <RechartsLineChart data={mockTokenUsage}>
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
                  <RechartsLineChart data={mockMessageUsage}>
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

        {/* Subscription card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Subscription</CardTitle>
                <CardDescription>Manage your plan and billing</CardDescription>
              </div>
              <Badge
                variant={mockSubscription.status === 'active' ? 'success' : 'warning'}
              >
                {mockSubscription.status === 'active' ? 'Active' : 'Trial'}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold tracking-tight">
                      {mockSubscription.plan}
                    </span>
                    <span className="text-lg text-muted-foreground">
                      {mockSubscription.price}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Renews on {mockSubscription.renewsOn}
                  </p>
                </div>
                <div className="flex-1 sm:max-w-xs">
                  <ul className="space-y-2">
                    {mockSubscription.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                          <Check className="h-2.5 w-2.5" />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
            <Separator />
            <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" asChild>
                <Link href="/dashboard/settings">Manage Billing</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/settings">
                  Upgrade Plan
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
