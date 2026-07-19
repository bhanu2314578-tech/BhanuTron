'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Play, Sparkles, FileText, Search, Quote } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* subtle dotted backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--foreground)/0.04)_1px,transparent_1px)] [background-size:24px_24px]"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28 lg:px-8 lg:pb-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: copy */}
          <div className="flex flex-col items-start">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <Badge variant="secondary" className="mb-5 gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                AI-powered document chat
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
              className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
            >
              Chat with your documents instantly.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.12 }}
              className="mt-6 max-w-xl text-pretty text-lg text-muted-foreground"
            >
              Upload PDFs, manuals, invoices, research papers and receive
              AI-powered answers with citations.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.19 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Button size="lg" asChild>
                <Link href="/signup">
                  Start Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#demo">
                  <Play className="mr-2 h-4 w-4" />
                  Watch Demo
                </a>
              </Button>
            </motion.div>
          </div>

          {/* Right: product mock */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="rounded-[14px] border border-border bg-card p-4 shadow-sm">
              {/* mock window bar */}
              <div className="mb-4 flex items-center gap-2">
                <Image
                  src="/images/rag2.png"
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 rounded-[5px] object-cover"
                />
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-muted" />
                  <span className="h-2.5 w-2.5 rounded-full bg-muted" />
                  <span className="h-2.5 w-2.5 rounded-full bg-muted" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
                {/* sidebar: docs */}
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Documents
                  </p>
                  <div className="space-y-2">
                    {[
                      'Q3 Invoice.pdf',
                      'Employee Manual.pdf',
                      'Research Paper.pdf',
                    ].map((name, i) => (
                      <motion.div
                        key={name}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.12 }}
                        className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5 text-xs"
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="truncate">{name}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* chat area */}
                <div className="rounded-lg border border-border bg-background p-3">
                  <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Search className="h-3.5 w-3.5 text-primary" />
                    Ask anything about your documents
                  </div>
                  <div className="space-y-3">
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="ml-auto max-w-[80%] rounded-lg rounded-br-sm bg-primary px-3 py-2 text-xs text-primary-foreground"
                    >
                      What&apos;s the payment term on the Q3 invoice?
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.05 }}
                      className="max-w-[85%] rounded-lg rounded-bl-sm bg-muted px-3 py-2 text-xs"
                    >
                      <p>
                        The Q3 invoice specifies net-30 payment terms, due within
                        30 days of the invoice date.
                      </p>
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-primary">
                        <Quote className="h-3 w-3" />
                        <span>Source: Q3 Invoice.pdf · p.2</span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>

            {/* floating accent */}
            {!reduceMotion && (
              <motion.div
                aria-hidden="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 }}
                className="absolute -bottom-4 -left-4 hidden rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium shadow-sm xl:block"
              >
                <span className="text-success">●</span> Indexed in 1.2s
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
