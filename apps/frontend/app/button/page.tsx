'use client'

import { Button } from '@/components/ui/button'
import { Check, Download, Trash2, AlertCircle, Info } from 'lucide-react'

export default function ButtonDemoPage() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2 text-foreground">
            Button Color Variants
          </h1>
          <p className="text-muted-foreground">
            Semua warna button yang sudah diintegrasikan dengan theme signify-ai
          </p>
        </div>

        {/* Default Variants */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">
            Variants
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-card p-8 rounded-lg border border-border">
            {/* Default */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">
                Default
              </h3>
              <div className="flex flex-col gap-2">
                <Button variant="default">Default Button</Button>
                <Button variant="default" disabled>
                  Disabled
                </Button>
              </div>
            </div>

            {/* Destructive */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">
                Destructive
              </h3>
              <div className="flex flex-col gap-2">
                <Button variant="destructive">Delete Action</Button>
                <Button variant="destructive" disabled>
                  Disabled
                </Button>
              </div>
            </div>

            {/* Outline */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">
                Outline
              </h3>
              <div className="flex flex-col gap-2">
                <Button variant="outline">Outline Button</Button>
                <Button variant="outline" disabled>
                  Disabled
                </Button>
              </div>
            </div>

            {/* Secondary */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">
                Secondary
              </h3>
              <div className="flex flex-col gap-2">
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="secondary" disabled>
                  Disabled
                </Button>
              </div>
            </div>

            {/* Ghost */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">
                Ghost
              </h3>
              <div className="flex flex-col gap-2">
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="ghost" disabled>
                  Disabled
                </Button>
              </div>
            </div>

            {/* Link */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">Link</h3>
              <div className="flex flex-col gap-2">
                <Button variant="link">Link Button</Button>
                <Button variant="link" disabled>
                  Disabled
                </Button>
              </div>
            </div>

            {/* Success */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">
                Success
              </h3>
              <div className="flex flex-col gap-2">
                <Button variant="success">Success Action</Button>
                <Button variant="success" disabled>
                  Disabled
                </Button>
              </div>
            </div>

            {/* Warning */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">
                Warning
              </h3>
              <div className="flex flex-col gap-2">
                <Button variant="warning">Warning Action</Button>
                <Button variant="warning" disabled>
                  Disabled
                </Button>
              </div>
            </div>

            {/* Highlight */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">
                Highlight
              </h3>
              <div className="flex flex-col gap-2">
                <Button variant="highlight">Highlight Button</Button>
                <Button variant="highlight" disabled>
                  Disabled
                </Button>
              </div>
            </div>

            {/* Surface */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">
                Surface
              </h3>
              <div className="flex flex-col gap-2">
                <Button variant="surface">Surface Button</Button>
                <Button variant="surface" disabled>
                  Disabled
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Sizes */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Sizes</h2>
          <div className="bg-card p-8 rounded-lg border border-border space-y-4">
            <div className="flex items-center gap-4">
              <span className="w-24 text-sm font-medium text-muted-foreground">
                XS
              </span>
              <Button variant="default" size="xs">
                Extra Small
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-24 text-sm font-medium text-muted-foreground">
                SM
              </span>
              <Button variant="default" size="sm">
                Small
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-24 text-sm font-medium text-muted-foreground">
                Default
              </span>
              <Button variant="default" size="default">
                Default Size
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-24 text-sm font-medium text-muted-foreground">
                LG
              </span>
              <Button variant="default" size="lg">
                Large Button
              </Button>
            </div>
          </div>
        </section>

        {/* Icon Sizes */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">
            Icon Sizes
          </h2>
          <div className="bg-card p-8 rounded-lg border border-border space-y-4">
            <div className="flex items-center gap-4">
              <span className="w-24 text-sm font-medium text-muted-foreground">
                icon-xs
              </span>
              <Button variant="default" size="icon-xs">
                <Check className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-24 text-sm font-medium text-muted-foreground">
                icon-sm
              </span>
              <Button variant="default" size="icon-sm">
                <Check className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-24 text-sm font-medium text-muted-foreground">
                icon
              </span>
              <Button variant="default" size="icon">
                <Download className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-24 text-sm font-medium text-muted-foreground">
                icon-lg
              </span>
              <Button variant="default" size="icon-lg">
                <Trash2 className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </section>

        {/* With Icons */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">
            With Icons
          </h2>
          <div className="bg-card p-8 rounded-lg border border-border">
            <div className="flex flex-wrap gap-4">
              <Button variant="default">
                <Check className="h-4 w-4" />
                Confirm
              </Button>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              <Button variant="success">
                <Check className="h-4 w-4" />
                Success
              </Button>
              <Button variant="warning">
                <AlertCircle className="h-4 w-4" />
                Warning
              </Button>
              <Button variant="outline">
                <Info className="h-4 w-4" />
                More Info
              </Button>
              <Button variant="secondary">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </section>

        {/* Dark Mode Preview */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">
            Dark Mode Preview
          </h2>
          <div className="dark bg-background p-8 rounded-lg border border-border">
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground">
                  Semua Variants
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="default">Default</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                  <Button variant="success">Success</Button>
                  <Button variant="warning">Warning</Button>
                  <Button variant="highlight">Highlight</Button>
                  <Button variant="surface">Surface</Button>
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-border">
                <h3 className="font-medium text-sm text-muted-foreground">
                  Dengan Icons
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="default">
                    <Check className="h-4 w-4" />
                    Confirm
                  </Button>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                  <Button variant="success">
                    <Check className="h-4 w-4" />
                    Success
                  </Button>
                  <Button variant="outline">
                    <Info className="h-4 w-4" />
                    More Info
                  </Button>
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-border">
                <h3 className="font-medium text-sm text-muted-foreground">
                  Berbagai Ukuran
                </h3>
                <div className="flex items-center gap-3 flex-wrap">
                  <Button variant="default" size="xs">
                    XS
                  </Button>
                  <Button variant="default" size="sm">
                    Small
                  </Button>
                  <Button variant="default" size="default">
                    Default
                  </Button>
                  <Button variant="default" size="lg">
                    Large
                  </Button>
                  <Button variant="default" size="icon">
                    <Check className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Color Palette Reference */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-foreground">
            Color Palette Reference
          </h2>
          <div className="bg-card p-8 rounded-lg border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-primary border border-border"></div>
                <div>
                  <p className="font-medium text-sm">Primary</p>
                  <p className="text-xs text-muted-foreground">Deep Ocean Blue</p>
                  <p className="text-xs text-muted-foreground">#00008B</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-secondary border border-border"></div>
                <div>
                  <p className="font-medium text-sm">Secondary</p>
                  <p className="text-xs text-muted-foreground">Tech Teal</p>
                  <p className="text-xs text-muted-foreground">#40E0D0</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-destructive border border-border"></div>
                <div>
                  <p className="font-medium text-sm">Destructive</p>
                  <p className="text-xs text-muted-foreground">Soft Red</p>
                  <p className="text-xs text-muted-foreground">#E63946</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-success border border-border"></div>
                <div>
                  <p className="font-medium text-sm">Success</p>
                  <p className="text-xs text-muted-foreground">Tech Teal</p>
                  <p className="text-xs text-muted-foreground">#40E0D0</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-warning border border-border"></div>
                <div>
                  <p className="font-medium text-sm">Warning</p>
                  <p className="text-xs text-muted-foreground">Warm Sun</p>
                  <p className="text-xs text-muted-foreground">#FFC845</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-highlight border border-border"></div>
                <div>
                  <p className="font-medium text-sm">Highlight</p>
                  <p className="text-xs text-muted-foreground">Bright Lemon</p>
                  <p className="text-xs text-muted-foreground">#F3E44D</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-surface-tertiary border border-border"></div>
                <div>
                  <p className="font-medium text-sm">Surface Tertiary</p>
                  <p className="text-xs text-muted-foreground">Soft Sky</p>
                  <p className="text-xs text-muted-foreground">#ADD8E6</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-accent border border-border"></div>
                <div>
                  <p className="font-medium text-sm">Accent</p>
                  <p className="text-xs text-muted-foreground">Tech Teal</p>
                  <p className="text-xs text-muted-foreground">#40E0D0</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-24 rounded-lg bg-muted border border-border"></div>
                <div>
                  <p className="font-medium text-sm">Muted</p>
                  <p className="text-xs text-muted-foreground">Light Steel</p>
                  <p className="text-xs text-muted-foreground">#F8F9FA</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}