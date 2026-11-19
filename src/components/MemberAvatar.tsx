import { useEffect, useState } from 'react';

export type MemberAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface MemberAvatarProps {
  name: string;
  src?: string;
  size?: MemberAvatarSize;
  className?: string;
}

const SIZE_CLASSES: Record<MemberAvatarSize, string> = {
  xs: 'w-6 h-6 text-[10px] rounded',
  sm: 'w-8 h-8 text-xs rounded-md',
  md: 'w-10 h-10 text-sm rounded-lg',
  lg: 'w-12 h-12 text-base rounded-lg',
  xl: 'w-20 h-20 sm:w-24 sm:h-24 text-2xl rounded-xl',
};

export function getMemberInitials(name: string): string {
  const parts = name
    .replace(/^(Dr\.|Ms\.|Mr\.|Mrs\.|Prof\.)\s+/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'SC';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function MemberAvatar({
  name,
  src,
  size = 'md',
  className = '',
}: MemberAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  const sizeClass = SIZE_CLASSES[size];
  const trimmedSrc = src?.trim();

  if (trimmedSrc && !imgFailed) {
    return (
      <span
        className={`relative inline-flex shrink-0 overflow-hidden border border-[#D8CEBA] dark:border-[#52483C] bg-[#F5F0E6] dark:bg-[#221E1A] ${sizeClass} ${className}`}
      >
        <img
          src={trimmedSrc}
          alt={`${name} profile portrait`}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center shrink-0 bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] text-[var(--theme-accent-text)] font-display font-bold select-none ${sizeClass} ${className}`}
    >
      {getMemberInitials(name)}
    </span>
  );
}
