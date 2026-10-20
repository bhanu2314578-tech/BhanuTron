'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Reveal } from '@/components/shared/reveal';
import { Button } from '@/components/ui/button';

export function CTA() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[14px] border border-border bg-card px-6 py-14 text-center sm:px-12 sm:py-20">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.06)_1px,transparent_1px)] [background-size:24px_24px]"
            />
            <div className="relative flex flex-col items-center gap-5">
              <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Start chatting with your documents today
              </h2>
              <p className="max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
                Upload your first document and get an AI-powered answer in
                under a minute. No credit card required.
              </p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/signup">
                    Start Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="#pricing">View Pricing</a>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
