'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NavUser {
  name: string;
  email: string;
  avatarUrl?: string;
}

interface NavbarProps {
  /** Authenticated user — pass null/undefined to hide avatar slot */
  user?: NavUser | null;
  /** Called when the Settings gear icon is clicked — wire to your Sheet open state */
  onSettingsOpen?: () => void;
  /** Active language — defaults to 'ID' */
  lang?: 'EN' | 'ID';
  /** Called when the language toggle is clicked */
  onLangToggle?: () => void;
}

// ─── Mode tabs ────────────────────────────────────────────────────────────────
// Letter / Word / Sentence live on the main detection page as modes (query param).
// Practice is its own route. History + Reference are accessed via Settings / tabs.

const MODE_TABS = [
  { label: 'Letter',   href: '/translate?mode=letter'   },
  { label: 'Word',     href: '/translate?mode=word'     },
  { label: 'Sentence', href: '/translate?mode=sentence' },
  { label: 'Practice', href: '/practice'                },
] as const;

// ─── UserAvatar ───────────────────────────────────────────────────────────────

function UserAvatar({ user }: { user: NavUser }) {
  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div
      aria-label={`Signed in as ${user.name}`}
      title={user.name}
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full',
        'bg-primary text-primary-foreground font-display text-xs font-semibold',
        'ring-2 ring-background shadow-sm select-none overflow-hidden',
      )}
    >
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="size-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        initials
      )}
    </div>
  );
}

// ─── ModeTabBar ───────────────────────────────────────────────────────────────

function ModeTabBar({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Detection mode"
      className="hidden md:flex items-end gap-0 h-full"
      role="tablist"
    >
      {MODE_TABS.map(({ label, href }) => {
        // Mark Practice active on /practice; others active on /translate with matching mode
        const isActive =
          label === 'Practice'
            ? pathname === '/practice'
            : pathname.startsWith('/translate') && href.includes(pathname.split('?')[0]);

        return (
          <Link
            key={label}
            href={href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              // Base
              'relative flex items-center px-4 h-full text-sm transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
              // Underline indicator
              'after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:transition-transform after:duration-200',
              isActive
                ? 'text-primary-700 font-semibold after:bg-primary after:scale-x-100'
                : 'text-muted-foreground font-medium after:bg-primary after:scale-x-0 hover:text-foreground hover:bg-muted/60 rounded-t-md',
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export default function Navbar({
  user,
  onSettingsOpen,
  lang = 'ID',
  onLangToggle,
}: NavbarProps) {
  const pathname = usePathname();

  return (
    <header
      role="banner"
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'h-14',                                          // 56px — BISINDO spec: ≤56px on mobile
        'border-b border-border/60',
        'bg-background/90 backdrop-blur-md',
        'shadow-sm',
      )}
    >
      <div className="flex h-full w-full items-center justify-between px-4 md:px-6">

        {/* ── Left: Logo ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 shrink-0">
          <Logo size="sm" />
          {/* App title — hidden on small screens to save space */}
          <span className="hidden sm:block text-sm font-semibold text-foreground font-display">
            Signify
          </span>
        </div>

        {/* ── Center: Mode tabs (desktop only) ───────────────────────────── */}
        <ModeTabBar pathname={pathname} />

        {/* ── Right: actions ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 shrink-0">

          {/* Language toggle — EN / ID */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onLangToggle}
            aria-label={`Switch language — currently ${lang}`}
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-muted-foreground h-9 px-2.5"
          >
            <Globe className="size-3.5" aria-hidden="true" />
            {lang}
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsOpen}
            aria-label="Open settings"
            className={cn(
              'size-9 text-muted-foreground',
              'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            )}
          >
            <Settings className="size-4" aria-hidden="true" />
          </Button>

          {/* User avatar — only when authenticated */}
          {user && (
            <div className="ml-1">
              <UserAvatar user={user} />
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile mode tabs — full-width strip below the main bar ───────── */}
      {/* Shown only on pages where mode tabs are relevant */}
      {(pathname.startsWith('/translate') || pathname === '/practice') && (
        <nav
          aria-label="Detection mode (mobile)"
          role="tablist"
          className={cn(
            'md:hidden flex w-full border-t border-border/60',
            'bg-background/90 backdrop-blur-md',
          )}
        >
          {MODE_TABS.map(({ label, href }) => {
            const isActive =
              label === 'Practice'
                ? pathname === '/practice'
                : pathname.startsWith('/translate');

            return (
              <Link
                key={label}
                href={href}
                role="tab"
                aria-selected={isActive}
                className={cn(
                  'flex flex-1 items-center justify-center py-2 text-xs transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
                  'relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full',
                  isActive
                    ? 'text-primary-700 font-semibold after:bg-primary'
                    : 'text-muted-foreground font-medium after:bg-transparent hover:text-foreground hover:bg-muted/40',
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}