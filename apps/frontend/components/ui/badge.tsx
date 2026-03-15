import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-primary [a&]:hover:bg-primary/90 [a&]:hover:border-primary/90 dark:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground border-secondary [a&]:hover:bg-secondary/90 [a&]:hover:border-secondary/90 dark:hover:bg-secondary/80",
        destructive:
          "bg-destructive text-destructive-foreground border-destructive [a&]:hover:bg-destructive/90 [a&]:hover:border-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:hover:bg-destructive/80",
        outline:
          "border-border text-foreground bg-background [a&]:hover:bg-accent [a&]:hover:text-accent-foreground dark:bg-background dark:border-border dark:text-foreground",
        ghost:
          "border-transparent text-foreground bg-muted [a&]:hover:bg-accent [a&]:hover:text-accent-foreground dark:bg-muted dark:text-foreground",
        link:
          "border-transparent text-primary bg-transparent underline-offset-4 [a&]:hover:underline dark:text-primary",
        success:
          "bg-success text-success-foreground border-success [a&]:hover:bg-success/90 [a&]:hover:border-success/90 dark:hover:bg-success/80",
        warning:
          "bg-warning text-warning-foreground border-warning [a&]:hover:bg-warning/90 [a&]:hover:border-warning/90 dark:hover:bg-warning/80",
        highlight:
          "bg-highlight text-highlight-foreground border-highlight [a&]:hover:bg-highlight/90 [a&]:hover:border-highlight/90 dark:hover:bg-highlight/80",
        surface:
          "bg-surface-tertiary text-surface-tertiary-foreground border-surface-tertiary [a&]:hover:bg-surface-tertiary/90 [a&]:hover:border-surface-tertiary/90 dark:hover:bg-surface-tertiary/80",
        info:
          "bg-accent text-accent-foreground border-accent [a&]:hover:bg-accent/80 [a&]:hover:border-accent/80 dark:hover:bg-accent/70",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }