'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Check,
  Copy,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  User,
} from 'lucide-react';

import { Markdown } from '@/components/chat/markdown';
import { ChatSources } from '@/components/chat/sources';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/lib/chat-data';

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-muted-foreground/50"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
        active && 'text-primary'
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  isTyping?: boolean;
  onRegenerate?: () => void;
}

export function MessageBubble({
  message,
  isTyping,
  onRegenerate,
}: MessageBubbleProps) {
  const [copied, setCopied] = React.useState(false);
  const [feedback, setFeedback] = React.useState<'up' | 'down' | null>(null);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn('flex gap-3', isUser && 'flex-row-reverse')}
    >
      {/* Avatar */}
      <div className="shrink-0">
        {isUser ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
            <User className="h-4 w-4 text-secondary-foreground" />
          </span>
        ) : (
          <Image
            src="/images/rag2.png"
            alt="Assistant"
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
          />
        )}
      </div>

      {/* Content */}
      <div className={cn('flex max-w-[85%] flex-col', isUser && 'items-end')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-card'
          )}
        >
          {isTyping ? (
            <TypingDots />
          ) : isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <Markdown content={message.content} />
          )}
        </div>

        {/* Sources */}
        {!isUser && !isTyping && message.sources && (
          <div className="w-full max-w-lg">
            <ChatSources sources={message.sources} />
          </div>
        )}

        {/* Actions */}
        {!isUser && !isTyping && (
          <div className="mt-1.5 flex items-center gap-1">
            <ActionButton
              icon={copied ? Check : Copy}
              label={copied ? 'Copied' : 'Copy'}
              active={copied}
              onClick={handleCopy}
            />
            <ActionButton
              icon={RefreshCw}
              label="Regenerate"
              onClick={onRegenerate}
            />
            <ActionButton
              icon={ThumbsUp}
              label="Good response"
              active={feedback === 'up'}
              onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
            />
            <ActionButton
              icon={ThumbsDown}
              label="Bad response"
              active={feedback === 'down'}
              onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
            />
            <span className="ml-2 text-xs text-muted-foreground">
              {message.timestamp}
            </span>
          </div>
        )}
        {isUser && (
          <span className="mt-1.5 text-xs text-muted-foreground">
            {message.timestamp}
          </span>
        )}
      </div>
    </motion.div>
  );
}
