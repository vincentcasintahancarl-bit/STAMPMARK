import { useState } from 'react';
import {
  BookOpen,
  Calendar,
  CalendarCheck,
  CalendarPlus,
  Check,
  Flame,
  LogOut,
  MapPin,
  Shield,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { GRADE_LEVEL_OPTIONS, SUBJECTS } from '../data/seedData';
import {
  DiscussionPost,
  FriendRequest,
  GradeLevel,
  LessonUnit,
  MemberStreak,
  MemberStudyGoal,
  PersonalNote,
  PomodoroCadenceId,
  PomodoroPhase,
  PomodoroState,
  PostKind,
  RegisteredAccount,
  SchoolEvent,
  SchoolMember,
  StudyReminder,
  SubjectId,
  UserRole,
} from '../types/school';
import {
  getFriendsForMember,
  getIncomingFriendRequests,
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

interface SidebarProps {
  members: SchoolMember[];
  activeMember: SchoolMember;
  isAppOwner?: boolean;
  userEmail?: string | null;
  onSignOut: () => void;
  onOpenAccountInfo: (memberId: string) => void;
  posts: DiscussionPost[];
  selectedSubject: SubjectId | 'all';
  onSelectSubject: (subject: SubjectId | 'all') => void;
  selectedGrade: GradeLevel | 'all';
  onSelectGrade: (grade: GradeLevel | 'all') => void;
  selectedLessonId: string | null;
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
  events: SchoolEvent[];
  canManageEvents?: boolean;
  onOpenEvents: (openComposer?: boolean) => void;
  friendRequests: FriendRequest[];
  onOpenFriends: () => void;
  onAcceptFriendRequest: (requestId: string) => void;
  onDeclineFriendRequest: (requestId: string) => void;
}

export function Sidebar({
  members,
  activeMember,
  isAppOwner = false,
  userEmail,
  onSignOut,
  onOpenAccountInfo,
  posts,
  selectedSubject,
  onSelectSubject,
  selectedGrade,
  onSelectGrade,
  selectedLessonId,
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
  events,
  canManageEvents,
  onOpenEvents,
  friendRequests,
  onOpenFriends,
  onAcceptFriendRequest,
  onDeclineFriendRequest,
}: SidebarProps) {
  const isTeacher = activeMember.role === UserRole.TEACHER;
  const teacherSubjects = isTeacher
    ? getTeacherTaughtSubjects(activeMember)
    : [];
  const monitoredClub = isTeacher
    ? getTeacherMonitoredClub(activeMember)
    : undefined;
  const monitoredClubMembers = monitoredClub
    ? members.filter(
        (m) =>
          m.id !== activeMember.id &&
          m.club?.trim().toLowerCase() === monitoredClub.toLowerCase()
      )
    : [];

  const openQuestionsCount = posts.filter(
    (p) => p.kind === PostKind.QUESTION && !p.replies.some((r) => r.isAccepted)
  ).length;
  const ideasCount = posts.filter((p) => p.kind === PostKind.IDEA).length;
  const resolvedCount = posts.filter(
    (p) => p.kind === PostKind.QUESTION && p.replies.some((r) => r.isAccepted)
  ).length;

  return (
    <aside className="w-full lg:w-[272px] shrink-0 space-y-6">
      {/* Signed-in Account Card */}
      <section className="heritage-card border rounded-lg p-5">
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="font-display text-lg font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
              Your Account
            </h2>
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#6B6155] dark:text-[#B8AFA0] hover:text-[var(--theme-accent-text)] whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sign out</span>
            </button>
          </div>

          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => onOpenAccountInfo(activeMember.id)}
              aria-label={`View profile for ${activeMember.name}`}
              className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent-text)]"
            >
              <MemberAvatar
                name={activeMember.name}
                src={activeMember.avatarUrl}
                size="md"
              />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                  <p className="text-sm font-semibold text-[#1C1917] dark:text-[#F7F3EA] truncate">
                    {activeMember.name}
                  </p>
                  {(activeMember.isOwner || isAppOwner) && (
                    <OwnerBadge size="xs" />
                  )}
                </div>
                {!isTeacher && (
                  <span
                    className="inline-flex items-center gap-1 text-xs font-mono font-semibold tabular-nums text-[#8C6D3B] dark:text-[#D4B475] shrink-0"
                    title={`${memberStreak.currentStreak}-day streak`}
                  >
                    <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{memberStreak.currentStreak}d</span>
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-[var(--theme-accent-text)] truncate">
                @{getMemberUsername(activeMember.name, activeMember.username)}
              </p>
              {userEmail && (
                <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] truncate mt-0.5">
                  {userEmail}
                </p>
              )}
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#574F45] dark:text-[#CEC5B6]">
            <span>{activeMember.role}</span>
            <span aria-hidden="true">·</span>
            <span>{activeMember.gradeOrDept}</span>
            {activeMember.section && (
              <>
                <span aria-hidden="true">·</span>
                <span>{activeMember.section}</span>
              </>
            )}
          </div>

          {activeMember.club && (
            <div className="mt-2">
              <ClubBadge club={activeMember.club} size="sm" />
            </div>
          )}

          {isTeacher ? (
            <dl className="mt-3 pt-3 border-t border-[#ECE5D5] dark:border-[#342E26] grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="flex items-center gap-1 text-[#6B6155] dark:text-[#B8AFA0]">
                  <BookOpen className="w-3.5 h-3.5 text-[var(--theme-accent-text)]" aria-hidden="true" />
                  <span>Subjects Taught</span>
                </dt>
                <dd className="mt-0.5 font-mono font-semibold tabular-nums text-[#1C1917] dark:text-[#F7F3EA]">
                  {teacherSubjects.length} / 4
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-[#6B6155] dark:text-[#B8AFA0]">
                  <Shield className="w-3.5 h-3.5 text-[#8C6D3B] dark:text-[#D4B475]" aria-hidden="true" />
                  <span>Club Members</span>
                </dt>
                <dd className="mt-0.5 font-mono font-semibold tabular-nums text-[#1C1917] dark:text-[#F7F3EA]">
                  {monitoredClub ? monitoredClubMembers.length : 0}
                </dd>
              </div>
            </dl>
          ) : (
            <dl className="mt-3 pt-3 border-t border-[#ECE5D5] dark:border-[#342E26] grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="flex items-center gap-1 text-[#6B6155] dark:text-[#B8AFA0]">
                  <Flame className="w-3.5 h-3.5 text-[#8C6D3B] dark:text-[#D4B475]" aria-hidden="true" />
                  <span>Daily Streak</span>
                </dt>
                <dd className="mt-0.5 font-mono font-semibold tabular-nums text-[#1C1917] dark:text-[#F7F3EA]">
                  {memberStreak.currentStreak}{' '}
                  {memberStreak.currentStreak === 1 ? 'day' : 'days'}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-[#6B6155] dark:text-[#B8AFA0]">
                  <CalendarCheck
                    className="w-3.5 h-3.5 text-[var(--theme-accent-text)]"
                    aria-hidden="true"
                  />
                  <span>Days Opened</span>
                </dt>
                <dd className="mt-0.5 font-mono font-semibold tabular-nums text-[#1C1917] dark:text-[#F7F3EA]">
                  {memberStreak.totalDaysOpened}{' '}
                  {memberStreak.totalDaysOpened === 1 ? 'day' : 'days'}
                </dd>
              </div>
            </dl>
          )}

          <button
            type="button"
            onClick={() => onOpenAccountInfo(activeMember.id)}
            className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] hover:bg-[var(--theme-accent-soft-hover)] rounded-md transition-colors"
          >
            <User className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Account Information</span>
          </button>
        </div>
      </section>

      {isTeacher ? (
        <section className="heritage-card border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-[#1C1917] dark:text-[#F7F3EA] flex items-center gap-1.5">
              <BookOpen
                className="w-4 h-4 text-[var(--theme-accent-text)]"
                aria-hidden="true"
              />
              <span>Teaching & Club</span>
            </h2>
            <span className="text-xs font-mono tabular-nums text-[#6B6155] dark:text-[#B8AFA0]">
              {teacherSubjects.length}/4 subs
            </span>
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#6B6155] dark:text-[#B8AFA0]">
              Subjects You Teach
            </p>
            <ul className="space-y-1">
              {teacherSubjects.map((subId) => {
                const sub = SUBJECTS.find((s) => s.id === subId);
                if (!sub) return null;
                const isPrimary = sub.id === activeMember.focusSubject;
                return (
                  <li key={sub.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSubject(sub.id);
                        onClearLessonFilter();
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
                        selectedSubject === sub.id
                          ? 'bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)] text-[var(--theme-accent-text)] font-semibold'
                          : 'bg-[#F5F0E6] dark:bg-[#221E1A] border-[#E2D9C6] dark:border-[#3D362D] text-[#1C1917] dark:text-[#F7F3EA] hover:border-[var(--theme-accent-border)]'
                      }`}
                    >
                      <span className="truncate">{sub.name}</span>
                      {isPrimary && (
                        <span className="text-[10px] font-medium text-[var(--theme-accent-text)] shrink-0">
                          Lead
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="pt-3 border-t border-[#ECE5D5] dark:border-[#342E26] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#6B6155] dark:text-[#B8AFA0]">
                Club You Monitor
              </p>
              {monitoredClub && (
                <span className="text-[11px] font-mono tabular-nums text-[#6B6155] dark:text-[#B8AFA0]">
                  {monitoredClubMembers.length}{' '}
                  {monitoredClubMembers.length === 1 ? 'member' : 'members'}
                </span>
              )}
            </div>
            <ClubBadge club={monitoredClub} size="sm" showEmpty />
            {monitoredClub && monitoredClubMembers.length > 0 && (
              <p className="text-[11px] text-[#574F45] dark:text-[#CEC5B6] truncate">
                Monitoring:{' '}
                {monitoredClubMembers
                  .slice(0, 2)
                  .map((m) => m.name)
                  .join(', ')}
                {monitoredClubMembers.length > 2
                  ? ` +${monitoredClubMembers.length - 2} more`
                  : ''}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onOpenAccountInfo(activeMember.id)}
            className="w-full py-1.5 text-xs font-medium text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] hover:bg-[var(--theme-accent-soft-hover)] rounded-md transition-colors"
          >
            View Faculty Info & Club Roster
          </button>
        </section>
      ) : (
        <>
          {/* Weekly Study Goals Widget */}
          <WeeklyStudyGoals
            activeMember={activeMember}
            lessons={lessons}
            studyGoal={studyGoal}
            onToggleLessonComplete={onToggleLessonComplete}
            onUpdateWeeklyTarget={onUpdateWeeklyTarget}
            onOpenAccountInfo={onOpenAccountInfo}
          />

          {/* Pomodoro Study Timer Widget */}
          <StudyTimer
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

      {/* Private Personal Notes Widget */}
      <PersonalNotes
        activeMember={activeMember}
        notes={personalNotes}
        onAddNote={onAddPersonalNote}
        onUpdateNote={onUpdatePersonalNote}
        onDeleteNote={onDeletePersonalNote}
      />

      {/* Study Reminders Set Widget (Students & Peer Tutors only) */}
      {!isTeacher && (
        <StudyReminders
          reminders={reminders}
          currentTimeMs={currentTimeMs}
          onAddReminder={onAddReminder}
          onToggleReminderComplete={onToggleReminderComplete}
          onSnoozeReminder={onSnoozeReminder}
          onDeleteReminder={onDeleteReminder}
        />
      )}

      {/* Upcoming School Events Preview */}
      <section className="heritage-card border rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-[#1C1917] dark:text-[#F7F3EA] flex items-center gap-1.5">
            <Calendar
              className="w-4 h-4 text-[var(--theme-accent-text)]"
              aria-hidden="true"
            />
            <span>School Events</span>
          </h2>
          {(canManageEvents ?? activeMember.role === UserRole.TEACHER) && (
            <button
              type="button"
              onClick={() => onOpenEvents(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--theme-accent-text)] hover:underline whitespace-nowrap"
            >
              <CalendarPlus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Add</span>
            </button>
          )}
        </div>

        {(() => {
          const upcoming = events
            .filter((ev) => ev.startsAt >= currentTimeMs - 2 * 60 * 60 * 1000)
            .sort((a, b) => a.startsAt - b.startsAt)
            .slice(0, 2);

          if (upcoming.length === 0) {
            return (
              <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0]">
                No upcoming school events scheduled yet.
              </p>
            );
          }

          return (
            <ul className="space-y-2.5">
              {upcoming.map((ev) => (
                <li
                  key={ev.id}
                  className="p-2.5 rounded-md bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D]"
                >
                  <button
                    type="button"
                    onClick={() => onOpenEvents(false)}
                    className="w-full text-left group"
                  >
                    <p className="text-xs font-semibold text-[#1C1917] dark:text-[#F7F3EA] group-hover:text-[var(--theme-accent-text)] line-clamp-1">
                      {ev.title}
                    </p>
                    <p className="mt-1 text-[11px] font-mono text-[var(--theme-accent-text)]">
                      {new Date(ev.startsAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      ·{' '}
                      {new Date(ev.startsAt).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#6B6155] dark:text-[#B8AFA0] flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <span className="truncate">{ev.location}</span>
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          );
        })()}

        <button
          type="button"
          onClick={() => onOpenEvents(false)}
          className="w-full py-1.5 text-xs font-medium text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] hover:bg-[var(--theme-accent-soft-hover)] rounded-md transition-colors"
        >
          View All Events ({events.length})
        </button>
      </section>

      {/* Study Friends & Requests Widget */}
      <section className="heritage-card border rounded-lg p-5 space-y-3">
        {(() => {
          const friendIds = getFriendsForMember(friendRequests, activeMember.id);
          const incoming = getIncomingFriendRequests(
            friendRequests,
            activeMember.id
          );
          const topIncoming = incoming[0];
          const topSender = topIncoming
            ? members.find((m) => m.id === topIncoming.senderId)
            : undefined;
          const previewFriends = friendIds
            .map((id) => members.find((m) => m.id === id))
            .filter((m): m is SchoolMember => Boolean(m))
            .slice(0, 3);

          return (
            <>
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold text-[#1C1917] dark:text-[#F7F3EA] flex items-center gap-1.5">
                  <Users
                    className="w-4 h-4 text-[var(--theme-accent-text)]"
                    aria-hidden="true"
                  />
                  <span>Study Friends</span>
                </h2>
                <span className="text-xs font-mono tabular-nums text-[#6B6155] dark:text-[#B8AFA0]">
                  {friendIds.length}
                </span>
              </div>

              {topIncoming && topSender && (
                <div className="p-2.5 rounded-md bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-semibold text-[var(--theme-accent-text)]">
                      {incoming.length}{' '}
                      {incoming.length === 1
                        ? 'Friend Request'
                        : 'Friend Requests'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenAccountInfo(topSender.id)}
                    className="flex items-center gap-2 text-left w-full group"
                  >
                    <MemberAvatar
                      name={topSender.name}
                      src={topSender.avatarUrl}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-semibold text-[#1C1917] dark:text-[#F7F3EA] group-hover:text-[var(--theme-accent-text)] truncate">
                          {topSender.name}
                        </span>
                        {topSender.isOwner && <OwnerBadge size="xs" />}
                      </span>
                      <span className="block text-[11px] text-[#574F45] dark:text-[#CEC5B6] truncate">
                        {topSender.gradeOrDept}
                      </span>
                    </span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onAcceptFriendRequest(topIncoming.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-1 text-[11px] font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded transition-colors"
                    >
                      <Check className="w-3 h-3" aria-hidden="true" />
                      <span>Accept</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeclineFriendRequest(topIncoming.id)}
                      className="inline-flex items-center justify-center gap-1 px-2.5 py-1 text-[11px] font-medium text-[#443D34] dark:text-[#E0D8CA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] rounded hover:text-[#7C1D1D] dark:hover:text-[#FCA5A5] transition-colors"
                    >
                      <X className="w-3 h-3" aria-hidden="true" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              )}

              {previewFriends.length > 0 ? (
                <ul className="space-y-1.5">
                  {previewFriends.map((friend) => (
                    <li key={friend.id}>
                      <button
                        type="button"
                        onClick={() => onOpenAccountInfo(friend.id)}
                        className="w-full flex items-center gap-2.5 p-1.5 rounded-md hover:bg-[#F5F0E6] dark:hover:bg-[#221E1A] transition-colors text-left"
                      >
                        <MemberAvatar
                          name={friend.name}
                          src={friend.avatarUrl}
                          size="sm"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-medium text-[#1C1917] dark:text-[#F7F3EA] truncate">
                              {friend.name}
                            </span>
                            {friend.isOwner && <OwnerBadge size="xs" />}
                          </span>
                          <span className="block text-[11px] text-[#6B6155] dark:text-[#B8AFA0] truncate">
                            @{getMemberUsername(friend.name, friend.username)}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                !topIncoming && (
                  <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0]">
                    Send a friend request to study alongside classmates.
                  </p>
                )
              )}

              <button
                type="button"
                onClick={onOpenFriends}
                className="w-full py-1.5 text-xs font-medium text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] hover:bg-[var(--theme-accent-soft-hover)] rounded-md transition-colors"
              >
                {incoming.length > 0
                  ? `Review Requests (${incoming.length})`
                  : 'Find Classmates & Friends'}
              </button>
            </>
          );
        })()}
      </section>

      {/* Grade Level Filter */}
      <section className="heritage-card border rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
            Grade Level
          </h2>
          {selectedGrade !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectGrade('all')}
              className="text-xs font-medium text-[var(--theme-accent-text)] hover:underline"
            >
              All
            </button>
          )}
        </div>

        <label htmlFor="sidebar-grade-filter" className="sr-only">
          Filter posts by grade level
        </label>
        <select
          id="sidebar-grade-filter"
          value={selectedGrade}
          onChange={(e) =>
            onSelectGrade(e.target.value as GradeLevel | 'all')
          }
          className="w-full px-3 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
        >
          <option value="all">All Grade Levels ({posts.length})</option>
          {GRADE_LEVEL_OPTIONS.map((grade) => {
            const count = posts.filter((p) => p.gradeLevel === grade).length;
            return (
              <option key={grade} value={grade}>
                {grade} ({count})
              </option>
            );
          })}
        </select>
      </section>

      {/* Subject Filter Navigation */}
      <section className="heritage-card border rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
            Departments & Subjects
          </h2>
          {selectedLessonId && (
            <button
              type="button"
              onClick={onClearLessonFilter}
              className="text-xs font-medium text-[var(--theme-accent-text)] hover:underline"
            >
              Clear lesson
            </button>
          )}
        </div>

        <ul className="space-y-1">
          <li>
            <button
              type="button"
              onClick={() => {
                onSelectSubject('all');
                onClearLessonFilter();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                selectedSubject === 'all' && !selectedLessonId
                  ? 'bg-[var(--theme-accent-soft)] text-[var(--theme-accent-text)] font-medium'
                  : 'text-[#443D34] dark:text-[#E0D8CA] hover:bg-[#F5F0E6] dark:hover:bg-[#221E1A] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]'
              }`}
            >
              <span className="truncate">All Subjects</span>
              <span className="text-xs font-mono tabular-nums text-[#7A7063] dark:text-[#B8AFA0]">
                {posts.length}
              </span>
            </button>
          </li>

          {SUBJECTS.map((subject) => {
            const count = posts.filter((p) => p.subjectId === subject.id).length;
            const isActive = selectedSubject === subject.id;
            return (
              <li key={subject.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectSubject(subject.id);
                    onClearLessonFilter();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                    isActive
                      ? 'bg-[var(--theme-accent-soft)] text-[var(--theme-accent-text)] font-medium'
                      : 'text-[#443D34] dark:text-[#E0D8CA] hover:bg-[#F5F0E6] dark:hover:bg-[#221E1A] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]'
                  }`}
                >
                  <span className="truncate">{subject.name}</span>
                  <span className="text-xs font-mono tabular-nums text-[#7A7063] dark:text-[#B8AFA0]">
                    {count}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Study Activity Summary */}
      <section className="heritage-card border rounded-lg p-5">
        <h2 className="font-display text-lg font-semibold text-[#1C1917] dark:text-[#F7F3EA] mb-3">
          Term Ledger
        </h2>
        <dl className="divide-y divide-[#ECE5D5] dark:divide-[#342E26] text-sm">
          <div className="py-2 flex items-center justify-between">
            <dt className="text-[#574F45] dark:text-[#CEC5B6]">Open Questions</dt>
            <dd className="font-mono font-medium tabular-nums text-[var(--theme-accent-text)]">
              {openQuestionsCount}
            </dd>
          </div>
          <div className="py-2 flex items-center justify-between">
            <dt className="text-[#574F45] dark:text-[#CEC5B6]">Resolved Questions</dt>
            <dd className="font-mono font-medium tabular-nums text-[#1C1917] dark:text-[#F7F3EA]">
              {resolvedCount}
            </dd>
          </div>
          <div className="py-2 flex items-center justify-between">
            <dt className="text-[#574F45] dark:text-[#CEC5B6]">Shared Study Ideas</dt>
            <dd className="font-mono font-medium tabular-nums text-[#1C1917] dark:text-[#F7F3EA]">
              {ideasCount}
            </dd>
          </div>
        </dl>
      </section>
    </aside>
  );
}
