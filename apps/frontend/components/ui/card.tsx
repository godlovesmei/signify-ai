import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * DESIGN.md defines four card surface patterns:
 *
 *   default (capability-card) — canvas bg (#fff), ink text, xs radius (4px) → sm (8px) for most cards,
 *                               1px hairline border, 24px padding, no shadow (flat)
 *   agent-console-card        — primary bg (#17171c), on-dark text (#fff), sm radius (8px), 24px padding
 *   hero-photo-card           — canvas bg (#fff), lg radius (22px) — for media cards
 *   product-card              — soft-stone bg (#eeece7), ink text, sm radius (8px), 32px padding
 *
 * All cards: shadow-none (DESIGN.md: flat system, depth via surface alternation + borders).
 */
const cardVariants = cva(
  "relative flex flex-col transition-colors duration-200 shadow-none",
  {
    variants: {
      variant: {
        /**
         * default — capability-card surface
         * bg: canvas, border: hairline (1px), radius: sm (8px), padding: 24px, gap: 24px
         */
        default:
          "gap-6 rounded-sm border border-border bg-card p-6",

        /**
         * agent-console-card — dark product mockup panel
         * bg: primary (#17171c), text: on-dark (#fff), radius: sm (8px), padding: 24px
         */
        "agent-console":
          "gap-6 rounded-sm border border-transparent bg-primary p-6 text-primary-foreground",

        /**
         * hero-photo-card — rounded media card (home hero, solution pages)
         * bg: canvas, radius: lg (22px) — dominant signature radius for major media
         */
        hero:
          "gap-6 rounded-lg border border-border bg-card p-6",

        /**
         * product-card — warm stone surface (3-column product/model summaries)
         * bg: soft-stone (#eeece7), text: ink (#212121), radius: sm (8px), padding: 32px
         */
        product:
          "gap-6 rounded-sm border border-border bg-secondary p-8 text-secondary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type CardProps = React.ComponentProps<"div"> &
  VariantProps<typeof cardVariants> & {
    asChild?: boolean
  }

function Card({ className, variant = "default", asChild = false, ...props }: CardProps) {
  const Comp = asChild ? Slot.Root : "div"
  return (
    <Comp
      data-slot="card"
      data-variant={variant}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6 border-b border-border",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-[24px] leading-[1.3] font-normal text-foreground",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        "text-muted-foreground text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        "px-6 text-foreground",
        className
      )}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center px-6 gap-4 [.border-t]:pt-6 border-t border-border",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
}