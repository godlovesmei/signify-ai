import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-md text-sm font-medium outline-none transition-all duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none hover:-translate-y-px active:translate-y-0 active:scale-[0.98] active:shadow-[inset_0_2px_6px_rgba(0,0,0,0.35)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        // 🔵 PRIMARY
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(59,130,246,0.35),0_12px_24px_-14px_rgba(2,6,23,0.45)] dark:hover:bg-primary/80",

        // 🟢 SUCCESS
        success:
          "bg-success text-success-foreground shadow-sm hover:bg-success/90 hover:shadow-[0_0_20px_rgba(34,197,94,0.35),0_12px_24px_-14px_rgba(6,95,70,0.45)] dark:hover:bg-success/80",

        // 🟡 WARNING
        warning:
          "bg-warning text-warning-foreground shadow-sm hover:bg-warning/90 hover:shadow-[0_0_20px_rgba(245,158,11,0.35),0_12px_24px_-14px_rgba(120,53,15,0.45)] dark:hover:bg-warning/80",

        // 🔴 DESTRUCTIVE
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-[0_0_20px_rgba(239,68,68,0.45),0_12px_24px_-14px_rgba(127,29,29,0.5)] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",

        // 🧊 GLASS (REPLACES OUTLINE)
        outline:
          "border border-white/20 bg-white/10 backdrop-blur-md text-foreground shadow-none " +
          "hover:bg-white/15 hover:border-white/30 hover:backdrop-blur-lg " +
          "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.08)] " +
          "active:shadow-[inset_0_2px_6px_rgba(0,0,0,0.25)] " +
          "dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10",

        // 👻 GHOST
        ghost:
          "text-foreground shadow-none hover:bg-primary/5 hover:text-primary active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]",

        // ⚪ SECONDARY
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 hover:shadow-[0_0_16px_rgba(100,116,139,0.25),0_10px_20px_-16px_rgba(2,6,23,0.4)]",

        // 🟣 HIGHLIGHT
        highlight:
          "bg-highlight text-highlight-foreground shadow-xs hover:bg-highlight/90 hover:shadow-[0_0_16px_rgba(168,85,247,0.3),0_10px_20px_-16px_rgba(2,6,23,0.38)]",

        // 🪟 SURFACE
        surface:
          "bg-surface-tertiary text-surface-tertiary-foreground shadow-xs hover:bg-surface-tertiary/80 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(2,6,23,0.1)]",

        // 🔗 LINK
        link:
          "text-primary underline-offset-4 hover:underline hover:translate-y-0 hover:shadow-none active:scale-100",
      },

      size: {
        default: "h-10 px-5 py-2.5 text-sm has-[>svg]:px-4",
        xs: "h-7 gap-1 rounded-md px-2.5 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 rounded-md gap-1.5 px-4 text-sm has-[>svg]:px-3",
        lg: "h-12 rounded-md px-8 text-base has-[>svg]:px-6",
        icon: "size-10",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }