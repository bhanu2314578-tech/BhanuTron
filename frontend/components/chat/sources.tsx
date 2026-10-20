'use client';

import * as React from 'react';
import { ChevronDown, FileText, BookOpen } from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { ChatSource } from '@/types';

export function ChatSources({ sources }: { sources: ChatSource[] }) {
  const [open, setOpen] = React.useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-3">
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50">
        <BookOpen className="h-4 w-4 shrink-0 text-primary" />
        <span className="font-medium">
          {sources.length} {sources.length === 1 ? 'Source' : 'Sources'}
        </span>
        <span className="text-muted-foreground">— Click to {open ? 'hide' : 'view'}</span>
        <ChevronDown
          className={cn(
            'ml-auto h-4 w-4 text-muted-foreground transition-transform',
            open && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        {sources.map((source) => (
          <div
            key={source.id}
            className="rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FileText className="h-3.5 w-3.5" />
              </span>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{source.document}</p>
                <p className="text-xs text-muted-foreground">
                  Page {source.page} · Section {source.section}
                </p>
              </div>
            </div>
            <p className="mt-2 border-l-2 border-primary/30 pl-3 text-xs leading-relaxed text-muted-foreground">
              {source.snippet}
            </p>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
