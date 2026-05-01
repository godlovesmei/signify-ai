"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import MobileNavItem from "./MobileNavItem";
import {
  getActiveWorkspaceNavItem,
  isWorkspaceRoute,
  WORKSPACE_NAV_ITEMS,
} from "./workspaceNavConfig";

interface MobileBottomNavProps {
  reserveSpace?: boolean;
}

const MOBILE_NAV_HEIGHT_PX = 70;
const MOBILE_NAV_EXTRA_OFFSET_PX = 2;
const MOBILE_NAV_OFFSET_VALUE = `calc(${MOBILE_NAV_HEIGHT_PX}px + env(safe-area-inset-bottom, 0px) + ${MOBILE_NAV_EXTRA_OFFSET_PX}px)`;

export default function MobileBottomNav({
  reserveSpace = true,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  const activeItem = getActiveWorkspaceNavItem(pathname);
  const isWorkspace = isWorkspaceRoute(pathname);

  useEffect(() => {
    if (!isWorkspace) {
      return;
    }

    const root = document.documentElement;
    root.style.setProperty("--workspace-mobile-nav-offset", MOBILE_NAV_OFFSET_VALUE);

    return () => {
      root.style.setProperty("--workspace-mobile-nav-offset", "0px");
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
          className="md:hidden"
          style={{ height: MOBILE_NAV_OFFSET_VALUE }}
        />
      )}

      <motion.nav
        aria-label="Workspace mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 md:hidden"
        initial={reduceMotion ? undefined : { y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
        }
      >
        {/* Gradient fade above nav */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-background/60 to-transparent"
        />

        <div className="border-t border-white/10 bg-background/70 pb-[calc(env(safe-area-inset-bottom,0px)+2px)] pt-1.5 shadow-[0_-10px_40px_-20px_rgba(0,0,0,0.5)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/50">
          <div className="mx-auto w-full max-w-md px-2">
            <ul className="grid grid-cols-4 gap-0.5">
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
        </div>
      </motion.nav>
    </>
  );
}