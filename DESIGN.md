---
version: alpha
name: Cohere-design-analysis
description: Cohere's 2026 web system is a controlled enterprise AI interface built from stark white editorial space, deep green-black product bands, soft mineral surfaces, rounded media cards, and a distinctive type split between monospaced-feeling display headlines and precise Unica77 UI text.

colors:
  primary: "#17171c"
  cohere-black: "#000000"
  ink: "#212121"
  deep-green: "#003c33"
  dark-navy: "#071829"
  canvas: "#ffffff"
  soft-stone: "#eeece7"
  pale-green: "#edfce9"
  pale-blue: "#f1f5ff"
  hairline: "#d9d9dd"
  border-light: "#e5e7eb"
  card-border: "#f2f2f2"
  muted: "#93939f"
  slate: "#75758a"
  body-muted: "#616161"
  action-blue: "#1863dc"
  focus-blue: "#4c6ee6"
  coral: "#ff7759"
  coral-soft: "#ffad9b"
  form-focus: "#9b60aa"
  on-primary: "#ffffff"
  on-dark: "#ffffff"
  error: "#b30000"

typography:
  hero-display:
    fontFamily: CohereText
    fontSize: 96px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: -1.92px
  product-display:
    fontFamily: CohereText
    fontSize: 72px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: -1.44px
  section-display:
    fontFamily: Unica77 Cohere Web
    fontSize: 60px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: -1.2px
  section-heading:
    fontFamily: Unica77 Cohere Web
    fontSize: 48px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: -0.48px
  card-heading:
    fontFamily: Unica77 Cohere Web
    fontSize: 32px
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: -0.32px
  feature-heading:
    fontFamily: Unica77 Cohere Web
    fontSize: 24px
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: 0
  body-large:
    fontFamily: Unica77 Cohere Web
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  body:
    fontFamily: Unica77 Cohere Web
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  button:
    fontFamily: Unica77 Cohere Web
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.71
    letterSpacing: 0
  caption:
    fontFamily: Unica77 Cohere Web
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  mono-label:
    fontFamily: CohereMono
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0.28px
  micro:
    fontFamily: Unica77 Cohere Web
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 22px
  xl: 30px
  pill: 32px
  full: 9999px

spacing:
  xxs: 2px
  xs: 6px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  section: 80px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: 12px 24px
  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.xs}"
    padding: 8px 0
  button-pill-outline:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.button}"
    rounded: "{rounded.xl}"
    padding: 6px 12px
  announcement-bar:
    backgroundColor: "{colors.cohere-black}"
    textColor: "{colors.on-dark}"
    typography: "{typography.micro}"
    height: 36px
  hero-photo-card:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.lg}"
  agent-console-card:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.sm}"
    padding: 24px
  trust-logo-strip:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
  capability-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.xs}"
    padding: 24px
  dark-feature-band:
    backgroundColor: "{colors.deep-green}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.lg}"
    padding: 80px
  product-card:
    backgroundColor: "{colors.soft-stone}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: 32px
  blog-filter-chip:
    backgroundColor: transparent
    textColor: "{colors.coral}"
    typography: "{typography.card-heading}"
    rounded: "{rounded.sm}"
    padding: 8px 14px
  research-table:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-large}"
  contact-form-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 32px
  footer-newsletter:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-dark}"
    typography: "{typography.micro}"
---

## Overview

Cohere's current web presence feels like a sober enterprise AI command center with editorial restraint. The home page opens on a huge typographic declaration over a white canvas, then uses photography, dark product mockups, trust logos, and generous empty space to make AI infrastructure feel controlled rather than speculative. Product pages invert the tone into deep green-black or dark navy bands, while blog and research pages move toward publishing-system clarity: large filters, thin rules, dense lists, and pale technical backgrounds.

What makes the system distinctive is the mix of austere black-and-white UI with bursts of tactile brand imagery. The site avoids decorative chrome in the normal interface; color arrives through photography, abstract 3D media, coral blog taxonomy chips, blue research links, and dark product environments. Cards are rounded but not cute. Type is large, tight, and almost monospaced in spirit, creating a research-lab cadence across marketing, product, and editorial surfaces.

**Key Characteristics:**
- Monumental display headlines with very tight line height and negative tracking.
- White editorial canvases interrupted by deep green, dark navy, and image-led CTA bands.
- Rounded media cards and product cards, usually 8px to 22px.
- Pill CTAs in near-black or white, with most secondary actions rendered as underlined text links.
- Trust-logo strips with monochrome partner marks and very wide vertical spacing.
- Agent-console mockups using dark panels, small status chips, and product integration badges.
- Blog and research surfaces with prominent taxonomy chips, long rule-separated lists, and search fields.

## Colors

### Brand & Accent

- **Cohere Black** (`#000000`): Announcement bar, highest-contrast text, and the global brand anchor.
- **Near-Black Primary** (`#17171c`): Primary CTA buttons, dark footer, and deep UI cards.
- **Deep Enterprise Green** (`#003c33`): Product hero bands for North and Command-style dark sections.
- **Dark Navy** (`#071829`): Financial-services and security-oriented solution bands.
- **Action Blue** (`#1863dc`): Editorial links, pagination, and secondary action emphasis.
- **Coral** (`#ff7759`): Blog category chips, taxonomy outlines, and warm product markers.
- **Soft Coral** (`#ffad9b`): Pale chip borders and segmented article-label details.

### Surface & Background

- **Canvas White** (`#ffffff`): Dominant page background and form/card surface.
- **Soft Stone** (`#eeece7`): Product cards, testimonial placeholders, and warm neutral surface blocks.
- **Pale Green Wash** (`#edfce9`): North page section backdrop behind stacked dark capability panels.
- **Pale Blue Wash** (`#f1f5ff`): Blog CTA surface behind abstract 3D imagery.
- **Card Border** (`#f2f2f2`): Softest card containment line.

### Text & Rules

- **Ink** (`#212121`): Default body text and most link text on light backgrounds.
- **Muted Slate** (`#93939f`): Footer links, dates, metadata, and de-emphasized labels.
- **Slate** (`#75758a`): Research separators and tertiary text.
- **Hairline** (`#d9d9dd`): Standard list rules and section dividers.
- **Border Light** (`#e5e7eb`): Secondary divider and utility rule.

### Semantic

- **Focus Blue** (`#4c6ee6`): Keyboard focus and ring color.
- **Form Focus Violet** (`#9b60aa`): Focus border for text inputs.
- **Error Red** (`#b30000`): Extracted ring/shadow color associated with validation-like states.

### Gradient System

Cohere does not use gradients as a generic UI fill. Gradients and color fields are media-led: abstract 3D hero imagery, deep blue open-science particle fields, red-orange product video posters, and dark green-to-black product environments. Keep UI surfaces flat; reserve gradient richness for large media panels and CTA image bands.

## Typography

### Font Family

