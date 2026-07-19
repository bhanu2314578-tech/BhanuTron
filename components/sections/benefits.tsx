'use client';

import { Check, Clock, TrendingUp, Users } from 'lucide-react';

import { Reveal, Stagger, StaggerItem } from '@/components/shared/reveal';
import { SectionHeading } from '@/components/shared/section-heading';

const benefits = [
  {
    icon: Clock,
    title: 'Save hours every week',
    description:
      'Stop scrolling through 200-page PDFs. Get the answer you need in seconds with the source attached.',
  },
  {
    icon: TrendingUp,
    title: 'Make confident decisions',
    description:
      'Every answer is backed by a citation, so you can verify the source and trust the output.',
  },
  {
    icon: Users,
    title: 'Built for teams',
    description:
      'Share document workspaces with your team so everyone gets answers from the same source of truth.',
  },
];

const checklist = [
  'No credit card required to start',
  'Works with PDF, DOCX, TXT, and more',
  'Cancel anytime — your data stays yours',
  'SOC 2-aligned security practices',
];

export function Benefits() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left: heading + checklist */}
          <div className="flex flex-col gap-8">
            <Reveal>
              <SectionHeading
                eyebrow="Benefits"
                title="Why teams choose BhanuTron"
                description="Less time searching. More time acting on answers you can trust."
                align="left"
              />
            </Reveal>

            <Stagger className="flex flex-col gap-3" stagger={0.07}>
              {checklist.map((item) => (
                <StaggerItem key={item}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          {/* Right: benefit cards */}
          <Stagger className="flex flex-col gap-4" stagger={0.1}>
            {benefits.map(({ icon: Icon, title, description }) => (
              <StaggerItem key={title}>
                <div className="flex items-start gap-4 rounded-[14px] border border-border bg-card p-5 transition-shadow hover:shadow-md">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-semibold tracking-tight">
                      {title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
