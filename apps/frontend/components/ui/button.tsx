import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-[0.85rem] text-sm font-bold tracking-tight outline-none transition-all duration-300 ease-[cubic-bezier(0.2,1,0.2,1)] focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20 motion-reduce:transform-none motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-50 hover:scale-[1.02] active:scale-[0.97] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:shadow-md",

        success:
          "bg-success text-success-foreground shadow-sm",

        warning:
          "bg-warning text-warning-foreground shadow-sm",

        destructive:
          "bg-destructive text-destructive-foreground shadow-sm",

        outline:
          "border border-border bg-background text-foreground shadow-sm hover:bg-secondary/50 hover:border-border",

        ghost:
          "text-foreground hover:bg-secondary/80",

        secondary:
          "bg-secondary text-secondary-foreground border border-border/10",

        highlight:
          "bg-accent text-accent-foreground shadow-sm",

        surface:
          "bg-surface-tertiary text-surface-tertiary-foreground",

        glass:
          "border border-border/20 bg-background/50 text-foreground backdrop-blur-xl hover:bg-background/80",

        signal:
          "bg-accent text-accent-foreground shadow-lg shadow-accent/20",

        link:
          "text-primary underline-offset-4 hover:underline hover:scale-100",
      },

      size: {
        default: "h-11 px-6 text-[13px]",
        xs: "h-8 gap-1 rounded-lg px-3 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-10 rounded-xl gap-1.5 px-5 text-[13px]",
        lg: "h-14 rounded-2xl px-10 text-base",
        icon: "size-11",
        "icon-xs": "size-8 rounded-lg",
        "icon-sm": "size-10 rounded-xl",
        "icon-lg": "size-14 rounded-2xl",
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