- **Display**: `CohereText`, falling back to `Space Grotesk`, `Inter`, `ui-sans-serif`, and `system-ui`.
- **Body/UI**: `Unica77 Cohere Web`, falling back to `Inter`, `Arial`, `ui-sans-serif`, and `system-ui`.
- **Technical labels**: `CohereMono`, falling back to `Arial`, `ui-sans-serif`, and `system-ui`.
- **Icons**: Cohere uses custom icon fonts and thin-line geometric illustrations.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|---|---|---:|---:|---:|---:|---|
| Hero Display | CohereText | 96px | 400 | 1.00 | -1.92px | Home page declaration scale. |
| Product Display | CohereText | 72px | 400 | 1.00 | -1.44px | Product and research hero headlines. |
| Section Display | Unica77 | 60px | 400 | 1.00 | -1.2px | Large product-page headings. |
| Section Heading | Unica77 | 48px | 400 | 1.20 | -0.48px | Split hero and CTA headings. |
| Card Heading | Unica77 | 32px | 400 | 1.20 | -0.32px | Feature card and list section titles. |
| Feature Heading | Unica77 | 24px | 400 | 1.30 | 0 | Cards, filters, and article titles. |
| Body Large | Unica77 | 18px | 400 | 1.40 | 0 | Lead text and larger paragraphs. |
| Body | Unica77 | 16px | 400 | 1.50 | 0 | Default copy and link text. |
| Button | Unica77 | 14px | 500 | 1.71 | 0 | Compact CTA labels. |
| Caption | Unica77 | 14px | 400 | 1.40 | 0 | Metadata and small explanatory text. |
| Mono Label | CohereMono | 14px | 400 | 1.40 | 0.28px | Uppercase technical labels. |
| Micro | Unica77 | 12px | 400 | 1.40 | 0 | Footer, nav microcopy, and small links. |

### Principles

- Use massive type sparingly; Cohere pages often have one oversized headline and then settle into restrained 16px-24px UI copy.
- Keep display type tight. Hero copy should feel compact and carved, not airy.
- Avoid heavy bold weights. Size, spacing, and surface contrast do most of the hierarchy work.
- Use uppercase mono labels for category and system markers, especially on product and research pages.
- Editorial pages can use coral chips and blue links, but the base typography remains black and measured.

## Layout

### Spacing System

The system uses an 8px base with many one-off alignment values: `2px`, `6px`, `8px`, `10px`, `12px`, `16px`, `20px`, `22px`, `24px`, `28px`, `32px`, `36px`, `40px`, `56px`, `60px`, `64px`, and `80px`.

Large sections rely on dramatic vertical breathing room. The home page places a trust-logo strip far below the hero media. Product pages often hold dark panels inside fields of empty white space, then transition to dense forms or footers only near the end.

### Grid & Container

- Global nav uses a three-zone layout: logo left, menu centered, sign-in/CTA right.
- Home hero is centered text above a two-card media composition: a wide product mockup card beside a narrower photography card.
- Feature sections commonly use 3-column cards on desktop.
- Product pages alternate centered hero blocks, trust-logo strips, large single-feature bands, and 2- or 3-column card grids.
- Research pages use full-width lists with date and chip columns instead of decorative cards.
- Forms use two-column input rows inside a rounded white card on dark or stone section backgrounds.

### Whitespace Philosophy

Cohere uses whitespace as a trust signal. Large empty intervals separate the brand claim, customer proof, product proof, and CTA. Dense content appears only where it serves the information architecture: research paper rows, blog card grids, and contact form fields.

## Elevation & Depth

Cohere is mostly flat. Depth comes from surface alternation, media contrast, rounded corners, and thin borders rather than drop shadows.

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow, white or dark field | Hero copy, research lists, editorial surfaces |
| Bordered | 1px `#d9d9dd`, `#e5e7eb`, or dark translucent rules | Research rows, forms, pale cards, footer inputs |
| Media Lift | Rounded image or video over contrasting section color | Hero photo cards, product videos, CTA imagery |
| Dark Product Field | Deep green or navy full-width band | Command, North, financial services, security sections |

## Shapes

### Radius Scale

| Token | Value | Role |
|---|---:|---|
| `xs` | 4px | Small images, search fields, article thumbnails, utility elements |
| `sm` | 8px | Blog chips, cards, small media, dialogs |
| `md` | 16px | Medium product cards and grouped blocks |
| `lg` | 22px | Signature media-card and soft placeholder radius |
| `xl` | 30px | Research/topic filter pills |
| `pill` | 32px | Primary CTA buttons |
| `full` | 9999px | Round status elements and fully pill-shaped controls |

### Image Treatment

Images are not decorative backdrops for text except in CTA bands. Most imagery sits as rounded cards with visible corners: product videos, enterprise photography, article thumbnails, and abstract 3D renders. The dominant radii are 8px and 22px.

## Components

### **`button-primary`**

Near-black or white pill CTA, depending on surface contrast. Uses 14px-16px Unica77, 12px 24px padding, and a 32px pill radius. This is the primary action style for "Request a demo", "Submit", and hero CTAs.

### **`button-secondary`**

Text-only action link, usually underlined or rule-aligned, with no filled background. Used for "Explore products", "Try the Playground", newsletter signup, and secondary hero actions.

### **`button-pill-outline`**

Outlined pill control with transparent fill, 1px dark border, and 30px radius. Used for research filters, topic tags, and lightweight taxonomy controls.

### Semantic & Utility Button Variants

The three brand variants above remain the default choice for marketing and documentation surfaces. Product workflows may use the following contextual variants when an action needs a clear semantic meaning:

| Variant | Role | Treatment |
|---|---|---|
| `success` | Confirm or complete a positive action | Deep enterprise green pill with on-dark text |
| `warning` | Call attention before a risky action | Coral pill with dark text |
| `destructive` | Delete, reset, or perform an irreversible action | Error-red pill with white text |
| `signal` | Trigger an informational or live-system action | Action-blue pill with theme-aware on-action text |
| `highlight` | Emphasize a selected or recommended lightweight action | Pale-green surface in light mode, deep-green-tinted surface in dark mode |
| `surface` | Neutral contained action on dense product surfaces | Pale-blue surface in light mode, navy-tinted surface in dark mode |
| `ghost` | Compact toolbar or low-emphasis action | Transparent surface with subtle hover fill |
| `link` | Editorial or navigational text action | Action-blue text with an underline interaction |

- `primary`, `secondary`, and `outline` are the canonical brand variants.
- `default` is retained only as a backwards-compatible alias for `primary`; do not use it in new examples.
- Semantic variants must reference `var(--color-*)` tokens. They must not hardcode light- or dark-only colors.
- `system` is a preference mode, not a third palette. It resolves to the light token set or the `.dark` token set based on the operating-system preference.

### **`announcement-bar`**

Full-width black strip above the nav, 36px tall, centered microcopy with an underlined "Learn more" link and a close control at the far right.

### **`hero-photo-card`**

Rounded media card used in the home hero and solution pages. It combines photography or abstract imagery with an overlaid dark agent-console module. Radius is usually 22px on large cards and 8px on smaller thumbnails.

### **`agent-console-card`**

Dark product mockup panel showing agent names, status chips, integration badges, prompt fields, and generated response cards. Background is near-black, text is white or muted, and small accent chips use product colors.

### **`trust-logo-strip`**

Centered copy above a row of monochrome customer logos. It is intentionally quiet: no cards, no borders, just large horizontal spacing and black or white logos depending on the background.

