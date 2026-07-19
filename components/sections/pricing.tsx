'use client';

import { Check } from 'lucide-react';
import Link from 'next/link';

import { Reveal, Stagger, StaggerItem } from '@/components/shared/reveal';
import { SectionHeading } from '@/components/shared/section-heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const tiers = [
  {
    name: 'Starter',
    price: '$0',
    period: '/mo',
    description: 'For individuals getting started with document chat.',
    cta: 'Start Free',
    highlight: false,
    features: [
      '50 messages / month',
      '5 documents',
      'Source citations',
      'PDF & TXT support',
    ],
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/mo',
    description: 'For professionals who need more power and storage.',
    cta: 'Start Free Trial',
    highlight: true,
    features: [
      'Unlimited messages',
      '100 documents',
      'All file formats',
      'Multi-document chat',
      'Priority support',
    ],
  },
  {
    name: 'Team',
    price: '$49',
    period: '/mo',
    description: 'For teams sharing a shared document workspace.',
    cta: 'Contact Sales',
    highlight: false,
    features: [
      'Everything in Pro',
      'Unlimited documents',
      '5 team seats included',
      'Shared workspaces',
      'SSO & audit logs',
    ],
  },
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="scroll-mt-20 border-y border-border bg-muted/30 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Pricing"
            title="Simple, transparent pricing"
            description="Start free. Upgrade when you need more. No hidden fees."
          />
        </Reveal>

        <Stagger className="mt-14 grid gap-6 lg:grid-cols-3" stagger={0.1}>
          {tiers.map((tier) => (
            <StaggerItem key={tier.name}>
              <Card
                className={cn(
                  'relative h-full',
                  tier.highlight && 'border-primary shadow-md'
                )}
              >
                {tier.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Most popular
                  </span>
                )}
                <CardContent className="flex h-full flex-col gap-6 p-6">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold tracking-tight">
                      {tier.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-semibold tracking-tight">
                        {tier.price}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {tier.period}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tier.description}
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    variant={tier.highlight ? 'default' : 'outline'}
                    asChild
                  >
                    <Link href="/signup">{tier.cta}</Link>
                  </Button>

                  <ul className="flex flex-col gap-3 border-t border-border pt-6">
                    {tier.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                          <Check className="h-3 w-3" />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
