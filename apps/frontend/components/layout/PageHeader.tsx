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
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-cohere-hairline pb-4",
        "sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:pb-5",
        className
      )}
    >
      <div className="min-w-0">
        <h1
          className={cn(
            "break-words font-display leading-none text-cohere-ink",
            "text-[24px] sm:text-[28px] md:text-[32px] lg:text-[36px]"
          )}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-xl text-sm leading-6 text-cohere-body-muted">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}