### **`capability-card`**

Content block with thin-line geometric illustration, 24px heading, body copy, and a text link. On light backgrounds, cards often have only a top rule or a subtle image/card relationship rather than full boxing.

### **`dark-feature-band`**

Deep green or navy full-width section used for product capabilities, security claims, and feature breakdowns. Text turns white; cards use darker translucent surfaces, pale borders, and abstract line illustrations.

### **`product-card`**

Warm stone card used for product/model summaries. Typically 3-column on desktop, with 8px radius, generous padding, a small pill button, a divider line, and checkmark bullet rows.

### **`blog-filter-chip`**

Large coral taxonomy chip used on the blog index. Active chips invert to coral fill with dark text; inactive chips use coral outline and pale fill. Typography is oversized relative to typical filters, making the taxonomy a hero-level control.

### **`research-table`**

Rule-separated publication list with title left, topic pills centered, and date right. Rows are tall, white, and border-driven; filters above use many compact outlined pills.

### **`contact-form-card`**

Rounded white form panel set against dark green or warm stone sections. Inputs are rectangular with thin gray borders, 12px-16px padding, and compact labels/placeholders. Submit uses the same near-black pill style as primary CTAs.

### **`footer-newsletter`**

Dark footer subscription block with coral "AI moves fast" label, white headline, muted legal microcopy, a single-line email field, and arrow submit marker. Footer columns use white section labels and muted links.

## Do's and Don'ts

### Do

- Use white canvas as the default surface; introduce dark green or navy as full-width product bands.
- Keep primary CTAs pill-shaped and near-black on light surfaces.
- Use 22px radius on major media cards and placeholders.
- Use coral for editorial taxonomy and small warm accents, not as the main CTA system.
- Use monochrome trust logos with wide spacing.
- Use thin-line geometric illustrations for research and capability icons.
- Let photography and product mockups carry color, while the UI shell stays restrained.

### Don't

- Do not turn coral or blue into broad decorative surface colors.
- Do not add heavy drop shadows to cards.
- Do not make every section card-based; Cohere often uses unframed rows, rules, and open space.
- Do not use rounded cards below 8px for major media.
- Do not replace the display/body type split with one generic sans-serif voice.
- Do not render undocumented interaction variants in documentation or previews.
- Do not use saturated gradients as normal UI backgrounds; keep gradients media-led.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---:|---|
| Small Mobile | <425px | Single-column cards, compact nav, reduced hero headline scale |
| Mobile | 425-640px | Hero media stacks, card grids become one column, form rows stack |
| Large Mobile | 640-768px | Wider one-column layouts with larger media cards |
| Tablet | 768-1024px | Two-column cards begin, nav spacing tightens |
| Desktop | 1024-1440px | Full nav, 3-column card grids, split hero compositions |
| Large Desktop | 1440-2560px | Wide containers and large empty vertical intervals |

### Touch Targets

Primary CTAs and pills meet comfortable touch sizing through 12px-24px padding and pill radii. Research filter chips and blog category chips are larger than standard tags, making dense taxonomy surfaces usable on touch devices.

### Collapsing Strategy

- Nav collapses from full horizontal links to a compact mobile menu.
- Hero media moves from split cards to stacked cards.
- Product and capability grids collapse from 3 columns to 2 and then 1.
- Form fields collapse from paired rows to a single column.
- Research rows preserve their rule-separated structure but stack metadata below titles on smaller widths.

## Iteration Guide

1. Start from a white canvas or a full-width dark green/navy band; avoid mid-tone page backgrounds unless the screenshot shows a specific CTA/form section.
2. Use `button-primary` for the single highest-priority action and `button-secondary` for the companion action.
3. Use `hero-photo-card` or `agent-console-card` when a page needs visual energy; avoid invented dashboard data.
4. For editorial pages, combine `blog-filter-chip`, `button-pill-outline`, and `research-table` instead of generic marketing cards.
5. Keep component examples structurally honest: placeholder product frames are better than invented product content.

## Known Gaps

- Exact proprietary font files are not bundled; use the documented fallbacks when implementing externally.
- Mobile screenshots were not regenerated in this public update, so mobile behavior is documented from the desktop system and existing responsive patterns.
- Some live pages lazy-load content blocks late; blank testimonial placeholders are documented as placeholder skeleton surfaces rather than filled testimonial cards.

---

## Dark Mode Tokens

### Theme Toggle Strategy

This design system uses the **`.dark` class approach** (Tailwind-compatible) as the official theme toggle strategy.

- Apply `class="dark"` to the `<html>` element when dark mode is active.
- Do **not** use `data-theme` attribute or media-query-only strategy unless specifically overriding for a subsystem.
- `prefers-color-scheme` may be used as the **initial default** before the user makes a manual choice, but the canonical toggle mechanism is the `.dark` class.

```tsx
// Recommended toggle implementation
function toggleTheme() {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem(
    "theme",
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );
}

// On initial load (before hydration)
const saved = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
if (saved === "dark" || (!saved && prefersDark)) {
  document.documentElement.classList.add("dark");
}
```

### Semantic CSS Variables

Define semantic tokens that swap automatically when `.dark` is applied. These variables sit on top of the raw color palette and are what components should reference.

```css
:root {
  /* Surfaces */
  --color-bg-base:        #ffffff;
  --color-bg-subtle:      #eeece7;
  --color-bg-inverse:     #17171c;
  --color-bg-product:     #003c33;

  /* Text */
  --color-text-primary:   #212121;
  --color-text-muted:     #93939f;
  --color-text-on-dark:   #ffffff;

  /* Borders */
  --color-border:         #d9d9dd;
  --color-border-subtle:  #e5e7eb;

  /* Interactive */
  --color-action:         #1863dc;
  --color-focus-ring:     #4c6ee6;
  --color-accent:         #ff7759;

  /* Component surface aliases */
  --color-card-bg:        #ffffff;
  --color-card-border:    #f2f2f2;
  --color-input-border:   #d9d9dd;
  --color-input-focus:    #9b60aa;
}

.dark {
  /* Surfaces */
  --color-bg-base:        #17171c;
  --color-bg-subtle:      #1e1e24;
  --color-bg-inverse:     #ffffff;
  --color-bg-product:     #003c33;

  /* Text */
  --color-text-primary:   #f0f0f4;
  --color-text-muted:     #6b6b7e;
  --color-text-on-dark:   #ffffff;

  /* Borders */
  --color-border:         #2e2e38;
  --color-border-subtle:  #252530;

  /* Interactive */
  --color-action:         #6b9fff;
  --color-focus-ring:     #7b8fff;
  --color-accent:         #ff8a70;

  /* Component surface aliases */
  --color-card-bg:        #1e1e24;
  --color-card-border:    #2e2e38;
  --color-input-border:   #2e2e38;
  --color-input-focus:    #b07ac0;
}
```

### Usage Rule

- Components must reference `var(--color-*)` tokens, not hardcoded hex values, for any property that changes between light and dark mode.
- The raw color palette (e.g. `#17171c`, `#003c33`) is the source of truth; semantic variables point to those values.
- Static surfaces like the `dark-feature-band` and `agent-console-card` retain their dark green/navy regardless of theme toggle.

