import Link from 'next/link';
import Image from 'next/image';

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
  const iconSize = sizeMap[size];

  return (
    <span className="flex items-center gap-2">
      <span className="relative flex shrink-0 items-center justify-center transition-transform group-hover:scale-105">
        {/* Light mode logo */}
        <Image
          src="/nobackground-logo.png"
          alt="Signify AI logo"
          width={iconSize}
          height={iconSize}
          className="block h-auto w-auto dark:hidden object-contain"
          priority
        />
        {/* Dark mode logo */}
        <Image
          src="/nobackground-logoo.png"
          alt="Signify AI logo"
          width={iconSize}
          height={iconSize}
          className="hidden h-auto w-auto dark:block object-contain"
          priority
        />
      </span>

      {showWordmark && (
        <span
          className="font-black tracking-tighter text-foreground leading-none"
          style={{ fontSize: size === 'lg' ? '1.75rem' : size === 'md' ? '1.5rem' : '1.25rem' }}
        >
          Signify<span className="text-muted-foreground/40">AI</span>
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
