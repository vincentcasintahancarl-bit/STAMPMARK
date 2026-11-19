import {
  Award,
  Compass,
  Cpu,
  Crown,
  Feather,
  FlaskConical,
  Laptop,
  Leaf,
  Scale,
  Shield,
} from 'lucide-react';
import { SCHOOL_CLUBS } from '../data/seedData';
import { SchoolClubMeta } from '../types/school';

interface ClubBadgeProps {
  club?: string;
  size?: 'xs' | 'sm' | 'md';
  showEmpty?: boolean;
  className?: string;
}

const CREST_TONE_CLASSES: Record<SchoolClubMeta['crestTone'], string> = {
  emerald:
    'text-[#14532D] dark:text-[#86EFAC] bg-[#EDF7F0] dark:bg-[#11271A] border-[#B6D9C2] dark:border-[#2C6440]',
  navy:
    'text-[#1E3A8A] dark:text-[#93C5FD] bg-[#EFF4FC] dark:bg-[#13203B] border-[#BFCFE9] dark:border-[#2D4B82]',
  crimson:
    'text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FAF1F0] dark:bg-[#2F1414] border-[#E4C2BE] dark:border-[#7B3030]',
  indigo:
    'text-[#3730A3] dark:text-[#A5B4FC] bg-[#F0F1FC] dark:bg-[#1B1B3B] border-[#C7CBF0] dark:border-[#3E3F85]',
  amber:
    'text-[#78350F] dark:text-[#FCD34D] bg-[#FCF5E6] dark:bg-[#2B200E] border-[#E6CE9E] dark:border-[#73511C]',
  teal:
    'text-[#134E4A] dark:text-[#5EEAD4] bg-[#ECF8F6] dark:bg-[#102927] border-[#B2DAD4] dark:border-[#255E58]',
  plum:
    'text-[#581C87] dark:text-[#D8B4FE] bg-[#F6EFFB] dark:bg-[#261436] border-[#D9C0EC] dark:border-[#5D3282]',
  gold:
    'text-[#713F12] dark:text-[#FDE047] bg-[#FDF8E4] dark:bg-[#2A230D] border-[#E5D290] dark:border-[#6F5B18]',
  sky:
    'text-[#0C4A6E] dark:text-[#7DD3FC] bg-[#EDF7FC] dark:bg-[#0F2331] border-[#B4D8EB] dark:border-[#23577A]',
};

const CUSTOM_CLUB_CLASSES =
  'text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)]';

function renderClubIcon(clubId: string | undefined, iconClass: string) {
  switch (clubId) {
    case 'science-olympiad':
      return <FlaskConical className={iconClass} aria-hidden="true" />;
    case 'math-society':
      return <Compass className={iconClass} aria-hidden="true" />;
    case 'debate-guild':
      return <Scale className={iconClass} aria-hidden="true" />;
    case 'robotics-club':
      return <Cpu className={iconClass} aria-hidden="true" />;
    case 'literary-circle':
      return <Feather className={iconClass} aria-hidden="true" />;
    case 'eco-bio-club':
      return <Leaf className={iconClass} aria-hidden="true" />;
    case 'chess-society':
      return <Crown className={iconClass} aria-hidden="true" />;
    case 'student-council':
      return <Award className={iconClass} aria-hidden="true" />;
    case 'ict-club':
      return <Laptop className={iconClass} aria-hidden="true" />;
    default:
      return <Shield className={iconClass} aria-hidden="true" />;
  }
}

export function ClubBadge({
  club,
  size = 'sm',
  showEmpty = false,
  className = '',
}: ClubBadgeProps) {
  const trimmed = club?.trim();
  if (!trimmed) {
    if (!showEmpty) return null;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs text-[#6B6155] dark:text-[#B8AFA0] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D] rounded-md whitespace-nowrap ${className}`}
      >
        <Shield className="w-3 h-3 shrink-0" aria-hidden="true" />
        <span>No Club</span>
      </span>
    );
  }

  const matched = SCHOOL_CLUBS.find(
    (c) =>
      c.name.toLowerCase() === trimmed.toLowerCase() ||
      c.id.toLowerCase() === trimmed.toLowerCase() ||
      (c.id === 'ict-club' && trimmed.toLowerCase() === 'ict')
  );

  const toneClasses = matched
    ? CREST_TONE_CLASSES[matched.crestTone]
    : CUSTOM_CLUB_CLASSES;

  const sizeClasses =
    size === 'md'
      ? 'px-2.5 py-1 text-xs gap-1.5 rounded-md'
      : size === 'xs'
        ? 'px-1.5 py-0.5 text-[11px] gap-1 rounded'
        : 'px-2 py-0.5 text-[11px] gap-1.5 rounded-md';

  const iconSize =
    size === 'md' ? 'w-3.5 h-3.5 shrink-0' : 'w-3 h-3 shrink-0';

  return (
    <span
      title={
        matched ? `${matched.name} — ${matched.tagline}` : `Club: ${trimmed}`
      }
      className={`inline-flex items-center border font-medium whitespace-nowrap max-w-full ${toneClasses} ${sizeClasses} ${className}`}
    >
      {renderClubIcon(matched?.id, iconSize)}
      <span className="truncate">{matched ? matched.name : trimmed}</span>
    </span>
  );
}
