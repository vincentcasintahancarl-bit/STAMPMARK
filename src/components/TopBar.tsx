import { useEffect, useRef, useState } from 'react';
import { LogOut, Palette, Plus, ShieldAlert, UserCog } from 'lucide-react';
import { NavTab, SettingsSection } from '../types/school';
import { OwnerBadge } from './OwnerBadge';

interface TopBarProps {
  activeTab: NavTab;
  unreadMailCount: number;
  upcomingEventsCount?: number;
  pendingFriendRequestsCount?: number;
  pendingReportsCount?: number;
  isTeacherMonitor?: boolean;
  isAppOwner?: boolean;
  isAccountDisabled?: boolean;
  isSettingsOpen: boolean;
  activeSettingsSection: SettingsSection;
  activeMemberName: string;
  isSignedIn: boolean;
  onSelectTab: (tab: NavTab) => void;
  onOpenComposer: () => void;
  onOpenSettingsSection: (section: SettingsSection) => void;
  onLogOut: () => void;
}

const BASE_NAV_ITEMS: { id: NavTab; label: string }[] = [
  { id: NavTab.FEED, label: 'Feed' },
  { id: NavTab.LESSONS, label: 'Lessons' },
  { id: NavTab.EVENTS, label: 'Events' },
  { id: NavTab.FRIENDS, label: 'Friends' },
  { id: NavTab.SAVED, label: 'Saved' },
  { id: NavTab.MAIL, label: 'Mail' },
  { id: NavTab.CONTRIBUTORS, label: 'Contributors' },
];

