'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';
import {
  isWorkspaceNavActive,
  WORKSPACE_NAV_ITEMS,
} from '@/components/layout/mobile-nav/workspaceNavConfig';

interface WorkspaceTopNavProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showLegacyMobileNav?: boolean;
}

export default function WorkspaceTopNav({
  title,
  subtitle,
  actions,
  showLegacyMobileNav = false,
}: WorkspaceTopNavProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/90 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          {(title || subtitle) && (
            <div className="hidden sm:block">
              {title && <p className="text-sm font-semibold text-foreground">{title}</p>}
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          )}
        </div>

        <nav aria-label="Workspace navigation" className="hidden items-center gap-1 md:flex">
          {WORKSPACE_NAV_ITEMS.map((item) => {
            const isActive = isWorkspaceNavActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/12 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">{actions}</div>
      </div>

      {showLegacyMobileNav && (
        <nav aria-label="Workspace navigation (mobile)" className="grid grid-cols-4 border-t border-border/30 md:hidden">
          {WORKSPACE_NAV_ITEMS.map((item) => {
            const isActive = isWorkspaceNavActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-2 py-2 text-center text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-primary/8 text-primary'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
