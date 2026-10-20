'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { Logo } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';

interface AuthLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthLayout({
  title,
  description,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* top bar */}
      <header className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="BhanuTron home">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      {/* centered card */}
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="rounded-[14px] border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex flex-col gap-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {children}
          </div>
          {footer && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {footer}
            </p>
          )}
        </motion.div>
      </main>
    </div>
  );
}
