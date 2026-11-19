import { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Flame,
  LogOut,
  Shield,
  SlidersHorizontal,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import { GRADE_LEVEL_OPTIONS, SUBJECTS } from '../data/seedData';
import {
  DiscussionPost,
  GradeLevel,
  LessonUnit,
  MemberStreak,
  MemberStudyGoal,
  PersonalNote,
  PomodoroCadenceId,
  PomodoroPhase,
  PomodoroState,
  RegisteredAccount,
  SchoolMember,
  StudyReminder,
  SubjectId,
  UserRole,
} from '../types/school';
import {
  getMemberUsername,
  getTeacherMonitoredClub,
  getTeacherTaughtSubjects,
} from '../utils/storage';
import { ClubBadge } from './ClubBadge';
import { MemberAvatar } from './MemberAvatar';
import { OwnerBadge } from './OwnerBadge';
import { PersonalNotes } from './PersonalNotes';
import { StudyReminders } from './StudyReminders';
import { StudyTimer } from './StudyTimer';
import { WeeklyStudyGoals } from './WeeklyStudyGoals';

interface MobileWorkspaceBarProps {
  members: SchoolMember[];
  activeMember: SchoolMember;
  isAppOwner?: boolean;
  posts: DiscussionPost[];
  selectedSubject: SubjectId | 'all';
  selectedGrade: GradeLevel | 'all';
  selectedLessonId: string | null;
  showFeedFilters: boolean;
  onOpenAccountInfo: (memberId: string) => void;
  onSignOut: () => void;
  onSelectSubject: (subject: SubjectId | 'all') => void;
  onSelectGrade: (grade: GradeLevel | 'all') => void;
  onClearLessonFilter: () => void;
  lessons: LessonUnit[];
  studyGoal: MemberStudyGoal;
  memberStreak: MemberStreak;
  onToggleLessonComplete: (lessonId: string) => void;
  onUpdateWeeklyTarget: (target: number) => void;
  pomodoro: PomodoroState;
  isTimerMuted: boolean;
  onToggleTimerMute: () => void;
  onToggleTimerRun: () => void;
  onResetTimer: () => void;
  onSelectTimerPhase: (phase: PomodoroPhase) => void;
  onSkipTimerPhase: () => void;
  onChangeTimerCadence: (cadenceId: PomodoroCadenceId) => void;
  personalNotes: PersonalNote[];
  onAddPersonalNote: (content: string, subjectId: SubjectId | 'general') => void;
  onUpdatePersonalNote: (noteId: string, content: string) => void;
  onDeletePersonalNote: (noteId: string) => void;
  reminders: StudyReminder[];
  currentTimeMs: number;
  onAddReminder: (
    title: string,
    subjectId: SubjectId | 'general',
    dueAt: number
  ) => void;
  onToggleReminderComplete: (reminderId: string) => void;
  onSnoozeReminder: (reminderId: string, minutes?: number) => void;
  onDeleteReminder: (reminderId: string) => void;
  friendsCount?: number;
  pendingFriendRequestsCount?: number;
  onOpenFriends?: () => void;
}

export function MobileWorkspaceBar({
  members,
  activeMember,
  isAppOwner = false,
  posts,
  selectedSubject,
  selectedGrade,
  selectedLessonId,
  showFeedFilters,
  onOpenAccountInfo,
  onSignOut,
  onSelectSubject,
  onSelectGrade,
  onClearLessonFilter,
  lessons,
  studyGoal,
  memberStreak,
  onToggleLessonComplete,
  onUpdateWeeklyTarget,
  pomodoro,
  isTimerMuted,
  onToggleTimerMute,
  onToggleTimerRun,
  onResetTimer,
  onSelectTimerPhase,
  onSkipTimerPhase,
  onChangeTimerCadence,
  personalNotes,
  onAddPersonalNote,
  onUpdatePersonalNote,
  onDeletePersonalNote,
  reminders,
  currentTimeMs,
  onAddReminder,
  onToggleReminderComplete,
  onSnoozeReminder,
  onDeleteReminder,
  friendsCount = 0,
  pendingFriendRequestsCount = 0,
  onOpenFriends,
}: MobileWorkspaceBarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isTeacher = activeMember.role === UserRole.TEACHER;
  const teacherSubjects = isTeacher
    ? getTeacherTaughtSubjects(activeMember)
    : [];
  const monitoredClub = isTeacher
    ? getTeacherMonitoredClub(activeMember)
    : undefined;
  const monitoredClubMembersCount = monitoredClub
    ? members.filter(
        (m) =>
          m.id !== activeMember.id &&
          m.club?.trim().toLowerCase() === monitoredClub.toLowerCase()
      ).length
    : 0;

  const validLessonIds = new Set(lessons.map((l) => l.id));
  const completedCount = studyGoal.completedLessonIds.filter((id) =>
    validLessonIds.has(id)
  ).length;
  const targetCount = Math.max(1, studyGoal.weeklyTarget);

  return (
    <div className="lg:hidden space-y-3 mb-4">
      {/* Compact Mobile Account & Filter Strip */}
      <div className="heritage-card border rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-2 sm:gap-2.5">
        <button
          type="button"
          onClick={() => onOpenAccountInfo(activeMember.id)}
          className="min-w-0 flex-1 flex items-center gap-2 sm:gap-3 text-left min-h-[44px] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent-text)]"
        >
          <MemberAvatar
            name={activeMember.name}
            src={activeMember.avatarUrl}
            size="md"
          />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-semibold text-[#1C1917] dark:text-[#F7F3EA] truncate">
                {activeMember.name}
              </span>
              {(activeMember.isOwner || isAppOwner) && (
                <OwnerBadge size="xs" />
              )}
            </span>
            <span className="block text-xs text-[#6B6155] dark:text-[#B8AFA0] truncate">
              <span className="font-mono text-[var(--theme-accent-text)]">
                @{getMemberUsername(activeMember.name, activeMember.username)}
              </span>
              <span aria-hidden="true"> · </span>
              <span>{activeMember.gradeOrDept}</span>
              <span aria-hidden="true"> · </span>
              {isTeacher ? (
                <span className="font-mono tabular-nums">
                  {teacherSubjects.length}/4 subjects
                </span>
              ) : (
                <span className="font-mono tabular-nums">
                  {completedCount}/{targetCount} goals
                </span>
              )}
            </span>
            {activeMember.club && (
              <span className="mt-1 block max-w-full">
                <ClubBadge club={activeMember.club} size="xs" />
              </span>
            )}
          </span>
        </button>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {isTeacher ? (
            <div
              className="flex flex-col items-end justify-center text-right pr-0.5 sm:pr-1 shrink-0"
              title="Teacher subjects taught & monitored club members"
            >
              <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold tabular-nums text-[#1C1917] dark:text-[#F7F3EA]">
                <Shield className="w-3.5 h-3.5 text-[var(--theme-accent-text)]" aria-hidden="true" />
                <span>{monitoredClubMembersCount}</span>
              </span>
              <span className="text-[10px] font-mono tabular-nums text-[#6B6155] dark:text-[#B8AFA0]">
                in club
              </span>
            </div>
          ) : (
            <div
              className="flex flex-col items-end justify-center text-right pr-0.5 sm:pr-1 shrink-0"
              title={`${memberStreak.currentStreak}-day streak · ${memberStreak.totalDaysOpened} total days opened`}
            >
              <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold tabular-nums text-[#1C1917] dark:text-[#F7F3EA]">
                <Flame className="w-3.5 h-3.5 text-[#8C6D3B] dark:text-[#D4B475]" aria-hidden="true" />
                <span>{memberStreak.currentStreak}d</span>
              </span>
              <span className="text-[10px] font-mono tabular-nums text-[#6B6155] dark:text-[#B8AFA0]">
                {memberStreak.totalDaysOpened}d total
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => onOpenAccountInfo(activeMember.id)}
            aria-label="Open Account Information"
            className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 min-h-[40px] sm:min-h-[44px] text-xs font-medium text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] rounded-lg transition-colors whitespace-nowrap"
          >
            <User className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden min-[380px]:inline">Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDrawerOpen((v) => !v)}
            aria-expanded={isDrawerOpen}
            aria-label="Toggle mobile study goals, filters, and account switcher"
            className={`inline-flex items-center justify-center gap-1 px-2.5 sm:px-3 min-h-[40px] sm:min-h-[44px] text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
              isDrawerOpen
                ? 'bg-[#1C1917] dark:bg-[#F7F3EA] border-[#1C1917] dark:border-[#F7F3EA] text-[#FFFDF8] dark:text-[#161412]'
                : 'bg-[#FFFDF8] dark:bg-[#1C1916] border-[#D8CEBA] dark:border-[#4A4137] text-[#443D34] dark:text-[#E5DEC9] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Menu</span>
            {isDrawerOpen ? (
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Mobile Account & Filter Drawer */}
      {isDrawerOpen && (
        <div className="heritage-card border rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
              Account & Classroom Filters
            </h2>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              aria-label="Close mobile menu"
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#6B6155] dark:text-[#B8AFA0] hover:text-[#1C1917] dark:hover:text-[#F7F3EA] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C]"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div>
            <label
              htmlFor="mobile-grade-filter"
              className="block text-xs font-medium text-[#574F45] dark:text-[#CEC5B6] mb-1.5"
            >
              Grade Level Filter
            </label>
            <select
              id="mobile-grade-filter"
              value={selectedGrade}
              onChange={(e) =>
                onSelectGrade(e.target.value as GradeLevel | 'all')
              }
              className="w-full px-3 min-h-[44px] text-sm font-medium text-[#1C1917] dark:text-[#F7F3EA] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
            >
              <option value="all">All Grades ({posts.length})</option>
              {GRADE_LEVEL_OPTIONS.map((grade) => {
                const count = posts.filter((p) => p.gradeLevel === grade).length;
                return (
                  <option key={grade} value={grade}>
                    {grade} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {isTeacher ? (
            <div className="p-3.5 rounded-lg bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#1C1917] dark:text-[#F7F3EA] inline-flex items-center gap-1.5">
                  <BookOpen
                    className="w-3.5 h-3.5 text-[var(--theme-accent-text)]"
                    aria-hidden="true"
                  />
                  <span>Subjects Taught ({teacherSubjects.length}/4)</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenAccountInfo(activeMember.id);
                  }}
                  className="text-[11px] font-medium text-[var(--theme-accent-text)] hover:underline"
                >
                  Faculty Info
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {teacherSubjects.map((subId) => {
                  const sub = SUBJECTS.find((s) => s.id === subId);
                  if (!sub) return null;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        onSelectSubject(sub.id);
                        onClearLessonFilter();
                        setIsDrawerOpen(false);
                      }}
                      className="px-2.5 py-1 text-[11px] font-medium rounded border bg-[#FFFDF8] dark:bg-[#161412] border-[#DDD4C0] dark:border-[#4A4137] text-[#1C1917] dark:text-[#F7F3EA]"
                    >
                      {sub.name}
                    </button>
                  );
                })}
              </div>
              <div className="pt-2 border-t border-[#E2D9C6] dark:border-[#3D362D] flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-[#574F45] dark:text-[#CEC5B6]">
                  Club Monitored:
                </span>
                <ClubBadge club={monitoredClub} size="xs" showEmpty />
              </div>
            </div>
          ) : (
            <>
              <WeeklyStudyGoals
                compact
                activeMember={activeMember}
                lessons={lessons}
                studyGoal={studyGoal}
                onToggleLessonComplete={onToggleLessonComplete}
                onUpdateWeeklyTarget={onUpdateWeeklyTarget}
                onOpenAccountInfo={(id) => {
                  setIsDrawerOpen(false);
                  onOpenAccountInfo(id);
                }}
              />

              <StudyTimer
                compact
                pomodoro={pomodoro}
                isMuted={isTimerMuted}
                onToggleMute={onToggleTimerMute}
                onToggleRun={onToggleTimerRun}
                onReset={onResetTimer}
                onSelectPhase={onSelectTimerPhase}
                onSkipPhase={onSkipTimerPhase}
                onChangeCadence={onChangeTimerCadence}
              />
            </>
          )}

          <PersonalNotes
            compact
            activeMember={activeMember}
            notes={personalNotes}
            onAddNote={onAddPersonalNote}
            onUpdateNote={onUpdatePersonalNote}
            onDeleteNote={onDeletePersonalNote}
          />

          {!isTeacher && (
            <StudyReminders
              compact
              reminders={reminders}
              currentTimeMs={currentTimeMs}
              onAddReminder={onAddReminder}
              onToggleReminderComplete={onToggleReminderComplete}
              onSnoozeReminder={onSnoozeReminder}
              onDeleteReminder={onDeleteReminder}
            />
          )}

          {onOpenFriends && (
            <button
              type="button"
              onClick={() => {
                setIsDrawerOpen(false);
                onOpenFriends();
              }}
              className="w-full flex items-center justify-between gap-2 px-3.5 min-h-[44px] text-xs font-medium text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] rounded-lg transition-colors"
            >
              <span className="inline-flex items-center gap-2">
                <UserPlus className="w-4 h-4" aria-hidden="true" />
                <span>Study Friends & Requests</span>
              </span>
              <span className="font-mono tabular-nums">
                {pendingFriendRequestsCount > 0
                  ? `${pendingFriendRequestsCount} pending`
                  : `${friendsCount} friends`}
              </span>
            </button>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-[#ECE5D5] dark:border-[#342E26]">
            <button
              type="button"
              onClick={() => {
                setIsDrawerOpen(false);
                onSignOut();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 min-h-[44px] text-xs font-medium text-[#443D34] dark:text-[#F7F3EA] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-lg hover:bg-[#ECE5D5] dark:hover:bg-[#2C2721]"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Horizontal Swipeable Subject Scroller (Feed & Saved) */}
      {showFeedFilters && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
          <button
            type="button"
            onClick={() => {
              onSelectSubject('all');
              onClearLessonFilter();
            }}
            className={`px-3.5 min-h-[40px] text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              selectedSubject === 'all' && !selectedLessonId
                ? 'bg-[var(--theme-accent)] border-[var(--theme-accent)] text-[#FFFDF8]'
                : 'bg-[#FFFDF8] dark:bg-[#1C1916] border-[#DFD5C2] dark:border-[#4A4137] text-[#443D34] dark:text-[#E5DEC9] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C]'
            }`}
          >
            All Subjects
          </button>
          {SUBJECTS.map((sub) => {
            const active = selectedSubject === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  onSelectSubject(sub.id);
                  if (selectedLessonId) onClearLessonFilter();
                }}
                className={`px-3.5 min-h-[40px] text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[var(--theme-accent)] border-[var(--theme-accent)] text-[#FFFDF8]'
                    : 'bg-[#FFFDF8] dark:bg-[#1C1916] border-[#DFD5C2] dark:border-[#4A4137] text-[#443D34] dark:text-[#E5DEC9] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C]'
                }`}
              >
                {sub.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
