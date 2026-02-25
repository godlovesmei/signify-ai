import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-muted/20">
      <div className="w-full px-6 py-16 md:px-10">
        <div className="grid gap-12 md:grid-cols-5">
          {/* Brand */}
          <div className="md:col-span-2">
            <Logo size="md" className="mb-4" />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Breaking communication barriers with AI-powered sign language translation.
              Built with and for the Deaf and Hard of Hearing community.
            </p>
          </div>

          {/* Links */}
          {[
            {
              heading: 'Product',
              links: [
                { label: 'How It Works', href: '/how-it-works' },
                { label: "Who It's For", href: '#who-its-for' },
                { label: 'Learn Sign Language', href: '/learn' },
                { label: 'Pricing', href: '/pricing' },
              ],
            },
            {
              heading: 'Company',
              links: [
                { label: 'About', href: '/about' },
                { label: 'Blog', href: '/blog' },
                { label: 'Careers', href: '/careers' },
              ],
            },
            {
              heading: 'Legal & Access',
              links: [
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms-condition' },
                { label: 'Accessibility Statement', href: '/accessibility' },
                { label: 'Contact', href: '/contact' },
              ],
            },
          ].map(({ heading, links }) => (
            <div key={heading}>
              <h4 className="mb-5 text-xs font-bold uppercase tracking-wider text-foreground">
                {heading}
              </h4>
              <ul className="space-y-3.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 text-sm text-muted-foreground md:flex-row">
          <p>&copy; 2026 Signify AI. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link
              href="/accessibility"
              className="hover:text-foreground transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
            >
              Accessibility Statement
            </Link>
            <span className="flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              WCAG 2.1 AA
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}