---

## Polymorphic / asChild Pattern

### Rule

When a `Button` component needs to render as a Next.js `<Link>`, use the **Radix `asChild` prop** pattern. This is the official strategy for polymorphic rendering in this design system.

Do **not** use a generic `as` prop or manually duplicate button styling onto anchor/link elements.

### Implementation

```tsx
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button({
  asChild = false,
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
```

### Usage Examples

```tsx
// Renders as a native button
<Button variant="primary">Request access</Button>

// Renders as a Next.js Link, but with all button styling applied
<Button asChild variant="primary">
  <Link href="/demo">Request access</Link>
</Button>

// Renders as an anchor tag (external link)
<Button asChild variant="outline">
  <a href="https://docs.cohere.com" target="_blank" rel="noopener noreferrer">
    Read the docs
  </a>
</Button>
```

### Install Requirement

```bash
npm install @radix-ui/react-slot
```

### Rule for Codex

- Never duplicate button Tailwind classes onto `<Link>` or `<a>` elements manually.
- Always use `asChild` when the button must navigate.
- The `Slot` component merges all props and className onto the child element, so the child must accept `className` and spread `...props`.

---

## Button State Specification

All button variants must implement the following interaction states consistently. These states belong in the component definition, not only in the Motion section.

### State Matrix

| State      | `button-primary`                                      | `button-secondary`                             | `button-pill-outline`                          |
|------------|-------------------------------------------------------|------------------------------------------------|------------------------------------------------|
| **Default**  | Black pill, white text, no border                   | Transparent, ink text, no fill                 | Transparent, 1px dark border, primary text     |
| **Hover**    | Lifts `-translate-y-0.5`, coral-violet glow below   | Gradient underline appears (1px, 500ms)        | Border opacity increases, subtle bg tint       |
| **Focus**    | `ring-2 ring-offset-2 ring-[--color-focus-ring]`    | Same focus ring                                | Same focus ring                                |
| **Active**   | `scale-[0.97]`, glow dims                           | Opacity 0.75                                   | Background tint darkens                        |
| **Disabled** | Opacity 0.38, `cursor-not-allowed`, no hover effect | Opacity 0.38, `cursor-not-allowed`             | Opacity 0.38, `cursor-not-allowed`             |
| **Loading**  | Replace label with loading dots, disable pointer    | Replace label with loading dots                | Replace label with loading dots                |

### CSS / Tailwind Implementation Reference

```tsx
// button-primary with all states
<button
  className={cn(
    // base
    "relative isolate inline-flex items-center justify-center rounded-full bg-[#17171c] px-7 h-11 text-[14px] font-semibold text-white",
    // transition
    "transition-transform duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
    // hover
    "hover:-translate-y-0.5",
    // focus
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-focus-ring)]",
    // active
    "active:scale-[0.97]",
    // disabled
    "disabled:opacity-[0.38] disabled:cursor-not-allowed disabled:pointer-events-none",
    // loading
    isLoading && "pointer-events-none"
  )}
  disabled={disabled || isLoading}
  aria-disabled={disabled || isLoading}
>
  {isLoading ? <LoadingDots /> : children}
  {/* glow */}
  <span aria-hidden="true" className="..." />
</button>
```

### Loading State

Use the `loading-dot` CSS keyframe defined in the CSS Techniques Library. The loading state should:

- Replace the label text with three animated dots.
- Keep the button width stable (avoid layout shift).
- Set `aria-busy="true"` and `aria-label` for screen readers.

```tsx
{isLoading && <span aria-live="polite" className="sr-only">Loading…</span>}
```

### Rule for Codex

- Every button variant must implement all five states above.
- Focus rings must always be visible; never `outline-none` without a visible replacement.
- Active state `scale` must be instantaneous or very fast (`< 100ms`).
- Disabled state must not respond to hover or focus interactions.

---

## Accessibility & Color Contrast

### WCAG AA Compliance Requirement

All color combinations in this design system must meet **WCAG 2.1 Level AA** minimum contrast ratios:

- **Normal text (< 18px or < 14px bold):** minimum contrast ratio of **4.5:1**.
- **Large text (≥ 18px or ≥ 14px bold):** minimum contrast ratio of **3:1**.
- **UI components and graphical objects (icons, borders, input outlines):** minimum contrast ratio of **3:1**.

### Verified Combinations

The following pairings have been reviewed for AA compliance. When implementing new combinations, verify before shipping.

| Foreground           | Background            | Ratio (approx.) | Status |
|----------------------|-----------------------|-----------------|--------|
| `#212121` (Ink)      | `#ffffff` (Canvas)    | 16.1:1          | ✅ AAA |
| `#212121` (Ink)      | `#eeece7` (Soft Stone)| 13.8:1          | ✅ AAA |
| `#ffffff` (White)    | `#17171c` (Primary)   | 18.7:1          | ✅ AAA |
| `#ffffff` (White)    | `#003c33` (Deep Green)| 12.6:1          | ✅ AAA |
| `#93939f` (Muted)    | `#ffffff` (Canvas)    | 2.9:1           | ⚠️ Fails AA — use for non-essential decoration only |
| `#1863dc` (Action)   | `#ffffff` (Canvas)    | 4.7:1           | ✅ AA  |
| `#ff7759` (Coral)    | `#ffffff` (Canvas)    | 2.8:1           | ⚠️ Fails AA — coral is for large decorative text (blog chips) only, not body text |
| `#ff7759` (Coral)    | `#17171c` (Primary)   | 5.6:1           | ✅ AA  |
| `#f0f0f4` (Dark mode text) | `#17171c` (Dark bg) | 15.2:1    | ✅ AAA |

### Rules for Codex

