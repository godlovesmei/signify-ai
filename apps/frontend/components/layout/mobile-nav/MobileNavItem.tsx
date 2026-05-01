"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { WorkspaceNavIcon, WorkspaceNavItem } from "./workspaceNavConfig";

interface MobileNavItemProps {
  item: WorkspaceNavItem;
  isActive: boolean;
  reduceMotion: boolean | null;
}

interface MobileIconProps {
  icon: WorkspaceNavIcon;
  isActive: boolean;
  reduceMotion: boolean | null;
}

function createIconTransition(reduceMotion: boolean | null) {
  if (reduceMotion) {
    return { duration: 0 };
  }
  return {
    duration: 0.24,
    ease: [0.22, 1, 0.36, 1] as const,
  };
}

function MobileIcon({ icon, isActive, reduceMotion }: MobileIconProps) {
  const iconTransition = createIconTransition(reduceMotion);
  const circlePath =
    "M12 3.75C7.44 3.75 3.75 7.44 3.75 12C3.75 16.56 7.44 20.25 12 20.25C16.56 20.25 20.25 16.56 20.25 12C20.25 7.44 16.56 3.75 12 3.75Z";

  const renderTranslate = () => (
    <>
      <motion.path
        d={circlePath}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={
          isActive
            ? { pathLength: 1, pathOffset: 0, pathSpacing: 1 }
            : { pathLength: 0.88, pathOffset: 0.06, pathSpacing: 0.86 }
        }
        transition={iconTransition}
      />
      <motion.path
        d="M7.5 9.25H16.5M8.6 12H15.4M9.5 14.75H14.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={
          isActive
            ? { pathLength: 1, pathOffset: 0, opacity: 1 }
            : { pathLength: 0.72, pathOffset: 0.24, opacity: 0.82 }
        }
        transition={iconTransition}
      />
    </>
  );

  const renderPractice = () => (
    <>
      <motion.path
        d="M3.75 9.25L12 5L20.25 9.25L12 13.5L3.75 9.25Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={
          isActive
            ? { pathLength: 1, pathOffset: 0, pathSpacing: 1 }
            : { pathLength: 0.86, pathOffset: 0.12, pathSpacing: 0.88 }
        }
        transition={iconTransition}
      />
      <motion.path
        d="M7.25 11.1V14.1C7.25 15.8 9.35 17.15 12 17.15C14.65 17.15 16.75 15.8 16.75 14.1V11.1"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={
          isActive
            ? { pathLength: 1, pathOffset: 0, opacity: 1 }
            : { pathLength: 0.8, pathOffset: 0.2, opacity: 0.84 }
        }
        transition={iconTransition}
      />
      <motion.path
        d="M19 10.2V14.7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={
          isActive
            ? { pathLength: 1, opacity: 1 }
            : { pathLength: 0.78, opacity: 0.78 }
        }
        transition={iconTransition}
      />
    </>
  );

  const renderHistory = () => (
    <>
      <motion.path
        d={circlePath}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={
          isActive
            ? { pathLength: 1, pathOffset: 0, pathSpacing: 1 }
            : { pathLength: 0.9, pathOffset: 0.08, pathSpacing: 0.9 }
        }
        transition={iconTransition}
      />
      <motion.path
        d="M12 7.5V12L15.25 13.7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={
          isActive
            ? { pathLength: 1, pathOffset: 0, opacity: 1 }
            : { pathLength: 0.66, pathOffset: 0.32, opacity: 0.8 }
        }
        transition={iconTransition}
      />
    </>
  );

  const renderReference = () => (
    <>
      <motion.path
        d="M5.75 5.6H11.75C13.15 5.6 14.3 6.75 14.3 8.15V18.4H8.6C7.02 18.4 5.75 17.12 5.75 15.55V5.6Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={
          isActive
            ? { pathLength: 1, pathOffset: 0, pathSpacing: 1 }
            : { pathLength: 0.88, pathOffset: 0.1, pathSpacing: 0.88 }
        }
        transition={iconTransition}
      />
      <motion.path
        d="M18.25 5.6H12.25C10.85 5.6 9.7 6.75 9.7 8.15V18.4H15.4C16.98 18.4 18.25 17.12 18.25 15.55V5.6Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={
          isActive
            ? { pathLength: 1, pathOffset: 0, opacity: 1 }
            : { pathLength: 0.84, pathOffset: 0.14, opacity: 0.84 }
        }
        transition={iconTransition}
      />
    </>
  );

  return (
    <motion.svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      animate={isActive ? { scale: 1, y: -1 } : { scale: 0.95, y: 0 }}
      transition={iconTransition}
    >
      {icon === "translate" && renderTranslate()}
      {icon === "practice" && renderPractice()}
      {icon === "history" && renderHistory()}
      {icon === "reference" && renderReference()}
    </motion.svg>
  );
}

export default function MobileNavItem({
  item,
  isActive,
  reduceMotion,
}: MobileNavItemProps) {
  return (
    <li className="list-none">
      <motion.div whileTap={reduceMotion ? undefined : { scale: 0.97 }}>
        <Link
          href={item.href}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "relative flex h-[58px] flex-col items-center justify-center gap-0.5 rounded-2xl px-1",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
            isActive ? "text-primary" : "text-muted-foreground/60"
          )}
        >
          {isActive && (
            <motion.span
              layoutId="workspace-mobile-active-indicator"
              className="absolute inset-0 rounded-2xl bg-primary/14"
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 420, damping: 32, mass: 0.4 }
              }
            />
          )}

          <span className="relative z-10 flex items-center justify-center">
            <MobileIcon
              icon={item.icon}
              isActive={isActive}
              reduceMotion={reduceMotion}
            />
          </span>

          <motion.span
            className="relative z-10 text-[10px] font-medium tracking-[0.01em]"
            animate={{ opacity: isActive ? 1 : 0.86, y: isActive ? -1 : 0 }}
            transition={createIconTransition(reduceMotion)}
          >
            {item.label}
          </motion.span>
        </Link>
      </motion.div>
    </li>
  );
}