export function TopBar({
  activeTab,
  unreadMailCount,
  upcomingEventsCount = 0,
  pendingFriendRequestsCount = 0,
  pendingReportsCount = 0,
  isTeacherMonitor = false,
  isAppOwner = false,
  isAccountDisabled = false,
  isSettingsOpen,
  activeSettingsSection,
  activeMemberName,
  isSignedIn,
  onSelectTab,
  onOpenComposer,
  onOpenSettingsSection,
  onLogOut,
}: TopBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);

  const navItems = isTeacherMonitor
    ? [...BASE_NAV_ITEMS, { id: NavTab.MONITOR, label: 'Monitor' }]
    : BASE_NAV_ITEMS;

  useEffect(() => {
    if (!isMenuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-30 bg-[#FFFDF8]/95 dark:bg-[#12100E]/95 backdrop-blur-md border-b border-[#E2D9C6] dark:border-[#3D362D]">
      <div className="max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-2 sm:gap-6 lg:gap-8">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              onSelectTab(NavTab.FEED);
            }}
            className="font-display text-[17px] sm:text-[26px] font-bold tracking-[0.01em] text-[#1C1917] dark:text-[#F7F3EA] whitespace-nowrap truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent-text)] rounded py-1"
          >
            StudyCommons
          </button>
          {isAppOwner && <OwnerBadge size="xs" />}
        </div>

        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center md:gap-4 lg:gap-6"
        >
          {navItems.map((item) => {
            const isActive = !isSettingsOpen && activeTab === item.id;
            const showMailCount = item.id === NavTab.MAIL && unreadMailCount > 0;
            const showEventsCount =
              item.id === NavTab.EVENTS && upcomingEventsCount > 0;
            const showFriendRequestsCount =
              item.id === NavTab.FRIENDS && pendingFriendRequestsCount > 0;
            const showReportCount =
              item.id === NavTab.MONITOR && pendingReportsCount > 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onSelectTab(item.id);
                }}
                className={`relative py-2 inline-flex items-center gap-1.5 text-sm font-medium tracking-[0.01em] whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent-text)] rounded ${
                  isActive
                    ? 'text-[var(--theme-accent-text)]'
                    : 'text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]'
                }`}
              >
                {item.id === NavTab.MONITOR && (
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                )}
                <span>
                  {item.label}
                  {showMailCount && (
                    <span className="ml-1 font-mono text-xs tabular-nums text-[var(--theme-accent-text)]">
                      ({unreadMailCount})
                    </span>
                  )}
                  {showEventsCount && (
                    <span className="ml-1 font-mono text-xs tabular-nums text-[var(--theme-accent-text)]">
                      ({upcomingEventsCount})
                    </span>
                  )}
                  {showFriendRequestsCount && (
                    <span className="ml-1 font-mono text-xs tabular-nums text-[var(--theme-accent-text)]">
                      ({pendingFriendRequestsCount})
                    </span>
                  )}
                  {showReportCount && (
                    <span className="ml-1 font-mono text-xs tabular-nums text-[#7C1D1D] dark:text-[#FCA5A5]">
                      ({pendingReportsCount})
                    </span>
                  )}
                </span>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[17px] h-0.5 bg-[var(--theme-accent-text)]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="shrink-0 flex items-center gap-1.5 sm:gap-2.5">
          <button
            type="button"
            disabled={isAccountDisabled}
            title={
              isAccountDisabled
                ? 'Your account is currently disabled by a monitoring teacher'
                : 'Create a new question or study idea'
            }
            onClick={() => {
              setIsMenuOpen(false);
              onOpenComposer();
            }}
            className="inline-flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 min-h-[38px] sm:min-h-0 sm:py-2 text-xs sm:text-sm font-medium text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] active:bg-[var(--theme-accent-active)] disabled:opacity-45 disabled:pointer-events-none rounded-lg sm:rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent-text)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#12100E]"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
            <span>New Post</span>
          </button>

          <div ref={menuContainerRef} className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Open settings menu"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              title="Settings"
              className={`inline-flex items-center justify-center gap-1 w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-md border transition-colors duration-150 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent-text)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#12100E] ${
                isSettingsOpen || isMenuOpen
                  ? 'bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)] text-[var(--theme-accent-text)]'
                  : 'bg-[#FFFDF8] dark:bg-[#1C1916] border-[#D8CEBA] dark:border-[#4A4137] text-[#443D34] dark:text-[#E5DEC9] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] hover:border-[#C5B99F] dark:hover:border-[#635648]'
              }`}
            >
              <span className="w-1 h-1 rounded-full bg-current" aria-hidden="true" />
              <span className="w-1 h-1 rounded-full bg-current" aria-hidden="true" />
              <span className="w-1 h-1 rounded-full bg-current" aria-hidden="true" />
            </button>

            {isMenuOpen && (
              <div
                role="menu"
                aria-label="Settings options"
                className="absolute right-0 mt-2 w-64 rounded-lg border border-[#E2D9C6] dark:border-[#3D362D] bg-[#FFFDF8] dark:bg-[#161412] shadow-lg overflow-hidden z-50 divide-y divide-[#ECE5D5] dark:divide-[#342E26]"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenSettingsSection(SettingsSection.APPEARANCE);
                  }}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                    isSettingsOpen &&
                    activeSettingsSection === SettingsSection.APPEARANCE
                      ? 'bg-[var(--theme-accent-soft)]'
                      : 'hover:bg-[#F5F0E6] dark:hover:bg-[#221E1A]'
                  }`}
                >
                  <Palette
                    className="w-4 h-4 text-[var(--theme-accent-text)] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                      Theme & Appearance
                    </span>
                    <span className="block text-[11px] text-[#6B6155] dark:text-[#B8AFA0] mt-0.5">
                      Dark mode, crest ink & paper stock
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenSettingsSection(SettingsSection.ACCOUNT);
                  }}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                    isSettingsOpen &&
                    activeSettingsSection === SettingsSection.ACCOUNT
                      ? 'bg-[var(--theme-accent-soft)]'
                      : 'hover:bg-[#F5F0E6] dark:hover:bg-[#221E1A]'
                  }`}
                >
                  <UserCog
                    className="w-4 h-4 text-[var(--theme-accent-text)] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                      <span>Edit Account</span>
                      {isAppOwner && <OwnerBadge size="xs" />}
                    </span>
                    <span className="block text-[11px] text-[#6B6155] dark:text-[#B8AFA0] mt-0.5 truncate">
                      Portrait & profile for {activeMemberName}
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onLogOut();
                  }}
                  className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-[#FAF3F1] dark:hover:bg-[#2D1414]"
                >
                  <LogOut
                    className="w-4 h-4 text-[#7C1D1D] dark:text-[#FCA5A5] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-[#7C1D1D] dark:text-[#FCA5A5]">
                      Log Out
                    </span>
                    <span className="block text-[11px] text-[#6B6155] dark:text-[#B8AFA0] mt-0.5">
                      {isSignedIn
                        ? 'Sign out of your school account'
                        : 'Return to sign-in screen'}
                    </span>
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
