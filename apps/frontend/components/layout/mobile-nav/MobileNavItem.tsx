"use client";

import Link from "next/link";
import { BookOpen, Camera, History, Target, User, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { WorkspaceNavIcon, WorkspaceNavItem } from "./workspaceNavConfig";

interface MobileNavItemProps {
  item: WorkspaceNavItem;
  isActive: boolean;
  reduceMotion: boolean | null;
}

const ICON_MAP: Record<WorkspaceNavIcon, LucideIcon> = {
  translate: Camera,
  practice: Target,
  history: History,
  reference: BookOpen,
  user: User,
};

function createTransition(reduceMotion: boolean | null) {
  if (reduceMotion) return { duration: 0 };
  return { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const };
}

export default function MobileNavItem({
  item,
  isActive,
  reduceMotion,
}: MobileNavItemProps) {
  const Icon = ICON_MAP[item.icon];

  return (
    <li className="list-none">
      <motion.div whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
        <Link
          href={item.href}
          aria-current={isActive ? "page" : undefined}
          aria-label={item.label}
          className={cn(
            "relative flex h-[58px] flex-col items-center justify-center gap-1 rounded-sm px-1 transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cohere-focus",
            isActive
              ? "bg-cohere-primary text-cohere-canvas"
              : "text-cohere-slate hover:bg-cohere-stone hover:text-cohere-ink"
          )}
        >
          <motion.span
            className="flex items-center justify-center"
            animate={isActive ? { y: -1 } : { y: 0 }}
            transition={createTransition(reduceMotion)}
          >
            <Icon className="size-[19px]" strokeWidth={1.8} />
          </motion.span>
          <motion.span
            className="text-mono-label !text-[10px] tracking-normal"
            animate={{ opacity: isActive ? 1 : 0.72 }}
            transition={createTransition(reduceMotion)}
          >
            {item.label}
          </motion.span>
        </Link>
      </motion.div>
    </li>
  );
}