- **Never use `#93939f` (Muted) for essential body text on white backgrounds.** Reserve it for timestamps, metadata, and decorative labels only.
- **Never use coral (`#ff7759`) for body-size text on white.** It is only permitted for large headings (≥ 24px) or chip/label contexts on dark surfaces.
- **All interactive elements** (buttons, links, form inputs) must meet AA contrast in default, hover, focus, and disabled states.
- When adding new colors or surface combinations not in this table, verify contrast using a tool such as [Accessible Colors](https://accessible-colors.com) or the browser DevTools accessibility panel before committing.
- In dark mode, re-verify all text/surface pairings using the semantic variable values defined in the Dark Mode Tokens section.
- Form input placeholder text (`color: var(--color-text-muted)`) is exempt from contrast requirements per WCAG 1.4.3 as long as placeholder is not the sole means of conveying input purpose.

---

## Motion & Interaction System

This design system must be implemented as a **restrained enterprise motion system**, not as decorative animation. The target behavior is inspired by Cohere-style product marketing: quiet initial load, smooth scroll reveals, sticky product demonstrations, horizontal feature movement, subtle hover micro-interactions, and dark product mockups that feel like a controlled AI workspace.

Motion should support comprehension. It should reveal hierarchy, clarify spatial relationships, and make product panels feel alive without overwhelming the user.

### Motion Principles

- **Calm first, expressive second.** Use motion to guide attention, not to entertain.
- **Editorial pacing.** Large headings and section entries should feel slow, clean, and deliberate.
- **Product mockups can be more animated.** Console windows, camera previews, scanning states, typing output, and progress indicators may use continuous subtle animation.
- **No bouncy consumer-app motion.** Avoid elastic, springy, playful motion unless used very lightly for button hover.
- **Use one major motion idea per section.** Do not combine parallax, text splitting, sticky pinning, and Lottie in the same content block unless it is a dedicated product showcase.
- **Respect reduced motion.** All JS and CSS animations must provide a `prefers-reduced-motion` fallback.

### Motion Timing Tokens

| Token | Duration | Easing | Use |
|---|---:|---|---|
| `motion-fast` | `180ms` | `cubic-bezier(0.22, 1, 0.36, 1)` | Link hover, icon shift, chip hover |
| `motion-base` | `280ms` | `cubic-bezier(0.22, 1, 0.36, 1)` | Button hover, card lift, dropdown reveal |
| `motion-slow` | `700ms` | `cubic-bezier(0.22, 1, 0.36, 1)` | Section reveal, image reveal, modal entrance |
| `motion-hero` | `1000ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Hero entrance, large text reveal |
| `motion-scroll` | scroll-driven | `scrub: 0.8 to 1.4` | Pinned sections, horizontal scroll, progress indicators |

### Recommended CSS Variables

Add these variables globally so both Tailwind classes and plain CSS can share the same motion language.

```css
:root {
  --ease-cohere: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-cohere-hero: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 180ms;
  --duration-base: 280ms;
  --duration-slow: 700ms;
  --duration-hero: 1000ms;
  --nav-height: 64px;
  --announcement-height: 36px;
  --scroll-progress: 0;
}
```

### Reduced Motion Rule

Every animation implementation must include this fallback.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.001ms !important;
  }

  [data-animate] {
    opacity: 1 !important;
    transform: none !important;
    filter: none !important;
    clip-path: none !important;
  }
}
```

---

## JavaScript Animation Libraries

Use a small set of focused libraries. Do not install animation libraries randomly. Each library has a specific role.

### Required Core Stack

```bash
npm install gsap @gsap/react motion lenis split-type lottie-react
```

### Optional 3D Stack

Only install this when the page needs WebGL, 3D abstract backgrounds, animated particles, or depth-based product visuals.

```bash
npm install three @react-three/fiber @react-three/drei
```

### Library Responsibilities

| Library / Technique | Primary Role | Use For | Avoid For |
|---|---|---|---|
| **Motion / Framer Motion** | Component-level motion | Page-load reveal, section fade-up, stagger, button/card hover, simple viewport animation | Long scroll-scrub timelines and pinned horizontal sections |
| **GSAP** | Timeline control | Sequenced hero animation, text split reveal, product mockup animation | Basic button hover that CSS can handle |
| **GSAP ScrollTrigger** | Scroll-based animation | Pinned sections, horizontal cards, scroll progress, sticky product showcases, scrubbed transforms | Tiny hover states |
| **Lenis** | Smooth scrolling | Premium scroll feel, anchor scroll, scroll normalization for ScrollTrigger | Modal scroll containers unless explicitly configured |
| **SplitType** | Text splitting | Hero word/line reveal, headline mask reveal, editorial title animation | Body paragraphs and accessibility-sensitive long text |
| **Lottie** | Lightweight vector animation | Loading states, waveform, scanning indicators, AI status loops, small icon motion | Core layout, full-page backgrounds, or text animation |
| **CSS keyframes** | Low-cost motion | Marquee logos, scanline, pulse, shimmer, loading dots, subtle floating cards | Complex scroll timelines |
| **IntersectionObserver** | Native reveal trigger | No-dependency reveal, adding `.is-visible` classes | Pinned or scrubbed scroll interactions |
| **Three.js / R3F** | WebGL visuals | Abstract 3D hero asset, particle field, depth-based media | Basic cards, buttons, dropdowns, forms |

---

## Page-Level Motion Patterns

### 1. Hero Load Sequence

Use for the first fold only. The hero should enter in this order:

1. Announcement bar and nav are already visible.
2. Mono label fades up.
3. Hero headline reveals by line or word.
4. Body copy fades up.
5. CTA buttons fade up.
6. Product mockup / media card scales in.
7. Ambient background glow slowly appears.

Recommended implementation:

- Use **Motion** for simple component entry.
- Use **GSAP + SplitType** if the headline needs line-by-line reveal.
- Avoid animating every word on small screens; reveal the full heading as one block below `640px`.

Motion example:

```tsx
import { motion } from "motion/react";

const reveal = {
  hidden: { opacity: 0, y: 28, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

export function HeroTitle() {
  return (
    <motion.h1
      initial="hidden"
      animate="visible"
      variants={reveal}
      className="font-display text-[56px] leading-none tracking-[-0.04em] md:text-[96px]"
    >
      Silent communication, clearly understood.
    </motion.h1>
  );
}
```

GSAP + SplitType example:

```tsx
"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import SplitType from "split-type";
import { useRef } from "react";

export function SplitHeadline({ children }: { children: string }) {
  const ref = useRef<HTMLHeadingElement | null>(null);

  useGSAP(() => {
    if (!ref.current) return;

    const split = new SplitType(ref.current, { types: "lines, words" });

    gsap.from(split.words, {
      yPercent: 110,
      opacity: 0,
      duration: 1,
      stagger: 0.035,
      ease: "power4.out",
    });

    return () => split.revert();
  }, []);

  return (
    <h1 ref={ref} className="overflow-hidden font-display text-[56px] leading-none md:text-[96px]">
      {children}
    </h1>
  );
}
```

### 2. Section Reveal

Use for most content blocks. Elements should enter from `24px` to `36px` below with slight blur.

CSS baseline:

```css
[data-animate] {
  opacity: 0;
  transform: translate3d(0, 36px, 0);
  filter: blur(10px);
  transition:
    opacity var(--duration-slow) var(--ease-cohere),
    transform var(--duration-slow) var(--ease-cohere),
    filter var(--duration-slow) var(--ease-cohere);
  transition-delay: var(--delay, 0ms);
  will-change: opacity, transform, filter;
}

[data-animate].is-visible {
  opacity: 1;
  transform: translate3d(0, 0, 0);
  filter: blur(0);
}
```

IntersectionObserver helper:

```tsx
"use client";

import { useEffect } from "react";

export function useRevealOnScroll() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-animate]"));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);
}
```

Usage:

```tsx
<div data-animate style={{ "--delay": "120ms" } as React.CSSProperties}>
  <FeatureCard />
</div>
```

### 3. Staggered Card Grid

Use for capability cards, product cards, research cards, and blog cards.

Rules:

- Parent section triggers the reveal.
- Children stagger by `80ms` to `140ms`.
- Do not exceed `600ms` total delay across a grid.
- Cards should not fly in from different directions unless the layout itself implies that movement.

Motion example:

```tsx
const grid = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.11,
      delayChildren: 0.12,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 26, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
  },
};
```

### 4. Sticky Product Showcase

Use for sections like "Our models. Your business." or SignifyAI workflow demos.

Behavior:

- Left side stays sticky.
- Right side scrolls through model/workflow items.
- Active item updates based on scroll position.
- Product mockup crossfades or transforms subtly.

Implementation options:

- Use `position: sticky` + IntersectionObserver for simple versions.
- Use GSAP ScrollTrigger for pinned, scrubbed versions.

GSAP pattern:

```tsx
"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

export function StickyShowcase() {
  const root = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      gsap.to("[data-showcase-progress]", {
        scaleY: 1,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top center",
          end: "bottom center",
          scrub: 0.8,
        },
      });

      gsap.utils.toArray<HTMLElement>("[data-showcase-item]").forEach((item) => {
        ScrollTrigger.create({
          trigger: item,
          start: "top 55%",
          end: "bottom 45%",
          toggleClass: { targets: item, className: "is-active" },
        });
      });
    },
    { scope: root }
  );

  return <section ref={root}>{/* sticky mockup + scroll items */}</section>;
}
```

### 5. Horizontal Scroll Cards

Use for industry cards, product cards, or case-study cards. This is one of the key Cohere-like interactions.

Rules:

- Only desktop/tablet should pin horizontal sections.
- On mobile, use normal vertical stacking or native horizontal scroll.
- Use a visible progress indicator.
- Do not pin more than one horizontal section on a short page.

GSAP ScrollTrigger pattern:

```tsx
"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

export function HorizontalCards() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const track = trackRef.current;
      if (!section || !track) return;

      const getDistance = () => track.scrollWidth - section.clientWidth;

      const tween = gsap.to(track, {
        x: () => -getDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${getDistance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      return () => tween.kill();
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="hidden overflow-hidden lg:block">
      <div ref={trackRef} className="flex w-max gap-5">
        {/* cards */}
      </div>
    </section>
  );
}
```

### 6. Marquee Logo Strip

Use for trust indicators. This should be CSS-only.

```css
.marquee {
  overflow: hidden;
}

.marquee-track {
  display: flex;
  width: max-content;
  gap: 4rem;
  animation: marquee 28s linear infinite;
}

.marquee:hover .marquee-track {
  animation-play-state: paused;
}

@keyframes marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}
```

Implementation rule:

- Duplicate the logo/text array exactly twice.
- Add `aria-hidden="true"` to the duplicate set.
- Pause on hover.
- Reduce or disable movement under `prefers-reduced-motion`.

### 7. Dropdown / Mega Menu Motion

Use for nav product menus. Cohere-style nav is simple: no heavy shadow, no bounce, no overly rounded floating blob.

Behavior:

- Opens on hover/focus for desktop.
- Opens by click/tap for mobile.
- Uses opacity + `translateY(-8px to 0)`.
- Has `pointer-events: none` when closed.
- Closes with short delay or when mouse leaves nav region.
- Keyboard focus must work.

CSS:

```css
.mega-menu {
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
  transition:
    opacity var(--duration-base) var(--ease-cohere),
    transform var(--duration-base) var(--ease-cohere);
}

.mega-menu[data-open="true"] {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
```

### 8. Cohere-Like CTA Hover

Primary CTAs should be black pills with a soft coral-violet-blue glow that appears below the button. The glow should not be a full gradient fill.

```tsx
<button className="group relative isolate inline-flex h-11 items-center justify-center rounded-full bg-black px-7 text-[14px] font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5">
  <span
    aria-hidden="true"
    className="pointer-events-none absolute -bottom-4 left-1/2 -z-20 h-9 w-[78%] -translate-x-1/2 rounded-full bg-[linear-gradient(90deg,rgba(255,106,88,0.82)_0%,rgba(214,117,232,0.66)_52%,rgba(96,112,255,0.50)_100%)] opacity-0 blur-xl transition-all duration-500 group-hover:w-[92%] group-hover:opacity-75"
  />
  <span>Request access</span>
</button>
```

Secondary sign-in links should use a thin gradient underline only on hover.

```tsx
<button className="group relative inline-flex w-fit py-3 text-[14px] font-medium text-cohere-ink">
  <span className="relative">
    Sign in
    <span
      aria-hidden="true"
      className="absolute left-0 top-[calc(100%+6px)] h-px w-0 rounded-full bg-[linear-gradient(90deg,#ff7a67_0%,#c98cff_52%,#5468ff_100%)] opacity-0 transition-all duration-500 group-hover:w-full group-hover:opacity-100"
    />
  </span>
</button>
```

### 9. Spotlight Card Hover

Use for product cards, capability cards, and large clickable surfaces.

```css
[data-spotlight] {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  transition:
    transform var(--duration-base) var(--ease-cohere),
    border-color var(--duration-base) var(--ease-cohere);
}

[data-spotlight]::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  background: radial-gradient(
    420px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(255, 255, 255, 0.25),
    transparent 42%
  );
  opacity: 0;
  transition: opacity var(--duration-base) var(--ease-cohere);
  pointer-events: none;
}

[data-spotlight]:hover {
  transform: translateY(-6px);
}

[data-spotlight]:hover::before {
  opacity: 1;
}

[data-spotlight] > * {
  position: relative;
  z-index: 1;
}
```

Pointer tracking helper:

```tsx
function handleSpotlightMove(event: React.MouseEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
}
```

### 10. Mac-Style Product Window

For SignifyAI, replace generic agent-console cards with a Mac-like product window when the section is meant to show live recognition.

Required visual details:

- Outer rounded shell: `28px` to `32px`.
- Inner black or near-black app surface.
- Top chrome row with red, yellow, green traffic lights.
- Live camera preview on the left.
- Diagnostic panel on the right.
- Thin scanning line over hand/camera preview.
- Landmark dots and lines to imply hand tracking.
- Output bubble showing recognized text.
- Keep all overlays semi-transparent and restrained.

CSS scanning line:

```css
.scanline {
  animation: scanner-move 3.2s ease-in-out infinite;
}

@keyframes scanner-move {
  0% {
    transform: translateY(0);
    opacity: 0.55;
  }
  50% {
    transform: translateY(250px);
    opacity: 1;
  }
  100% {
    transform: translateY(0);
    opacity: 0.55;
  }
}
```

---

## CSS Techniques Library

These are reusable CSS techniques Codex should prefer before adding new dependencies.

### Gradient Text Link Underline

Use for "Sign in", footer legal links, and secondary nav actions.

```css
.gradient-underline {
  position: relative;
  display: inline-flex;
}

.gradient-underline::after {
  content: "";
  position: absolute;
  left: 0;
  top: calc(100% + 6px);
  width: 0;
  height: 1px;
  border-radius: 999px;
  background: linear-gradient(90deg, #ff7a67 0%, #c98cff 52%, #5468ff 100%);
  opacity: 0;
  transition:
    width 500ms var(--ease-cohere),
    opacity 500ms var(--ease-cohere);
}

.gradient-underline:hover::after,
.gradient-underline:focus-visible::after {
  width: 100%;
  opacity: 1;
}
```

### Image Zoom Hover

Use for blog cards, media cards, and case-study cards.

```css
.image-zoom {
  overflow: hidden;
}

.image-zoom img {
  transform: scale(1.03);
  transition: transform 700ms var(--ease-cohere);
}

.image-zoom:hover img {
  transform: scale(1.08);
}
```

### Arrow Shift Link

Use for text links with arrows.

```css
.arrow-link svg {
  transition: transform 220ms var(--ease-cohere);
}

.arrow-link:hover svg {
  transform: translateX(5px);
}
```

### Soft Ambient Glow

Use behind hero cards or CTA pills. Do not use this as the default card background.

```css
.ambient-glow {
  position: absolute;
  pointer-events: none;
  border-radius: 999px;
  filter: blur(52px);
  opacity: 0.45;
  background: radial-gradient(circle, rgba(255, 119, 89, 0.28), transparent 62%);
}
```

### Floating Product Card

Use sparingly on hero mockup cards only.

```css
.floating-card {
  animation: float-card 6s ease-in-out infinite;
}

@keyframes float-card {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(0, -10px, 0);
  }
}
```

### Loading Dots

Use for AI "generating", "detecting", or "transcribing" states.

```css
.loading-dot {
  animation: loading-dot 1.2s ease-in-out infinite;
}

.loading-dot:nth-child(2) {
  animation-delay: 160ms;
}

.loading-dot:nth-child(3) {
  animation-delay: 320ms;
}

@keyframes loading-dot {
  0%,
  80%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-3px);
  }
}
```

### Shimmer Skeleton

Use for placeholder loading states only, not decorative content.

```css
.shimmer {
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
}

.shimmer::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.16), transparent);
  animation: shimmer 1.6s linear infinite;
}

@keyframes shimmer {
  to {
    transform: translateX(100%);
  }
}
```

### Blur-Up Media Reveal

Use when image/video cards enter the viewport.

```css
.media-reveal {
  opacity: 0;
  filter: blur(14px);
  transform: scale(0.98);
  transition:
    opacity 900ms var(--ease-cohere),
    filter 900ms var(--ease-cohere),
    transform 900ms var(--ease-cohere);
}

.media-reveal.is-visible {
  opacity: 1;
  filter: blur(0);
  transform: scale(1);
}
```

---

## GSAP Implementation Rules

### Setup

Create a single animation utility file if the codebase uses GSAP in multiple components.

```tsx
// lib/gsap.ts
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };
```

### React Usage

Always use `useGSAP` with a scoped root ref.

```tsx
"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

export function AnimatedSection() {
  const root = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      gsap.from("[data-gsap-reveal]", {
        y: 32,
        opacity: 0,
        filter: "blur(8px)",
        duration: 0.8,
        stagger: 0.1,
        ease: "power4.out",
        scrollTrigger: {
          trigger: root.current,
          start: "top 72%",
          once: true,
        },
      });
    },
    { scope: root }
  );

  return <section ref={root}>{/* content */}</section>;
}
```

### ScrollTrigger Cleanup

Use `useGSAP`; it automatically handles scoped cleanup. Avoid creating global ScrollTriggers inside components without cleanup.

### ScrollTrigger + Lenis Sync

If Lenis is installed, sync it with ScrollTrigger.

```tsx
"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,
      wheelMultiplier: 0.9,
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const update = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
    };
  }, []);

  return children;
}
```

### ScrollTrigger Refresh Rule

After loading images, fonts, or dynamic content, call:

```tsx
ScrollTrigger.refresh();
```

Do this only when layout size actually changes.

---

## Framer Motion / Motion Implementation Rules

Use the modern Motion import:

```tsx
import { motion, useReducedMotion } from "motion/react";
```

### Standard Reveal Variants

```tsx
export const motionReveal = {
  hidden: { opacity: 0, y: 32, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.85,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const motionStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
};
```

### Viewport Rule

```tsx
<motion.div
  variants={motionReveal}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, amount: 0.22 }}
/>
```

### Reduced Motion Rule

```tsx
const shouldReduceMotion = useReducedMotion();

<motion.div
  initial={shouldReduceMotion ? false : "hidden"}
  whileInView={shouldReduceMotion ? undefined : "visible"}
  variants={motionReveal}
/>
```

### Hover Rule

Use Motion for cards and buttons only when the interaction needs physics or pointer awareness. Otherwise use CSS.

```tsx
<motion.article
  whileHover={{ y: -6 }}
  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
/>
```

---

## Lenis Smooth Scrolling Rules

Lenis should be enabled once near the app root, not inside individual sections.

Recommended behavior:

- `lerp: 0.07` to `0.1`
- `wheelMultiplier: 0.85` to `1`
- Disable Lenis or set it carefully inside modals and drawers.
- Keep native keyboard scroll working.
- Do not use Lenis to hide poor layout rhythm.

Example placement:

```tsx
// app/providers.tsx
"use client";

import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SmoothScrollProvider>{children}</SmoothScrollProvider>;
}
```

---

## Lottie Usage Rules

Use Lottie for small, loopable product states.

Good examples:

- AI recognizing
- Camera scanning
- Waveform listening
- Generating response
- Upload processing
- Success check

Do not use Lottie for:

- Large hero backgrounds unless the file is optimized
- Critical content that must be readable by screen readers
- Decorative animation that loops aggressively near text

Implementation:

```tsx
"use client";

import Lottie from "lottie-react";
import animationData from "@/public/lottie/scanning.json";

export function ScanningLottie() {
  return (
    <Lottie
      animationData={animationData}
      loop
      autoplay
      aria-hidden="true"
      className="size-12"
    />
  );
}
```

Optimization:

- Keep JSON files small.
- Pause off-screen animations if many Lottie components exist on one page.
- Avoid more than 2-3 active Lottie loops per viewport.

---

## Three.js / WebGL Usage Rules

Three.js is optional. Use it only when a static image, CSS glow, or Lottie cannot achieve the desired visual.

Suitable use cases:

- Abstract 3D field in a hero media panel.
- Particle visualization behind a product mockup.
- Interactive product orb or model-vault-style preview.
- Depth-based background for a major campaign page.

Rules:

- Must be lazy-loaded.
- Must not block first contentful paint.
- Must respect `prefers-reduced-motion`.
- Provide a static fallback image.
- Avoid WebGL on low-power mobile devices unless performance is tested.

Example strategy:

```tsx
const Scene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => <StaticHeroFallback />,
});
```

---

## Navigation Motion Specification

### Desktop Navbar

- Layout: logo left, grouped nav center, sign-in/CTA right.
- Announcement bar: black, 36px, closable.
- Nav height: 64px.
- Sticky/fixed at top.
- On scroll: add hairline border, slight backdrop blur, and subtle background alpha.
- Dropdown: opacity + small vertical translation.
- No heavy box shadow.
- CTA: black pill with glow on hover.
- Sign in: text link with thin gradient underline on hover.

### Mobile Navbar

- Use full-width slide/fade panel, not tiny dropdown.
- Menu trigger: icon button with visible 1px hairline border.
- Each link should be 18px to 22px.
- Group actions at the bottom.
- Avoid nested hover-only interactions on mobile.

### Scroll State Hook

```tsx
function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const update = () => setScrolled(window.scrollY > threshold);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);

  return scrolled;
}
```

---

## Footer Motion Specification

Footer should follow the dark directory style:

- Dark near-black full-width surface.
- Newsletter panel on the left.
- Link directory columns on the right.
- Social icons bottom-right.
- Legal links bottom-right.
- Links use subtle opacity change and optional thin underline.
- Email field uses bottom border only.
- Submit arrow shifts right on hover.
- Avoid card shadows in the footer.

Newsletter input interaction:

```css
.footer-email-row {
  border-bottom: 1px solid rgba(255, 255, 255, 0.55);
  transition: border-color 280ms var(--ease-cohere);
}

.footer-email-row:hover,
.footer-email-row:focus-within {
  border-color: rgba(255, 255, 255, 1);
}

.footer-email-row svg {
  transition:
    transform 220ms var(--ease-cohere),
    opacity 220ms var(--ease-cohere);
}

.footer-email-row:hover svg,
.footer-email-row:focus-within svg {
  transform: translateX(4px);
  opacity: 1;
}
```

---

## Codex Implementation Contract

When Codex modifies this codebase, it should follow these rules.

### General

- Prefer **CSS transitions/keyframes** for simple hover and looping decorative effects.
- Use **Motion** for component-level reveal, stagger, and simple viewport animation.
- Use **GSAP ScrollTrigger** for pinned sections, horizontal scroll, scroll progress, and scroll-scrub timelines.
- Use **Lenis** once at the app provider/root level for smooth scroll.
- Use **SplitType** only for large headings, not body copy.
- Use **Lottie** for small product-state animations.
- Use **Three.js** only when a true 3D/WebGL visual is required.
- Do not add competing libraries like AOS, ScrollReveal, Anime.js, Swiper, or Locomotive Scroll unless specifically requested.

### Next.js / React

- Any component using browser APIs, GSAP, Motion hooks, Lenis, Lottie, or pointer tracking must start with `"use client"`.
- Do not import GSAP inside server components.
- Scope GSAP selectors with a `ref` and `useGSAP`.
- Do not query global selectors when a scoped ref is possible.
- Avoid hydration mismatch by not reading `window` during render.
- Do not animate layout-critical dimensions during initial server render.

### Accessibility

- Preserve semantic headings and links.
- Use `aria-hidden="true"` on decorative animated elements.
- Ensure dropdowns are keyboard accessible.
- Ensure focus rings remain visible.
- Do not hide content behind animation states if JavaScript fails.
- Respect `prefers-reduced-motion`.

### Performance

- Animate `transform` and `opacity` by default.
- Avoid animating `width`, `height`, `top`, `left`, or `filter` on many elements.
- Use `filter: blur()` only on small reveal groups, not large full-page content.
- Keep pinned ScrollTrigger sections limited.
- Lazy-load WebGL, Lottie, and heavy media.
- Use `will-change` sparingly and remove it if it causes memory pressure.
- Avoid more than 3 continuous animations visible in the same viewport.

### Visual Fidelity

- Keep UI surfaces mostly flat.
- Use hairline borders instead of heavy shadows.
- Use gradients mainly as glow, media, or subtle accent; not as large UI fills.
- Keep rounded corners consistent with the radius scale.
- Use generous whitespace and avoid dense card stacking.
- Buttons should be pill-shaped and near-black on light surfaces.
- Footer should use dark directory layout rather than generic CTA cards.

### Common Implementation Mistakes to Avoid

- Do not make every section animate from a different direction.
- Do not create large bouncing animations.
- Do not make Sign in underline thicker than `1px`.
- Do not add arrows to the compact CTA pill unless the design specifically asks for it.
- Do not place bright gradient backgrounds behind body text.
- Do not use a carousel when horizontal scroll cards or CSS scroll snap would be clearer.
- Do not animate text letter-by-letter on long Indonesian sentences; use word or line reveal only for short headlines.

---

## Suggested Codebase Structure

Use this structure if the project grows beyond one landing page.

```txt
components/
  motion/
    Reveal.tsx
    SplitHeadline.tsx
    SmoothScrollProvider.tsx
    HorizontalScrollSection.tsx
    StickyShowcase.tsx
  landing/
    MacSignScannerCard.tsx
    SpotlightCard.tsx
    MarqueeStrip.tsx
    MetricCounter.tsx
lib/
  gsap.ts
  motion.ts
styles/
  motion.css
public/
  lottie/
    scanning.json
```

### `lib/motion.ts`

```tsx
export const easeCohere = [0.22, 1, 0.36, 1] as const;

export const revealUp = {
  hidden: { opacity: 0, y: 32, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, ease: easeCohere },
  },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
};
```

### `components/motion/Reveal.tsx`

```tsx
"use client";

import { motion, useReducedMotion } from "motion/react";
import { revealUp } from "@/lib/motion";

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={revealUp}
      initial={shouldReduceMotion ? false : "hidden"}
      whileInView={shouldReduceMotion ? undefined : "visible"}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}
```

### `components/landing/SpotlightCard.tsx`

```tsx
"use client";

export function SpotlightCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      data-spotlight
      className={className}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
        event.currentTarget.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
      }}
    >
      {children}
    </article>
  );
}
```

---

## Quality Checklist for Cohere-Like Pages

Before a page is accepted, check:

- [ ] Hero has one clear oversized message and no competing visual clutter.
- [ ] Navbar has announcement bar, central nav, sign-in link, and compact CTA.
- [ ] Primary CTA uses black pill styling with subtle gradient glow on hover.
- [ ] Secondary sign-in/link underline is exactly `1px`.
- [ ] At least one product mockup feels alive through scanning, typing, progress, or subtle status animation.
- [ ] Cards use thin borders, restrained shadows, and consistent radius.
- [ ] Scroll reveal is consistent across sections.
- [ ] Pinned or horizontal scroll appears only where it improves understanding.
- [ ] Footer uses dark directory style with newsletter left and link columns right.
- [ ] Reduced motion fallback exists.
- [ ] Mobile layout does not rely on hover.
- [ ] No animation blocks content if JavaScript fails.

Important philosophy:
DESIGN.md should NOT be implemented mostly through globals.css only.
Use this split:
- Around 30% global foundation: CSS variables, theme tokens, typography base, container, motion tokens, reduced-motion fallback, reusable low-level utilities.
- Around 70% component-level implementation: variants, component APIs, composition patterns, state styling, interaction styling, accessibility behavior, and page usage.

Do not over-DRY the design system.
Do not move every visual decision into globals.css.
Components should own their variants.
Pages should mostly compose components and choose variants, not manually rebuild styling every time.

This is a hard architectural rule:
- DESIGN.md is not just a globals.css instruction file.
- globals.css should only define the foundation: tokens, base typography, theme variables, motion variables, reset-level behavior, focus styles, reduced-motion fallback, and truly reusable utilities.
- Most of the design system must live inside components through variants, sizes, states, and composition APIs.
- Button, Card, Badge, Input, layout components, landing components, and motion components must become the primary implementation surface.
- Pages should not repeatedly write long Tailwind class strings for the same visual pattern.
- Pages should compose existing components and select the correct variant, size, tone, and content structure.
- If a repeated visual pattern appears in two or more pages, prefer improving the component variant instead of duplicating page-level styling.
- If a section is unique, it may stay as a local page component, but it must still use shared Button/Card/Badge/Input variants where appropriate.
- Do not over-abstract everything into generic wrappers. Keep components practical, readable, and easy to use.
