export const siteConfig = {
  name: 'BhanuTron',
  title: 'BhanuTron — Modern SaaS Platform',
  description:
    'BhanuTron is a modern SaaS platform built for speed, clarity, and scale.',
  url: 'https://bhanutron.app',
  keywords: ['BhanuTron', 'SaaS', 'platform', 'productivity'],
  links: {
    twitter: 'https://twitter.com/bhanutron',
    github: 'https://github.com/bhanutron',
  },
} as const;

export type SiteConfig = typeof siteConfig;
