'use client';

import { FileUp, Cpu, MessageSquare } from 'lucide-react';

import { Reveal, Stagger, StaggerItem } from '@/components/shared/reveal';
import { SectionHeading } from '@/components/shared/section-heading';

const steps = [
  {
    icon: FileUp,
    step: '01',
    title: 'Upload your documents',
    description:
      'Add PDFs, manuals, invoices, or research papers. BhanuTron parses and indexes them automatically.',
  },
  {
    icon: Cpu,
    step: '02',
    title: 'Ask a question',
    description:
      'Type any question in plain language. The AI searches across your files and synthesizes an answer.',
  },
  {
    icon: MessageSquare,
    step: '03',
    title: 'Get cited answers',
    description:
      'Receive a clear response with citations pointing to the exact source passage and page number.',
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-y border-border bg-muted/30 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="How it works"
            title="From document to answer in three steps"
            description="No setup, no training. Upload, ask, and get answers backed by your sources."
          />
        </Reveal>

        <Stagger className="mt-14 grid gap-8 md:grid-cols-3" stagger={0.12}>
          {steps.map(({ icon: Icon, step, title, description }, i) => (
            <StaggerItem key={step}>
              <div className="relative flex flex-col items-start gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[12px] border border-border bg-card text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-3xl font-semibold tracking-tight text-muted-foreground/40">
                    {step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>

                {i < steps.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="absolute right-0 top-6 hidden h-px w-8 bg-border md:block"
                  />
                )}
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
