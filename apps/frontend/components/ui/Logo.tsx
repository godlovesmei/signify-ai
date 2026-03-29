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
  const icon = sizeMap[size];

  return (
    <span className="flex items-center gap-2">
      <span
        className="relative shrink-0 transition-transform group-hover:scale-105"
        style={{ width: icon, height: icon }}
      >
        <Image
          src="/signify-icon-v2.svg"
          alt="Signify.ai logo"
          fill
          className="object-contain"
          priority
        />
      </span>

      {showWordmark && (
        <span className="font-bold tracking-normal text-foreground text-xl">
          Signify<span className="text-primary">AI</span>
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