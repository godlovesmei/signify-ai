import { stripLocalePrefix } from "@/i18n/config";

export type WorkspaceNavKey = 'translate' | 'practice' | 'history' | 'reference' | 'profile';
export type WorkspaceNavIcon = 'translate' | 'practice' | 'history' | 'reference' | 'user';

export interface WorkspaceNavItem {
  key: WorkspaceNavKey;
  href: string;
  icon: WorkspaceNavIcon;
}

export const WORKSPACE_NAV_ITEMS: readonly WorkspaceNavItem[] = [
  { key: 'translate', href: '/translate', icon: 'translate' },
  { key: 'practice', href: '/practice', icon: 'practice' },
  { key: 'history', href: '/history', icon: 'history' },
  { key: 'reference', href: '/reference', icon: 'reference' },
  { key: 'profile', href: '/profile', icon: 'user' },
] as const;

function normalizePath(input: string): string {
  const value = input.trim();
  if (!value) return '/';

  let pathOnly = value;
  const protocolIndex = value.indexOf('://');
  if (protocolIndex !== -1) {
    try {
      pathOnly = new URL(value).pathname;
    } catch {
      pathOnly = value.slice(protocolIndex + 3);
      const slashIndex = pathOnly.indexOf('/');
      pathOnly = slashIndex === -1 ? '/' : pathOnly.slice(slashIndex);
    }
  }

  const withoutHash = pathOnly.split('#')[0] ?? '/';
  const withoutQuery = withoutHash.split('?')[0] ?? '/';
  const withLeadingSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  const trimmedTrailing = withLeadingSlash.replace(/\/+$/, '');
  return stripLocalePrefix(trimmedTrailing || '/').pathname;
}

export function isWorkspaceNavActive(href: string, currentPath: string): boolean {
  const target = normalizePath(href);
  const current = normalizePath(currentPath);
  return current === target || current.startsWith(`${target}/`);
}

export function getActiveWorkspaceNavItem(pathname: string): WorkspaceNavItem | null {
  return WORKSPACE_NAV_ITEMS.find((item) => isWorkspaceNavActive(item.href, pathname)) ?? null;
}

export function isWorkspaceRoute(pathname: string): boolean {
  return getActiveWorkspaceNavItem(pathname) !== null;
}
