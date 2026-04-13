'use client';

import { useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { usePathname } from 'next/navigation';
import MobileNavItem from './MobileNavItem';
import {
  getActiveWorkspaceNavItem,
  isWorkspaceRoute,
  WORKSPACE_NAV_ITEMS,
} from './workspaceNavConfig';

interface MobileBottomNavProps {
  reserveSpace?: boolean;
}

const MOBILE_NAV_HEIGHT_PX = 64;
const MOBILE_NAV_MARGIN_PX = 12;
const MOBILE_NAV_OFFSET_VALUE = `calc(${MOBILE_NAV_HEIGHT_PX}px + env(safe-area-inset-bottom, 0px) + ${MOBILE_NAV_MARGIN_PX}px)`;

export default function MobileBottomNav({ reserveSpace = true }: MobileBottomNavProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  const activeItem = getActiveWorkspaceNavItem(pathname);
  const isWorkspace = isWorkspaceRoute(pathname);

  useEffect(() => {
    if (!isWorkspace) {
      return;
    }

    const root = document.documentElement;
    root.style.setProperty('--workspace-mobile-nav-offset', MOBILE_NAV_OFFSET_VALUE);

    return () => {
      root.style.setProperty('--workspace-mobile-nav-offset', '0px');
    };
  }, [isWorkspace]);

  if (!isWorkspace || !activeItem) {
    return null;
  }

  return (
    <>
      {reserveSpace && (
        <div
          aria-hidden="true"
          className="h-[calc(64px+env(safe-area-inset-bottom,0px)+12px)] md:hidden"
        />
      )}

      <motion.nav
        aria-label="Workspace mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] md:hidden"
        initial={reduceMotion ? undefined : { y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
        }
      >
        <div className="mx-auto w-full max-w-md rounded-2xl border border-border/60 bg-background/92 shadow-[0_-12px_34px_-24px_rgba(0,0,0,0.7)] backdrop-blur-xl">
          <ul className="grid grid-cols-4 gap-1 p-1">
            {WORKSPACE_NAV_ITEMS.map((item) => (
              <MobileNavItem
                key={item.key}
                item={item}
                isActive={item.key === activeItem.key}
                reduceMotion={reduceMotion}
              />
            ))}
          </ul>
        </div>
      </motion.nav>
    </>
  );
}
