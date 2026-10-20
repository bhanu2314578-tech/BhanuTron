export const navConfig = {
  mainNav: [
    { title: 'Features', href: '/#features' },
    { title: 'How it works', href: '/#how-it-works' },
    { title: 'Pricing', href: '/#pricing' },
    { title: 'FAQ', href: '/#faq' },
  ],
  footerNav: [
    { title: 'Privacy', href: '/privacy' },
    { title: 'Terms', href: '/terms' },
    { title: 'Contact', href: '/contact' },
  ],
} as const;

export type NavConfig = typeof navConfig;
export type NavItem = { title: string; href: string };
