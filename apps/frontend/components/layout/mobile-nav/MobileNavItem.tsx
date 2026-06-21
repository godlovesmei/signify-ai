"use client";

import { Link } from "@/i18n/navigation";
import { BookOpen, Camera, History, Target, User, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { WorkspaceNavIcon, WorkspaceNavItem } from "./workspaceNavConfig";

interface MobileNavItemProps {
  item: WorkspaceNavItem;
  isActive: boolean;
  reduceMotion: boolean | null;
}

interface MobileNavActionItemProps {
  label: string;
  icon: LucideIcon;
  reduceMotion: boolean | null;
  onClick: () => void;
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

const itemClassName =
  "relative flex h-[54px] w-full flex-col items-center justify-center gap-0.5 rounded-sm px-0.5 text-cohere-slate transition-colors duration-200 hover:bg-cohere-stone hover:text-cohere-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cohere-focus sm:px-1";

function MobileNavLabel({
  label,
  isActive,
  reduceMotion,
}: {
  label: string;
  isActive: boolean;
  reduceMotion: boolean | null;
}) {
  return (
    <motion.span
      className="max-w-full truncate text-center font-mono text-[8px] uppercase leading-none tracking-[0.04em] min-[390px]:text-[9px] min-[390px]:tracking-wide"
      animate={{ opacity: isActive ? 1 : 0.65 }}
      transition={createTransition(reduceMotion)}
    >
      {label}
    </motion.span>
  );
}

export default function MobileNavItem({
  item,
  isActive,
  reduceMotion,
}: MobileNavItemProps) {
  const Icon = ICON_MAP[item.icon];
  const t = useTranslations("navigation.workspace");
  const label = t(item.key);

  return (
    <li className="list-none">
      <motion.div whileTap={reduceMotion ? undefined : { scale: 0.96 }}>
        <Link
          href={item.href}
          aria-current={isActive ? "page" : undefined}
          aria-label={label}
          className={cn(
            itemClassName,
            isActive
              ? "bg-cohere-primary text-white dark:bg-cohere-ink dark:text-cohere-canvas"
              : ""
          )}
        >
          <motion.span
            className="flex items-center justify-center"
            animate={isActive ? { y: -1 } : { y: 0 }}
            transition={createTransition(reduceMotion)}
          >
            <Icon className="size-[18px]" strokeWidth={1.8} />
          </motion.span>
          <MobileNavLabel
            label={label}
            isActive={isActive}
            reduceMotion={reduceMotion}
          />
        </Link>
      </motion.div>
    </li>
  );
}

export function MobileNavActionItem({
  label,
  icon: Icon,
  reduceMotion,
  onClick,
}: MobileNavActionItemProps) {
  return (
    <li className="list-none">
      <motion.div whileTap={reduceMotion ? undefined : { scale: 0.96 }}>
        <button
          type="button"
          aria-label={label}
          aria-haspopup="dialog"
          onClick={onClick}
          className={itemClassName}
        >
          <motion.span
            className="flex items-center justify-center"
            animate={{ y: 0 }}
            transition={createTransition(reduceMotion)}
          >
            <Icon className="size-[18px]" strokeWidth={1.8} />
          </motion.span>
          <MobileNavLabel
            label={label}
            isActive={false}
            reduceMotion={reduceMotion}
          />
        </button>
      </motion.div>
    </li>
  );
}
