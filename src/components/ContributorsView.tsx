import {
  AlertOctagon,
  AlertTriangle,
  Ban,
  Check,
  Clock,
  Info,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { SUBJECTS } from '../data/seedData';
import {
  AccountWarning,
  DiscussionPost,
  FriendRequest,
  PostKind,
  SchoolMember,
  UserRole,
  WarningLevel,
} from '../types/school';
import {
  canSwitchToMember,
  getActiveWarningsForMember,
  getFriendRelation,
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

interface ContributorsViewProps {
  members: SchoolMember[];
  posts: DiscussionPost[];
  activeMemberId: string;
  warnings?: AccountWarning[];
  friendRequests?: FriendRequest[];
  isActiveUserDisabled?: boolean;
  isViewerTeacher?: boolean;
  isAppOwner?: boolean;
  onOpenMonitor?: () => void;
  onOpenFriendsPage?: () => void;
  onSendFriendRequest?: (receiverId: string, note?: string) => void;
  onAcceptFriendRequest?: (requestId: string) => void;
  onDeclineFriendRequest?: (requestId: string) => void;
  onCancelFriendRequest?: (requestId: string) => void;
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
  onSwitchMember: (memberId: string) => void;
  onViewAccountInfo: (memberId: string) => void;
}

export function ContributorsView({
  members,
  posts,
  activeMemberId,
  warnings = [],
  friendRequests = [],
  isActiveUserDisabled = false,
  isViewerTeacher = false,
  isAppOwner = false,
  onOpenMonitor,
  onOpenFriendsPage,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onDeclineFriendRequest,
  onCancelFriendRequest,
  onToggleDisableMember,
  onReviewTeacherApproval,
  onToggleTeacherMonitor,
  onSwitchMember,
  onViewAccountInfo,
}: ContributorsViewProps) {
  const incomingRequestsCount = getIncomingFriendRequests(
    friendRequests,
    activeMemberId
  ).length;
  const renderWarningIcon = (level: WarningLevel) => {
    if (level === WarningLevel.CRITICAL) {
      return <AlertOctagon className="w-3 h-3 shrink-0" aria-hidden="true" />;
    }
    if (level === WarningLevel.MID) {
      return <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />;
    }
    return <Info className="w-3 h-3 shrink-0" aria-hidden="true" />;
  };

  const rows = members.map((member) => {
    const questions = posts.filter(
      (p) => p.authorId === member.id && p.kind === PostKind.QUESTION
    ).length;
    const ideas = posts.filter(
      (p) => p.authorId === member.id && p.kind === PostKind.IDEA
    ).length;
    const replies = posts.reduce(
      (acc, p) =>
        acc + p.replies.filter((r) => r.authorId === member.id).length,
      0
    );
    const acceptedSolutions = posts.reduce(
      (acc, p) =>
        acc +
        p.replies.filter((r) => r.authorId === member.id && r.isAccepted).length,
      0
    );
    const subjectName =
      SUBJECTS.find((s) => s.id === member.focusSubject)?.name ?? 'General';
    const isTeacher = member.role === UserRole.TEACHER;
    const taughtSubjects = isTeacher ? getTeacherTaughtSubjects(member) : [];
    const taughtSubjectNames = taughtSubjects
      .map((id) => SUBJECTS.find((s) => s.id === id)?.name)
      .filter((name): name is string => Boolean(name));
    const monitoredClub = isTeacher ? getTeacherMonitoredClub(member) : undefined;
    const memberWarnings = getActiveWarningsForMember(warnings, member.id);

    return {
      member,
      isTeacher,
      subjectName,
      taughtSubjectNames,
      monitoredClub,
      questions,
      ideas,
      replies,
      acceptedSolutions,
      highestWarning: memberWarnings[0] || null,
      warningCount: memberWarnings.length,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="heritage-eyebrow mb-1">Academic Directory</p>
          <h1 className="font-display text-3xl font-semibold text-[#1C1917] dark:text-[#F7F3EA] text-balance">
            Scholars & Faculty Roll
          </h1>
          <p className="mt-1 text-sm text-[#574F45] dark:text-[#CEC5B6]">
            Students, peer tutors, and faculty contributing lesson questions and explanations. Select any member to view their grade, section, and enrolled courses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onOpenFriendsPage && (
            <button
              type="button"
              onClick={onOpenFriendsPage}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#1C1917] dark:text-[#F7F3EA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <Users
                className="w-4 h-4 text-[var(--theme-accent-text)]"
                aria-hidden="true"
              />
              <span>
                Friends & Requests
                {incomingRequestsCount > 0 ? ` (${incomingRequestsCount})` : ''}
              </span>
            </button>
          )}

          {isViewerTeacher && onOpenMonitor && (
            <button
              type="button"
              onClick={onOpenMonitor}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] hover:bg-[var(--theme-accent-soft-hover)] rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span>Open Teacher Monitor</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-3">
        {rows.map(
          ({
            member,
            isTeacher,
            subjectName,
            taughtSubjectNames,
            monitoredClub,
            questions,
            ideas,
            replies,
            acceptedSolutions,
            highestWarning,
            warningCount,
          }) => {
            const isCurrent = member.id === activeMemberId;
            const friendRelation = getFriendRelation(
              friendRequests,
              activeMemberId,
              member.id
            );
            const showWarningBadge =
              (isViewerTeacher || isCurrent) && highestWarning !== null;
            const warningDisplay = highestWarning
              ? getWarningLevelDisplay(highestWarning.level)
              : null;
            const displayClub = isTeacher ? monitoredClub : member.club;

            return (
              <article
                key={member.id}
                className="heritage-card border rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <MemberAvatar
                      name={member.name}
                      src={member.avatarUrl}
                      size="md"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewAccountInfo(member.id)}
                          className="font-display font-semibold text-lg text-[#1C1917] dark:text-[#F7F3EA] hover:text-[var(--theme-accent-text)] transition-colors text-left truncate"
                        >
                          {member.name}
                        </button>
                        {(member.isOwner || (isCurrent && isAppOwner)) && (
                          <OwnerBadge size="xs" />
                        )}
                      </div>
                      <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] mt-0.5 truncate">
                        <span className="font-mono text-[var(--theme-accent-text)]">
                          @{getMemberUsername(member.name, member.username)}
                        </span>{' '}
                        <span aria-hidden="true">·</span> {member.role}
                      </p>
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="text-xs font-medium text-[var(--theme-accent-text)] shrink-0">
                      Active
                    </span>
                  )}
                </div>

                {(displayClub ||
                  (isTeacher && member.isMonitor) ||
                  member.isDisabled ||
                  isTeacherAccountPendingApproval(member) ||
                  isTeacherAccountRejected(member) ||
                  showWarningBadge) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {isTeacher && member.isMonitor && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded border text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)]">
                        <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                        <span>Monitor</span>
                      </span>
                    )}
                    {displayClub && (
                      <span className="inline-flex items-center gap-1.5">
                        {isTeacher && (
                          <span className="text-[11px] font-medium text-[#6B6155] dark:text-[#B8AFA0]">
                            Monitors:
                          </span>
                        )}
                        <ClubBadge club={displayClub} size="xs" />
                      </span>
                    )}
                    {isTeacherAccountPendingApproval(member) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded border text-[#7C4A03] dark:text-[#FCD34D] bg-[#FEF7E8] dark:bg-[#2B2110] border-[#E5C98B] dark:border-[#78571D]">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        <span>Pending Faculty Approval</span>
                      </span>
                    )}
                    {isTeacherAccountRejected(member) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded border text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FAF3F1] dark:bg-[#2D1414] border-[#E5C9C5] dark:border-[#7F3232]">
                        <X className="w-3 h-3" aria-hidden="true" />
                        <span>Faculty Declined</span>
                      </span>
                    )}
                    {member.isDisabled && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded border text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FAF3F1] dark:bg-[#2D1414] border-[#E5C9C5] dark:border-[#7F3232]">
                        <Ban className="w-3 h-3" aria-hidden="true" />
                        <span>Account Disabled</span>
                      </span>
                    )}
                    {showWarningBadge && highestWarning && warningDisplay && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded border ${warningDisplay.badgeClass}`}
                      >
                        {renderWarningIcon(highestWarning.level)}
                        <span>
                          {warningDisplay.label} Warning
                          {warningCount > 1 ? ` (${warningCount})` : ''}
                        </span>
                      </span>
                    )}
                  </div>
                )}

                <div className="text-xs text-[#574F45] dark:text-[#CEC5B6] space-y-1">
                  <div>
                    <span className="font-medium text-[#1C1917] dark:text-[#F7F3EA]">
                      {member.gradeOrDept}
                    </span>
                    {member.section && (
                      <>
                        <span aria-hidden="true"> · </span>
                        <span>{member.section}</span>
                      </>
                    )}
                  </div>
                  <div>
                    {isTeacher ? (
                      <span>
                        Teaches ({taughtSubjectNames.length}):{' '}
                        {taughtSubjectNames.join(', ')}
                      </span>
                    ) : (
                      <span>{subjectName}</span>
                    )}
                    {member.courseOrTrack && (
                      <>
                        <span aria-hidden="true"> · </span>
                        <span className="text-[#6B6155] dark:text-[#B8AFA0]">
                          {member.courseOrTrack}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 py-2.5 border-y border-[#ECE5D5] dark:border-[#342E26] text-center text-xs">
                  <div>
                    <div className="font-mono font-semibold tabular-nums text-[#1C1917] dark:text-[#F7F3EA]">
                      {questions}
                    </div>
                    <div className="text-[11px] text-[#6B6155] dark:text-[#B8AFA0]">
                      Questions
                    </div>
                  </div>
                  <div>
                    <div className="font-mono font-semibold tabular-nums text-[#1C1917] dark:text-[#F7F3EA]">
                      {ideas}
                    </div>
                    <div className="text-[11px] text-[#6B6155] dark:text-[#B8AFA0]">
                      Ideas
                    </div>
                  </div>
                  <div>
                    <div className="font-mono font-semibold tabular-nums text-[#1C1917] dark:text-[#F7F3EA]">
                      {replies}
                    </div>
                    <div className="text-[11px] text-[#6B6155] dark:text-[#B8AFA0]">
                      Replies
                    </div>
                  </div>
                  <div>
                    <div className="font-mono font-semibold tabular-nums text-[var(--theme-accent-text)]">
                      {acceptedSolutions}
                    </div>
                    <div className="text-[11px] text-[#6B6155] dark:text-[#B8AFA0]">
                      Solved
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onViewAccountInfo(member.id)}
                    className="flex-1 min-h-[42px] px-3 text-xs font-medium text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] rounded-lg"
                  >
                    View Account Info
                  </button>
                  {isAppOwner &&
                    !isCurrent &&
                    (isTeacherAccountPendingApproval(member) ||
                      isTeacherAccountRejected(member)) &&
                    onReviewTeacherApproval && (
                      <div className="w-full flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onReviewTeacherApproval(
                              member.id,
                              true,
                              undefined,
                              false
                            )
                          }
                          className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] rounded-lg"
                        >
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Approve Teacher</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onReviewTeacherApproval(
                              member.id,
                              true,
                              undefined,
                              true
                            )
                          }
                          className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 text-xs font-semibold text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] rounded-lg"
                        >
                          <ShieldCheck
                            className="w-3.5 h-3.5"
                            aria-hidden="true"
                          />
                          <span>Approve + Monitor</span>
                        </button>
                        {isTeacherAccountPendingApproval(member) && (
                          <button
                            type="button"
                            onClick={() =>
                              onReviewTeacherApproval(member.id, false)
                            }
                            className="min-h-[40px] inline-flex items-center justify-center gap-1 px-3 text-xs font-medium text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FAF3F1] dark:bg-[#2D1414] border border-[#E5C9C5] dark:border-[#7F3232] rounded-lg"
                          >
                            <X className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Decline</span>
                          </button>
                        )}
                      </div>
                    )}
                  {isAppOwner &&
                    !isCurrent &&
                    isTeacher &&
                    isApprovedFacultyTeacher(member) &&
                    onToggleTeacherMonitor && (
                      <button
                        type="button"
                        onClick={() =>
                          onToggleTeacherMonitor(member.id, !member.isMonitor)
                        }
                        className={`w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 text-xs font-semibold rounded-lg border ${
                          member.isMonitor
                            ? 'text-[#7C4A03] dark:text-[#FCD34D] bg-[#FEF7E8] dark:bg-[#2B2110] border-[#E5C98B] dark:border-[#78571D]'
                            : 'text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)]'
                        }`}
                      >
                        <ShieldCheck
                          className="w-3.5 h-3.5"
                          aria-hidden="true"
                        />
                        <span>
                          {member.isMonitor ? 'Remove Monitor' : 'Make Monitor'}
                        </span>
                      </button>
                    )}
                  {!isCurrent &&
                    friendRelation.status === 'none' &&
                    onSendFriendRequest && (
                      <button
                        type="button"
                        disabled={isActiveUserDisabled}
                        onClick={() => onSendFriendRequest(member.id)}
                        className="w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] disabled:opacity-50 rounded-lg transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Send Friend Request</span>
                      </button>
                    )}
                  {!isCurrent &&
                    friendRelation.status === 'outgoing_pending' &&
                    friendRelation.request &&
                    onCancelFriendRequest && (
                      <button
                        type="button"
                        onClick={() =>
                          onCancelFriendRequest(friendRelation.request!.id)
                        }
                        className="w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 text-xs font-medium text-[#7A5615] dark:text-[#FCD34D] bg-[#FBF8EC] dark:bg-[#2D2614] border border-[#E8D8A8] dark:border-[#6B5723] rounded-lg transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Request Sent · Cancel</span>
                      </button>
                    )}
                  {!isCurrent &&
                    friendRelation.status === 'incoming_pending' &&
                    friendRelation.request &&
                    onAcceptFriendRequest &&
                    onDeclineFriendRequest && (
                      <div className="w-full flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onAcceptFriendRequest(friendRelation.request!.id)
                          }
                          className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] rounded-lg"
                        >
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Accept Friend</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onDeclineFriendRequest(friendRelation.request!.id)
                          }
                          className="min-h-[40px] inline-flex items-center justify-center gap-1 px-3 text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] rounded-lg"
                        >
                          <X className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Decline</span>
                        </button>
                      </div>
                    )}
                  {!isCurrent && friendRelation.status === 'friends' && (
                    <span className="w-full min-h-[36px] inline-flex items-center justify-center gap-1.5 px-3 text-xs font-semibold text-[#1F4E2E] dark:text-[#86EFAC] bg-[#EFF7F1] dark:bg-[#13291B] border border-[#B8D7C0] dark:border-[#2F6842] rounded-lg">
                      <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Study Friends</span>
                    </span>
                  )}
                  {isViewerTeacher &&
                    !isCurrent &&
                    (isAppOwner || (!isTeacher && !member.isMonitor)) &&
                    onToggleDisableMember && (
                      <button
                        type="button"
                        onClick={() =>
                          onToggleDisableMember(member.id, !member.isDisabled)
                        }
                        className={`w-full min-h-[40px] px-3 text-xs font-semibold rounded-lg border ${
                          member.isDisabled
                            ? 'text-[#1F4E2E] dark:text-[#86EFAC] bg-[#EFF7F1] dark:bg-[#13291B] border-[#B8D7C0] dark:border-[#2F6842]'
                            : 'text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FAF3F1] dark:bg-[#2D1414] border-[#E5C9C5] dark:border-[#7F3232]'
                        }`}
                      >
                        {member.isDisabled
                          ? 'Turn Account On'
                          : 'Disable Account'}
                      </button>
                    )}
                </div>
              </article>
            );
          }
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block heritage-card border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2D9C6] dark:border-[#3D362D] bg-[#F5F0E6] dark:bg-[#221E1A] text-xs font-semibold text-[#443D34] dark:text-[#E0D8CA]">
                <th className="py-3 px-5">Member</th>
                <th className="py-3 px-4">Grade & Section</th>
                <th className="py-3 px-4">Course & Focus Subject</th>
                <th className="py-3 px-4 text-right">Questions</th>
                <th className="py-3 px-4 text-right">Ideas</th>
                <th className="py-3 px-4 text-right">Replies</th>
                <th className="py-3 px-4 text-right">Solutions</th>
                <th className="py-3 px-5 text-right">Account</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECE5D5] dark:divide-[#342E26] text-sm">
              {rows.map(
                ({
                  member,
                  isTeacher,
                  subjectName,
                  taughtSubjectNames,
                  monitoredClub,
                  questions,
                  ideas,
                  replies,
                  acceptedSolutions,
                  highestWarning,
                  warningCount,
                }) => {
                  const isCurrent = member.id === activeMemberId;
                  const friendRelation = getFriendRelation(
                    friendRequests,
                    activeMemberId,
                    member.id
                  );
                  const showWarningBadge =
                    (isViewerTeacher || isCurrent) && highestWarning !== null;
                  const warningDisplay = highestWarning
                    ? getWarningLevelDisplay(highestWarning.level)
                    : null;
                  const displayClub = isTeacher ? monitoredClub : member.club;

                  return (
                    <tr
                      key={member.id}
                      className="h-12 hover:bg-[#FAF6EE] dark:hover:bg-[#221E1A] transition-colors"
                    >
                      <td className="py-2.5 px-5">
                        <div className="flex items-center gap-3">
                          <MemberAvatar
                            name={member.name}
                            src={member.avatarUrl}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onViewAccountInfo(member.id)}
                                className="font-medium text-[#1C1917] dark:text-[#F7F3EA] hover:text-[var(--theme-accent-text)] transition-colors text-left"
                              >
                                {member.name}
                              </button>
                              {(member.isOwner || (isCurrent && isAppOwner)) && (
                                <OwnerBadge size="xs" />
                              )}
                              {isTeacher && member.isMonitor && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded border text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)]">
                                  <ShieldCheck
                                    className="w-2.5 h-2.5"
                                    aria-hidden="true"
                                  />
                                  <span>Monitor</span>
                                </span>
                              )}
                              {isTeacherAccountPendingApproval(member) && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded border text-[#7C4A03] dark:text-[#FCD34D] bg-[#FEF7E8] dark:bg-[#2B2110] border-[#E5C98B] dark:border-[#78571D]">
                                  <Clock className="w-2.5 h-2.5" aria-hidden="true" />
                                  <span>Pending Approval</span>
                                </span>
                              )}
                              {isTeacherAccountRejected(member) && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded border text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FAF3F1] dark:bg-[#2D1414] border-[#E5C9C5] dark:border-[#7F3232]">
                                  <X className="w-2.5 h-2.5" aria-hidden="true" />
                                  <span>Declined</span>
                                </span>
                              )}
                              {member.isDisabled && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded border text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FAF3F1] dark:bg-[#2D1414] border-[#E5C9C5] dark:border-[#7F3232]">
                                  <Ban className="w-2.5 h-2.5" aria-hidden="true" />
                                  <span>Disabled</span>
                                </span>
                              )}
                              {showWarningBadge &&
                                highestWarning &&
                                warningDisplay && (
                                  <span
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded border ${warningDisplay.badgeClass}`}
                                  >
                                    {renderWarningIcon(highestWarning.level)}
                                    <span>
                                      {warningDisplay.label}
                                      {warningCount > 1
                                        ? ` (${warningCount})`
                                        : ''}
                                    </span>
                                  </span>
                                )}
                            </div>
                            <div className="text-xs text-[#6B6155] dark:text-[#B8AFA0]">
                              <span className="font-mono text-[var(--theme-accent-text)]">
                                @{getMemberUsername(member.name, member.username)}
                              </span>{' '}
                              <span aria-hidden="true">·</span> {member.role}
                            </div>
                            {displayClub && (
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                {isTeacher && (
                                  <span className="text-[10px] text-[#6B6155] dark:text-[#B8AFA0]">
                                    Monitors:
                                  </span>
                                )}
                                <ClubBadge club={displayClub} size="xs" />
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-[#443D34] dark:text-[#E0D8CA] whitespace-nowrap">
                        <div className="font-medium text-[#1C1917] dark:text-[#F7F3EA]">
                          {member.gradeOrDept}
                        </div>
                        {member.section && (
                          <div className="text-xs text-[#6B6155] dark:text-[#B8AFA0]">
                            {member.section}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-[#443D34] dark:text-[#E0D8CA]">
                        {isTeacher ? (
                          <div className="max-w-[240px]">
                            <div className="font-medium text-[#1C1917] dark:text-[#F7F3EA] text-xs">
                              Teaches ({taughtSubjectNames.length}/4):{' '}
                              <span className="font-normal text-[#443D34] dark:text-[#E0D8CA]">
                                {taughtSubjectNames.join(', ')}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="font-medium text-[#1C1917] dark:text-[#F7F3EA] whitespace-nowrap">
                            {subjectName}
                          </div>
                        )}
                        {member.courseOrTrack && (
                          <div className="text-xs text-[#6B6155] dark:text-[#B8AFA0] max-w-[200px] truncate">
                            {member.courseOrTrack}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#443D34] dark:text-[#E0D8CA]">
                        {questions}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#443D34] dark:text-[#E0D8CA]">
                        {ideas}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#443D34] dark:text-[#E0D8CA]">
                        {replies}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[var(--theme-accent-text)] font-medium">
                        {acceptedSolutions}
                      </td>
                      <td className="py-2.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-3">
                          {!isCurrent &&
                            friendRelation.status === 'none' &&
                            onSendFriendRequest && (
                              <button
                                type="button"
                                disabled={isActiveUserDisabled}
                                onClick={() => onSendFriendRequest(member.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] disabled:opacity-50 rounded transition-colors"
                              >
                                <UserPlus
                                  className="w-3 h-3"
                                  aria-hidden="true"
                                />
                                <span>Add Friend</span>
                              </button>
                            )}
                          {!isCurrent &&
                            friendRelation.status === 'outgoing_pending' &&
                            friendRelation.request &&
                            onCancelFriendRequest && (
                              <button
                                type="button"
                                onClick={() =>
                                  onCancelFriendRequest(
                                    friendRelation.request!.id
                                  )
                                }
                                title="Click to cancel friend request"
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#7A5615] dark:text-[#FCD34D] bg-[#FBF8EC] dark:bg-[#2D2614] border border-[#E8D8A8] dark:border-[#6B5723] rounded hover:opacity-85 transition-colors"
                              >
                                <Clock
                                  className="w-3 h-3"
                                  aria-hidden="true"
                                />
                                <span>Requested</span>
                              </button>
                            )}
                          {!isCurrent &&
                            friendRelation.status === 'incoming_pending' &&
                            friendRelation.request &&
                            onAcceptFriendRequest &&
                            onDeclineFriendRequest && (
                              <span className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onAcceptFriendRequest(
                                      friendRelation.request!.id
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded"
                                >
                                  <Check
                                    className="w-3 h-3"
                                    aria-hidden="true"
                                  />
                                  <span>Accept</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onDeclineFriendRequest(
                                      friendRelation.request!.id
                                    )
                                  }
                                  className="px-1.5 py-1 text-xs text-[#6B6155] dark:text-[#B8AFA0] hover:text-[#7C1D1D] dark:hover:text-[#FCA5A5]"
                                  aria-label={`Decline friend request from ${member.name}`}
                                >
                                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                                </button>
                              </span>
                            )}
                          {!isCurrent && friendRelation.status === 'friends' && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F4E2E] dark:text-[#86EFAC]">
                              <UserCheck
                                className="w-3.5 h-3.5"
                                aria-hidden="true"
                              />
                              <span>Friends</span>
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => onViewAccountInfo(member.id)}
                            className="text-xs font-medium text-[var(--theme-accent-text)] hover:opacity-80 transition-colors"
                          >
                            View Info
                          </button>
                          {isCurrent ? (
                            <span className="text-xs font-medium text-[#8C7F6D] dark:text-[#B8AFA0]">
                              Active
                            </span>
                          ) : (
                            <>
                              {!canSwitchToMember(member) && (
                                <span className="text-xs font-medium text-[#7C4A03] dark:text-[#FCD34D]">
                                  Awaiting Approval
                                </span>
                              )}
                              {isAppOwner &&
                                (isTeacherAccountPendingApproval(member) ||
                                  isTeacherAccountRejected(member)) &&
                                onReviewTeacherApproval && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onReviewTeacherApproval(
                                          member.id,
                                          true,
                                          undefined,
                                          false
                                        )
                                      }
                                      className="px-2 py-1 text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded transition-colors"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onReviewTeacherApproval(
                                          member.id,
                                          true,
                                          undefined,
                                          true
                                        )
                                      }
                                      className="px-2 py-1 text-xs font-semibold text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] hover:bg-[var(--theme-accent-soft-hover)] rounded transition-colors"
                                    >
                                      Approve + Monitor
                                    </button>
                                    {isTeacherAccountPendingApproval(member) && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onReviewTeacherApproval(
                                            member.id,
                                            false
                                          )
                                        }
                                        className="text-xs font-medium text-[#7C1D1D] dark:text-[#FCA5A5] hover:opacity-80"
                                      >
                                        Decline
                                      </button>
                                    )}
                                  </span>
                                )}
                              {isAppOwner &&
                                isTeacher &&
                                isApprovedFacultyTeacher(member) &&
                                onToggleTeacherMonitor && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onToggleTeacherMonitor(
                                        member.id,
                                        !member.isMonitor
                                      )
                                    }
                                    className={`px-2 py-1 text-xs font-semibold rounded border transition-colors ${
                                      member.isMonitor
                                        ? 'text-[#7C4A03] dark:text-[#FCD34D] bg-[#FEF7E8] dark:bg-[#2B2110] border-[#E5C98B] dark:border-[#78571D] hover:opacity-85'
                                        : 'text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)] hover:bg-[var(--theme-accent-soft-hover)]'
                                    }`}
                                  >
                                    {member.isMonitor
                                      ? 'Remove Monitor'
                                      : 'Make Monitor'}
                                  </button>
                                )}
                              {isViewerTeacher &&
                                (isAppOwner || (!isTeacher && !member.isMonitor)) &&
                                onToggleDisableMember && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onToggleDisableMember(
                                        member.id,
                                        !member.isDisabled
                                      )
                                    }
                                    className={`text-xs font-semibold transition-colors ${
                                      member.isDisabled
                                        ? 'text-[#1F4E2E] dark:text-[#86EFAC] hover:opacity-80'
                                        : 'text-[#7C1D1D] dark:text-[#FCA5A5] hover:opacity-80'
                                    }`}
                                  >
                                    {member.isDisabled ? 'Turn On' : 'Disable'}
                                  </button>
                                )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
