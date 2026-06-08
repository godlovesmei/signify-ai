"use client"

import * as React from "react"
import { Slot, Slottable } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "group/button relative isolate inline-flex shrink-0 items-center justify-center whitespace-nowrap",
    "font-[var(--font-family-body)] tracking-normal",
    "transition-[transform,opacity,background-color,border-color,color] duration-[var(--duration-base)] ease-[var(--ease-cohere)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]",
    "data-[disabled=true]:pointer-events-none data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-[0.38]",
    "data-[loading=true]:pointer-events-none data-[loading=true]:text-transparent data-[loading=true]:[&_svg]:invisible",
    "data-[disabled=false]:active:duration-[80ms]",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default: [
          "gap-2 rounded-[var(--radius-token-pill)] bg-[var(--color-bg-inverse)] px-6 py-3",
          "text-[14px] font-medium leading-[1.71] text-[var(--color-text-inverse)]",
          "[--button-loader-color:var(--color-text-inverse)]",
          "data-[disabled=false]:hover:opacity-90 data-[disabled=false]:active:opacity-75",
        ],
        primary: [
          "gap-2 rounded-[var(--radius-token-pill)] bg-[var(--color-bg-inverse)] px-6 py-3",
          "text-[14px] font-medium leading-[1.71] text-[var(--color-text-inverse)]",
          "[--button-loader-color:var(--color-text-inverse)]",
          "data-[disabled=false]:hover:opacity-90 data-[disabled=false]:active:opacity-75",
        ],
        secondary: [
          "gap-2 rounded-[var(--radius-token-xs)] bg-transparent px-0 py-2",
          "text-[16px] font-normal leading-6 text-[var(--color-text-primary)]",
          "[--button-loader-color:var(--color-text-primary)] [--button-underline-color:var(--color-text-primary)]",
          "data-[disabled=false]:hover:[&_[data-button-underline]]:scale-x-100",
          "data-[disabled=false]:hover:[&_[data-button-underline]]:opacity-100",
          "data-[disabled=false]:active:opacity-75",
        ],
        outline: [
          "gap-2 rounded-[var(--radius-token-xl)] border border-[color-mix(in_srgb,var(--color-text-primary)_55%,transparent)] bg-transparent px-3 py-1.5",
          "text-[14px] font-medium leading-[1.71] text-[var(--color-text-primary)]",
          "[--button-loader-color:var(--color-text-primary)]",
          "data-[disabled=false]:hover:border-[var(--color-text-primary)]",
          "data-[disabled=false]:hover:bg-[color-mix(in_srgb,var(--color-bg-subtle)_65%,transparent)]",
          "data-[disabled=false]:active:bg-[var(--color-bg-subtle)]",
        ],
        success: [
          "gap-2 rounded-[var(--radius-token-pill)] bg-[var(--color-state-success)] px-6 py-3",
          "text-[14px] font-medium leading-[1.71] text-[var(--color-text-on-success)]",
          "[--button-loader-color:var(--color-text-on-success)]",
          "data-[disabled=false]:hover:opacity-90 data-[disabled=false]:active:opacity-75",
        ],
        warning: [
          "gap-2 rounded-[var(--radius-token-pill)] bg-[var(--color-state-warning)] px-6 py-3",
          "text-[14px] font-medium leading-[1.71] text-[var(--color-text-on-warning)]",
          "[--button-loader-color:var(--color-text-on-warning)]",
          "data-[disabled=false]:hover:opacity-90 data-[disabled=false]:active:opacity-75",
        ],
        destructive: [
          "gap-2 rounded-[var(--radius-token-pill)] bg-[var(--color-state-destructive)] px-6 py-3",
          "text-[14px] font-medium leading-[1.71] text-[var(--color-text-on-destructive)]",
          "[--button-loader-color:var(--color-text-on-destructive)]",
          "data-[disabled=false]:hover:opacity-90 data-[disabled=false]:active:opacity-75",
        ],
        signal: [
          "gap-2 rounded-[var(--radius-token-pill)] bg-[var(--color-action)] px-6 py-3",
          "text-[14px] font-medium leading-[1.71] text-[var(--color-text-on-action)]",
          "[--button-loader-color:var(--color-text-on-action)]",
          "data-[disabled=false]:hover:opacity-90 data-[disabled=false]:active:opacity-75",
        ],
        highlight: [
          "gap-2 rounded-[var(--radius-token-pill)] border border-[var(--color-highlight-border)] bg-[var(--color-highlight-bg)] px-6 py-3",
          "text-[14px] font-medium leading-[1.71] text-[var(--color-text-on-highlight)]",
          "[--button-loader-color:var(--color-text-on-highlight)]",
          "data-[disabled=false]:hover:border-[var(--color-text-on-highlight)] data-[disabled=false]:active:opacity-75",
        ],
        surface: [
          "gap-2 rounded-[var(--radius-token-pill)] border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-6 py-3",
          "text-[14px] font-medium leading-[1.71] text-[var(--color-text-on-surface-tertiary)]",
          "[--button-loader-color:var(--color-text-on-surface-tertiary)]",
          "data-[disabled=false]:hover:border-[var(--color-text-on-surface-tertiary)] data-[disabled=false]:active:opacity-75",
        ],
        onDark: [
          "gap-2 rounded-[var(--radius-token-pill)] border border-white/85 bg-white px-6 py-3",
          "text-[14px] font-medium leading-[1.71] text-[#17171c]",
          "[--button-loader-color:#17171c]",
          "data-[disabled=false]:hover:border-white data-[disabled=false]:hover:bg-white/90 data-[disabled=false]:active:bg-white/80",
        ],
        outlineOnDark: [
          "gap-2 rounded-[var(--radius-token-pill)] border border-white/25 bg-transparent px-6 py-3",
          "text-[14px] font-medium leading-[1.71] text-white",
          "[--button-loader-color:#ffffff]",
          "data-[disabled=false]:hover:border-white/45 data-[disabled=false]:hover:bg-white/10 data-[disabled=false]:active:bg-white/15",
        ],
        ghostOnDark: [
          "gap-2 rounded-[var(--radius-token-xs)] bg-transparent px-3 py-2",
          "text-[14px] font-medium leading-[1.71] text-white/55",
          "[--button-loader-color:#ffffff]",
          "data-[disabled=false]:hover:bg-white/10 data-[disabled=false]:hover:text-white data-[disabled=false]:active:bg-white/15",
        ],
        ghost: [
          "gap-2 rounded-[var(--radius-token-xs)] bg-transparent px-3 py-2",
          "text-[14px] font-medium leading-[1.71] text-[var(--color-text-primary)]",
          "[--button-loader-color:var(--color-text-primary)]",
          "data-[disabled=false]:hover:bg-[var(--color-bg-subtle)] data-[disabled=false]:active:opacity-75",
        ],
        link: [
          "gap-2 rounded-[var(--radius-token-xs)] bg-transparent px-0 py-2",
          "text-[16px] font-normal leading-6 text-[var(--color-action)]",
          "[--button-loader-color:var(--color-action)] [--button-underline-color:var(--color-action)]",
          "data-[disabled=false]:hover:[&_[data-button-underline]]:scale-x-100",
          "data-[disabled=false]:hover:[&_[data-button-underline]]:opacity-100",
          "data-[disabled=false]:active:opacity-75",
        ],
      },
      size: {
        xs: "",
        sm: "",
        md: "",
        default: "",
        lg: "",
        icon: "size-11 p-0",
        "icon-xs": "size-8 p-0",
        "icon-sm": "size-10 p-0",
        "icon-lg": "size-12 p-0",
      },
    },
    compoundVariants: [
      {
        variant: [
          "default",
          "primary",
          "success",
          "warning",
          "destructive",
          "signal",
          "highlight",
          "surface",
          "onDark",
        ],
        size: "xs",
        className: "px-3 py-1.5 text-[12px]",
      },
      {
        variant: [
          "default",
          "primary",
          "success",
          "warning",
          "destructive",
          "signal",
          "highlight",
          "surface",
          "onDark",
        ],
        size: "sm",
        className: "px-5 py-2.5 text-[13px]",
      },
      {
        variant: [
          "default",
          "primary",
          "success",
          "warning",
          "destructive",
          "signal",
          "highlight",
          "surface",
          "onDark",
        ],
        size: "lg",
        className: "px-8 py-3.5 text-[16px]",
      },
      {
        variant: ["secondary", "link"],
        size: "xs",
        className: "py-1 text-[13px]",
      },
      {
        variant: ["secondary", "link"],
        size: "sm",
        className: "py-1.5 text-[14px]",
      },
      {
        variant: ["secondary", "link"],
        size: "lg",
        className: "py-3 text-[18px]",
      },
      {
        variant: ["outline", "ghost", "outlineOnDark", "ghostOnDark"],
        size: "xs",
        className: "px-2.5 py-1 text-[12px]",
      },
      {
        variant: ["outline", "ghost", "outlineOnDark", "ghostOnDark"],
        size: "sm",
        className: "text-[13px]",
      },
      {
        variant: ["outline", "ghost", "outlineOnDark", "ghostOnDark"],
        size: "lg",
        className: "px-4 py-2 text-[16px]",
      },
      {
        variant: ["secondary", "link"],
        size: ["icon-xs", "icon-sm", "icon", "icon-lg"],
        className:
          "rounded-[var(--radius-token-xs)] data-[disabled=false]:hover:bg-[var(--color-bg-subtle)]",
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
)

const loadingDotStyles = `
  @keyframes signify-button-loading-dot {
    0%, 80%, 100% {
      opacity: 0.35;
      transform: translateY(0);
    }

    40% {
      opacity: 1;
      transform: translateY(-3px);
    }
  }

  [data-button-loading-dot] {
    animation: signify-button-loading-dot 1.2s ease-in-out infinite;
  }

  [data-button-loading-dot]:nth-child(2) {
    animation-delay: 160ms;
  }

  [data-button-loading-dot]:nth-child(3) {
    animation-delay: 320ms;
  }
`

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    isLoading?: boolean
    loadingLabel?: string
  }

