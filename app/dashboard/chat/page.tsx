'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Send,
  Search,
  MessageSquare,
  Trash2,
  Pencil,
  MoreHorizontal,
  X,
} from 'lucide-react';

import { MessageBubble } from '@/components/chat/message-bubble';
import { SuggestedPrompts } from '@/components/chat/suggested-prompts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { chatService } from '@/services/api.service';
import {
  mockConversations,
  mockSuggestedPrompts,
  type ChatMessage,
  type ChatConversation,
} from '@/lib/chat-data';

export default function ChatPage() {
  const [conversations, setConversations] =
    React.useState<ChatConversation[]>(mockConversations);
  const [activeId, setActiveId] = React.useState(mockConversations[0].id);
  const [messages, setMessages] = React.useState<ChatMessage[]>(
    mockConversations[0].messages
  );
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeId);

  const filteredConversations = React.useMemo(() => {
    if (!search) return conversations;
    return conversations.filter((c) =>
      c.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [conversations, search]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSelectConversation = (conv: ChatConversation) => {
    setActiveId(conv.id);
    setMessages(conv.messages);
    setMobileSidebarOpen(false);
  };

  const handleNewChat = () => {
    const newConv: ChatConversation = {
      id: `conv-${Date.now()}`,
      title: 'New Chat',
      preview: '',
      timestamp: 'Just now',
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
    setMessages([]);
    setInput('');
    setMobileSidebarOpen(false);
  };

  const handleDeleteConversation = (id: string) => {
    const filtered = conversations.filter((c) => c.id !== id);
    setConversations(filtered);
    if (id === activeId) {
      if (filtered.length > 0) {
        setActiveId(filtered[0].id);
        setMessages(filtered[0].messages);
      } else {
        handleNewChat();
      }
    }
  };

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isTyping) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await chatService.send({
        question: content,
      });
      const reply: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
      };
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      toast.error('Chat request failed', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRegenerate = async () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;

    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (lastAssistant) {
      setMessages((prev) => prev.filter((m) => m.id !== lastAssistant.id));
    }
    setIsTyping(true);

    try {
      const res = await chatService.send({ question: lastUser.content });
      const reply: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
      };
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      toast.error('Chat request failed', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden lg:h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 border-r border-border bg-muted/20 lg:flex lg:flex-col">
        <ChatSidebar
          conversations={filteredConversations}
          activeId={activeId}
          search={search}
          onSearch={setSearch}
          onSelect={handleSelectConversation}
          onNewChat={handleNewChat}
          onDelete={handleDeleteConversation}
        />
      </aside>

      {/* Mobile sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Chat history">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-border bg-background"
          >
            <ChatSidebar
              conversations={filteredConversations}
              activeId={activeId}
              search={search}
              onSearch={setSearch}
              onSelect={handleSelectConversation}
              onNewChat={handleNewChat}
              onDelete={handleDeleteConversation}
              onClose={() => setMobileSidebarOpen(false)}
            />
          </motion.aside>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent lg:hidden"
              aria-label="Open chat history"
            >
              <MessageSquare className="h-5 w-5" aria-hidden="true" />
            </button>
            <h1 className="truncate text-sm font-medium">
              {activeConversation?.title ?? 'New Chat'}
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleNewChat}>
            <Plus className="mr-1.5 h-4 w-4" />
            New
          </Button>
        </header>

        {/* Conversation */}
        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center overflow-y-auto">
            <SuggestedPrompts
              prompts={mockSuggestedPrompts}
              onSelect={(prompt) => handleSend(prompt)}
            />
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-6"
          >
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onRegenerate={handleRegenerate}
                />
              ))}
              {isTyping && (
                <MessageBubble
                  message={{
                    id: 'typing',
                    role: 'assistant',
                    content: '',
                    timestamp: '',
                  }}
                  isTyping
                />
              )}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 border-t border-border bg-background p-4">
          <div className="mx-auto max-w-3xl">
            <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-card p-2 focus-within:border-primary/50">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about your documents..."
                aria-label="Ask a question about your documents"
                rows={1}
                className="max-h-32 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
                style={{
                  height: 'auto',
                  minHeight: '40px',
                }}
              />
              <Button
                size="icon"
                className="h-9 w-9 shrink-0 rounded-xl"
                disabled={!input.trim() || isTyping}
                onClick={() => handleSend()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              BhanuTron can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ChatSidebarProps {
  conversations: ChatConversation[];
  activeId: string;
  search: string;
  onSearch: (v: string) => void;
  onSelect: (c: ChatConversation) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}

function ChatSidebar({
  conversations,
  activeId,
  search,
  onSearch,
  onSelect,
  onNewChat,
  onDelete,
  onClose,
}: ChatSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <Button variant="outline" size="sm" className="w-full" onClick={onNewChat}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Chat
        </Button>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-2 shrink-0 lg:hidden"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="h-9 pl-8 text-sm"
          />
        </div>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-0.5">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                'group flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors',
                conv.id === activeId
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-accent'
              )}
            >
              <button
                onClick={() => onSelect(conv)}
                className="flex flex-1 items-center gap-2 overflow-hidden text-left"
                aria-current={conv.id === activeId ? 'true' : undefined}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="truncate">{conv.title}</span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent focus-visible:flex group-hover:flex" aria-label="Conversation options">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(conv.id)}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
