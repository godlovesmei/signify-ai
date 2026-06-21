"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { Settings } from "lucide-react";
import { usePathname } from "@/i18n/navigation";
import MobileNavItem, { MobileNavActionItem } from "./MobileNavItem";
import {
  getActiveWorkspaceNavItem,
  isWorkspaceRoute,
  WORKSPACE_NAV_ITEMS,
} from "./workspaceNavConfig";

interface MobileBottomNavProps {
  onSettingsClick: () => void;
  reserveSpace?: boolean;
}

const BOTTOM_NAV_HEIGHT_PX = 64;
const BOTTOM_NAV_OFFSET_VALUE = `calc(${BOTTOM_NAV_HEIGHT_PX}px + env(safe-area-inset-bottom, 0px))`;

export default function MobileBottomNav({
  onSettingsClick,
  reserveSpace = true,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const t = useTranslations("navigation.aria");
  const commonT = useTranslations("common");

  const activeItem = getActiveWorkspaceNavItem(pathname);
  const isWorkspace = isWorkspaceRoute(pathname);

  useEffect(() => {
    if (!isWorkspace) return;
    const root = document.documentElement;
    const media = window.matchMedia("(max-width: 1023px)");
    const syncOffset = () => {
      root.style.setProperty(
        "--workspace-mobile-nav-offset",
        media.matches ? BOTTOM_NAV_OFFSET_VALUE : "0px"
      );
    };

    syncOffset();
    media.addEventListener("change", syncOffset);

    return () => {
      media.removeEventListener("change", syncOffset);
      root.style.setProperty("--workspace-mobile-nav-offset", "0px");
    };
  }, [isWorkspace]);

  if (!isWorkspace || !activeItem) return null;

  return (
    <>
      {/* Space reservation: mobile bottom nav only */}
      {reserveSpace && (
        <div
          aria-hidden="true"
          className="lg:hidden"
          style={{ height: BOTTOM_NAV_OFFSET_VALUE }}
        />
      )}

      {/* Mobile and tablet use the bottom nav; desktop uses the sidebar. */}
      <motion.nav
        aria-label={t("workspace")}
        className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
        initial={reduceMotion ? undefined : { y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
        }
      >
        <div className="border-t border-cohere-hairline bg-cohere-canvas pb-[env(safe-area-inset-bottom,0px)] pt-1">
          <ul className="grid grid-cols-6 gap-0 px-1">
            {WORKSPACE_NAV_ITEMS.map((item) => (
              <MobileNavItem
                key={item.key}
                item={item}
                isActive={item.key === activeItem.key}
                reduceMotion={reduceMotion}
              />
            ))}
            <MobileNavActionItem
              label={commonT("settings")}
              icon={Settings}
              reduceMotion={reduceMotion}
              onClick={onSettingsClick}
            />
          </ul>
        </div>
      </motion.nav>
    </>
  );
}
