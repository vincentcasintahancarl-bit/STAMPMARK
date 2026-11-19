import { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Award,
  Ban,
  BookOpen,
  CalendarCheck,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  GraduationCap,
  HelpCircle,
  Info,
  Layers,
  Lightbulb,
  Mail,
  Minus,
  Plus,
  Send,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Target,
  Trash2,
  TrendingUp,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { SCHOOL_CLUBS, SUBJECTS } from '../data/seedData';
import {
  AccountWarning,
  DiscussionPost,
  FriendRequest,
  LessonUnit,
  MemberStreak,
  MemberStudyGoal,
  PostKind,
  RegisteredAccount,
  SchoolMember,
  UserRole,
  WarningLevel,
} from '../types/school';
import {
  canSwitchToMember,
  formatRelativeTime,
  getFriendRelation,
  getFriendsForMember,
  getIncomingFriendRequests,
  getMemberUsername,
  getTeacherMonitoredClub,
  getTeacherTaughtSubjects,
  getWarningLevelDisplay,
  isApprovedFacultyTeacher,
  isTeacherAccountPendingApproval,
  isTeacherAccountRejected,
} from '../utils/storage';
import { ClubBadge } from './ClubBadge';
import { MemberAvatar } from './MemberAvatar';
import { OwnerBadge } from './OwnerBadge';

interface AccountInfoViewProps {
  member: SchoolMember;
  allMembers: SchoolMember[];
  linkedAccount: RegisteredAccount | null;
  activeMemberId: string;
  posts: DiscussionPost[];
  lessons: LessonUnit[];
  studyGoal: MemberStudyGoal;
  memberStreak: MemberStreak;
  activeWarnings?: AccountWarning[];
  friendRequests?: FriendRequest[];
  isViewerDisabled?: boolean;
  isViewerTeacher?: boolean;
  isAppOwner?: boolean;
  onIssueWarning?: (
    memberId: string,
    level: WarningLevel,
    reason: string
  ) => void;
  onClearWarning?: (warningId: string) => void;
  onAcknowledgeWarning?: (warningId: string) => void;
  onToggleDisableMember?: (
    memberId: string,
    disable: boolean,
    reason?: string
  ) => void;
  onReviewTeacherApproval?: (
    memberId: string,
    approve: boolean,
    note?: string,
    grantMonitor?: boolean
  ) => void;
  onToggleTeacherMonitor?: (memberId: string, makeMonitor: boolean) => void;
  onSendFriendRequest?: (receiverId: string, note?: string) => void;
  onAcceptFriendRequest?: (requestId: string) => void;
  onDeclineFriendRequest?: (requestId: string) => void;
  onCancelFriendRequest?: (requestId: string) => void;
  onRemoveFriend?: (friendMemberId: string) => void;
  onOpenFriendsPage?: () => void;
  onToggleLessonComplete: (lessonId: string) => void;
  onUpdateWeeklyTarget: (target: number) => void;
  onBack: () => void;
  onSelectMemberToView: (memberId: string) => void;
  onSwitchActiveProfile: (memberId: string) => void;
  onOpenThread: (postId: string) => void;
  onOpenAccountSettings: () => void;
}

export function AccountInfoView({
  member,
  allMembers,
  linkedAccount,
  activeMemberId,
  posts,
  lessons,
  studyGoal,
  memberStreak,
  activeWarnings = [],
  friendRequests = [],
  isViewerDisabled = false,
  isViewerTeacher = false,
  isAppOwner = false,
  onIssueWarning,
  onClearWarning,
  onAcknowledgeWarning,
  onToggleDisableMember,
  onReviewTeacherApproval,
  onToggleTeacherMonitor,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onDeclineFriendRequest,
  onCancelFriendRequest,
  onRemoveFriend,
  onOpenFriendsPage,
  onToggleLessonComplete,
  onUpdateWeeklyTarget,
  onBack,
  onSelectMemberToView,
  onSwitchActiveProfile,
  onOpenThread,
  onOpenAccountSettings,
}: AccountInfoViewProps) {
  const isOwnProfile = member.id === activeMemberId;
  const effectiveUsername = getMemberUsername(member.name, member.username);

  const [showWarnForm, setShowWarnForm] = useState(false);
  const [warnLevel, setWarnLevel] = useState<WarningLevel>(WarningLevel.LOW);
  const [warnReason, setWarnReason] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [disableReason, setDisableReason] = useState('');
  const [showFriendNoteForm, setShowFriendNoteForm] = useState(false);
  const [friendNote, setFriendNote] = useState('');
  const [confirmUnfriend, setConfirmUnfriend] = useState(false);

  const canModerateMember = isViewerTeacher && !isOwnProfile;
  const canApproveTeacher = isAppOwner && !isOwnProfile;
  const canToggleDisableTarget =
    canModerateMember &&
    (isAppOwner || (member.role !== UserRole.TEACHER && !member.isMonitor));
  const friendRelation = getFriendRelation(
    friendRequests,
    activeMemberId,
    member.id
  );
  const memberFriendIds = getFriendsForMember(friendRequests, member.id);
  const memberFriendsList = memberFriendIds
    .map((id) => allMembers.find((m) => m.id === id))
    .filter((m): m is SchoolMember => Boolean(m));
  const ownIncomingRequests = isOwnProfile
    ? getIncomingFriendRequests(friendRequests, activeMemberId)
    : [];

  const renderWarningIcon = (level: WarningLevel) => {
    if (level === WarningLevel.CRITICAL) {
      return <AlertOctagon className="w-4 h-4 shrink-0" aria-hidden="true" />;
    }
    if (level === WarningLevel.MID) {
      return <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />;
    }
    return <Info className="w-4 h-4 shrink-0" aria-hidden="true" />;
  };

  const handleSubmitWarning = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onIssueWarning || !warnReason.trim()) return;
    onIssueWarning(member.id, warnLevel, warnReason.trim());
    setWarnReason('');
    setWarnLevel(WarningLevel.LOW);
    setShowWarnForm(false);
  };

  const handleConfirmDisable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onToggleDisableMember) return;
    onToggleDisableMember(
      member.id,
      true,
      disableReason.trim() || 'Disabled by monitoring teacher during conduct review.'
    );
    setDisableReason('');
    setShowDisableForm(false);
  };

  const isTeacherProfile = member.role === UserRole.TEACHER;
  const effectiveSubjects = isTeacherProfile
    ? getTeacherTaughtSubjects(member)
    : member.enrolledSubjects && member.enrolledSubjects.length > 0
      ? member.enrolledSubjects
      : [member.focusSubject];

  const monitoredClub = isTeacherProfile
    ? getTeacherMonitoredClub(member)
    : member.club;
  const monitoredClubMembers = monitoredClub
    ? allMembers.filter(
        (m) =>
          m.id !== member.id &&
          m.club?.trim().toLowerCase() === monitoredClub.toLowerCase()
      )
    : [];

  const memberPosts = posts
    .filter((p) => p.authorId === member.id)
    .sort((a, b) => b.createdAt - a.createdAt);
  const questionsCount = memberPosts.filter(
    (p) => p.kind === PostKind.QUESTION
  ).length;
  const ideasCount = memberPosts.filter((p) => p.kind === PostKind.IDEA).length;
  const repliesCount = posts.reduce(
    (acc, p) => acc + p.replies.filter((r) => r.authorId === member.id).length,
    0
  );
  const solutionsCount = posts.reduce(
    (acc, p) =>
      acc +
      p.replies.filter((r) => r.authorId === member.id && r.isAccepted).length,
    0
  );

  const primarySubjectMeta = SUBJECTS.find((s) => s.id === member.focusSubject);
  const memberClubMeta = monitoredClub
    ? SCHOOL_CLUBS.find(
        (c) =>
          c.name.toLowerCase() === monitoredClub.trim().toLowerCase() ||
          c.id.toLowerCase() === monitoredClub.trim().toLowerCase()
      )
    : undefined;

  const validLessonIds = new Set(lessons.map((l) => l.id));
  const completedIdsSet = new Set(
    studyGoal.completedLessonIds.filter((id) => validLessonIds.has(id))
  );
  const completedLessonsCount = completedIdsSet.size;
  const weeklyTarget = Math.max(1, studyGoal.weeklyTarget);
  const weeklyPercent = Math.min(
    100,
    Math.round((completedLessonsCount / weeklyTarget) * 100)
  );
  const lessonsRemaining = Math.max(0, weeklyTarget - completedLessonsCount);

  const overallGoalStatus =
    completedLessonsCount >= weeklyTarget
      ? { label: 'Goal Reached', Icon: Award }
      : weeklyPercent >= 50
        ? { label: 'On Track', Icon: TrendingUp }
        : completedLessonsCount > 0
          ? { label: 'In Progress', Icon: Target }
          : { label: 'Not Started', Icon: BookOpen };
  const OverallStatusIcon = overallGoalStatus.Icon;

  const totalCurriculumPercent =
    lessons.length > 0
      ? Math.round((completedLessonsCount / lessons.length) * 100)
      : 0;

  const subjectProgressRows = SUBJECTS.filter(
    (sub) =>
      effectiveSubjects.includes(sub.id) ||
      lessons.some(
        (lesson) =>
          lesson.subjectId === sub.id && completedIdsSet.has(lesson.id)
      )
  ).map((sub) => {
    const subjectLessons = lessons.filter((l) => l.subjectId === sub.id);
    const completedInSubject = subjectLessons.filter((l) =>
      completedIdsSet.has(l.id)
    ).length;
    const totalInSubject = subjectLessons.length;
    const pct =
      totalInSubject > 0
        ? Math.round((completedInSubject / totalInSubject) * 100)
        : 0;
    return {
      subject: sub,
      isPrimary: sub.id === member.focusSubject,
      isEnrolled: effectiveSubjects.includes(sub.id),
      completedCount: completedInSubject,
      totalCount: totalInSubject,
      percent: pct,
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Member Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Classroom Feed</span>
        </button>

        <div className="flex items-center gap-2">
          <label
            htmlFor="inspect-member-select"
            className="text-xs text-[#6B6155] dark:text-[#B8AFA0] whitespace-nowrap"
          >
            View Member:
          </label>
          <select
            id="inspect-member-select"
            value={member.id}
            onChange={(e) => onSelectMemberToView(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium text-[#1C1917] dark:text-[#F7F3EA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
          >
            {allMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.gradeOrDept}){m.isDisabled ? ' — Disabled' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Faculty Approval Status Banner for Pending/Declined Teacher Accounts */}
      {(isTeacherAccountPendingApproval(member) ||
        isTeacherAccountRejected(member)) && (
        <div
          role="status"
          className={`rounded-xl sm:rounded-lg border p-4 flex flex-wrap items-center justify-between gap-3 ${
            isTeacherAccountPendingApproval(member)
              ? 'border-[#E5C98B] dark:border-[#78571D] bg-[#FEF7E8] dark:bg-[#2B2110]'
              : 'border-[#E5C9C5] dark:border-[#7F3232] bg-[#FAF3F1] dark:bg-[#2D1414]'
          }`}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            {isTeacherAccountPendingApproval(member) ? (
              <Clock
                className="w-4 h-4 text-[#7C4A03] dark:text-[#FCD34D] shrink-0 mt-0.5"
                aria-hidden="true"
              />
            ) : (
              <X
                className="w-4 h-4 text-[#7C1D1D] dark:text-[#FCA5A5] shrink-0 mt-0.5"
                aria-hidden="true"
              />
            )}
            <div className="min-w-0">
              <p
                className={`text-xs font-semibold ${
                  isTeacherAccountPendingApproval(member)
                    ? 'text-[#7C4A03] dark:text-[#FCD34D]'
                    : 'text-[#7C1D1D] dark:text-[#FCA5A5]'
                }`}
              >
                {isTeacherAccountPendingApproval(member)
                  ? 'Pending Faculty Approval'
                  : 'Teacher Account Request Declined'}
              </p>
              <p className="text-xs text-[#443D34] dark:text-[#E0D8CA] mt-0.5">
                {isTeacherAccountPendingApproval(member)
                  ? 'This new Teacher account must be approved by the App Owner (vincentcasintahancarl@gmail.com) before it can access Teacher tools or sign in.'
                  : member.teacherApprovalNote ||
                    'This teacher account request was declined by the App Owner.'}
              </p>
            </div>
          </div>

          {canApproveTeacher && onReviewTeacherApproval && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  onReviewTeacherApproval(member.id, true, undefined, false)
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md transition-colors whitespace-nowrap"
              >
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Approve Teacher</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onReviewTeacherApproval(member.id, true, undefined, true)
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] hover:bg-[var(--theme-accent-soft-hover)] rounded-md transition-colors whitespace-nowrap"
              >
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Approve &amp; Make Monitor</span>
              </button>
              {isTeacherAccountPendingApproval(member) && (
                <button
                  type="button"
                  onClick={() => onReviewTeacherApproval(member.id, false)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#E5C9C5] dark:border-[#7F3232] rounded-md transition-colors whitespace-nowrap"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Decline</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Primary Account Identity Card */}
      <section className="heritage-card border rounded-xl sm:rounded-lg p-4 sm:p-8 space-y-5 sm:space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 min-w-0">
            {isOwnProfile ? (
              <button
                type="button"
                onClick={onOpenAccountSettings}
                aria-label="Change profile picture in Settings"
                title="Change profile picture in Settings"
                className="relative group self-start shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent-text)]"
              >
                <MemberAvatar
                  name={member.name}
                  src={member.avatarUrl}
                  size="xl"
                />
                <span
                  aria-hidden="true"
                  className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-[#1C1917]/85 dark:bg-[#F7F3EA]/90 text-[#FFFDF8] dark:text-[#161412] flex items-center justify-center shadow-sm border border-[#FFFDF8]/40 dark:border-[#161412]/30 group-hover:scale-105 transition-transform"
                >
                  <Camera className="w-3.5 h-3.5" />
                </span>
              </button>
            ) : (
              <MemberAvatar
                name={member.name}
                src={member.avatarUrl}
                size="xl"
              />
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6155] dark:text-[#B8AFA0] mb-1.5">
                <span className="heritage-eyebrow">
                  {isTeacherProfile
                    ? 'Faculty & Teacher Dossier'
                    : 'Scholar Dossier'}
                </span>
                <span aria-hidden="true">·</span>
                <span>{member.role}</span>
                {isTeacherProfile && isApprovedFacultyTeacher(member) && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold ${
                        member.isMonitor
                          ? 'text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)]'
                          : 'text-[#574F45] dark:text-[#CEC5B6] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D]'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                      <span>
                        {member.isMonitor
                          ? 'Teacher Monitor'
                          : 'Standard Teacher'}
                      </span>
                    </span>
                  </>
                )}
                {isOwnProfile && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-[#1C1917] dark:text-[#F7F3EA]">
                      Your Active Account
                    </span>
                  </>
                )}
                {member.isDisabled && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FAF3F1] dark:bg-[#2D1414] border border-[#E5C9C5] dark:border-[#7F3232]">
                      <Ban className="w-3 h-3" aria-hidden="true" />
                      <span>Account Disabled</span>
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#1C1917] dark:text-[#F7F3EA] text-balance">
                  {member.name}
                </h1>
                {(member.isOwner || (isOwnProfile && isAppOwner)) && (
                  <OwnerBadge size="md" />
                )}
                <ClubBadge club={monitoredClub} size="md" showEmpty />
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#574F45] dark:text-[#CEC5B6]">
                <span className="font-mono font-medium text-[var(--theme-accent-text)]">
                  @{effectiveUsername}
                </span>
                <span aria-hidden="true">·</span>
                {isTeacherProfile ? (
                  <>
                    <span className="inline-flex items-center gap-1 font-medium text-[#1C1917] dark:text-[#F7F3EA]">
                      <BookOpen
                        className="w-3.5 h-3.5 text-[var(--theme-accent-text)]"
                        aria-hidden="true"
                      />
                      <span className="font-mono tabular-nums">
                        {effectiveSubjects.length}
                      </span>
                      <span>subjects taught</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 text-[#574F45] dark:text-[#CEC5B6]">
                      <Shield
                        className="w-3.5 h-3.5 text-[#8C6D3B] dark:text-[#D4B475]"
                        aria-hidden="true"
                      />
                      <span>
                        {monitoredClub
                          ? `Monitoring ${monitoredClub} (${monitoredClubMembers.length})`
                          : 'No monitored club assigned'}
                      </span>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1 font-medium text-[#1C1917] dark:text-[#F7F3EA]">
                      <Flame
                        className="w-3.5 h-3.5 text-[#8C6D3B] dark:text-[#D4B475]"
                        aria-hidden="true"
                      />
                      <span className="font-mono tabular-nums">
                        {memberStreak.currentStreak}
                      </span>
                      <span>day streak</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 text-[#574F45] dark:text-[#CEC5B6]">
                      <CalendarCheck
                        className="w-3.5 h-3.5 text-[var(--theme-accent-text)]"
                        aria-hidden="true"
                      />
                      <span className="font-mono tabular-nums font-medium text-[#1C1917] dark:text-[#F7F3EA]">
                        {memberStreak.totalDaysOpened}
                      </span>
                      <span>
                        {memberStreak.totalDaysOpened === 1
                          ? 'day opened'
                          : 'days opened'}
                      </span>
                    </span>
                  </>
                )}
                {linkedAccount?.email && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Mail
                        className="w-3.5 h-3.5 text-[#8C6D3B] dark:text-[#D4B475]"
                        aria-hidden="true"
                      />
                      <span>{linkedAccount.email}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
            {isOwnProfile ? (
              <>
                {onOpenFriendsPage && (
                  <button
                    type="button"
                    onClick={onOpenFriendsPage}
                    className="w-full sm:w-auto min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] hover:bg-[var(--theme-accent-soft-hover)] rounded-lg sm:rounded-md transition-colors whitespace-nowrap"
                  >
                    <Users className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      Friends ({memberFriendIds.length})
                      {ownIncomingRequests.length > 0
                        ? ` · ${ownIncomingRequests.length} pending`
                        : ''}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenAccountSettings}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] rounded-lg sm:rounded-md transition-colors whitespace-nowrap"
                >
                  <Settings
                    className="w-3.5 h-3.5 text-[var(--theme-accent-text)]"
                    aria-hidden="true"
                  />
                  <span>Edit Account in Settings</span>
                </button>
              </>
            ) : (
              <>
                {friendRelation.status === 'none' && onSendFriendRequest && (
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <button
                      type="button"
                      disabled={isViewerDisabled}
                      onClick={() => onSendFriendRequest(member.id)}
                      className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] disabled:opacity-50 rounded-lg sm:rounded-md transition-colors whitespace-nowrap"
                    >
                      <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Send Friend Request</span>
                    </button>
                    <button
                      type="button"
                      disabled={isViewerDisabled}
                      onClick={() => {
                        setShowFriendNoteForm((v) => !v);
                        setShowWarnForm(false);
                        setShowDisableForm(false);
                      }}
                      title="Include a greeting note with your friend request"
                      className="min-h-[44px] sm:min-h-0 inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] hover:bg-[var(--theme-accent-soft-hover)] disabled:opacity-50 rounded-lg sm:rounded-md transition-colors whitespace-nowrap"
                    >
                      Add Note
                    </button>
                  </div>
                )}

                {friendRelation.status === 'outgoing_pending' &&
                  friendRelation.request &&
                  onCancelFriendRequest && (
                    <button
                      type="button"
                      onClick={() =>
                        onCancelFriendRequest(friendRelation.request!.id)
                      }
                      className="w-full sm:w-auto min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-[#7A5615] dark:text-[#FCD34D] bg-[#FBF8EC] dark:bg-[#2D2614] border border-[#E8D8A8] dark:border-[#6B5723] hover:opacity-90 rounded-lg sm:rounded-md transition-colors whitespace-nowrap"
                    >
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Request Sent · Cancel</span>
                    </button>
                  )}

                {friendRelation.status === 'incoming_pending' &&
                  friendRelation.request &&
                  onAcceptFriendRequest &&
                  onDeclineFriendRequest && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() =>
                          onAcceptFriendRequest(friendRelation.request!.id)
                        }
                        className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-lg sm:rounded-md transition-colors whitespace-nowrap"
                      >
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Accept Friend Request</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onDeclineFriendRequest(friendRelation.request!.id)
                        }
                        className="min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] hover:text-[#7C1D1D] dark:hover:text-[#FCA5A5] rounded-lg sm:rounded-md transition-colors whitespace-nowrap"
                      >
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Decline</span>
                      </button>
                    </div>
                  )}

                {friendRelation.status === 'friends' && (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#1F4E2E] dark:text-[#86EFAC] bg-[#EFF7F1] dark:bg-[#13291B] border border-[#B8D7C0] dark:border-[#2F6842] rounded-lg sm:rounded-md whitespace-nowrap">
                      <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Friends</span>
                    </span>
                    {onRemoveFriend &&
                      (confirmUnfriend ? (
                        <div className="inline-flex items-center gap-1.5 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              onRemoveFriend(member.id);
                              setConfirmUnfriend(false);
                            }}
                            className="px-3 py-2 text-xs font-semibold text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FAF3F1] dark:bg-[#2D1414] border border-[#E5C9C5] dark:border-[#7F3232] rounded-md whitespace-nowrap"
                          >
                            Confirm Unfriend
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmUnfriend(false)}
                            className="px-2 py-2 text-xs text-[#6B6155] dark:text-[#B8AFA0]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmUnfriend(true)}
                          title="Remove friend"
                          className="min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-[#574F45] dark:text-[#CEC5B6] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] hover:text-[#7C1D1D] dark:hover:text-[#FCA5A5] rounded-lg sm:rounded-md transition-colors whitespace-nowrap"
                        >
                          <UserMinus
                            className="w-3.5 h-3.5"
                            aria-hidden="true"
                          />
                          <span>Unfriend</span>
                        </button>
                      ))}
                  </div>
                )}


                {isAppOwner &&
                  !isOwnProfile &&
                  isTeacherProfile &&
                  isApprovedFacultyTeacher(member) &&
                  onToggleTeacherMonitor && (
                    <button
                      type="button"
                      onClick={() =>
                        onToggleTeacherMonitor(member.id, !member.isMonitor)
                      }
                      className={`w-full sm:w-auto min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg sm:rounded-md border transition-colors whitespace-nowrap ${
                        member.isMonitor
                          ? 'text-[#7C4A03] dark:text-[#FCD34D] bg-[#FEF7E8] dark:bg-[#2B2110] border-[#E5C98B] dark:border-[#78571D] hover:opacity-90'
                          : 'text-[#FFFDF8] bg-[var(--theme-accent)] border-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)]'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>
                        {member.isMonitor ? 'Remove Monitor' : 'Make Monitor'}
                      </span>
                    </button>
                  )}

                {canModerateMember && onIssueWarning && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowWarnForm((v) => !v);
                      setShowDisableForm(false);
                    }}
                    className="w-full sm:w-auto min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-[#7C4A03] dark:text-[#FCD34D] bg-[#FEF7E8] dark:bg-[#2B2110] border border-[#E5C98B] dark:border-[#78571D] hover:opacity-90 rounded-lg sm:rounded-md transition-colors whitespace-nowrap"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Put Warning</span>
                  </button>
                )}

                {canToggleDisableTarget && onToggleDisableMember && (
                  member.isDisabled ? (
                    <button
                      type="button"
                      onClick={() => onToggleDisableMember(member.id, false)}
                      className="w-full sm:w-auto min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-[#1F4E2E] dark:text-[#86EFAC] bg-[#EFF7F1] dark:bg-[#13291B] border border-[#B8D7C0] dark:border-[#2F6842] hover:opacity-90 rounded-lg sm:rounded-md transition-colors whitespace-nowrap"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Turn Account On</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowDisableForm((v) => !v);
                        setShowWarnForm(false);
                      }}
                      className="w-full sm:w-auto min-h-[44px] sm:min-h-0 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FAF3F1] dark:bg-[#2D1414] border border-[#E5C9C5] dark:border-[#7F3232] hover:opacity-90 rounded-lg sm:rounded-md transition-colors whitespace-nowrap"
                    >
                      <Ban className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Disable Account</span>
                    </button>
                  )
                )}
              </>
            )}
          </div>
        </div>

        {/* Optional Friend Request Greeting Note Form */}
        {!isOwnProfile &&
          showFriendNoteForm &&
          friendRelation.status === 'none' &&
          onSendFriendRequest && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSendFriendRequest(
                  member.id,
                  friendNote.trim() || undefined
                );
                setFriendNote('');
                setShowFriendNoteForm(false);
              }}
              className="p-4 rounded-lg border border-[var(--theme-accent-border)] bg-[var(--theme-accent-soft)] space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                  Send Friend Request to {member.name}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowFriendNoteForm(false)}
                  className="text-xs font-medium text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label
                  htmlFor="dossier-friend-note"
                  className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1"
                >
                  Personal Study Note (optional)
                </label>
                <input
                  id="dossier-friend-note"
                  type="text"
                  maxLength={140}
                  value={friendNote}
                  onChange={(e) => setFriendNote(e.target.value)}
                  placeholder={`Hi ${member.name}, want to share notes and study together?`}
                  className="w-full px-3 py-2 text-xs text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#FFFDF8] dark:bg-[#161412] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isViewerDisabled}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] disabled:opacity-50 rounded-md transition-colors"
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Send Friend Request</span>
                </button>
              </div>
            </form>
          )}

        {/* Teacher Monitor Inline Action Forms */}
        {canModerateMember && showWarnForm && onIssueWarning && (
          <form
            onSubmit={handleSubmitWarning}
            className="p-4 rounded-lg border border-[#E5C98B] dark:border-[#78571D] bg-[#FEF7E8] dark:bg-[#2B2110] space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[#7C4A03] dark:text-[#FCD34D]">
                Issue Academic Warning to {member.name}
              </h2>
              <button
                type="button"
                onClick={() => setShowWarnForm(false)}
                className="text-xs font-medium text-[#6B6155] dark:text-[#B8AFA0] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { level: WarningLevel.LOW, label: 'Low' },
                { level: WarningLevel.MID, label: 'Mid' },
                { level: WarningLevel.CRITICAL, label: 'Critical' },
              ].map((item) => {
                const display = getWarningLevelDisplay(item.level);
                const selected = warnLevel === item.level;
                return (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setWarnLevel(item.level)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border transition-colors ${
                      selected
                        ? `${display.badgeClass} ring-2 ring-offset-1 ring-current`
                        : 'bg-[#FFFDF8] dark:bg-[#1C1916] text-[#443D34] dark:text-[#E0D8CA] border-[#D8CEBA] dark:border-[#52483C]'
                    }`}
                  >
                    {renderWarningIcon(item.level)}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div>
              <label
                htmlFor="dossier-warn-reason"
                className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1"
              >
                Warning Reason / Teacher Note
              </label>
              <input
                id="dossier-warn-reason"
                type="text"
                required
                maxLength={240}
                value={warnReason}
                onChange={(e) => setWarnReason(e.target.value)}
                placeholder="Explain why this warning is being placed on the account..."
                className="w-full px-3 py-2 text-xs text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#FFFDF8] dark:bg-[#161412] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Confirm Warning</span>
              </button>
            </div>
          </form>
        )}

        {canToggleDisableTarget && showDisableForm && onToggleDisableMember && (
          <form
            onSubmit={handleConfirmDisable}
            className="p-4 rounded-lg border border-[#E5C9C5] dark:border-[#7F3232] bg-[#FAF3F1] dark:bg-[#2D1414] space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[#7C1D1D] dark:text-[#FCA5A5]">
                Disable {member.name}&apos;s Account
              </h2>
              <button
                type="button"
                onClick={() => setShowDisableForm(false)}
                className="text-xs font-medium text-[#6B6155] dark:text-[#B8AFA0] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]"
              >
                Cancel
              </button>
            </div>

            <div>
              <label
                htmlFor="dossier-disable-reason"
                className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1"
              >
                Reason for Disabling Account
              </label>
              <input
                id="dossier-disable-reason"
                type="text"
                maxLength={240}
                value={disableReason}
                onChange={(e) => setDisableReason(e.target.value)}
                placeholder="e.g. Repeated off-topic sharing or critical warning escalation"
                className="w-full px-3 py-2 text-xs text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#FFFDF8] dark:bg-[#161412] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#FFFDF8] bg-[#991B1B] hover:bg-[#7F1D1D] rounded-md transition-colors"
              >
                <Ban className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Disable Account Now</span>
              </button>
            </div>
          </form>
        )}

        {/* Disabled Notice */}
        {member.isDisabled && (
          <div className="p-4 rounded-lg border border-[#E5C9C5] dark:border-[#7F3232] bg-[#FAF3F1] dark:bg-[#2D1414] flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <Ban
                className="w-4 h-4 text-[#7C1D1D] dark:text-[#FCA5A5] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#7C1D1D] dark:text-[#FCA5A5]">
                  This account is currently disabled
                </p>
                <p className="text-xs text-[#574F45] dark:text-[#E0D8CA] mt-0.5">
                  {member.disabledReason ||
                    'Disabled by a monitoring teacher pending review.'}
                </p>
                {member.disabledAt && (
                  <p className="text-[11px] text-[#6B6155] dark:text-[#B8AFA0] mt-1">
                    Disabled {formatRelativeTime(member.disabledAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Active Warnings Ledger (Visible to Account Owner & Teachers) */}
        {(isOwnProfile || isViewerTeacher) && activeWarnings.length > 0 && (
          <div className="space-y-2.5 pt-1">
            <p className="text-xs font-semibold text-[#443D34] dark:text-[#E0D8CA] flex items-center gap-1.5">
              <ShieldAlert
                className="w-3.5 h-3.5 text-[var(--theme-accent-text)]"
                aria-hidden="true"
              />
              <span>Active Academic Warnings ({activeWarnings.length})</span>
            </p>
            <div className="space-y-2">
              {activeWarnings.map((warning) => {
                const display = getWarningLevelDisplay(warning.level);
                return (
                  <div
                    key={warning.id}
                    className={`p-3.5 rounded-lg border flex flex-wrap items-start justify-between gap-3 ${display.panelClass}`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className={display.textClass}>
                        {renderWarningIcon(warning.level)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className={`font-semibold ${display.textClass}`}>
                            {display.label} Warning
                          </span>
                          <span className="text-[#6B6155] dark:text-[#B8AFA0]">
                            · {formatRelativeTime(warning.createdAt)}
                          </span>
                          {warning.acknowledgedAt && (
                            <span className="text-[11px] text-[#574F45] dark:text-[#CEC5B6]">
                              · Acknowledged
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#1C1917] dark:text-[#F7F3EA] mt-1">
                          {warning.reason}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isOwnProfile && !warning.acknowledgedAt && onAcknowledgeWarning && (
                        <button
                          type="button"
                          onClick={() => onAcknowledgeWarning(warning.id)}
                          className="px-2.5 py-1 text-[11px] font-medium text-[#1C1917] dark:text-[#F7F3EA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] rounded-md hover:opacity-90"
                        >
                          Acknowledge
                        </button>
                      )}
                      {isViewerTeacher && onClearWarning && (
                        <button
                          type="button"
                          onClick={() => onClearWarning(warning.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-[#443D34] dark:text-[#E0D8CA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] rounded-md hover:text-[#7C1D1D] dark:hover:text-[#FCA5A5]"
                        >
                          <Trash2 className="w-3 h-3" aria-hidden="true" />
                          <span>Clear</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {member.bio && (
          <p className="text-sm text-[#3B342D] dark:text-[#E2DACB] leading-relaxed max-w-3xl">
            {member.bio}
          </p>
        )}

        {/* Structured Academic Information Ledger */}
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-[#ECE5D5] dark:border-[#342E26]">
          <div className="p-4 bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D] rounded-md">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-[#6B6155] dark:text-[#B8AFA0]">
              <GraduationCap
                className="w-3.5 h-3.5 text-[var(--theme-accent-text)]"
                aria-hidden="true"
              />
              <span>
                {isTeacherProfile ? 'Faculty Department' : 'Grade / Department'}
              </span>
            </dt>
            <dd className="mt-1.5 text-sm font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
              {member.gradeOrDept}
            </dd>
          </div>

          <div className="p-4 bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D] rounded-md">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-[#6B6155] dark:text-[#B8AFA0]">
              <Layers
                className="w-3.5 h-3.5 text-[var(--theme-accent-text)]"
                aria-hidden="true"
              />
              <span>
                {isTeacherProfile ? 'Advisory / Office Room' : 'Section / Room'}
              </span>
            </dt>
            <dd className="mt-1.5 text-sm font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
              {member.section || 'Not specified'}
            </dd>
          </div>

          <div className="p-4 bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D] rounded-md">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-[#6B6155] dark:text-[#B8AFA0]">
              <BookOpen
                className="w-3.5 h-3.5 text-[var(--theme-accent-text)]"
                aria-hidden="true"
              />
              <span>
                {isTeacherProfile ? 'Teaching Load' : 'Course / Strand'}
              </span>
            </dt>
            <dd className="mt-1.5 text-sm font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
              {isTeacherProfile
                ? `${effectiveSubjects.length} of 3–4 Subjects`
                : member.courseOrTrack || 'General Academic'}
            </dd>
            {isTeacherProfile && member.courseOrTrack && (
              <p className="mt-0.5 text-[11px] text-[#6B6155] dark:text-[#B8AFA0] truncate">
                {member.courseOrTrack}
              </p>
            )}
          </div>

          <div className="p-4 bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D] rounded-md">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-[#6B6155] dark:text-[#B8AFA0]">
              <CheckCircle2
                className="w-3.5 h-3.5 text-[var(--theme-accent-text)]"
                aria-hidden="true"
              />
              <span>
                {isTeacherProfile ? 'Lead Subject Taught' : 'Primary Subject'}
              </span>
            </dt>
            <dd className="mt-1.5 text-sm font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
              {primarySubjectMeta?.name || 'General'}
            </dd>
          </div>

          <div className="sm:col-span-2 lg:col-span-4 p-4 bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D] rounded-md space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <dt className="flex items-center gap-1.5 text-xs font-medium text-[#6B6155] dark:text-[#B8AFA0]">
                  <Shield
                    className="w-3.5 h-3.5 text-[var(--theme-accent-text)]"
                    aria-hidden="true"
                  />
                  <span>
                    {isTeacherProfile
                      ? 'Club Monitored & Oversight'
                      : 'School Club Affiliation'}
                  </span>
                </dt>
                <dd className="mt-2 flex flex-wrap items-center gap-2.5">
                  <ClubBadge club={monitoredClub} size="md" showEmpty />
                  {memberClubMeta?.tagline && (
                    <span className="text-xs text-[#574F45] dark:text-[#CEC5B6]">
                      {memberClubMeta.tagline}
                    </span>
                  )}
                </dd>
              </div>
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={onOpenAccountSettings}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--theme-accent-text)] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] hover:bg-[#ECE5D5] dark:hover:bg-[#26211C] rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  <Settings className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {isTeacherProfile
                      ? monitoredClub
                        ? 'Change Monitored Club'
                        : 'Assign Monitored Club'
                      : member.club
                        ? 'Change Club'
                        : 'Choose Club'}
                  </span>
                </button>
              )}
            </div>

            {isTeacherProfile && monitoredClub && (
              <div className="pt-3 border-t border-[#E2D9C6] dark:border-[#3D362D] space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                    Members Inside {monitoredClub}
                  </span>
                  <span className="text-xs font-mono tabular-nums text-[#6B6155] dark:text-[#B8AFA0]">
                    {monitoredClubMembers.length}{' '}
                    {monitoredClubMembers.length === 1 ? 'member' : 'members'}
                  </span>
                </div>

                {monitoredClubMembers.length === 0 ? (
                  <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0]">
                    No students or fellow members are currently enrolled in {monitoredClub}.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {monitoredClubMembers.map((clubMember) => (
                      <button
                        key={clubMember.id}
                        type="button"
                        onClick={() => onSelectMemberToView(clubMember.id)}
                        className="flex items-center gap-2.5 p-2.5 rounded-md bg-[#FFFDF8] dark:bg-[#161412] border border-[#DDD4C0] dark:border-[#4A4137] hover:border-[var(--theme-accent-border)] text-left transition-colors"
                      >
                        <MemberAvatar
                          name={clubMember.name}
                          src={clubMember.avatarUrl}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-[#1C1917] dark:text-[#F7F3EA] truncate">
                              {clubMember.name}
                            </span>
                            {clubMember.isDisabled && (
                              <span className="text-[10px] font-semibold text-[#7C1D1D] dark:text-[#FCA5A5] shrink-0">
                                · Disabled
                              </span>
                            )}
                          </div>
                          <span className="block text-[11px] text-[#6B6155] dark:text-[#B8AFA0] truncate">
                            {clubMember.role} · {clubMember.gradeOrDept}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </dl>
      </section>

      {/* Weekly Study Goals & Visual Status Bars (Students & Peer Tutors only) */}
      {!isTeacherProfile && (
      <section
        aria-labelledby="account-study-goals-heading"
        className="heritage-card border rounded-xl sm:rounded-lg p-4 sm:p-6 space-y-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="heritage-eyebrow mb-1">Weekly Study Ledger</p>
            <h2
              id="account-study-goals-heading"
              className="font-display text-xl sm:text-2xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]"
            >
              Weekly Study Goals & Lesson Status
            </h2>
            <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] mt-0.5">
              Live progress synced from lesson completions tracked in your study sidebar.
            </p>
          </div>

          {isOwnProfile && (
            <div
              className="inline-flex items-center bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md shrink-0"
              role="group"
              aria-label="Adjust weekly lesson target"
            >
              <button
                type="button"
                onClick={() => onUpdateWeeklyTarget(Math.max(1, weeklyTarget - 1))}
                disabled={weeklyTarget <= 1}
                aria-label="Decrease weekly lesson goal"
                className="w-8 h-8 inline-flex items-center justify-center text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA] hover:bg-[#ECE5D5] dark:hover:bg-[#2C2721] disabled:opacity-40 disabled:pointer-events-none rounded-l-md transition-colors"
              >
                <Minus className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <span className="px-3 text-xs font-mono font-semibold tabular-nums text-[#1C1917] dark:text-[#F7F3EA]">
                Target: {weeklyTarget} / week
              </span>
              <button
                type="button"
                onClick={() =>
                  onUpdateWeeklyTarget(Math.min(12, weeklyTarget + 1))
                }
                disabled={weeklyTarget >= 12}
                aria-label="Increase weekly lesson goal"
                className="w-8 h-8 inline-flex items-center justify-center text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA] hover:bg-[#ECE5D5] dark:hover:bg-[#2C2721] disabled:opacity-40 disabled:pointer-events-none rounded-r-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Overall Weekly Goal & Curriculum Status Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D] rounded-md space-y-2.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                <OverallStatusIcon
                  className="w-4 h-4 text-[var(--theme-accent-text)]"
                  aria-hidden="true"
                />
                <span>Weekly Target · {overallGoalStatus.label}</span>
              </span>
              <span className="font-mono font-semibold tabular-nums text-[#1C1917] dark:text-[#F7F3EA]">
                {completedLessonsCount} / {weeklyTarget}{' '}
                <span className="font-sans font-normal text-[#6B6155] dark:text-[#B8AFA0]">
                  ({weeklyPercent}%)
                </span>
              </span>
            </div>

            <div
              role="progressbar"
              aria-label="Overall weekly study goal progress"
              aria-valuenow={completedLessonsCount}
              aria-valuemin={0}
              aria-valuemax={weeklyTarget}
              className="h-3 w-full bg-[#ECE5D5] dark:bg-[#2C2721] border border-[#D8CEBA] dark:border-[#4A4137] rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-[var(--theme-accent)] dark:bg-[var(--theme-accent-text)] transition-all duration-200"
                style={{ width: `${weeklyPercent}%` }}
              />
            </div>

            <p className="text-xs text-[#574F45] dark:text-[#CEC5B6]">
              {lessonsRemaining === 0
                ? `${member.name} has met this week's target of ${weeklyTarget} completed lessons.`
                : `${lessonsRemaining} more ${
                    lessonsRemaining === 1 ? 'lesson' : 'lessons'
                  } needed to fulfill the weekly target.`}
            </p>
          </div>

          <div className="p-4 bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D] rounded-md space-y-2.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                <BookOpen
                  className="w-4 h-4 text-[var(--theme-accent-text)]"
                  aria-hidden="true"
                />
                <span>Archive Curriculum Coverage</span>
              </span>
              <span className="font-mono font-semibold tabular-nums text-[#1C1917] dark:text-[#F7F3EA]">
                {completedLessonsCount} / {lessons.length}{' '}
                <span className="font-sans font-normal text-[#6B6155] dark:text-[#B8AFA0]">
                  ({totalCurriculumPercent}%)
                </span>
              </span>
            </div>

            <div
              role="progressbar"
              aria-label="Total archive lesson coverage"
              aria-valuenow={completedLessonsCount}
              aria-valuemin={0}
              aria-valuemax={Math.max(1, lessons.length)}
              className="h-3 w-full bg-[#ECE5D5] dark:bg-[#2C2721] border border-[#D8CEBA] dark:border-[#4A4137] rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-[#8C6D3B] dark:bg-[#D4B475] transition-all duration-200"
                style={{ width: `${totalCurriculumPercent}%` }}
              />
            </div>

            <p className="text-xs text-[#574F45] dark:text-[#CEC5B6]">
              Across {lessons.length} active lesson{' '}
              {lessons.length === 1 ? 'unit' : 'units'} in the term study archive.
            </p>
          </div>
        </div>

        {/* Per-Subject Lesson Progress Status Bars */}
        <div className="pt-2 border-t border-[#ECE5D5] dark:border-[#342E26] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
              Subject Completion Status Bars
            </h3>
            <span className="text-xs font-mono tabular-nums text-[#6B6155] dark:text-[#B8AFA0]">
              {subjectProgressRows.length}{' '}
              {subjectProgressRows.length === 1 ? 'subject' : 'subjects'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subjectProgressRows.map(
              ({
                subject,
                isPrimary,
                completedCount,
                totalCount,
                percent,
              }) => {
                const statusText =
                  totalCount === 0
                    ? 'No Units'
                    : completedCount === totalCount
                      ? 'Completed'
                      : completedCount > 0
                        ? 'In Progress'
                        : 'Pending';

                return (
                  <div
                    key={subject.id}
                    className={`p-3.5 rounded-md border space-y-2 ${
                      isPrimary
                        ? 'bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)]'
                        : 'bg-[#FFFDF8] dark:bg-[#1C1916] border-[#E2D9C6] dark:border-[#3D362D]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-[#1C1917] dark:text-[#F7F3EA] truncate">
                            {subject.name}
                          </span>
                          {isPrimary && (
                            <span className="text-[11px] font-medium text-[var(--theme-accent-text)] shrink-0">
                              · Primary
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#6B6155] dark:text-[#B8AFA0]">
                          {subject.department} · {statusText}
                        </p>
                      </div>

                      <span className="text-xs font-mono font-semibold tabular-nums text-[#1C1917] dark:text-[#F7F3EA] shrink-0">
                        {completedCount}/{totalCount}{' '}
                        <span className="font-sans font-normal text-[#6B6155] dark:text-[#B8AFA0]">
                          ({percent}%)
                        </span>
                      </span>
                    </div>

                    <div
                      role="progressbar"
                      aria-label={`${subject.name} lesson completion`}
                      aria-valuenow={completedCount}
                      aria-valuemin={0}
                      aria-valuemax={Math.max(1, totalCount)}
                      className="h-2 w-full bg-[#ECE5D5] dark:bg-[#2C2721] border border-[#DDD4C0] dark:border-[#4A4137] rounded-full overflow-hidden"
                    >
                      <div
                        className="h-full bg-[var(--theme-accent)] dark:bg-[var(--theme-accent-text)] transition-all duration-200"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Lesson Unit Ledger */}
        {lessons.length > 0 && (
          <div className="pt-2 border-t border-[#ECE5D5] dark:border-[#342E26] space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                Lesson Completion Checklist
              </h3>
              <span className="text-xs text-[#6B6155] dark:text-[#B8AFA0]">
                {isOwnProfile
                  ? 'Toggle any unit to update your weekly status bars'
                  : `Showing lesson status recorded for ${member.name}`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {lessons.map((lesson) => {
                const isDone = completedIdsSet.has(lesson.id);
                const subjectName =
                  SUBJECTS.find((s) => s.id === lesson.subjectId)?.name ||
                  'General';

                if (isOwnProfile) {
                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      role="checkbox"
                      aria-checked={isDone}
                      onClick={() => onToggleLessonComplete(lesson.id)}
                      className={`text-left flex items-center gap-2.5 px-3 py-2.5 rounded-md border transition-colors min-h-[44px] ${
                        isDone
                          ? 'bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)]'
                          : 'bg-[#FFFDF8] dark:bg-[#1C1916] border-[#E2D9C6] dark:border-[#3D362D] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C]'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                          isDone
                            ? 'bg-[var(--theme-accent)] border-[var(--theme-accent)] text-[#FFFDF8]'
                            : 'bg-[#FFFDF8] dark:bg-[#161412] border-[#C5B99F] dark:border-[#52483C] text-transparent'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-medium text-[#1C1917] dark:text-[#F7F3EA] truncate">
                          {lesson.title}
                        </span>
                        <span className="block text-[11px] text-[#6B6155] dark:text-[#B8AFA0] truncate">
                          {subjectName} · {lesson.unitNumber}
                        </span>
                      </span>
                      <span className="text-[11px] font-medium text-[var(--theme-accent-text)] shrink-0">
                        {isDone ? 'Completed' : 'Pending'}
                      </span>
                    </button>
                  );
                }

                return (
                  <div
                    key={lesson.id}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md border ${
                      isDone
                        ? 'bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)]'
                        : 'bg-[#F5F0E6] dark:bg-[#221E1A] border-[#E2D9C6] dark:border-[#3D362D]'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        isDone
                          ? 'text-[var(--theme-accent-text)]'
                          : 'text-[#B5AA96] dark:text-[#6B6155]'
                      }`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[#1C1917] dark:text-[#F7F3EA] truncate">
                        {lesson.title}
                      </p>
                      <p className="text-[11px] text-[#6B6155] dark:text-[#B8AFA0] truncate">
                        {subjectName} · {lesson.unitNumber}
                      </p>
                    </div>
                    <span className="text-[11px] font-medium text-[#574F45] dark:text-[#CEC5B6] shrink-0">
                      {isDone ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
      )}

      {/* Enrolled / Taught Subjects & Courses Directory */}
      <section className="heritage-card border rounded-xl sm:rounded-lg p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
              {isTeacherProfile
                ? 'Subjects Taught (3–4 Subjects)'
                : 'Subjects & Courses Enrolled'}
            </h2>
            <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] mt-0.5">
              {isTeacherProfile
                ? `Subjects ${member.name} teaches and oversees across the classroom this term.`
                : `Classes and subject areas ${member.name} participates in this term.`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono tabular-nums text-[#6B6155] dark:text-[#B8AFA0]">
              {isTeacherProfile
                ? `${effectiveSubjects.length} / 4 subjects`
                : `${effectiveSubjects.length} ${
                    effectiveSubjects.length === 1 ? 'subject' : 'subjects'
                  }`}
            </span>
            {isTeacherProfile && isOwnProfile && (
              <button
                type="button"
                onClick={onOpenAccountSettings}
                className="text-xs font-medium text-[var(--theme-accent-text)] hover:underline whitespace-nowrap"
              >
                Edit Subjects
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {effectiveSubjects.map((subId) => {
            const sub = SUBJECTS.find((s) => s.id === subId);
            if (!sub) return null;
            const isPrimary = sub.id === member.focusSubject;
            const unitCount = lessons.filter((l) => l.subjectId === sub.id).length;
            const postCount = posts.filter((p) => p.subjectId === sub.id).length;
            return (
              <div
                key={sub.id}
                className={`p-4 rounded-md border ${
                  isPrimary
                    ? 'bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)]'
                    : 'bg-[#F5F0E6] dark:bg-[#221E1A] border-[#E2D9C6] dark:border-[#3D362D]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                    {sub.name}
                  </span>
                  {isPrimary && (
                    <span className="text-[11px] font-medium text-[var(--theme-accent-text)]">
                      {isTeacherProfile ? 'Lead' : 'Primary'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] mt-1">
                  {sub.department} Department
                </p>
                {isTeacherProfile && (
                  <p className="text-[11px] font-mono tabular-nums text-[#574F45] dark:text-[#CEC5B6] mt-2 pt-2 border-t border-[#E2D9C6]/70 dark:border-[#3D362D]">
                    {unitCount} {unitCount === 1 ? 'unit' : 'units'} · {postCount}{' '}
                    {postCount === 1 ? 'thread' : 'threads'}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Study Friends Network */}
      <section className="heritage-card border rounded-xl sm:rounded-lg p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
              Study Friends
            </h2>
            <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] mt-0.5">
              Connected classmates and study partners for {member.name}.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono tabular-nums text-[#6B6155] dark:text-[#B8AFA0]">
              {memberFriendsList.length}{' '}
              {memberFriendsList.length === 1 ? 'friend' : 'friends'}
            </span>
            {isOwnProfile && onOpenFriendsPage && (
              <button
                type="button"
                onClick={onOpenFriendsPage}
                className="text-xs font-medium text-[var(--theme-accent-text)] hover:underline whitespace-nowrap"
              >
                Manage Friends
              </button>
            )}
          </div>
        </div>

        {memberFriendsList.length === 0 ? (
          <p className="text-sm text-[#6B6155] dark:text-[#B8AFA0]">
            {isOwnProfile
              ? 'You have not connected with any study friends yet. Visit Friends to send requests.'
              : `${member.name} has no connected study friends listed yet.`}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {memberFriendsList.map((friend) => (
              <button
                key={friend.id}
                type="button"
                onClick={() => onSelectMemberToView(friend.id)}
                className="flex items-center gap-3 p-3 rounded-md bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D] hover:border-[var(--theme-accent-border)] text-left transition-colors"
              >
                <MemberAvatar
                  name={friend.name}
                  src={friend.avatarUrl}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-semibold text-[#1C1917] dark:text-[#F7F3EA] truncate">
                      {friend.name}
                    </p>
                    {friend.isOwner && <OwnerBadge size="xs" />}
                  </div>
                  <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] truncate">
                    @{getMemberUsername(friend.name, friend.username)} ·{' '}
                    {friend.gradeOrDept}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Classroom Activity & Posts */}
      <section className="heritage-card border rounded-xl sm:rounded-lg p-4 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
              Classroom Contributions
            </h2>
            <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] mt-0.5">
              Questions asked, study ideas shared, and helpful solutions contributed.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs">
            <div>
              <span className="font-mono font-semibold tabular-nums text-[#1C1917] dark:text-[#F7F3EA]">
                {questionsCount}
              </span>{' '}
              <span className="text-[#6B6155] dark:text-[#B8AFA0]">
                Questions
              </span>
            </div>
            <div>
              <span className="font-mono font-semibold tabular-nums text-[#1C1917] dark:text-[#F7F3EA]">
                {ideasCount}
              </span>{' '}
              <span className="text-[#6B6155] dark:text-[#B8AFA0]">
                Study Ideas
              </span>
            </div>
            <div>
              <span className="font-mono font-semibold tabular-nums text-[#1C1917] dark:text-[#F7F3EA]">
                {repliesCount}
              </span>{' '}
              <span className="text-[#6B6155] dark:text-[#B8AFA0]">Replies</span>
            </div>
            <div>
              <span className="font-mono font-semibold tabular-nums text-[var(--theme-accent-text)]">
                {solutionsCount}
              </span>{' '}
              <span className="text-[#6B6155] dark:text-[#B8AFA0]">
                Accepted Solutions
              </span>
            </div>
          </div>
        </div>

        {memberPosts.length === 0 ? (
          <p className="text-sm text-[#6B6155] dark:text-[#B8AFA0] py-4 border-t border-[#ECE5D5] dark:border-[#342E26]">
            No questions or study ideas posted by {member.name} yet.
          </p>
        ) : (
          <ul className="divide-y divide-[#ECE5D5] dark:divide-[#342E26] border-t border-[#ECE5D5] dark:border-[#342E26]">
            {memberPosts.map((post) => {
              const subName =
                SUBJECTS.find((s) => s.id === post.subjectId)?.name ?? 'General';
              return (
                <li key={post.id} className="py-3.5">
                  <button
                    type="button"
                    onClick={() => onOpenThread(post.id)}
                    className="w-full text-left flex items-start justify-between gap-4 group"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6155] dark:text-[#B8AFA0] mb-1">
                        <span className="inline-flex items-center gap-1 font-medium text-[var(--theme-accent-text)]">
                          {post.kind === PostKind.QUESTION ? (
                            <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : (
                            <Lightbulb className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                          <span>
                            {post.kind === PostKind.QUESTION
                              ? 'Question'
                              : 'Study Idea'}
                          </span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{subName}</span>
                        {post.gradeLevel && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{post.gradeLevel}</span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span>{formatRelativeTime(post.createdAt)}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-[#1C1917] dark:text-[#F7F3EA] group-hover:text-[var(--theme-accent-text)] transition-colors truncate">
                        {post.title}
                      </h3>
                    </div>

                    <ArrowUpRight
                      className="w-4 h-4 text-[#8C7F6D] dark:text-[#B8AFA0] group-hover:text-[var(--theme-accent-text)] shrink-0 mt-1"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
