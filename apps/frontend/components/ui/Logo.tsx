import { Link } from "@/i18n/navigation";
import Image from 'next/image';
import { useTranslations } from "next-intl";

/**
 * Logo — Not explicitly defined as a component in DESIGN.md.
 * Aligned to documented tokens:
 *   - font-display (CohereText) for wordmark — DESIGN.md display font
 *   - font-weight: 400 — DESIGN.md: display type is always weight 400
 *   - letter-spacing: 0 — DESIGN.md: feature-heading and body use tracking 0
 *   - sizing via sizeMap: sm=28, md=34, lg=40 — within DESIGN.md spacing system
 */

type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  href?: string | false;
  size?: LogoSize;
  showWordmark?: boolean;
  className?: string;
}

const sizeMap: Record<LogoSize, number> = {
  sm: 28,
  md: 34,
  lg: 40,
};

function LogoContent({
  size = 'md',
  showWordmark = true,
}: Pick<LogoProps, 'size' | 'showWordmark'>) {
  const t = useTranslations("common");
  const iconSize = sizeMap[size];

  return (
    <span className="flex items-center gap-2">
      <span className="relative flex shrink-0 items-center justify-center">
        {/* Light mode logo */}
        <Image
          src="/nobackground-logo.png"
          alt={t("logoAlt")}
          width={iconSize}
          height={iconSize}
          className="block h-auto w-auto dark:hidden object-contain"
          priority
        />
        {/* Dark mode logo */}
        <Image
          src="/nobackground-logoo.png"
          alt={t("logoAlt")}
          width={iconSize}
          height={iconSize}
          className="hidden h-auto w-auto dark:block object-contain"
          priority
        />
      </span>

      {showWordmark && (
        <span
          className="font-display font-normal tracking-normal text-current leading-none"
          style={{ fontSize: size === 'lg' ? '1.75rem' : size === 'md' ? '1.5rem' : '1.25rem' }}
        >
          Signify<span className="brand-ai-gradient">AI</span>
        </span>
      )}
    </span>
  );
}

export function Logo({
  href = '/',
  size = 'md',
  showWordmark = true,
  className = '',
}: LogoProps) {
  const content = <LogoContent size={size} showWordmark={showWordmark} />;

  if (href === false) {
    return <div className={`group inline-flex ${className}`}>{content}</div>;
  }

  return (
    <Link href={href} className={`group inline-flex ${className}`}>
      {content}
    </Link>
  );
}
