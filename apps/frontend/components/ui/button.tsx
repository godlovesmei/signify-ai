import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-md text-sm font-semibold outline-none transition-all duration-200 ease-out focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transform-none motion-reduce:transition-none disabled:pointer-events-none disabled:translate-y-0 disabled:scale-100 disabled:opacity-55 disabled:shadow-none hover:-translate-y-px active:translate-y-0 active:scale-[0.98] aria-invalid:border-destructive aria-invalid:ring-destructive/25 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_10px_22px_-14px_rgba(var(--glow-primary),0.72)] hover:bg-primary/90 hover:shadow-[0_0_0_1px_rgba(var(--glow-primary),0.16),0_18px_34px_-18px_rgba(var(--glow-primary),0.82)] dark:hover:bg-primary/80",

        success:
          "bg-success text-success-foreground shadow-[0_10px_22px_-14px_rgba(var(--glow-success),0.72)] hover:bg-success/90 hover:shadow-[0_0_0_1px_rgba(var(--glow-success),0.18),0_18px_34px_-18px_rgba(var(--glow-success),0.72)] dark:hover:bg-success/80",

        warning:
          "bg-warning text-warning-foreground shadow-[0_10px_22px_-14px_rgba(var(--glow-warning),0.62)] hover:bg-warning/90 hover:shadow-[0_0_0_1px_rgba(var(--glow-warning),0.18),0_18px_34px_-18px_rgba(var(--glow-warning),0.70)] dark:hover:bg-warning/80",

        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_10px_22px_-14px_rgba(var(--glow-error),0.78)] hover:bg-destructive/90 hover:shadow-[0_0_0_1px_rgba(var(--glow-error),0.18),0_18px_34px_-18px_rgba(var(--glow-error),0.78)] focus-visible:ring-destructive/30 dark:focus-visible:ring-destructive/45",

        outline:
          "border border-input bg-background text-foreground shadow-xs hover:border-primary/35 hover:bg-accent/10 hover:text-foreground hover:shadow-[0_12px_24px_-18px_rgba(var(--shadow-color),0.45)] dark:bg-background/70 dark:hover:bg-white/[0.06]",

        ghost:
          "text-foreground shadow-none hover:bg-primary/10 hover:text-primary active:bg-primary/15",

        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 hover:shadow-[0_12px_24px_-18px_rgba(var(--shadow-color),0.38)]",

        highlight:
          "bg-highlight text-highlight-foreground shadow-xs hover:bg-highlight/90 hover:shadow-[0_12px_24px_-18px_rgba(var(--glow-primary),0.45)]",

        surface:
          "bg-surface-tertiary text-surface-tertiary-foreground shadow-xs hover:bg-surface-tertiary/80 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(2,6,23,0.1)]",

        glass:
          "border border-border/50 bg-card/70 text-foreground shadow-xs backdrop-blur-md hover:border-primary/25 hover:bg-card/90 hover:shadow-[0_12px_28px_-20px_rgba(var(--shadow-color),0.52)] dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]",

        signal:
          "border border-primary/20 bg-primary text-primary-foreground shadow-[0_12px_26px_-14px_rgba(var(--glow-primary),0.82)] hover:bg-primary/90 hover:shadow-[0_0_0_1px_rgba(var(--glow-cyan),0.20),0_18px_38px_-18px_rgba(var(--glow-primary),0.92)] dark:border-primary/35",

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

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    isLoading?: boolean
    loadingText?: string
  }

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  disabled,
  isLoading = false,
  loadingText,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading
  const classNames = cn(buttonVariants({ variant, size, className }))

  if (asChild) {
    return (
      <Slot.Root
        data-slot="button"
        data-variant={variant}
        data-size={size}
        aria-busy={isLoading || undefined}
        aria-disabled={isDisabled || undefined}
        className={classNames}
        {...props}
      >
        {children}
      </Slot.Root>
    )
  }

  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      className={classNames}
      {...props}
    >
      {isLoading && (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      )}
      {isLoading && loadingText ? loadingText : children}
    </button>
  )
}

export { Button, buttonVariants }
