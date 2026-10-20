'use client';

import {
  FileText,
  Table,
  GitCompare,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = {
  FileText,
  Table,
  GitCompare,
  HelpCircle,
};

interface SuggestedPromptsProps {
  prompts: { title: string; prompt: string; icon: string }[];
  onSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ prompts, onSelect }: SuggestedPromptsProps) {
  return (
    <div className="flex flex-col items-center gap-6 px-4 py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          How can I help you today?
        </h2>
        <p className="text-sm text-muted-foreground">
          Ask a question or try one of these suggestions
        </p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {prompts.map((item) => {
          const Icon = iconMap[item.icon] ?? Sparkles;
          return (
            <button
              key={item.title}
              onClick={() => onSelect(item.prompt)}
              className={cn(
                'group flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-sm'
              )}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                  {item.prompt}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
