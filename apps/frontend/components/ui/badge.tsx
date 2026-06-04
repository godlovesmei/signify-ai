import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * DESIGN.md defines one explicit badge-like pattern:
 *   blog-filter-chip — xl radius (30px), coral text/border, card-heading typography,
 *                      transparent or coral-fill bg, no uppercase (card-heading is Unica77 not mono)
 *
 * Additional chip patterns derived from DESIGN.md surface tokens:
 *   default      — primary fill (near-black), on-primary text, pill/xl shape
 *   outline      — 1px border (hairline), transparent fill, ink text — general outlined chip
 *   pill-outline — xl radius (30px), primary border+text — maps to button-pill-outline chip style
 *
 * Removed variants not in DESIGN.md: secondary, destructive, ghost, link, success,
 *   warning, highlight, surface, info.
 *
 * Typography: micro (Unica77, 12px, weight 400, line-height 1.4) — no uppercase for non-mono labels.
 * DESIGN.md uppercase is reserved for mono-label (CohereMono) only.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-1 text-[12px] font-normal tracking-normal transition-colors duration-200 [&>svg]:size-3",
  {
    variants: {
      variant: {
        /**
         * default — filled near-black chip (primary surface)
         */
        default:
          "bg-primary text-primary-foreground border-primary",

        /**
         * outline — general outlined chip; hairline border, transparent fill
         * Used in research-table topic pills and agent-console status chips.
         */
        outline:
          "border-border text-foreground bg-transparent",

        /**
         * pill-outline — coral-border chip; maps to blog-filter-chip (inactive state)
         * DESIGN.md: "inactive chips use coral outline and pale fill"
         */
        "pill-outline":
          "border-cohere-coral/50 text-cohere-coral bg-transparent",
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