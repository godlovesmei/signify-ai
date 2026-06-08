import { describe, expect, it } from "vitest"

import { buttonVariants } from "@/components/ui/Button"

const variants = [
  "default",
  "primary",
  "secondary",
  "outline",
  "success",
  "warning",
  "destructive",
  "signal",
  "highlight",
  "surface",
  "onDark",
  "outlineOnDark",
  "ghostOnDark",
  "ghost",
  "link",
] as const

const sizes = [
  "xs",
  "sm",
  "md",
  "default",
  "lg",
  "icon-xs",
  "icon-sm",
  "icon",
  "icon-lg",
] as const

describe("buttonVariants", () => {
  it.each(variants)("exposes the %s variant", (variant) => {
    expect(buttonVariants({ variant })).toContain("data-[disabled=true]")
  })

  it.each(sizes)("exposes the %s size", (size) => {
    expect(buttonVariants({ size })).toContain("focus-visible:ring")
  })

  it("TC-025 keeps default as a compatibility alias for primary", () => {
    expect(buttonVariants({ variant: "default" })).toBe(
      buttonVariants({ variant: "primary" }),
    )
  })

  it.each([
    ["success", "--color-state-success"],
    ["warning", "--color-state-warning"],
    ["destructive", "--color-state-destructive"],
    ["signal", "--color-action"],
    ["highlight", "--color-highlight-bg"],
    ["surface", "--color-bg-tertiary"],
  ] as const)("maps %s to a semantic theme token", (variant, token) => {
    expect(buttonVariants({ variant })).toContain(token)
  })

  it("keeps on-dark actions readable on the always-dark camera surface", () => {
    expect(buttonVariants({ variant: "onDark" })).toContain("bg-white")
    expect(buttonVariants({ variant: "onDark" })).toContain("text-[#17171c]")
    expect(buttonVariants({ variant: "outlineOnDark" })).toContain("text-white")
    expect(buttonVariants({ variant: "ghostOnDark" })).toContain("text-white/55")
  })

  it("TC-025 uses a surface hover instead of an underline for text-action icons", () => {
    expect(buttonVariants({ variant: "secondary", size: "icon" })).toContain(
      "hover:bg-[var(--color-bg-subtle)]",
    )
  })
})
