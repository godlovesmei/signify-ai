import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-[32px] text-sm font-medium tracking-normal outline-none transition-colors duration-200 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-cohere-ink/90",

        success:
          "bg-success text-success-foreground hover:bg-success/90",

        warning:
          "bg-warning text-warning-foreground hover:bg-warning/90",

        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",

        outline:
          "border border-border bg-transparent text-foreground hover:bg-secondary",

        ghost:
          "text-foreground hover:bg-secondary",

        secondary:
          "bg-secondary text-secondary-foreground border border-border",

        highlight:
          "bg-accent text-accent-foreground hover:bg-accent/90",

        surface:
          "bg-surface-tertiary text-surface-tertiary-foreground border border-border",

        signal:
          "bg-accent text-accent-foreground hover:bg-accent/90",

        link:
          "text-primary underline-offset-4 hover:underline",
      },

      size: {
        default: "h-11 px-6 text-[14px]",
        xs: "h-8 gap-1 rounded-[30px] px-3 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-10 rounded-[32px] gap-1.5 px-5 text-[13px]",
        lg: "h-12 rounded-[32px] px-8 text-[14px]",
        icon: "size-11",
        "icon-xs": "size-8 rounded-sm",
        "icon-sm": "size-10 rounded-sm",
        "icon-lg": "size-12 rounded-sm",
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
