'use client';

import { Reveal } from '@/components/shared/reveal';

const logos = [
  'Acme Corp',
  'Globex',
  'Stark Inc',
  'Wayne Co',
  'Umbrella',
  'Cyberdyne',
];

export function TrustedBy() {
  return (
    <section className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-center text-sm font-medium text-muted-foreground">
            Trusted by teams at fast-moving companies
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {logos.map((name) => (
              <span
                key={name}
                className="text-lg font-semibold tracking-tight text-muted-foreground/70 transition-colors hover:text-foreground"
              >
                {name}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
