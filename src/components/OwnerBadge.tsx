import { Crown } from 'lucide-react';

interface OwnerBadgeProps {
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function OwnerBadge({ size = 'sm', className = '' }: OwnerBadgeProps) {
  const sizeClasses =
    size === 'md'
      ? 'px-2.5 py-1 text-xs gap-1.5 rounded-md'
      : size === 'xs'
        ? 'px-1.5 py-0.5 text-[10px] gap-1 rounded'
        : 'px-2 py-0.5 text-[11px] gap-1 rounded-md';

  const iconSize =
    size === 'md' ? 'w-3.5 h-3.5 shrink-0' : 'w-3 h-3 shrink-0';

  return (
    <span
      title="App Owner"
      aria-label="App Owner"
      className={`inline-flex items-center border font-semibold whitespace-nowrap shrink-0 text-[#713F12] dark:text-[#FDE047] bg-[#FDF8E4] dark:bg-[#2A230D] border-[#E5D290] dark:border-[#6F5B18] ${sizeClasses} ${className}`}
    >
      <Crown className={iconSize} aria-hidden="true" />
      <span>Owner</span>
    </span>
  );
}
