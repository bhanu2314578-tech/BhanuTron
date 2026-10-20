'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Reveal } from '@/components/shared/reveal';
import { SectionHeading } from '@/components/shared/section-heading';

const faqs = [
  {
    question: 'What file formats does BhanuTron support?',
    answer:
      'BhanuTron supports PDF, DOCX, TXT, and plain-text files. We are continuously adding support for additional formats based on user demand.',
  },
  {
    question: 'Are my documents secure?',
    answer:
      'Yes. All documents are encrypted in transit and at rest. You control who can access your workspaces, and you can delete your data at any time.',
  },
  {
    question: 'How accurate are the AI answers?',
    answer:
      'BhanuTron grounds every answer in your uploaded documents and provides a citation to the source passage so you can verify accuracy for yourself.',
  },
  {
    question: 'Can I chat across multiple documents at once?',
    answer:
      'Yes. On the Pro plan and above you can reference several documents in a single conversation to cross-check and compare information.',
  },
  {
    question: 'Do you offer a free plan?',
    answer:
      'Yes. The Starter plan is free forever and includes 50 messages and 5 documents per month. No credit card is required to sign up.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Absolutely. You can upgrade, downgrade, or cancel your plan at any time from your account settings — no contracts, no lock-in.',
  },
];

export function FAQ() {
  return (
    <section id="faq" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="FAQ"
            title="Frequently asked questions"
            description="Everything you need to know about BhanuTron. Can't find an answer? Reach out to our team."
          />
        </Reveal>

        <Reveal delay={0.1}>
          <Accordion type="single" collapsible className="mt-12">
            {faqs.map((faq, i) => (
              <AccordionItem key={faq.question} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-base">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
