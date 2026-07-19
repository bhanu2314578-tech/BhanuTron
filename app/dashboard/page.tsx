'use client';

import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  FileText,
  MessageSquare,
  Quote,
  HardDrive,
  Upload,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Tooltip,
} from 'recharts';
import {
  mockStats,
  mockActivity,
  mockDocuments,
  mockUsageData,
  storageUsedGB,
  storageTotalGB,
} from '@/lib/mock-data';
import { formatDate } from '@/lib/format';
import { statusVariant, statusLabel } from '@/constants/document';

const statIcons = [FileText, MessageSquare, Quote, HardDrive];

const chartConfig = {
  chats: { label: 'Chats', color: 'hsl(var(--primary))' },
  documents: { label: 'Documents', color: 'hsl(var(--success))' },
};

export default function DashboardPage() {
  const recentDocs = mockDocuments.slice(0, 4);
  const storagePercent = Math.round((storageUsedGB / storageTotalGB) * 100);

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mb-6"
      >
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Welcome back, Jane
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                You have 3 new documents and 12 unread chat responses.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/documents">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/dashboard/chat">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  New Chat
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mockStats.map((stat, i) => {
          const Icon = statIcons[i];
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
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
                    <span
                      className={`flex items-center gap-1 text-xs font-medium ${
                        stat.trend === 'up' ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      <TrendIcon className="h-3 w-3" />
                      {stat.change}
                    </span>
                  </div>
                  <p className="mt-4 text-2xl font-semibold tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Usage chart + storage */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Usage Overview</CardTitle>
              <CardDescription>Chats and documents over the last 7 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[260px] w-full">
                <RechartsLineChart data={mockUsageData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line dataKey="chats" stroke="var(--color-chats)" strokeWidth={2} dot={false} />
                  <Line dataKey="documents" stroke="var(--color-documents)" strokeWidth={2} dot={false} />
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
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Storage Usage</CardTitle>
              <CardDescription>{storageUsedGB} GB of {storageTotalGB} GB used</CardDescription>
            </CardHeader>
            <CardContent className="flex h-[260px] flex-col items-center justify-center gap-4">
              <div className="relative flex h-32 w-32 items-center justify-center">
                <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120" role="progressbar" aria-valuenow={storagePercent} aria-valuemin={0} aria-valuemax={100} aria-label="Storage usage">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    strokeWidth="10"
                    className="stroke-muted"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    strokeWidth="10"
                    strokeLinecap="round"
                    stroke="hsl(var(--primary))"
                    strokeDasharray={`${(storagePercent / 100) * 327} 327`}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-semibold">{storagePercent}%</span>
                  <span className="text-xs text-muted-foreground">used</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Upgrade Storage
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent activity + recent documents */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockActivity.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{item.action}</span>{' '}
                      <span className="text-muted-foreground">{item.target}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Documents</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/documents">
                  View all
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent/50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.pages} pages · {formatDate(doc.uploadDate)}
                    </p>
                  </div>
                  <Badge variant={statusVariant[doc.status]}>
                    {statusLabel[doc.status]}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
