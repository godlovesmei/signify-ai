import Link from 'next/link';
import Image from 'next/image';

type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  /** Render as a clickable link to href (default: '/') */
  href?: string | false;
  /** Size preset */
  size?: LogoSize;
  /** Show or hide the wordmark text (default: true) */
  showWordmark?: boolean;
  /** Additional className for the wrapper */
  className?: string;
}

const sizeMap: Record<LogoSize, { icon: number; text: string }> = {
  sm: { icon: 56, text: 'text-lg' },
  md: { icon: 64, text: 'text-xl' },
  lg: { icon: 72, text: 'text-2xl' },
};

function LogoContent({
  size = 'md',
  showWordmark = true,
}: Pick<LogoProps, 'size' | 'showWordmark'>) {
  const { icon, text } = sizeMap[size!];

  return (
    <span className="flex items-center gap-2.5">
      {/* Icon */}
      <span className="relative shrink-0 transition-transform group-hover:scale-105"
        style={{ width: `${icon}px`, height: `${icon}px` }}>
        <Image
          src="/logo.png"
          alt="Signify.ai logo"
          fill
          className="object-contain"
          priority
        />
      </span>

      {/* Wordmark */}
      {showWordmark && (
        <span className={`font-bold tracking-tight text-foreground ${text}`}>
          Signify<span className="text-primary">.ai</span>
        </span>
      )}
    </span>
  );
}

export function Logo({ href = '/', size = 'md', showWordmark = true, className = '' }: LogoProps) {
  if (href === false) {
    return (
      <div className={`group inline-flex ${className}`}>
        <LogoContent size={size} showWordmark={showWordmark} />
      </div>
    );
  }

  return (
    <Link href={href} className={`group inline-flex ${className}`}>
      <LogoContent size={size} showWordmark={showWordmark} />
    </Link>
  );
}