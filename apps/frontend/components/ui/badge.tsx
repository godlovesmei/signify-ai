import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[30px] border px-3 py-1 text-[12px] font-medium tracking-normal uppercase transition-colors duration-200 [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-primary",
        secondary:
          "bg-secondary text-secondary-foreground border-border",
        destructive:
          "bg-destructive text-destructive-foreground border-destructive",
        outline:
          "border-border text-foreground bg-background",
        ghost:
          "border-transparent text-foreground bg-secondary",
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
          "bg-transparent text-accent border-accent/30",
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