function LoadingDots({ label }: { label: string }) {
  return (
    <>
      <style href="signify-button-loading-dots" precedence="low">
        {loadingDotStyles}
      </style>
      <span
        data-button-loader
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center gap-1.5 text-[var(--button-loader-color)]"
      >
        <span data-button-loading-dot className="size-1.5 rounded-full bg-current" />
        <span data-button-loading-dot className="size-1.5 rounded-full bg-current" />
        <span data-button-loading-dot className="size-1.5 rounded-full bg-current" />
      </span>
      <span aria-live="polite" className="sr-only">
        {label}
      </span>
    </>
  )
}

function SecondaryUnderline() {
  return (
    <span
      data-button-underline
      aria-hidden="true"
      className="pointer-events-none absolute bottom-1 left-0 h-px w-full origin-left scale-x-0 rounded-full bg-[var(--button-underline-color)] opacity-0 transition-[transform,opacity] duration-[var(--duration-base)] ease-[var(--ease-cohere)]"
    />
  )
}

function Button({
  asChild = false,
  variant = "primary",
  size = "md",
  className,
  children,
  disabled = false,
  isLoading = false,
  loadingLabel = "Loading",
  type = "button",
  tabIndex,
  onClickCapture,
  onKeyDownCapture,
  "aria-label": ariaLabel,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading
  const isIconSize = typeof size === "string" && size.startsWith("icon")
  const content = [
    <Slottable key="content">{children}</Slottable>,
    isLoading ? <LoadingDots key="loader" label={loadingLabel} /> : null,
    (variant === "secondary" || variant === "link") && !isIconSize ? (
      <SecondaryUnderline key="underline" />
    ) : null,
  ]

  function handleClickCapture(event: React.MouseEvent<HTMLButtonElement>) {
    if (isDisabled) {
      event.preventDefault()
      event.stopPropagation()
      return
    }

    onClickCapture?.(event)
  }

  function handleKeyDownCapture(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (isDisabled && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault()
      event.stopPropagation()
      return
    }

    onKeyDownCapture?.(event)
  }

  const sharedProps = {
    "data-slot": "button",
    "data-variant": variant,
    "data-size": size,
    "data-disabled": isDisabled,
    "data-loading": isLoading,
    "aria-busy": isLoading || undefined,
    "aria-disabled": isDisabled || undefined,
    "aria-label": isLoading ? loadingLabel : ariaLabel,
    className: cn(buttonVariants({ variant, size }), className),
  }

  if (asChild) {
    return (
      <Slot
        {...props}
        {...sharedProps}
        tabIndex={isDisabled ? -1 : tabIndex}
        onClickCapture={handleClickCapture}
        onKeyDownCapture={handleKeyDownCapture}
      >
        {content}
      </Slot>
    )
  }

  return (
    <button
      {...props}
      {...sharedProps}
      type={type}
      disabled={isDisabled}
      tabIndex={tabIndex}
      onClickCapture={handleClickCapture}
      onKeyDownCapture={handleKeyDownCapture}
    >
      {content}
    </button>
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
