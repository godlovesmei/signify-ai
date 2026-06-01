import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-black tracking-widest uppercase w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 transition-all duration-300",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-primary",
        secondary:
          "bg-secondary text-secondary-foreground border-border/20",
        destructive:
          "bg-destructive text-destructive-foreground border-destructive",
        outline:
          "border-border text-foreground bg-background",
        ghost:
          "border-transparent text-foreground bg-secondary/50",
        link:
          "border-transparent text-primary bg-transparent underline-offset-4",
        success:
          "bg-success text-success-foreground border-success",
        warning:
          "bg-warning text-warning-foreground border-warning",
        highlight:
          "bg-accent text-accent-foreground border-accent",
        surface:
          "bg-surface-tertiary text-surface-tertiary-foreground border-surface-tertiary",
        info:
          "bg-accent/10 text-accent border-accent/20",
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