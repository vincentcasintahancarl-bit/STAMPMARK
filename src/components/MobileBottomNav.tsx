import {
  Bookmark,
  BookOpen,
  Calendar,
  Home,
  Mail,
  ShieldAlert,
  UserPlus,
  Users,
} from 'lucide-react';
import { NavTab } from '../types/school';

interface MobileBottomNavProps {
  activeTab: NavTab;
  unreadMailCount: number;
  pendingFriendRequestsCount?: number;
  pendingReportsCount?: number;
  isTeacherMonitor?: boolean;
  isOverlayViewActive: boolean;
  onSelectTab: (tab: NavTab) => void;
}

const BASE_MOBILE_NAV_ITEMS: {
  id: NavTab;
  label: string;
  Icon: typeof Home;
}[] = [
  { id: NavTab.FEED, label: 'Feed', Icon: Home },
  { id: NavTab.LESSONS, label: 'Lessons', Icon: BookOpen },
  { id: NavTab.EVENTS, label: 'Events', Icon: Calendar },
  { id: NavTab.FRIENDS, label: 'Friends', Icon: UserPlus },
  { id: NavTab.SAVED, label: 'Saved', Icon: Bookmark },
  { id: NavTab.MAIL, label: 'Mail', Icon: Mail },
  { id: NavTab.CONTRIBUTORS, label: 'Members', Icon: Users },
];

export function MobileBottomNav({
  activeTab,
  unreadMailCount,
  pendingFriendRequestsCount = 0,
  pendingReportsCount = 0,
  isTeacherMonitor = false,
  isOverlayViewActive,
  onSelectTab,
}: MobileBottomNavProps) {
  const navItems = isTeacherMonitor
    ? [
        ...BASE_MOBILE_NAV_ITEMS,
        { id: NavTab.MONITOR, label: 'Monitor', Icon: ShieldAlert },
      ]
    : BASE_MOBILE_NAV_ITEMS;

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFDF8]/95 dark:bg-[#12100E]/95 backdrop-blur-md border-t border-[#E2D9C6] dark:border-[#3D362D] pb-safe"
    >
      <div className="grid grid-flow-col auto-cols-[minmax(54px,1fr)] h-[58px] items-stretch overflow-x-auto no-scrollbar">
        {navItems.map(({ id, label, Icon }) => {
          const isActive = !isOverlayViewActive && activeTab === id;
          const showUnread = id === NavTab.MAIL && unreadMailCount > 0;
          const showFriendReqs =
            id === NavTab.FRIENDS && pendingFriendRequestsCount > 0;
          const showReports = id === NavTab.MONITOR && pendingReportsCount > 0;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectTab(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 min-h-[48px] px-1 transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--theme-accent-text)] ${
                isActive
                  ? 'text-[var(--theme-accent-text)]'
                  : 'text-[#6B6155] dark:text-[#B8AFA0] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]'
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 inset-x-3 h-0.5 rounded-b bg-[var(--theme-accent-text)]"
                />
              )}
              <span className="relative inline-flex items-center justify-center">
                <Icon
                  className="w-5 h-5"
                  strokeWidth={isActive ? 2.25 : 1.75}
                  aria-hidden="true"
                />
                {showUnread && (
                  <span className="ml-1 font-mono text-[10px] font-semibold tabular-nums text-[var(--theme-accent-text)]">
                    {unreadMailCount}
                  </span>
                )}
                {showFriendReqs && (
                  <span className="ml-1 font-mono text-[10px] font-semibold tabular-nums text-[var(--theme-accent-text)]">
                    {pendingFriendRequestsCount}
                  </span>
                )}
                {showReports && (
                  <span className="ml-1 font-mono text-[10px] font-semibold tabular-nums text-[#7C1D1D] dark:text-[#FCA5A5]">
                    {pendingReportsCount}
                  </span>
                )}
              </span>
              <span
                className={`text-[10px] sm:text-[11px] leading-none tracking-tight whitespace-nowrap ${
                  isActive ? 'font-semibold' : 'font-medium'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
