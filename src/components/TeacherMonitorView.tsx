import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Ban,
  Calendar,
  CalendarPlus,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  Flag,
  MapPin,
  MessageSquare,
  Plus,
  Power,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import {
  GRADE_LEVEL_OPTIONS,
  SCHOOL_CLUBS,
  SUBJECTS,
} from '../data/seedData';
import {
  AccountWarning,
  ContentReport,
  DiscussionPost,
  GradeLevel,
  PostKind,
  RegisteredAccount,
  ReportStatus,
  ReportTargetType,
  SchoolEvent,
  SchoolEventCategory,
  SchoolMember,
  SubjectId,
  TeacherApprovalStatus,
  UserRole,
  WarningLevel,
} from '../types/school';
import {
  formatRelativeTime,
  formatStampTime,
  getActiveWarningsForMember,
  getEventCategoryDisplay,
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

export type MonitorSectionTab =
  | 'reports'
  | 'approvals'
  | 'activity'
  | 'accounts'
  | 'events';

interface TeacherMonitorViewProps {
  activeMember: SchoolMember;
  isAppOwner?: boolean;
  members: SchoolMember[];
  accounts?: RegisteredAccount[];
  posts: DiscussionPost[];
  reports: ContentReport[];
  warnings: AccountWarning[];
  events: SchoolEvent[];
  requestedTab?: { tab: MonitorSectionTab; nonce: number } | null;
  onOpenThread: (postId: string) => void;
  onOpenAccountInfo: (memberId: string) => void;
  onDeletePost: (postId: string) => void;
  onDeleteReply: (postId: string, replyId: string) => void;
  onIssueWarning: (payload: {
    targetMemberId: string;
    level: WarningLevel;
    reason: string;
    relatedContentPreview?: string;
  }) => void;
  onClearWarning: (warningId: string) => void;
  onToggleDisableMember: (
    memberId: string,
    disable: boolean,
    reason?: string
  ) => void;
  onReviewTeacherApproval: (
    memberId: string,
    approve: boolean,
    note?: string,
    grantMonitor?: boolean
  ) => void;
  onToggleTeacherMonitor?: (memberId: string, makeMonitor: boolean) => void;
  onUpdateReportStatus: (
    reportId: string,
    status: ReportStatus,
    resolutionNote?: string
  ) => void;
  onAddEvent: (payload: {
    title: string;
    description: string;
    category: SchoolEventCategory;
    subjectId: SubjectId | 'all';
    gradeLevel: GradeLevel | 'All Grades';
    startsAt: number;
    location: string;
    clubName?: string;
  }) => void;
  onDeleteEvent: (eventId: string) => void;
  onOpenEventsPage: () => void;
}

type MonitorTab = MonitorSectionTab;
type ReportFilter = 'pending' | 'resolved' | 'all';
type ActivityFilter = 'all' | 'posts' | 'messages' | 'reported';

interface WarningDraftTarget {
  memberId: string;
  memberName: string;
  contentPreview?: string;
  reportId?: string;
}

function toDefaultEventInput(): string {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  tomorrow.setHours(15, 0, 0, 0);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  const hours = String(tomorrow.getHours()).padStart(2, '0');
  const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function TeacherMonitorView({
  activeMember,
  isAppOwner = false,
  members,
  accounts = [],
  posts,
  reports,
  warnings,
  events,
  requestedTab,
  onOpenThread,
  onOpenAccountInfo,
  onDeletePost,
  onDeleteReply,
  onIssueWarning,
  onClearWarning,
  onToggleDisableMember,
  onReviewTeacherApproval,
  onToggleTeacherMonitor,
  onUpdateReportStatus,
  onAddEvent,
  onDeleteEvent,
  onOpenEventsPage,
}: TeacherMonitorViewProps) {
  const [activeTab, setActiveTab] = useState<MonitorTab>(() => {
    if (requestedTab?.tab === 'approvals' && !isAppOwner) return 'reports';
    return requestedTab?.tab || 'reports';
  });
  const [reportFilter, setReportFilter] = useState<ReportFilter>('pending');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [activitySearch, setActivitySearch] = useState('');
  const [accountSearch, setAccountSearch] = useState('');

  useEffect(() => {
    if (requestedTab) {
      setActiveTab(
        requestedTab.tab === 'approvals' && !isAppOwner
          ? 'reports'
          : requestedTab.tab
      );
    }
  }, [requestedTab, isAppOwner]);

  useEffect(() => {
    if (!isAppOwner && activeTab === 'approvals') {
      setActiveTab('reports');
    }
  }, [isAppOwner, activeTab]);

  const [eventTitle, setEventTitle] = useState('');
  const [eventCategory, setEventCategory] = useState<SchoolEventCategory>(
    SchoolEventCategory.WORKSHOP
  );
  const [eventSubjectId, setEventSubjectId] = useState<SubjectId | 'all'>(
    'all'
  );
  const [eventGradeLevel, setEventGradeLevel] = useState<
    GradeLevel | 'All Grades'
  >('All Grades');
  const [eventClubName, setEventClubName] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventStartsAt, setEventStartsAt] = useState<string>(() =>
    toDefaultEventInput()
  );
  const [eventDescription, setEventDescription] = useState('');
  const [eventNotice, setEventNotice] = useState<string | null>(null);

  const [warningDraft, setWarningDraft] = useState<WarningDraftTarget | null>(
    null
  );
  const [warningLevel, setWarningLevel] = useState<WarningLevel>(
    WarningLevel.LOW
  );
  const [warningReason, setWarningReason] = useState('');

  const [disableDraftMember, setDisableDraftMember] =
    useState<SchoolMember | null>(null);
  const [disableReason, setDisableReason] = useState('');

  const [declineTeacherDraft, setDeclineTeacherDraft] =
    useState<SchoolMember | null>(null);
  const [declineTeacherNote, setDeclineTeacherNote] = useState('');
  const [approvalNotice, setApprovalNotice] = useState<string | null>(null);

  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);

  const pendingReportsCount = useMemo(
    () => reports.filter((r) => r.status === ReportStatus.PENDING).length,
    [reports]
  );

  const pendingTeacherMembers = useMemo(
    () => members.filter((m) => isTeacherAccountPendingApproval(m)),
    [members]
  );

  const approvedTeacherMembers = useMemo(
    () => members.filter((m) => isApprovedFacultyTeacher(m)),
    [members]
  );

  const activeMonitorsCount = useMemo(
    () => approvedTeacherMembers.filter((m) => Boolean(m.isMonitor)).length,
    [approvedTeacherMembers]
  );

  const rejectedTeacherMembers = useMemo(
    () => members.filter((m) => isTeacherAccountRejected(m)),
    [members]
  );

  const totalMessagesCount = useMemo(
    () => posts.reduce((acc, p) => acc + p.replies.length, 0),
    [posts]
  );

  const activeWarningsCount = useMemo(
    () => warnings.filter((w) => !w.clearedAt).length,
    [warnings]
  );

  const disabledAccountsCount = useMemo(
    () => members.filter((m) => m.isDisabled).length,
    [members]
  );

  const filteredReports = useMemo(() => {
    const list = reports.filter((r) => {
      if (reportFilter === 'pending') return r.status === ReportStatus.PENDING;
      if (reportFilter === 'resolved') return r.status !== ReportStatus.PENDING;
      return true;
    });
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }, [reports, reportFilter]);

  const activityItems = useMemo(() => {
    type ActivityItem =
      | {
          kind: 'post';
          key: string;
          createdAt: number;
          post: DiscussionPost;
          author?: SchoolMember;
          subjectName: string;
          previewText: string;
          pendingReports: number;
        }
      | {
          kind: 'message';
          key: string;
          createdAt: number;
          post: DiscussionPost;
          replyId: string;
          replyBody: string;
          replyFormula?: string;
          author?: SchoolMember;
          subjectName: string;
          pendingReports: number;
        };

    const items: ActivityItem[] = [];
    const pendingPostReportCounts = new Map<string, number>();
    const pendingReplyReportCounts = new Map<string, number>();

    for (const r of reports) {
      if (r.status !== ReportStatus.PENDING) continue;
      if (r.targetType === ReportTargetType.POST) {
        pendingPostReportCounts.set(
          r.postId,
          (pendingPostReportCounts.get(r.postId) || 0) + 1
        );
      } else if (r.replyId) {
        pendingReplyReportCounts.set(
          r.replyId,
          (pendingReplyReportCounts.get(r.replyId) || 0) + 1
        );
      }
    }

    for (const post of posts) {
      const subjectName =
        SUBJECTS.find((s) => s.id === post.subjectId)?.name ?? 'General';
      items.push({
        kind: 'post',
        key: `post:${post.id}`,
        createdAt: post.createdAt,
        post,
        author: members.find((m) => m.id === post.authorId),
        subjectName,
        previewText: `${post.title} — ${post.body}`,
        pendingReports: pendingPostReportCounts.get(post.id) || 0,
      });

      for (const reply of post.replies) {
        items.push({
          kind: 'message',
          key: `reply:${reply.id}`,
          createdAt: reply.createdAt,
          post,
          replyId: reply.id,
          replyBody: reply.body,
          replyFormula: reply.formulaNote,
          author: members.find((m) => m.id === reply.authorId),
          subjectName,
          pendingReports: pendingReplyReportCounts.get(reply.id) || 0,
        });
      }
    }

    const q = activitySearch.trim().toLowerCase();
    return items
      .filter((item) => {
        if (activityFilter === 'posts' && item.kind !== 'post') return false;
        if (activityFilter === 'messages' && item.kind !== 'message') {
          return false;
        }
        if (activityFilter === 'reported' && item.pendingReports === 0) {
          return false;
        }
        if (!q) return true;
        const text =
          item.kind === 'post'
            ? `${item.post.title} ${item.post.body} ${item.author?.name || ''} ${item.subjectName}`
            : `${item.replyBody} ${item.post.title} ${item.author?.name || ''} ${item.subjectName}`;
        return text.toLowerCase().includes(q);
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [posts, members, reports, activityFilter, activitySearch]);

  const filteredAccounts = useMemo(() => {
    const q = accountSearch.trim().toLowerCase();
    return members.filter((m) => {
      if (!q) return true;
      const username = getMemberUsername(m.name, m.username);
      return (
        m.name.toLowerCase().includes(q) ||
        username.includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.gradeOrDept.toLowerCase().includes(q)
      );
    });
  }, [members, accountSearch]);

  const openWarningModal = (target: WarningDraftTarget) => {
    setWarningDraft(target);
    setWarningLevel(WarningLevel.LOW);
    setWarningReason('');
  };

  const handleConfirmWarning = (e: React.FormEvent) => {
    e.preventDefault();
    if (!warningDraft) return;
    const cleanedReason =
      warningReason.trim() ||
      getWarningLevelDisplay(warningLevel).description;
    onIssueWarning({
      targetMemberId: warningDraft.memberId,
      level: warningLevel,
      reason: cleanedReason,
      relatedContentPreview: warningDraft.contentPreview,
    });
    if (warningDraft.reportId) {
      onUpdateReportStatus(
        warningDraft.reportId,
        ReportStatus.RESOLVED,
        `${getWarningLevelDisplay(warningLevel).label} issued to ${warningDraft.memberName}`
      );
    }
    setWarningDraft(null);
    setWarningReason('');
  };

  const handleConfirmDisable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disableDraftMember) return;
    onToggleDisableMember(
      disableDraftMember.id,
      true,
      disableReason.trim() ||
        'Account disabled by monitoring teacher pending conduct review.'
    );
    setDisableDraftMember(null);
    setDisableReason('');
  };

  const canToggleDisableTarget = (target?: SchoolMember | null): boolean => {
    if (!target || target.id === activeMember.id) return false;
    if (isAppOwner) return true;
    return target.role !== UserRole.TEACHER && !target.isMonitor;
  };

  if (!isAppOwner && !(isApprovedFacultyTeacher(activeMember) && activeMember.isMonitor)) {
    return (
      <div className="heritage-card border rounded-lg p-8 text-center space-y-2">
        <ShieldAlert
          className="w-7 h-7 text-[var(--theme-accent-text)] mx-auto"
          aria-hidden="true"
        />
        <h1 className="font-display text-2xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
          Teacher Monitor Access Required
        </h1>
        <p className="text-sm text-[#574F45] dark:text-[#CEC5B6] max-w-md mx-auto">
          Only the App Owner (vincentcasintahancarl@gmail.com) and Owner-appointed Teacher Monitors can review reports, issue warnings, or moderate classroom posts and accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="heritage-eyebrow mb-1">
            {isAppOwner
              ? 'App Owner Control & Moderation Console'
              : 'Appointed Teacher Monitor Console'}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#1C1917] dark:text-[#F7F3EA] text-balance">
            Teacher Sharing & Message Monitor
          </h1>
          <p className="mt-1 text-sm text-[#574F45] dark:text-[#CEC5B6]">
            {isAppOwner
              ? 'Approve new Teacher accounts, assign or remove Teacher Monitor permissions, review reports, issue warnings, and manage accounts.'
              : 'Review student reports, monitor shared study posts and messages, issue Low / Mid / Critical warnings, remove inappropriate content, and disable or re-enable student accounts.'}
          </p>
          {(() => {
            const taughtSubjects = getTeacherTaughtSubjects(activeMember);
            const monitoredClub = getTeacherMonitoredClub(activeMember);
            const clubMembersCount = monitoredClub
              ? members.filter(
                  (m) =>
                    m.id !== activeMember.id &&
                    (m.club || '').trim().toLowerCase() ===
                      monitoredClub.trim().toLowerCase()
                ).length
              : 0;
            return (
              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                {isAppOwner ? (
                  <>
                    <OwnerBadge size="sm" />
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] text-[var(--theme-accent-text)] font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>vincentcasintahancarl@gmail.com</span>
                    </span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] text-[var(--theme-accent-text)] font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Owner-Appointed Monitor</span>
                  </span>
                )}
                {activeMember.role === UserRole.TEACHER && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D] text-[#443D34] dark:text-[#E0D8CA]">
                    <span className="font-medium">
                      Teaching {taughtSubjects.length}/4 subjects:
                    </span>
                    <span className="text-[#6B6155] dark:text-[#B8AFA0]">
                      {taughtSubjects
                        .map((id) => SUBJECTS.find((s) => s.id === id)?.name)
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </span>
                )}
                {activeMember.role === UserRole.TEACHER && monitoredClub && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D] text-[#443D34] dark:text-[#E0D8CA]">
                    <span className="font-medium">Monitoring Club:</span>
                    <ClubBadge club={monitoredClub} size="xs" />
                    <span className="font-mono text-[11px] text-[#6B6155] dark:text-[#B8AFA0]">
                      ({clubMembersCount} {clubMembersCount === 1 ? 'member' : 'members'})
                    </span>
                  </span>
                )}
              </div>
            );
          })()}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-[#6B6155] dark:text-[#B8AFA0]">
            Monitoring as{' '}
            <span className="font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
              {activeMember.name}
            </span>
          </span>
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md transition-colors whitespace-nowrap"
          >
            <CalendarPlus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add School Event</span>
          </button>
        </div>
      </div>

      {/* Summary Ledger Strip */}
      <div
        className={`grid grid-cols-2 sm:grid-cols-3 ${
          isAppOwner ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
        } gap-3`}
      >
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`text-left p-4 rounded-lg border transition-colors ${
            activeTab === 'reports'
              ? 'bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)]'
              : 'heritage-card hover:bg-[#FAF6EE] dark:hover:bg-[#221E1A]'
          }`}
        >
          <div className="flex items-center justify-between gap-2 text-xs text-[#6B6155] dark:text-[#B8AFA0]">
            <span>Pending Reports</span>
            <Flag
              className="w-3.5 h-3.5 text-[var(--theme-accent-text)]"
              aria-hidden="true"
            />
          </div>
          <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#1C1917] dark:text-[#F7F3EA]">
            {pendingReportsCount}
          </div>
        </button>

        {isAppOwner && (
          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={`text-left p-4 rounded-lg border transition-colors ${
              activeTab === 'approvals'
                ? 'bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)]'
                : 'heritage-card hover:bg-[#FAF6EE] dark:hover:bg-[#221E1A]'
            }`}
          >
            <div className="flex items-center justify-between gap-2 text-xs text-[#6B6155] dark:text-[#B8AFA0]">
              <span>Teachers & Monitors</span>
              <UserCheck
                className="w-3.5 h-3.5 text-[var(--theme-accent-text)]"
                aria-hidden="true"
              />
            </div>
            <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#1C1917] dark:text-[#F7F3EA]">
              {pendingTeacherMembers.length}
              <span className="ml-1.5 text-xs font-sans font-normal text-[#6B6155] dark:text-[#B8AFA0]">
                pending · {activeMonitorsCount} monitors
              </span>
            </div>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`text-left p-4 rounded-lg border transition-colors ${
            activeTab === 'activity'
              ? 'bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)]'
              : 'heritage-card hover:bg-[#FAF6EE] dark:hover:bg-[#221E1A]'
          }`}
        >
          <div className="flex items-center justify-between gap-2 text-xs text-[#6B6155] dark:text-[#B8AFA0]">
            <span>Sharing & Messages</span>
            <MessageSquare
              className="w-3.5 h-3.5 text-[var(--theme-accent-text)]"
              aria-hidden="true"
            />
          </div>
          <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#1C1917] dark:text-[#F7F3EA]">
            {posts.length + totalMessagesCount}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('accounts')}
          className={`text-left p-4 rounded-lg border transition-colors ${
            activeTab === 'accounts'
              ? 'bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)]'
              : 'heritage-card hover:bg-[#FAF6EE] dark:hover:bg-[#221E1A]'
          }`}
        >
          <div className="flex items-center justify-between gap-2 text-xs text-[#6B6155] dark:text-[#B8AFA0]">
            <span>Active Warnings</span>
            <AlertTriangle
              className="w-3.5 h-3.5 text-[#8C6D3B] dark:text-[#D4B475]"
              aria-hidden="true"
            />
          </div>
          <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#1C1917] dark:text-[#F7F3EA]">
            {activeWarningsCount}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('accounts')}
          className={`${
            isAppOwner ? 'col-span-2 sm:col-span-1' : ''
          } text-left p-4 rounded-lg border heritage-card hover:bg-[#FAF6EE] dark:hover:bg-[#221E1A] transition-colors`}
        >
          <div className="flex items-center justify-between gap-2 text-xs text-[#6B6155] dark:text-[#B8AFA0]">
            <span>Disabled Accounts</span>
            <Ban
              className="w-3.5 h-3.5 text-[#7C1D1D] dark:text-[#FCA5A5]"
              aria-hidden="true"
            />
          </div>
          <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#1C1917] dark:text-[#F7F3EA]">
            {disabledAccountsCount}
          </div>
        </button>
      </div>

      {/* Primary Section Tabs */}
      <div
        role="tablist"
        aria-label="Teacher monitor sections"
        className={`grid grid-cols-2 sm:grid-cols-3 ${
          isAppOwner ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
        } gap-1.5 p-1.5 bg-[#EFE8D9] dark:bg-[#24201B] border border-[#E2D9C6] dark:border-[#3D362D] rounded-xl sm:rounded-lg`}
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'reports'}
          onClick={() => setActiveTab('reports')}
          className={`inline-flex items-center justify-center gap-1.5 px-3 min-h-[40px] sm:min-h-[36px] text-xs font-medium rounded-lg sm:rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'reports'
              ? 'bg-[#FFFDF8] dark:bg-[#161412] text-[var(--theme-accent-text)] shadow-xs border border-[#E2D9C6] dark:border-[#3D362D]'
              : 'text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]'
          }`}
        >
          <Flag className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            Reports ({pendingReportsCount})
          </span>
        </button>

        {isAppOwner && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'approvals'}
            onClick={() => setActiveTab('approvals')}
            className={`inline-flex items-center justify-center gap-1.5 px-3 min-h-[40px] sm:min-h-[36px] text-xs font-medium rounded-lg sm:rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'approvals'
                ? 'bg-[#FFFDF8] dark:bg-[#161412] text-[var(--theme-accent-text)] shadow-xs border border-[#E2D9C6] dark:border-[#3D362D]'
                : 'text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              Teachers & Monitors ({pendingTeacherMembers.length})
            </span>
          </button>
        )}

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'activity'}
          onClick={() => setActiveTab('activity')}
          className={`inline-flex items-center justify-center gap-1.5 px-3 min-h-[40px] sm:min-h-[36px] text-xs font-medium rounded-lg sm:rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'activity'
              ? 'bg-[#FFFDF8] dark:bg-[#161412] text-[var(--theme-accent-text)] shadow-xs border border-[#E2D9C6] dark:border-[#3D362D]'
              : 'text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]'
          }`}
        >
          <Eye className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">Sharing & Messages</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'accounts'}
          onClick={() => setActiveTab('accounts')}
          className={`inline-flex items-center justify-center gap-1.5 px-3 min-h-[40px] sm:min-h-[36px] text-xs font-medium rounded-lg sm:rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'accounts'
              ? 'bg-[#FFFDF8] dark:bg-[#161412] text-[var(--theme-accent-text)] shadow-xs border border-[#E2D9C6] dark:border-[#3D362D]'
              : 'text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]'
          }`}
        >
          <Users className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">Accounts & Warnings</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'events'}
          onClick={() => setActiveTab('events')}
          className={`${
            isAppOwner ? 'col-span-2 sm:col-span-1' : ''
          } inline-flex items-center justify-center gap-1.5 px-3 min-h-[40px] sm:min-h-[36px] text-xs font-medium rounded-lg sm:rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'events'
              ? 'bg-[#FFFDF8] dark:bg-[#161412] text-[var(--theme-accent-text)] shadow-xs border border-[#E2D9C6] dark:border-[#3D362D]'
              : 'text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">School Events ({events.length})</span>
        </button>
      </div>

      {/* TAB 1: REPORTS QUEUE */}
      {activeTab === 'reports' && (
        <section className="space-y-4">
          <div className="heritage-card border rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 bg-[#F5F0E6] dark:bg-[#221E1A] rounded-md">
              {[
                { id: 'pending' as const, label: 'Pending Review' },
                { id: 'resolved' as const, label: 'Resolved / Dismissed' },
                { id: 'all' as const, label: 'All Reports' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setReportFilter(item.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    reportFilter === item.id
                      ? 'bg-[#FFFDF8] dark:bg-[#161412] text-[var(--theme-accent-text)] shadow-xs border border-[#E2D9C6] dark:border-[#3D362D]'
                      : 'text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <span className="text-xs font-mono tabular-nums text-[#6B6155] dark:text-[#B8AFA0]">
              {filteredReports.length}{' '}
              {filteredReports.length === 1 ? 'report' : 'reports'}
            </span>
          </div>

          {filteredReports.length === 0 ? (
            <div className="heritage-card border rounded-lg p-10 text-center space-y-2">
              <ShieldCheck
                className="w-7 h-7 text-[var(--theme-accent-text)] mx-auto"
                aria-hidden="true"
              />
              <h2 className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                {reportFilter === 'pending'
                  ? 'No pending reports to review'
                  : 'No reports in this view'}
              </h2>
              <p className="text-sm text-[#574F45] dark:text-[#CEC5B6] max-w-md mx-auto">
                When students or faculty use the Report button on a shared post, reply, or inbox message, notifications appear here immediately.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => {
                const author = members.find(
                  (m) => m.id === report.targetAuthorId
                );
                const reporter = members.find(
                  (m) => m.id === report.reporterId
                );
                const targetPost = posts.find((p) => p.id === report.postId);
                const targetReplyExists =
                  report.targetType === ReportTargetType.REPLY &&
                  Boolean(
                    targetPost?.replies.some((r) => r.id === report.replyId)
                  );
                const contentExists =
                  report.targetType === ReportTargetType.POST
                    ? Boolean(targetPost)
                    : targetReplyExists;
                const authorWarnings = author
                  ? getActiveWarningsForMember(warnings, author.id)
                  : [];
                const topWarning = authorWarnings[0];
                const deleteKey = `report-del-${report.id}`;

                return (
                  <article
                    key={report.id}
                    className="heritage-card border rounded-lg p-4 sm:p-5 space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6155] dark:text-[#B8AFA0]">
                          <span className="inline-flex items-center gap-1 font-semibold text-[#7C1D1D] dark:text-[#FCA5A5]">
                            <Flag className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>
                              {report.targetType === ReportTargetType.POST
                                ? 'Reported Shared Post'
                                : 'Reported Message / Reply'}
                            </span>
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            Reported by {reporter?.name ?? 'Class Member'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{formatStampTime(report.createdAt)}</span>
                        </div>
                        <h3 className="font-display text-lg font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                          {report.reason}
                        </h3>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border whitespace-nowrap shrink-0 ${
                          report.status === ReportStatus.PENDING
                            ? 'bg-[#FAF3F1] dark:bg-[#3A1616] text-[#7C1D1D] dark:text-[#FCA5A5] border-[#E5C9C5] dark:border-[#8C3737]'
                            : 'bg-[#F5F0E6] dark:bg-[#221E1A] text-[#574F45] dark:text-[#CEC5B6] border-[#DDD4C0] dark:border-[#4A4137]'
                        }`}
                      >
                        {report.status === ReportStatus.PENDING ? (
                          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        <span>
                          {report.status === ReportStatus.PENDING
                            ? 'Needs Teacher Review'
                            : report.status === ReportStatus.RESOLVED
                              ? 'Resolved'
                              : 'Dismissed'}
                        </span>
                      </span>
                    </div>

                    {/* Content & Author Snapshot */}
                    <div className="p-3.5 bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D] rounded-md space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <MemberAvatar
                            name={author?.name ?? 'Class Member'}
                            src={author?.avatarUrl}
                            size="xs"
                          />
                          <span className="font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                            {author?.name ?? 'Unknown Member'}
                          </span>
                          {author?.isOwner && <OwnerBadge size="xs" />}
                          <span className="text-[#6B6155] dark:text-[#B8AFA0]">
                            ({author?.role ?? 'Student'})
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {author?.isDisabled && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded border bg-[#FAF3F1] dark:bg-[#3A1616] text-[#7C1D1D] dark:text-[#FCA5A5] border-[#E5C9C5] dark:border-[#8C3737]">
                              <Ban className="w-3 h-3" aria-hidden="true" />
                              <span>Account Disabled</span>
                            </span>
                          )}
                          {topWarning && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded border ${
                                getWarningLevelDisplay(topWarning.level).badgeClass
                              }`}
                            >
                              <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                              <span>
                                {getWarningLevelDisplay(topWarning.level).label}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-[#2E2924] dark:text-[#EAE3D5] leading-relaxed">
                        “{report.contentSnapshot}”
                      </p>

                      {report.details && (
                        <p className="text-xs text-[#574F45] dark:text-[#CEC5B6] pt-1 border-t border-[#E2D9C6] dark:border-[#3D362D]">
                          <strong className="font-medium text-[#1C1917] dark:text-[#F7F3EA]">
                            Reporter note:
                          </strong>{' '}
                          {report.details}
                        </p>
                      )}

                      {!contentExists && (
                        <p className="text-xs font-medium text-[#6B6155] dark:text-[#B8AFA0]">
                          Original {report.targetType === ReportTargetType.POST ? 'post' : 'message'} has already been deleted.
                        </p>
                      )}

                      {report.resolutionNote && (
                        <p className="text-xs font-medium text-[var(--theme-accent-text)]">
                          Action logged: {report.resolutionNote}
                        </p>
                      )}
                    </div>

                    {/* Teacher Action Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#ECE5D5] dark:border-[#342E26]">
                      <div className="flex flex-wrap items-center gap-2">
                        {targetPost && (
                          <button
                            type="button"
                            onClick={() => onOpenThread(targetPost.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] rounded-md transition-colors whitespace-nowrap"
                          >
                            <span>View Thread</span>
                            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        )}

                        {author && (
                          <button
                            type="button"
                            onClick={() =>
                              openWarningModal({
                                memberId: author.id,
                                memberName: author.name,
                                contentPreview: report.contentSnapshot,
                                reportId: report.id,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#7A5615] dark:text-[#FCD34D] bg-[#FBF8EC] dark:bg-[#2D2614] border border-[#E8D8A8] dark:border-[#6B5723] hover:opacity-90 rounded-md transition-colors whitespace-nowrap"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Put Warning</span>
                          </button>
                        )}

                        {canToggleDisableTarget(author) && author && (
                          <button
                            type="button"
                            onClick={() => {
                              if (author.isDisabled) {
                                onToggleDisableMember(author.id, false);
                                if (report.status === ReportStatus.PENDING) {
                                  onUpdateReportStatus(
                                    report.id,
                                    ReportStatus.RESOLVED,
                                    `Account re-enabled for ${author.name}`
                                  );
                                }
                              } else {
                                setDisableDraftMember(author);
                                setDisableReason(
                                  `Disabled following report: ${report.reason}`
                                );
                              }
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                              author.isDisabled
                                ? 'text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)]'
                                : 'text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FAF3F1] dark:bg-[#3A1616] border-[#E5C9C5] dark:border-[#8C3737]'
                            }`}
                          >
                            {author.isDisabled ? (
                              <>
                                <Power className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Turn Account On</span>
                              </>
                            ) : (
                              <>
                                <Ban className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Disable Account</span>
                              </>
                            )}
                          </button>
                        )}

                        {contentExists &&
                          (confirmDeleteKey === deleteKey ? (
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#FAF3F1] dark:bg-[#3A1616] border border-[#E5C9C5] dark:border-[#8C3737] text-xs">
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    report.targetType === ReportTargetType.POST
                                  ) {
                                    onDeletePost(report.postId);
                                  } else if (report.replyId) {
                                    onDeleteReply(report.postId, report.replyId);
                                  }
                                  setConfirmDeleteKey(null);
                                }}
                                className="font-semibold text-[#7C1D1D] dark:text-[#FCA5A5] hover:underline"
                              >
                                Confirm Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteKey(null)}
                                className="text-[#574F45] dark:text-[#CEC5B6]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteKey(deleteKey)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#FFFDF8] bg-[#7C1D1D] hover:bg-[#631616] rounded-md transition-colors whitespace-nowrap"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>
                                Delete{' '}
                                {report.targetType === ReportTargetType.POST
                                  ? 'Post'
                                  : 'Message'}
                              </span>
                            </button>
                          ))}
                      </div>

                      {report.status === ReportStatus.PENDING && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateReportStatus(
                              report.id,
                              ReportStatus.DISMISSED,
                              'Reviewed by teacher — no further action needed'
                            )
                          }
                          className="text-xs font-medium text-[#6B6155] dark:text-[#B8AFA0] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]"
                        >
                          Dismiss Report
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: OWNER TEACHER APPROVALS & MONITOR CONTROL */}
      {activeTab === 'approvals' && isAppOwner && (
        <section className="space-y-6">
          {approvalNotice && (
            <div
              role="status"
              className="px-4 py-3 rounded-lg border border-[#B8D7C0] dark:border-[#2F6842] bg-[#EFF7F1] dark:bg-[#13291B] text-xs font-medium text-[#1F4E2E] dark:text-[#86EFAC] flex items-center justify-between gap-3"
            >
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{approvalNotice}</span>
              </span>
              <button
                type="button"
                onClick={() => setApprovalNotice(null)}
                className="text-xs underline shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Owner Monitor Assignment Control */}
          <div className="heritage-card border border-[var(--theme-accent-border)] rounded-lg p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#ECE5D5] dark:border-[#342E26]">
              <div>
                <p className="heritage-eyebrow mb-0.5">
                  Owner Control · vincentcasintahancarl@gmail.com
                </p>
                <h2 className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                  Teacher Monitor Permissions
                </h2>
                <p className="text-xs text-[#574F45] dark:text-[#CEC5B6] mt-0.5">
                  Choose which approved Teachers are granted Monitor access to review reports, issue warnings, delete flagged posts, and disable student accounts.
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-[var(--theme-accent-text)] font-semibold">
                {activeMonitorsCount} active{' '}
                {activeMonitorsCount === 1 ? 'monitor' : 'monitors'}
              </span>
            </div>

            {approvedTeacherMembers.length === 0 ? (
              <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0]">
                No approved Teacher accounts yet. Approve a pending teacher below first, then decide whether to grant Monitor access.
              </p>
            ) : (
              <div className="space-y-2.5">
                {approvedTeacherMembers.map((teacher) => {
                  const teacherSubjects = getTeacherTaughtSubjects(teacher);
                  const teacherClub = getTeacherMonitoredClub(teacher);
                  const isMonitor = Boolean(teacher.isMonitor);
                  return (
                    <div
                      key={teacher.id}
                      className="p-3.5 rounded-lg bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D] flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <MemberAvatar
                          name={teacher.name}
                          src={teacher.avatarUrl}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onOpenAccountInfo(teacher.id)}
                              className="text-sm font-semibold text-[#1C1917] dark:text-[#F7F3EA] hover:text-[var(--theme-accent-text)] truncate"
                            >
                              {teacher.name}
                            </button>
                            {(teacher.isOwner ||
                              (isAppOwner && teacher.id === activeMember.id)) && (
                              <OwnerBadge size="xs" />
                            )}
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded border ${
                                isMonitor
                                  ? 'bg-[var(--theme-accent-soft)] text-[var(--theme-accent-text)] border-[var(--theme-accent-border)]'
                                  : 'bg-[#FFFDF8] dark:bg-[#161412] text-[#574F45] dark:text-[#CEC5B6] border-[#D8CEBA] dark:border-[#4A4137]'
                              }`}
                            >
                              <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                              <span>
                                {isMonitor ? 'Teacher Monitor' : 'Standard Teacher'}
                              </span>
                            </span>
                          </div>
                          <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] mt-0.5 truncate">
                            @{getMemberUsername(teacher.name, teacher.username)} ·{' '}
                            {teacher.gradeOrDept}
                            {teacherSubjects.length > 0
                              ? ` · ${teacherSubjects.length} subjects`
                              : ''}
                            {teacherClub ? ` · Monitors ${teacherClub}` : ''}
                          </p>
                        </div>
                      </div>

                      {onToggleTeacherMonitor && (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleTeacherMonitor(teacher.id, !isMonitor);
                            setApprovalNotice(
                              !isMonitor
                                ? `${teacher.name} is now a Teacher Monitor.`
                                : `Removed Monitor access from ${teacher.name} (still an approved Teacher).`
                            );
                          }}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                            isMonitor
                              ? 'text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FAF3F1] dark:bg-[#3A1616] border-[#E5C9C5] dark:border-[#8C3737] hover:opacity-90'
                              : 'text-[#FFFDF8] bg-[var(--theme-accent)] border-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)]'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{isMonitor ? 'Remove Monitor' : 'Make Monitor'}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="heritage-card border rounded-lg p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                New Teacher Account Approval Queue
              </h2>
              <p className="text-xs text-[#574F45] dark:text-[#CEC5B6] mt-0.5">
                All newly created Teacher accounts require App Owner approval before they can enter the classroom. You can approve them as a Standard Teacher or grant Monitor access right away.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-[#6B6155] dark:text-[#B8AFA0]">
              {pendingTeacherMembers.length} pending
            </span>
          </div>

          {pendingTeacherMembers.length === 0 ? (
            <div className="heritage-card border rounded-lg p-10 text-center space-y-2">
              <ShieldCheck
                className="w-7 h-7 text-[var(--theme-accent-text)] mx-auto"
                aria-hidden="true"
              />
              <h3 className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                No pending teacher applications
              </h3>
              <p className="text-sm text-[#574F45] dark:text-[#CEC5B6] max-w-md mx-auto">
                When someone registers a new Teacher account, their request appears here for your Owner review and Monitor assignment.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTeacherMembers.map((candidate) => {
                const linkedAcct = accounts.find(
                  (a) => a.memberId === candidate.id
                );
                const candidateSubjects = getTeacherTaughtSubjects(candidate);
                const candidateClub = getTeacherMonitoredClub(candidate);

                return (
                  <article
                    key={candidate.id}
                    className="heritage-card border rounded-lg p-4 sm:p-5 space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <MemberAvatar
                          name={candidate.name}
                          src={candidate.avatarUrl}
                          size="md"
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onOpenAccountInfo(candidate.id)}
                              className="font-display text-lg font-semibold text-[#1C1917] dark:text-[#F7F3EA] hover:text-[var(--theme-accent-text)] transition-colors"
                            >
                              {candidate.name}
                            </button>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded border text-[#7C4A03] dark:text-[#FCD34D] bg-[#FEF7E8] dark:bg-[#2B2110] border-[#E5C98B] dark:border-[#78571D]">
                              <Clock className="w-3 h-3" aria-hidden="true" />
                              <span>Pending Owner Approval</span>
                            </span>
                          </div>
                          <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] mt-0.5">
                            <span className="font-mono text-[var(--theme-accent-text)]">
                              @{getMemberUsername(candidate.name, candidate.username)}
                            </span>
                            {linkedAcct?.email && (
                              <>
                                {' '}
                                <span aria-hidden="true">·</span>{' '}
                                <span>{linkedAcct.email}</span>
                              </>
                            )}{' '}
                            <span aria-hidden="true">·</span> {candidate.gradeOrDept}
                            {candidate.section ? ` · ${candidate.section}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onReviewTeacherApproval(
                              candidate.id,
                              true,
                              undefined,
                              false
                            );
                            setApprovalNotice(
                              `${candidate.name} has been approved as a Teacher.`
                            );
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] hover:bg-[var(--theme-accent-soft-hover)] rounded-md transition-colors whitespace-nowrap"
                        >
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Approve Teacher</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onReviewTeacherApproval(
                              candidate.id,
                              true,
                              undefined,
                              true
                            );
                            setApprovalNotice(
                              `${candidate.name} has been approved and added as a Teacher Monitor.`
                            );
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md transition-colors whitespace-nowrap"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Approve & Make Monitor</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeclineTeacherDraft(candidate);
                            setDeclineTeacherNote('');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FAF3F1] dark:bg-[#3A1616] border border-[#E5C9C5] dark:border-[#8C3737] hover:opacity-90 rounded-md transition-colors whitespace-nowrap"
                        >
                          <X className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-md bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="block text-[11px] text-[#6B6155] dark:text-[#B8AFA0] mb-1">
                          Subjects Applied to Teach ({candidateSubjects.length}/4)
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {candidateSubjects.map((subId) => {
                            const sub = SUBJECTS.find((s) => s.id === subId);
                            if (!sub) return null;
                            return (
                              <span
                                key={subId}
                                className="px-2 py-0.5 rounded bg-[#FFFDF8] dark:bg-[#161412] border border-[#DDD4C0] dark:border-[#4A4137] text-[#1C1917] dark:text-[#F7F3EA] font-medium"
                              >
                                {sub.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <span className="block text-[11px] text-[#6B6155] dark:text-[#B8AFA0] mb-1">
                          Club to Monitor
                        </span>
                        {candidateClub ? (
                          <ClubBadge club={candidateClub} size="sm" />
                        ) : (
                          <span className="text-[#6B6155] dark:text-[#B8AFA0]">
                            None specified
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {rejectedTeacherMembers.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-[#E2D9C6] dark:border-[#3D362D]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6B6155] dark:text-[#B8AFA0]">
                Previously Declined Teacher Requests ({rejectedTeacherMembers.length})
              </h3>
              {rejectedTeacherMembers.map((candidate) => (
                <div
                  key={candidate.id}
                  className="heritage-card border rounded-lg p-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <MemberAvatar
                      name={candidate.name}
                      src={candidate.avatarUrl}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1C1917] dark:text-[#F7F3EA] truncate">
                        {candidate.name}
                      </p>
                      <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0]">
                        {candidate.gradeOrDept}
                        {candidate.teacherApprovalNote
                          ? ` · Declined: ${candidate.teacherApprovalNote}`
                          : ' · Declined by App Owner'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onReviewTeacherApproval(candidate.id, true, undefined, false);
                        setApprovalNotice(
                          `${candidate.name} has been approved as a Teacher.`
                        );
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] hover:bg-[var(--theme-accent-soft-hover)] rounded-md transition-colors whitespace-nowrap"
                    >
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Approve Teacher</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onReviewTeacherApproval(candidate.id, true, undefined, true);
                        setApprovalNotice(
                          `${candidate.name} has been approved and added as a Teacher Monitor.`
                        );
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md transition-colors whitespace-nowrap"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Approve & Make Monitor</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: SHARING & MESSAGES MONITOR */}
      {activeTab === 'activity' && (
        <section className="space-y-4">
          <div className="heritage-card border rounded-lg p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <Search
                  className="w-4 h-4 text-[#8C7F6D] dark:text-[#9C9385] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <label htmlFor="monitor-activity-search" className="sr-only">
                  Search shared posts and messages
                </label>
                <input
                  id="monitor-activity-search"
                  type="search"
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  placeholder="Search shared posts, replies, subjects, or student names..."
                  className="w-full pl-9 pr-3.5 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
                />
              </div>

              <div className="flex items-center gap-1 p-1 bg-[#F5F0E6] dark:bg-[#221E1A] rounded-md overflow-x-auto no-scrollbar shrink-0">
                {[
                  { id: 'all' as const, label: 'All' },
                  { id: 'posts' as const, label: 'Shared Posts' },
                  { id: 'messages' as const, label: 'Messages' },
                  { id: 'reported' as const, label: 'Reported' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActivityFilter(f.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                      activityFilter === f.id
                        ? 'bg-[#FFFDF8] dark:bg-[#161412] text-[var(--theme-accent-text)] shadow-xs border border-[#E2D9C6] dark:border-[#3D362D]'
                        : 'text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {activityItems.length === 0 ? (
            <div className="heritage-card border rounded-lg p-10 text-center text-sm text-[#6B6155] dark:text-[#B8AFA0]">
              No matching shared posts or messages found.
            </div>
          ) : (
            <div className="space-y-3">
              {activityItems.map((item) => {
                const deleteKey = `activity-${item.key}`;
                const authorWarnings = item.author
                  ? getActiveWarningsForMember(warnings, item.author.id)
                  : [];
                const topWarning = authorWarnings[0];

                return (
                  <article
                    key={item.key}
                    className="heritage-card border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B6155] dark:text-[#B8AFA0]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[var(--theme-accent-text)]">
                          {item.kind === 'post'
                            ? item.post.kind === PostKind.QUESTION
                              ? 'Shared Question'
                              : 'Shared Study Idea'
                            : 'Message / Reply'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-[#1C1917] dark:text-[#F7F3EA]">
                          {item.subjectName}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{formatRelativeTime(item.createdAt)}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {item.pendingReports > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded border bg-[#FAF3F1] dark:bg-[#3A1616] text-[#7C1D1D] dark:text-[#FCA5A5] border-[#E5C9C5] dark:border-[#8C3737]">
                            <Flag className="w-3 h-3" aria-hidden="true" />
                            <span>
                              {item.pendingReports}{' '}
                              {item.pendingReports === 1 ? 'report' : 'reports'}
                            </span>
                          </span>
                        )}
                        {item.author?.isDisabled && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded border bg-[#FAF3F1] dark:bg-[#3A1616] text-[#7C1D1D] dark:text-[#FCA5A5] border-[#E5C9C5] dark:border-[#8C3737]">
                            <Ban className="w-3 h-3" aria-hidden="true" />
                            <span>Disabled</span>
                          </span>
                        )}
                        {topWarning && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded border ${
                              getWarningLevelDisplay(topWarning.level).badgeClass
                            }`}
                          >
                            <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                            <span>
                              {getWarningLevelDisplay(topWarning.level).shortLabel}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    {item.kind === 'post' ? (
                      <div>
                        <h3 className="font-display text-lg font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                          {item.post.title}
                        </h3>
                        <p className="mt-1 text-sm text-[#3B342D] dark:text-[#E2DACB] line-clamp-3">
                          {item.post.body}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0]">
                          In thread:{' '}
                          <span className="font-medium text-[#1C1917] dark:text-[#F7F3EA]">
                            {item.post.title}
                          </span>
                        </p>
                        <p className="text-sm text-[#3B342D] dark:text-[#E2DACB]">
                          {item.replyBody}
                        </p>
                        {item.replyFormula && (
                          <div className="px-3 py-1.5 bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D] rounded font-mono text-xs text-[#2E2924] dark:text-[#EAE3D5]">
                            {item.replyFormula}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pt-3 border-t border-[#ECE5D5] dark:border-[#342E26] flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs">
                        <MemberAvatar
                          name={item.author?.name ?? 'Class Member'}
                          src={item.author?.avatarUrl}
                          size="xs"
                        />
                        {item.author ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onOpenAccountInfo(item.author!.id)}
                              className="font-medium text-[#1C1917] dark:text-[#F7F3EA] hover:text-[var(--theme-accent-text)]"
                            >
                              {item.author.name}
                            </button>
                            {item.author.isOwner && <OwnerBadge size="xs" />}
                          </>
                        ) : (
                          <span className="font-medium text-[#1C1917] dark:text-[#F7F3EA]">
                            Class Member
                          </span>
                        )}
                        <span className="text-[#6B6155] dark:text-[#B8AFA0]">
                          · {item.author?.role ?? 'Student'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenThread(item.post.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] rounded-md"
                        >
                          <span>Open</span>
                          <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                        </button>

                        {item.author && (
                          <button
                            type="button"
                            onClick={() =>
                              openWarningModal({
                                memberId: item.author!.id,
                                memberName: item.author!.name,
                                contentPreview:
                                  item.kind === 'post'
                                    ? item.post.title
                                    : item.replyBody,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#7A5615] dark:text-[#FCD34D] bg-[#FBF8EC] dark:bg-[#2D2614] border border-[#E8D8A8] dark:border-[#6B5723] hover:opacity-90 rounded-md"
                          >
                            <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                            <span>Put Warning</span>
                          </button>
                        )}

                        {canToggleDisableTarget(item.author) && item.author && (
                          <button
                            type="button"
                            onClick={() => {
                              if (item.author!.isDisabled) {
                                onToggleDisableMember(item.author!.id, false);
                              } else {
                                setDisableDraftMember(item.author!);
                                setDisableReason('');
                              }
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border ${
                              item.author.isDisabled
                                ? 'text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)]'
                                : 'text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FAF3F1] dark:bg-[#3A1616] border-[#E5C9C5] dark:border-[#8C3737]'
                            }`}
                          >
                            {item.author.isDisabled ? (
                              <>
                                <Power className="w-3 h-3" aria-hidden="true" />
                                <span>Turn On</span>
                              </>
                            ) : (
                              <>
                                <Ban className="w-3 h-3" aria-hidden="true" />
                                <span>Disable</span>
                              </>
                            )}
                          </button>
                        )}

                        {confirmDeleteKey === deleteKey ? (
                          <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-[#FAF3F1] dark:bg-[#3A1616] border border-[#E5C9C5] dark:border-[#8C3737] text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                if (item.kind === 'post') {
                                  onDeletePost(item.post.id);
                                } else {
                                  onDeleteReply(item.post.id, item.replyId);
                                }
                                setConfirmDeleteKey(null);
                              }}
                              className="font-semibold text-[#7C1D1D] dark:text-[#FCA5A5] hover:underline"
                            >
                              Confirm Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteKey(null)}
                              className="text-[#574F45] dark:text-[#CEC5B6]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteKey(deleteKey)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#FFFDF8] bg-[#7C1D1D] hover:bg-[#631616] rounded-md"
                          >
                            <Trash2 className="w-3 h-3" aria-hidden="true" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: ACCOUNTS & WARNINGS */}
      {activeTab === 'accounts' && (
        <section className="space-y-4">
          <div className="heritage-card border rounded-lg p-3.5">
            <div className="relative">
              <Search
                className="w-4 h-4 text-[#8C7F6D] dark:text-[#9C9385] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <label htmlFor="monitor-account-search" className="sr-only">
                Search accounts
              </label>
              <input
                id="monitor-account-search"
                type="search"
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
                placeholder="Search members by name, @username, role, or grade..."
                className="w-full pl-9 pr-3.5 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredAccounts.map((member) => {
              const memberWarnings = getActiveWarningsForMember(
                warnings,
                member.id
              );
              const isSelf = member.id === activeMember.id;
              const postsCount = posts.filter(
                (p) => p.authorId === member.id
              ).length;
              const repliesCount = posts.reduce(
                (acc, p) =>
                  acc + p.replies.filter((r) => r.authorId === member.id).length,
                0
              );

              return (
                <article
                  key={member.id}
                  className="heritage-card border rounded-lg p-4 sm:p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <MemberAvatar
                        name={member.name}
                        src={member.avatarUrl}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenAccountInfo(member.id)}
                            className="font-display text-lg font-semibold text-[#1C1917] dark:text-[#F7F3EA] hover:text-[var(--theme-accent-text)] transition-colors"
                          >
                            {member.name}
                          </button>
                          {(member.isOwner ||
                            (isAppOwner && member.id === activeMember.id)) && (
                            <OwnerBadge size="xs" />
                          )}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded border ${
                              member.isDisabled
                                ? 'bg-[#FAF3F1] dark:bg-[#3A1616] text-[#7C1D1D] dark:text-[#FCA5A5] border-[#E5C9C5] dark:border-[#8C3737]'
                                : isTeacherAccountPendingApproval(member)
                                  ? 'bg-[#FEF7E8] dark:bg-[#2B2110] text-[#7C4A03] dark:text-[#FCD34D] border-[#E5C98B] dark:border-[#78571D]'
                                  : isTeacherAccountRejected(member)
                                    ? 'bg-[#FAF3F1] dark:bg-[#3A1616] text-[#7C1D1D] dark:text-[#FCA5A5] border-[#E5C9C5] dark:border-[#8C3737]'
                                    : 'bg-[#F5F0E6] dark:bg-[#221E1A] text-[#443D34] dark:text-[#E0D8CA] border-[#D8CEBA] dark:border-[#4A4137]'
                            }`}
                          >
                            {member.isDisabled ? (
                              <>
                                <Ban className="w-3 h-3" aria-hidden="true" />
                                <span>Account Disabled</span>
                              </>
                            ) : isTeacherAccountPendingApproval(member) ? (
                              <>
                                <Clock className="w-3 h-3" aria-hidden="true" />
                                <span>Pending Owner Approval</span>
                              </>
                            ) : isTeacherAccountRejected(member) ? (
                              <>
                                <X className="w-3 h-3" aria-hidden="true" />
                                <span>Request Declined</span>
                              </>
                            ) : member.role === UserRole.TEACHER && member.isMonitor ? (
                              <>
                                <ShieldCheck
                                  className="w-3 h-3 text-[var(--theme-accent-text)]"
                                  aria-hidden="true"
                                />
                                <span>Teacher Monitor</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2
                                  className="w-3 h-3 text-[var(--theme-accent-text)]"
                                  aria-hidden="true"
                                />
                                <span>Account Active</span>
                              </>
                            )}
                          </span>
                        </div>

                        <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] mt-0.5">
                          <span className="font-mono text-[var(--theme-accent-text)]">
                            @{getMemberUsername(member.name, member.username)}
                          </span>{' '}
                          <span aria-hidden="true">·</span> {member.role}{' '}
                          <span aria-hidden="true">·</span> {member.gradeOrDept}{' '}
                          <span aria-hidden="true">·</span>{' '}
                          <span className="font-mono tabular-nums">
                            {postsCount} posts, {repliesCount} messages
                          </span>
                        </p>

                        {member.isDisabled && member.disabledReason && (
                          <p className="mt-1.5 text-xs text-[#7C1D1D] dark:text-[#FCA5A5]">
                            Disabled reason: {member.disabledReason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {isAppOwner &&
                        (isTeacherAccountPendingApproval(member) ||
                          isTeacherAccountRejected(member)) && (
                          <>
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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] hover:bg-[var(--theme-accent-soft-hover)] rounded-md transition-colors whitespace-nowrap"
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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md transition-colors whitespace-nowrap"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Approve & Monitor</span>
                            </button>
                            {isTeacherAccountPendingApproval(member) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDeclineTeacherDraft(member);
                                  setDeclineTeacherNote('');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FAF3F1] dark:bg-[#3A1616] border border-[#E5C9C5] dark:border-[#8C3737] hover:opacity-90 rounded-md transition-colors whitespace-nowrap"
                              >
                                <X className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Decline</span>
                              </button>
                            )}
                          </>
                        )}
                      {isAppOwner &&
                        isApprovedFacultyTeacher(member) &&
                        onToggleTeacherMonitor && (
                          <button
                            type="button"
                            onClick={() =>
                              onToggleTeacherMonitor(member.id, !member.isMonitor)
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap ${
                              member.isMonitor
                                ? 'text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FAF3F1] dark:bg-[#3A1616] border-[#E5C9C5] dark:border-[#8C3737] hover:opacity-90'
                                : 'text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)] hover:bg-[var(--theme-accent-soft-hover)]'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>
                              {member.isMonitor ? 'Remove Monitor' : 'Make Monitor'}
                            </span>
                          </button>
                        )}
                      <button
                        type="button"
                        onClick={() =>
                          openWarningModal({
                            memberId: member.id,
                            memberName: member.name,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#7A5615] dark:text-[#FCD34D] bg-[#FBF8EC] dark:bg-[#2D2614] border border-[#E8D8A8] dark:border-[#6B5723] hover:opacity-90 rounded-md transition-colors whitespace-nowrap"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Put Warning (Low/Mid/Critical)</span>
                      </button>

                      {canToggleDisableTarget(member) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (member.isDisabled) {
                              onToggleDisableMember(member.id, false);
                            } else {
                              setDisableDraftMember(member);
                              setDisableReason('');
                            }
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                            member.isDisabled
                              ? 'text-[#FFFDF8] bg-[var(--theme-accent)] border-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)]'
                              : 'text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FAF3F1] dark:bg-[#3A1616] border-[#E5C9C5] dark:border-[#8C3737] hover:opacity-90'
                          }`}
                        >
                          {member.isDisabled ? (
                            <>
                              <Power className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Turn Account On</span>
                            </>
                          ) : (
                            <>
                              <Ban className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Disable Account</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Active Warnings on This Member */}
                  {memberWarnings.length > 0 && (
                    <div className="pt-3 border-t border-[#ECE5D5] dark:border-[#342E26] space-y-2">
                      <p className="text-xs font-medium text-[#443D34] dark:text-[#E0D8CA]">
                        Active Warnings ({memberWarnings.length})
                      </p>
                      <div className="space-y-2">
                        {memberWarnings.map((w) => {
                          const meta = getWarningLevelDisplay(w.level);
                          return (
                            <div
                              key={w.id}
                              className={`p-3 rounded-md border flex flex-wrap items-start justify-between gap-3 ${meta.panelClass}`}
                            >
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  <span
                                    className={`inline-flex items-center gap-1 font-semibold ${meta.textClass}`}
                                  >
                                    <AlertTriangle
                                      className="w-3.5 h-3.5"
                                      aria-hidden="true"
                                    />
                                    <span>{meta.label}</span>
                                  </span>
                                  <span className="text-[#6B6155] dark:text-[#B8AFA0]">
                                    · {formatStampTime(w.createdAt)}
                                  </span>
                                  {w.acknowledgedAt && (
                                    <span className="text-[#6B6155] dark:text-[#B8AFA0]">
                                      · Acknowledged by student
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-[#1C1917] dark:text-[#F7F3EA]">
                                  {w.reason}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => onClearWarning(w.id)}
                                className="text-xs font-medium text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA] underline whitespace-nowrap shrink-0"
                              >
                                Clear Warning
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 4: SCHOOL EVENTS MANAGER */}
      {activeTab === 'events' && (
        <section className="space-y-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const trimmedTitle = eventTitle.trim();
              const trimmedLocation = eventLocation.trim();
              const parsed = new Date(eventStartsAt).getTime();
              if (trimmedTitle.length < 3 || !trimmedLocation || Number.isNaN(parsed)) {
                return;
              }
              onAddEvent({
                title: trimmedTitle,
                description:
                  eventDescription.trim() ||
                  'Faculty-hosted academic session open to participating students.',
                category: eventCategory,
                subjectId: eventSubjectId,
                gradeLevel: eventGradeLevel,
                startsAt: parsed,
                location: trimmedLocation,
                clubName: eventClubName || undefined,
              });
              setEventNotice(`Event "${trimmedTitle}" published to School Events.`);
              setEventTitle('');
              setEventLocation('');
              setEventDescription('');
              setEventClubName('');
            }}
            className="heritage-card border rounded-xl sm:rounded-lg p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#ECE5D5] dark:border-[#342E26]">
              <div>
                <h2 className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                  Add a School Event
                </h2>
                <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] mt-0.5">
                  Publish workshops, exam clinics, club meetings, or assemblies visible to all scholars.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenEventsPage}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--theme-accent-text)] hover:underline whitespace-nowrap"
              >
                <span>Open Full Events Page</span>
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            {eventNotice && (
              <div
                role="status"
                className="px-3.5 py-2.5 text-xs font-medium text-[#1F4E2E] dark:text-[#86EFAC] bg-[#EFF7F1] dark:bg-[#13291B] border border-[#B8D7C0] dark:border-[#2F6842] rounded-md flex items-center justify-between gap-2"
              >
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{eventNotice}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setEventNotice(null)}
                  className="text-xs underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="monitor-event-title"
                  className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1"
                >
                  Event Title
                </label>
                <input
                  id="monitor-event-title"
                  type="text"
                  required
                  maxLength={100}
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. ICT Cyber Safety Assembly & Lab Check"
                  className="w-full px-3.5 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
                />
              </div>

              <div>
                <label
                  htmlFor="monitor-event-category"
                  className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1"
                >
                  Category
                </label>
                <select
                  id="monitor-event-category"
                  value={eventCategory}
                  onChange={(e) =>
                    setEventCategory(e.target.value as SchoolEventCategory)
                  }
                  className="w-full px-3 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
                >
                  <option value={SchoolEventCategory.WORKSHOP}>Workshop</option>
                  <option value={SchoolEventCategory.EXAM_PREP}>Exam Prep</option>
                  <option value={SchoolEventCategory.CLUB_MEET}>Club Meet</option>
                  <option value={SchoolEventCategory.COMPETITION}>Competition</option>
                  <option value={SchoolEventCategory.ASSEMBLY}>School Assembly</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="monitor-event-date"
                  className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1"
                >
                  Date & Time
                </label>
                <input
                  id="monitor-event-date"
                  type="datetime-local"
                  required
                  value={eventStartsAt}
                  onChange={(e) => setEventStartsAt(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
                />
              </div>

              <div>
                <label
                  htmlFor="monitor-event-location"
                  className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1"
                >
                  Room / Location
                </label>
                <input
                  id="monitor-event-location"
                  type="text"
                  required
                  maxLength={80}
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="e.g. Auditorium or Room 204"
                  className="w-full px-3.5 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
                />
              </div>

              <div>
                <label
                  htmlFor="monitor-event-subject"
                  className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1"
                >
                  Subject
                </label>
                <select
                  id="monitor-event-subject"
                  value={eventSubjectId}
                  onChange={(e) =>
                    setEventSubjectId(e.target.value as SubjectId | 'all')
                  }
                  className="w-full px-3 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
                >
                  <option value="all">All Subjects</option>
                  {SUBJECTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="monitor-event-grade"
                  className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1"
                >
                  Grade Level
                </label>
                <select
                  id="monitor-event-grade"
                  value={eventGradeLevel}
                  onChange={(e) =>
                    setEventGradeLevel(
                      e.target.value as GradeLevel | 'All Grades'
                    )
                  }
                  className="w-full px-3 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
                >
                  <option value="All Grades">All Grades</option>
                  {GRADE_LEVEL_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="monitor-event-club"
                  className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1"
                >
                  Host Club (optional)
                </label>
                <select
                  id="monitor-event-club"
                  value={eventClubName}
                  onChange={(e) => setEventClubName(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
                >
                  <option value="">General School / No Club</option>
                  {SCHOOL_CLUBS.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="monitor-event-desc"
                  className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1"
                >
                  Description
                </label>
                <textarea
                  id="monitor-event-desc"
                  rows={2}
                  maxLength={600}
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Agenda, notes, or materials to bring..."
                  className="w-full px-3.5 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Publish School Event</span>
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {[...events]
              .sort((a, b) => a.startsAt - b.startsAt)
              .map((ev) => {
                const cat = getEventCategoryDisplay(ev.category);
                return (
                  <div
                    key={ev.id}
                    className="heritage-card border rounded-lg p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded border ${cat.badgeClass}`}
                        >
                          {cat.label}
                        </span>
                        <span className="font-mono text-[#6B6155] dark:text-[#B8AFA0]">
                          {formatStampTime(ev.startsAt)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[#574F45] dark:text-[#CEC5B6]">
                          <MapPin className="w-3 h-3" aria-hidden="true" />
                          <span>{ev.location}</span>
                        </span>
                      </div>
                      <p className="font-display text-lg font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                        {ev.title}
                      </p>
                      <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0]">
                        {ev.attendeeIds.length}{' '}
                        {ev.attendeeIds.length === 1
                          ? 'participant going'
                          : 'participants going'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteEvent(ev.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FAF3F1] dark:bg-[#2A1414] border border-[#E5C9C5] dark:border-[#8C3737] rounded-md hover:opacity-85 transition-colors whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Remove</span>
                    </button>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* ISSUE WARNING MODAL (LOW / MID / CRITICAL) */}
      {warningDraft && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1C1917]/55 dark:bg-black/75 backdrop-blur-[2px] p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="issue-warning-title"
        >
          <div className="w-full max-w-lg bg-[#FFFDF8] dark:bg-[#161412] border-t sm:border border-[#E2D9C6] dark:border-[#3D362D] rounded-t-2xl sm:rounded-lg overflow-hidden shadow-2xl pb-safe">
            <div className="px-5 py-4 border-b border-[#E2D9C6] dark:border-[#3D362D] flex items-center justify-between gap-4">
              <div>
                <h2
                  id="issue-warning-title"
                  className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]"
                >
                  Put Warning on {warningDraft.memberName}
                </h2>
                <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] mt-0.5">
                  Select Low, Mid, or Critical severity and include a teacher note.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWarningDraft(null)}
                aria-label="Close warning dialog"
                className="w-9 h-9 inline-flex items-center justify-center rounded-md text-[#6B6155] dark:text-[#B8AFA0] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleConfirmWarning} className="p-5 space-y-4">
              {warningDraft.contentPreview && (
                <div className="p-3 bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D] rounded-md text-xs text-[#443D34] dark:text-[#E0D8CA] line-clamp-2">
                  Reference: “{warningDraft.contentPreview}”
                </div>
              )}

              <div>
                <span className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-2">
                  Warning Severity Level
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    WarningLevel.LOW,
                    WarningLevel.MID,
                    WarningLevel.CRITICAL,
                  ].map((lvl) => {
                    const meta = getWarningLevelDisplay(lvl);
                    const isSelected = warningLevel === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setWarningLevel(lvl)}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          isSelected
                            ? `${meta.panelClass} ring-2 ring-[var(--theme-accent-text)]`
                            : 'bg-[#FFFDF8] dark:bg-[#1C1916] border-[#E2D9C6] dark:border-[#3D362D] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C]'
                        }`}
                      >
                        <div
                          className={`flex items-center gap-1.5 text-xs font-semibold ${meta.textClass}`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{meta.shortLabel}</span>
                        </div>
                        <p className="text-[11px] text-[#6B6155] dark:text-[#B8AFA0] mt-1 leading-snug">
                          {lvl === WarningLevel.LOW
                            ? 'Gentle reminder'
                            : lvl === WarningLevel.MID
                              ? 'Moderate notice'
                              : 'Severe strike'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="warning-reason-input"
                  className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
                >
                  Warning Message to User
                </label>
                <textarea
                  id="warning-reason-input"
                  rows={3}
                  required
                  maxLength={400}
                  value={warningReason}
                  onChange={(e) => setWarningReason(e.target.value)}
                  placeholder="Explain why this Low / Mid / Critical warning is being placed on the account..."
                  className="w-full px-3.5 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-[#E2D9C6] dark:border-[#3D362D]">
                <button
                  type="button"
                  onClick={() => setWarningDraft(null)}
                  className="px-4 py-2 text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md"
                >
                  Issue {getWarningLevelDisplay(warningLevel).label}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISABLE ACCOUNT CONFIRMATION MODAL */}
      {disableDraftMember && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1C1917]/55 dark:bg-black/75 backdrop-blur-[2px] p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="disable-account-title"
        >
          <div className="w-full max-w-md bg-[#FFFDF8] dark:bg-[#161412] border-t sm:border border-[#E2D9C6] dark:border-[#3D362D] rounded-t-2xl sm:rounded-lg overflow-hidden shadow-2xl pb-safe">
            <div className="px-5 py-4 border-b border-[#E2D9C6] dark:border-[#3D362D] flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Ban
                  className="w-4 h-4 text-[#7C1D1D] dark:text-[#FCA5A5]"
                  aria-hidden="true"
                />
                <h2
                  id="disable-account-title"
                  className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]"
                >
                  Disable {disableDraftMember.name}’s Account?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDisableDraftMember(null)}
                aria-label="Close disable account dialog"
                className="w-9 h-9 inline-flex items-center justify-center rounded-md text-[#6B6155] dark:text-[#B8AFA0]"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleConfirmDisable} className="p-5 space-y-4">
              <p className="text-xs text-[#574F45] dark:text-[#CEC5B6] leading-relaxed">
                Disabling this account blocks the user from signing in, sharing posts, or posting messages until a monitoring teacher turns the account back on.
              </p>

              <div>
                <label
                  htmlFor="disable-reason-input"
                  className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
                >
                  Reason for Disabling Account
                </label>
                <textarea
                  id="disable-reason-input"
                  rows={3}
                  maxLength={350}
                  value={disableReason}
                  onChange={(e) => setDisableReason(e.target.value)}
                  placeholder="e.g. Repeated critical conduct warnings or inappropriate classroom messages."
                  className="w-full px-3.5 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-[#E2D9C6] dark:border-[#3D362D]">
                <button
                  type="button"
                  onClick={() => setDisableDraftMember(null)}
                  className="px-4 py-2 text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-[#FFFDF8] bg-[#7C1D1D] hover:bg-[#631616] rounded-md"
                >
                  Disable Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* DECLINE TEACHER APPROVAL MODAL */}
      {declineTeacherDraft && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1C1917]/55 dark:bg-black/75 backdrop-blur-[2px] p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="decline-teacher-title"
        >
          <div className="w-full max-w-md bg-[#FFFDF8] dark:bg-[#161412] border-t sm:border border-[#E2D9C6] dark:border-[#3D362D] rounded-t-2xl sm:rounded-lg overflow-hidden shadow-2xl pb-safe">
            <div className="px-5 py-4 border-b border-[#E2D9C6] dark:border-[#3D362D] flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <UserCheck
                  className="w-4 h-4 text-[#7C1D1D] dark:text-[#FCA5A5]"
                  aria-hidden="true"
                />
                <h2
                  id="decline-teacher-title"
                  className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]"
                >
                  Decline {declineTeacherDraft.name}’s Teacher Request?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDeclineTeacherDraft(null)}
                aria-label="Close decline teacher dialog"
                className="w-9 h-9 inline-flex items-center justify-center rounded-md text-[#6B6155] dark:text-[#B8AFA0]"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onReviewTeacherApproval(
                  declineTeacherDraft.id,
                  false,
                  declineTeacherNote.trim() ||
                    'Declined during faculty review.'
                );
                setApprovalNotice(
                  `${declineTeacherDraft.name}’s teacher account request was declined.`
                );
                setDeclineTeacherDraft(null);
                setDeclineTeacherNote('');
              }}
              className="p-5 space-y-4"
            >
              <p className="text-xs text-[#574F45] dark:text-[#CEC5B6] leading-relaxed">
                This applicant will not be able to sign in as a Teacher unless faculty later re-approves their request.
              </p>

              <div>
                <label
                  htmlFor="decline-teacher-note"
                  className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
                >
                  Faculty Note (optional)
                </label>
                <textarea
                  id="decline-teacher-note"
                  rows={3}
                  maxLength={300}
                  value={declineTeacherNote}
                  onChange={(e) => setDeclineTeacherNote(e.target.value)}
                  placeholder="e.g. Please confirm faculty credentials with the department chair."
                  className="w-full px-3.5 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-[#E2D9C6] dark:border-[#3D362D]">
                <button
                  type="button"
                  onClick={() => setDeclineTeacherDraft(null)}
                  className="px-4 py-2 text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-[#FFFDF8] bg-[#7C1D1D] hover:bg-[#631616] rounded-md"
                >
                  Decline Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
