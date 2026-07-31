'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  MessageSquare,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowRight,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { historyService } from '@/services/api.service';
import type { HistoryConversation } from '@/types';

type ConversationGroup = 'Today' | 'Yesterday' | 'Last Week';

const groupOrder: ConversationGroup[] = ['Today', 'Yesterday', 'Last Week'];

function groupConversations(conversations: HistoryConversation[]) {
  const groups: Record<ConversationGroup, HistoryConversation[]> = {
    Today: [],
    Yesterday: [],
    'Last Week': [],
  };

  for (const conversation of conversations) {
    const label = conversation.timestamp.toLowerCase();
    if (label.includes('just now') || label.endsWith('m ago') || label.endsWith('h ago')) {
      groups.Today.push(conversation);
    } else if (label.endsWith('d ago') && parseInt(label, 10) <= 1) {
      groups.Yesterday.push(conversation);
    } else {
      groups['Last Week'].push(conversation);
    }
  }

  return groups;
}

export default function HistoryPage() {
  const [conversations, setConversations] = React.useState<HistoryConversation[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [renameTarget, setRenameTarget] =
    React.useState<HistoryConversation | null>(null);
  const [renameValue, setRenameValue] = React.useState('');
  const [deleteTarget, setDeleteTarget] =
    React.useState<HistoryConversation | null>(null);

  const loadHistory = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await historyService.list();
      setConversations(items);
    } catch (err) {
      toast.error('Failed to load history', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return conversations;
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.preview.toLowerCase().includes(search.toLowerCase())
    );
  }, [conversations, search]);

  const grouped = React.useMemo(() => groupConversations(filtered), [filtered]);

  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    try {
      const updated = await historyService.rename(renameTarget.id, renameValue.trim());
      setConversations((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      toast.success('Conversation renamed');
      setRenameTarget(null);
    } catch (err) {
      toast.error('Failed to rename conversation', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await historyService.delete(deleteTarget.id);
      setConversations((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      toast.success('Conversation deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error('Failed to delete conversation', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">History</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review your past conversations and document interactions.
            </p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="h-5 w-5" />}
            title="No conversations found"
            description={
              search
                ? "No conversations match your search. Try a different query."
                : "You haven't had any conversations yet. Start chatting to see your history here."
            }
            action={
              <Button asChild size="sm">
                <Link href="/dashboard/chat">Start a new chat</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-8">
            {groupOrder.map((group) => {
              const items = grouped[group];
              if (items.length === 0) return null;
              return (
                <div key={group}>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {group}
                  </h2>
                  <div className="space-y-2">
                    {items.map((conv, i) => (
                      <motion.div
                        key={conv.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.03 }}
                      >
                        <div className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:shadow-sm">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <MessageSquare className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-medium">
                                {conv.title}
                              </p>
                            </div>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {conv.preview}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {conv.timestamp}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="hidden sm:flex"
                            >
                              <Link href={`/dashboard/chat?conversation=${conv.id}`}>
                                Continue
                                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                              </Link>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
                                  )}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/chat?conversation=${conv.id}`}>
                                    <ArrowRight className="mr-2 h-3.5 w-3.5" />
                                    Continue Chat
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setRenameTarget(conv);
                                    setRenameValue(conv.title);
                                  }}
                                >
                                  <Pencil className="mr-2 h-3.5 w-3.5" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteTarget(conv)}
                                >
                                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Rename dialog */}
      <Dialog
        open={!!renameTarget}
        onOpenChange={(open) => !open && setRenameTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename conversation</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Enter new name"
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleRename} disabled={!renameValue.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete conversation?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{' '}
            <span className="font-medium text-foreground">
              {deleteTarget?.title}
            </span>
            ? This action cannot be undone.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
