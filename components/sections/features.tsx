'use client';

import {
  Upload,
  MessageSquareText,
  Quote,
  ShieldCheck,
  Zap,
  Layers,
} from 'lucide-react';

import {
  Reveal,
  Stagger,
  StaggerItem,
} from '@/components/shared/reveal';
import { SectionHeading } from '@/components/shared/section-heading';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Upload,
    title: 'Upload Documents',
    description:
      'Drag and drop PDFs, manuals, invoices, and research papers. We handle indexing instantly.',
  },
  {
    icon: MessageSquareText,
    title: 'AI Answers',
    description:
      'Ask natural-language questions and get clear, accurate answers synthesized from your files.',
  },
  {
    icon: Quote,
    title: 'Source Citations',
    description:
      'Every answer links back to the exact passage and page in your source document.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Storage',
    description:
      'Your documents are encrypted at rest and in transit. You control access at every level.',
  },
  {
    icon: Zap,
    title: 'Fast Search',
    description:
      'Semantic search returns relevant results across thousands of pages in milliseconds.',
  },
  {
    icon: Layers,
    title: 'Multi-document Chat',
    description:
      'Reference several documents in one conversation to cross-check and compare information.',
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Features"
            title="Everything you need to chat with your documents"
            description="From upload to answer in seconds. BhanuTron handles the heavy lifting so you can focus on insights."
          />
        </Reveal>

        <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <StaggerItem key={title}>
              <Card className="group h-full transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col gap-4 p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold tracking-tight">
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
