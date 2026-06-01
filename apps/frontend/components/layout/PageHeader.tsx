import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-6 border-b border-cohere-hairline pb-6 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <p className="text-mono-label text-[12px] text-cohere-slate">Workspace</p>
        <h1 className="mt-2 font-display text-[40px] leading-none text-cohere-ink md:text-[48px]">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-[16px] leading-[1.5] text-cohere-body-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
