import { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  AlertOctagon,
  AlertTriangle,
  Ban,
  BellRing,
  Bookmark,
  Check,
  CheckCheck,
  Clock,
  Flag,
  HelpCircle,
  Info,
  Lightbulb,
  LogOut,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { AccountInfoView } from './components/AccountInfoView';
import { AuthView } from './components/AuthView';
import { ContributorsView } from './components/ContributorsView';
import { EventsView } from './components/EventsView';
import { FriendsView } from './components/FriendsView';
import { LessonsView } from './components/LessonsView';
import { MailView } from './components/MailView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileWorkspaceBar } from './components/MobileWorkspaceBar';
import { NewPostModal } from './components/NewPostModal';
import { PostCard } from './components/PostCard';
import { ReportModal, ReportTargetContext } from './components/ReportModal';
import { ResilientImage } from './components/ResilientImage';
import { SettingsView } from './components/SettingsView';
import { Sidebar } from './components/Sidebar';
import {
  MonitorSectionTab,
  TeacherMonitorView,
} from './components/TeacherMonitorView';
import { ThreadDetail } from './components/ThreadDetail';
import { TopBar } from './components/TopBar';
import {
  WarningStampEffect,
  WarningStampOverlay,
} from './components/WarningStampOverlay';
import { WelcomeView } from './components/WelcomeView';
import { HERO_BANNER_IMAGE, SUBJECTS } from './data/seedData';
import {
  auth,
  formatFirebaseAuthError,
  signInWithGoogle,
  signOutFirebase,
  testConnection,
} from './firebase';
import {
  AccountWarning,
  ContentReport,
  DiscussionPost,
  FeedFilter,
  FriendRequest,
  FriendRequestStatus,
  GradeLevel,
  LessonUnit,
  NavTab,
  PersonalNote,
  PomodoroCadenceId,
  PomodoroPhase,
  PomodoroState,
  PostKind,
  RegisteredAccount,
  ReplyItem,
  ReportStatus,
  ReportTargetType,
  SchoolEvent,
  SchoolEventCategory,
  SchoolMember,
  SettingsSection,
  SortOrder,
  StudyReminder,
  SubjectId,
  ThemePreference,
  UserRole,
  WarningLevel,
} from './types/school';
import {
  acknowledgeWarningDoc,
  clearWarningDoc,
  createEventDoc,
  createFriendRequestDoc,
  createLessonDoc,
  createMemberProfile,
  createPostDoc,
  createReportDoc,
  createWarningDoc,
  deleteEventDoc,
  deleteFriendRequestDoc,
  deletePostDoc,
  ensureOwnerBadgeDoc,
  isBootstrappedAdminEmail,
  resolveReportDoc,
  respondFriendRequestDoc,
  reviewTeacherApprovalDoc,
  saveUserPrivateFields,
  seedInitialSchoolDataIfNeeded,
  subscribeToEvents,
  subscribeToFriendRequests,
  subscribeToLessons,
  subscribeToMemberProfile,
  subscribeToMembers,
  subscribeToPosts,
  subscribeToReports,
  subscribeToUserPrivate,
  subscribeToWarnings,
  toggleDisableMemberDoc,
  toggleTeacherMonitorDoc,
  updateEventAttendeesDoc,
  updateMemberAvatarDoc,
  updateMemberProfileDoc,
  updatePostInteractionDoc,
  UserPrivateData,
} from './utils/firestoreSync';
import {
  createId,
  getActiveWarningsForMember,
  getFriendRelation,
  getFriendsForMember,
  getIncomingFriendRequests,
  getPhaseDurationSeconds,
  getWarningLevelDisplay,
  isApprovedFacultyTeacher,
  isTeacherAccountPendingApproval,
  isTeacherAccountRejected,
  isTeacherMonitorMember,
  loadPomodoroState,
  loadThemePreference,
  recordDailyVisit,
  savePomodoroState,
  saveThemePreference,
} from './utils/storage';
import { applyThemeToDocument } from './utils/theme';

function playStudyTimerChime(): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.18);
      gain.gain.setValueAtTime(0.001, now + idx * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.18 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.18 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.18);
      osc.stop(now + idx * 0.18 + 0.38);
    });
    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1000);
  } catch {
    // Ignore audio context errors when autoplay is restricted
  }
}

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncRetryNonce, setSyncRetryNonce] = useState(0);

  const [ownMember, setOwnMember] = useState<SchoolMember | null>(null);
  const [memberLoaded, setMemberLoaded] = useState(false);
  const [slowMemberLoad, setSlowMemberLoad] = useState(false);
  const [userPrivate, setUserPrivate] = useState<UserPrivateData | null>(null);

  const [members, setMembers] = useState<SchoolMember[]>([]);
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [lessons, setLessons] = useState<LessonUnit[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [warnings, setWarnings] = useState<AccountWarning[]>([]);

  const seededUidRef = useRef<string | null>(null);
  const syncedStreakKeyRef = useRef<string | null>(null);

  const [pomodoro, setPomodoro] = useState<PomodoroState>(() =>
    loadPomodoroState()
  );
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(() => Date.now());
  const [isTimerMuted, setIsTimerMuted] = useState(false);

  const [authInitialRole, setAuthInitialRole] = useState<UserRole>(
    UserRole.STUDENT
  );
  const [hasPassedWelcome, setHasPassedWelcome] = useState(false);

  const [theme, setTheme] = useState<ThemePreference>(() =>
    loadThemePreference()
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>(
    SettingsSection.APPEARANCE
  );
  const [viewedProfileMemberId, setViewedProfileMemberId] = useState<
    string | null
  >(null);

  const [friendNotice, setFriendNotice] = useState<string | null>(null);
  const [openEventComposerOnNavigate, setOpenEventComposerOnNavigate] =
    useState(false);
  const [reportTarget, setReportTarget] = useState<ReportTargetContext | null>(
    null
  );
  const [reportNotice, setReportNotice] = useState<string | null>(null);
  const [warningStampEffect, setWarningStampEffect] =
    useState<WarningStampEffect | null>(null);
  const warningStampTimerRef = useRef<number | null>(null);
  const shownWarningStampKeysRef = useRef<Set<string>>(new Set());

  const [activeTab, setActiveTab] = useState<NavTab>(NavTab.FEED);
  const [selectedSubject, setSelectedSubject] = useState<SubjectId | 'all'>(
    'all'
  );
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | 'all'>('all');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [feedFilter, setFeedFilter] = useState<FeedFilter>(FeedFilter.ALL);
  const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.RECENT);
  const [searchQuery, setSearchQuery] = useState('');
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const [monitorTabRequest, setMonitorTabRequest] = useState<{
    tab: MonitorSectionTab;
    nonce: number;
  } | null>(null);

  const [composerState, setComposerState] = useState<{
    isOpen: boolean;
    kind: PostKind;
    subjectId: SubjectId;
    lessonId?: string;
  }>({
    isOpen: false,
    kind: PostKind.QUESTION,
    subjectId: SubjectId.BIOLOGY,
  });

  // Theme & local timer persistence
  useEffect(() => {
    applyThemeToDocument(theme);
    saveThemePreference(theme);
  }, [theme]);

  useEffect(() => {
    savePomodoroState(pomodoro);
  }, [pomodoro]);

  useEffect(() => {
    const tickClock = () => setCurrentTimeMs(Date.now());
    const intervalId = window.setInterval(tickClock, 5000);
    window.addEventListener('focus', tickClock);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', tickClock);
    };
  }, []);


  // Show recovery options if loading profile takes too long on mobile connections
  useEffect(() => {
    if (!firebaseUser || memberLoaded) {
      setSlowMemberLoad(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setSlowMemberLoad(true);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [firebaseUser, memberLoaded]);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      setSyncError(null);
      if (!user) {
        setOwnMember(null);
        setMemberLoaded(false);
        setUserPrivate(null);
        setMembers([]);
        setPosts([]);
        setLessons([]);
        setEvents([]);
        setFriendRequests([]);
        setReports([]);
        setWarnings([]);
        seededUidRef.current = null;
        syncedStreakKeyRef.current = null;
      } else {
        setMemberLoaded(false);
        void testConnection();
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore core subscriptions when signed in
  useEffect(() => {
    if (!firebaseUser) return;

    const uid = firebaseUser.uid;
    const email = firebaseUser.email || '';
    const isAdmin = isBootstrappedAdminEmail(email);

    const handleSyncError = () => {
      setSyncError(
        'Could not sync all classroom records right now. Check your connection or tap Retry.'
      );
    };

    if (seededUidRef.current !== uid) {
      seededUidRef.current = uid;
      void seedInitialSchoolDataIfNeeded(uid, isAdmin).catch(() => {});
    }

    const unsubOwnMember = subscribeToMemberProfile(
      uid,
      (member) => {
        setOwnMember(member);
        setMemberLoaded(true);
        setSyncError(null);
      },
      () => {
        setMemberLoaded(true);
        handleSyncError();
      }
    );
    const unsubPrivate = subscribeToUserPrivate(
      uid,
      email,
      setUserPrivate,
      handleSyncError
    );
    const unsubMembers = subscribeToMembers(setMembers, handleSyncError);
    const unsubPosts = subscribeToPosts(setPosts, handleSyncError);
    const unsubLessons = subscribeToLessons(setLessons, handleSyncError);
    const unsubEvents = subscribeToEvents(setEvents, handleSyncError);
    const unsubFriends = subscribeToFriendRequests(
      uid,
      setFriendRequests,
      handleSyncError
    );

    return () => {
      unsubOwnMember();
      unsubPrivate();
      unsubMembers();
      unsubPosts();
      unsubLessons();
      unsubEvents();
      unsubFriends();
    };
  }, [firebaseUser, syncRetryNonce]);

  const isAppOwner = Boolean(
    firebaseUser && isBootstrappedAdminEmail(firebaseUser.email)
  );
  const isApprovedTeacherUser = Boolean(
    ownMember && isApprovedFacultyTeacher(ownMember)
  );
  const isTeacherMonitor = Boolean(
    isAppOwner || (ownMember && isTeacherMonitorMember(ownMember))
  );
  const canManageEvents = Boolean(isAppOwner || isApprovedTeacherUser);

  const syncedOwnerBadgeUidRef = useRef<string | null>(null);
  useEffect(() => {
    if (!firebaseUser || !isAppOwner || !ownMember) return;
    if (ownMember.isOwner) return;
    if (syncedOwnerBadgeUidRef.current === ownMember.id) return;
    syncedOwnerBadgeUidRef.current = ownMember.id;
    ensureOwnerBadgeDoc(ownMember.id).catch((err) => {
      syncedOwnerBadgeUidRef.current = null;
      console.error('Failed to sync owner badge flag:', err);
    });
  }, [firebaseUser, isAppOwner, ownMember]);

  // Reports & Warnings subscriptions (scoped by role)
  useEffect(() => {
    if (!firebaseUser || !ownMember) return;
    if (
      ownMember.role === UserRole.TEACHER &&
      (isTeacherAccountPendingApproval(ownMember) ||
        isTeacherAccountRejected(ownMember))
    ) {
      return;
    }

    const handleModerationSyncError = () => {
      setSyncError(
        'Could not load classroom moderation updates right now. Tap Retry to reconnect.'
      );
    };

    const unsubReports = subscribeToReports(
      firebaseUser.uid,
      isTeacherMonitor,
      setReports,
      handleModerationSyncError
    );
    const unsubWarnings = subscribeToWarnings(
      firebaseUser.uid,
      isTeacherMonitor,
      setWarnings,
      handleModerationSyncError
    );

    return () => {
      unsubReports();
      unsubWarnings();
    };
  }, [firebaseUser, ownMember, isTeacherMonitor, syncRetryNonce]);

  // Document title sync with Pomodoro timer
  useEffect(() => {
    if (ownMember?.role !== UserRole.TEACHER && pomodoro.isRunning) {
      const mins = Math.floor(pomodoro.secondsRemaining / 60);
      const secs = pomodoro.secondsRemaining % 60;
      const clock = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      const label = pomodoro.phase === 'focus' ? 'Focus' : 'Pause';
      document.title = `${clock} · ${label} — StudyCommons`;
      return;
    }
    document.title = 'StudyCommons — Collaborative Classroom Study & Q&A';
  }, [
    ownMember?.role,
    pomodoro.isRunning,
    pomodoro.secondsRemaining,
    pomodoro.phase,
  ]);

  // Pomodoro timer countdown loop
  useEffect(() => {
    if (!pomodoro.isRunning || pomodoro.targetEndTime === null) return;

    const completeOrTick = () => {
      const nowMs = Date.now();
      const target = pomodoro.targetEndTime ?? nowMs;
      const remaining = Math.max(0, Math.ceil((target - nowMs) / 1000));

      if (remaining <= 0) {
        if (!isTimerMuted) {
          playStudyTimerChime();
        }
        setPomodoro((prev) => {
          if (!prev.isRunning) return prev;
          if (prev.phase === 'focus') {
            const nextSessions = prev.completedFocusSessions + 1;
            const nextPhase: PomodoroPhase =
              nextSessions % 4 === 0 ? 'longBreak' : 'shortBreak';
            return {
              ...prev,
              phase: nextPhase,
              secondsRemaining: getPhaseDurationSeconds(
                nextPhase,
                prev.cadenceId
              ),
              isRunning: false,
              targetEndTime: null,
              completedFocusSessions: nextSessions,
              lastCompletedPhase: 'focus',
            };
          }
          return {
            ...prev,
            phase: 'focus',
            secondsRemaining: getPhaseDurationSeconds('focus', prev.cadenceId),
            isRunning: false,
            targetEndTime: null,
            lastCompletedPhase: prev.phase,
          };
        });
        return;
      }

      setPomodoro((prev) =>
        prev.secondsRemaining === remaining
          ? prev
          : { ...prev, secondsRemaining: remaining }
      );
    };

    completeOrTick();
    const intervalId = window.setInterval(completeOrTick, 250);
    return () => window.clearInterval(intervalId);
  }, [pomodoro.isRunning, pomodoro.targetEndTime, isTimerMuted]);

  // Sync daily study streak once per day to /userPrivate/{uid}
  useEffect(() => {
    if (!firebaseUser || !ownMember || !userPrivate) return;
    if (ownMember.role === UserRole.TEACHER) return;

    const syncTodayVisit = () => {
      const currentStreakMap = { [ownMember.id]: userPrivate.streak };
      const { nextStreaks, changed } = recordDailyVisit(
        currentStreakMap,
        ownMember.id
      );
      if (!changed) return;
      const nextStreak = nextStreaks[ownMember.id];
      const syncKey = `${ownMember.id}:${nextStreak.lastOpenedDate}`;
      if (syncedStreakKeyRef.current === syncKey) return;
      syncedStreakKeyRef.current = syncKey;
      void saveUserPrivateFields(firebaseUser.uid, firebaseUser.email || '', {
        streak: nextStreak,
      }).catch(() => {});
    };

    syncTodayVisit();

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        syncTodayVisit();
      }
    };

    window.addEventListener('focus', syncTodayVisit);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    return () => {
      window.removeEventListener('focus', syncTodayVisit);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [firebaseUser, ownMember, userPrivate]);

  const bookmarks = useMemo(
    () => userPrivate?.bookmarks || [],
    [userPrivate?.bookmarks]
  );

  const memberReadMap = useMemo(
    () => userPrivate?.mailReads || {},
    [userPrivate?.mailReads]
  );

  const activeMemberStudyGoal = useMemo(
    () =>
      userPrivate?.studyGoal || {
        weeklyTarget: 4,
        completedLessonIds: [],
        updatedAt: Date.now(),
      },
    [userPrivate?.studyGoal]
  );

  const activeMemberStreak = useMemo(
    () =>
      userPrivate?.streak || {
        currentStreak: 1,
        longestStreak: 1,
        totalDaysOpened: 1,
        lastOpenedDate: '',
      },
    [userPrivate?.streak]
  );

  const activeMemberPersonalNotes = useMemo(
    () => userPrivate?.personalNotes || [],
    [userPrivate?.personalNotes]
  );

  const activeMemberReminders = useMemo(
    () => userPrivate?.reminders || [],
    [userPrivate?.reminders]
  );

  const dueReminders = useMemo(() => {
    if (!ownMember || ownMember.role === UserRole.TEACHER) return [];
    return activeMemberReminders
      .filter((r) => !r.isCompleted && r.dueAt <= currentTimeMs)
      .sort((a, b) => a.dueAt - b.dueAt);
  }, [ownMember, activeMemberReminders, currentTimeMs]);

  useEffect(() => {
    if (!firebaseUser || !ownMember || !userPrivate) return;
    if (ownMember.role === UserRole.TEACHER) return;
    const unnotified = activeMemberReminders.filter(
      (r) => !r.isCompleted && r.dueAt <= currentTimeMs && !r.notifiedAt
    );
    if (unnotified.length === 0) return;

    if (!isTimerMuted) {
      playStudyTimerChime();
    }
    const notifiedTimestamp = Date.now();
    const updatedReminders = activeMemberReminders.map((r) =>
      !r.isCompleted && r.dueAt <= currentTimeMs && !r.notifiedAt
        ? { ...r, notifiedAt: notifiedTimestamp }
        : r
    );
    void saveUserPrivateFields(firebaseUser.uid, firebaseUser.email || '', {
      reminders: updatedReminders,
    }).catch(() => {});
  }, [
    firebaseUser,
    ownMember,
    userPrivate,
    activeMemberReminders,
    currentTimeMs,
    isTimerMuted,
  ]);

  const activeThread = useMemo(
    () => posts.find((p) => p.id === openThreadId) || null,
    [posts, openThreadId]
  );

  const viewedProfileMember = useMemo(
    () => members.find((m) => m.id === viewedProfileMemberId) || null,
    [members, viewedProfileMemberId]
  );

  const ownLinkedAccount = useMemo<RegisteredAccount | null>(() => {
    if (!firebaseUser || !ownMember) return null;
    return {
      id: firebaseUser.uid,
      memberId: ownMember.id,
      name: ownMember.name,
      username: ownMember.username,
      avatarUrl: ownMember.avatarUrl,
      email: firebaseUser.email || '',
      passwordHash: '',
      role: ownMember.role,
      gradeOrDept: ownMember.gradeOrDept,
      section: ownMember.section,
      courseOrTrack: ownMember.courseOrTrack,
      club: ownMember.club,
      monitoredClub: ownMember.monitoredClub,
      focusSubject: ownMember.focusSubject,
      enrolledSubjects: ownMember.enrolledSubjects,
      taughtSubjects: ownMember.taughtSubjects,
      bio: ownMember.bio,
      createdAt: ownMember.createdAt || Date.now(),
      isDisabled: ownMember.isDisabled,
      disabledReason: ownMember.disabledReason,
      disabledAt: ownMember.disabledAt,
      disabledByMemberId: ownMember.disabledByMemberId,
      teacherApprovalStatus: ownMember.teacherApprovalStatus,
      teacherApprovedAt: ownMember.teacherApprovedAt,
      teacherApprovedByMemberId: ownMember.teacherApprovedByMemberId,
      teacherApprovalNote: ownMember.teacherApprovalNote,
      isOwner: Boolean(ownMember.isOwner || isAppOwner),
      isMonitor: ownMember.isMonitor,
      monitorGrantedAt: ownMember.monitorGrantedAt,
      monitorGrantedByMemberId: ownMember.monitorGrantedByMemberId,
    };
  }, [firebaseUser, ownMember, isAppOwner]);

  const viewedProfileStudyGoal = useMemo(() => {
    if (!viewedProfileMember) return null;
    if (ownMember && viewedProfileMember.id === ownMember.id) {
      return activeMemberStudyGoal;
    }
    return {
      weeklyTarget: 4,
      completedLessonIds: [],
      updatedAt: Date.now(),
    };
  }, [viewedProfileMember, ownMember, activeMemberStudyGoal]);

  const viewedProfileStreak = useMemo(() => {
    if (!viewedProfileMember) return null;
    if (ownMember && viewedProfileMember.id === ownMember.id) {
      return activeMemberStreak;
    }
    return {
      currentStreak: 1,
      longestStreak: 1,
      totalDaysOpened: 1,
      lastOpenedDate: '',
    };
  }, [viewedProfileMember, ownMember, activeMemberStreak]);

  const viewedLinkedAccount = useMemo(() => {
    if (!viewedProfileMember || !ownMember) return null;
    return viewedProfileMember.id === ownMember.id ? ownLinkedAccount : null;
  }, [viewedProfileMember, ownMember, ownLinkedAccount]);

  const selectedLesson = useMemo(
    () => lessons.find((l) => l.id === selectedLessonId) || null,
    [lessons, selectedLessonId]
  );

  const unreadMailCount = useMemo(() => {
    if (!ownMember) return 0;
    let count = 0;
    for (const post of posts) {
      if (post.authorId !== ownMember.id) continue;
      for (const reply of post.replies) {
        if (reply.authorId !== ownMember.id && !memberReadMap[reply.id]) {
          count += 1;
        }
      }
    }
    return count;
  }, [posts, ownMember, memberReadMap]);

  const isActiveUserDisabled = Boolean(ownMember?.isDisabled);

  const upcomingEventsCount = useMemo(
    () =>
      events.filter((ev) => ev.startsAt >= currentTimeMs - 2 * 60 * 60 * 1000)
        .length,
    [events, currentTimeMs]
  );

  const activeMemberFriendsCount = useMemo(
    () => (ownMember ? getFriendsForMember(friendRequests, ownMember.id).length : 0),
    [friendRequests, ownMember]
  );

  const pendingFriendRequestsCount = useMemo(
    () =>
      ownMember
        ? getIncomingFriendRequests(friendRequests, ownMember.id).length
        : 0,
    [friendRequests, ownMember]
  );

  const pendingReportsCount = useMemo(
    () => reports.filter((r) => r.status === ReportStatus.PENDING).length,
    [reports]
  );

  const pendingTeacherApprovalsCount = useMemo(
    () => members.filter((m) => isTeacherAccountPendingApproval(m)).length,
    [members]
  );

  const pendingReportsByPostId = useMemo(() => {
    const map = new Map<string, number>();
    for (const report of reports) {
      if (report.status !== ReportStatus.PENDING) continue;
      map.set(report.postId, (map.get(report.postId) || 0) + 1);
    }
    return map;
  }, [reports]);

  const reportedKeys = useMemo(() => {
    const set = new Set<string>();
    if (!ownMember) return set;
    for (const report of reports) {
      if (
        report.status === ReportStatus.PENDING &&
        report.reporterId === ownMember.id
      ) {
        if (report.targetType === ReportTargetType.POST) {
          set.add(`post:${report.postId}`);
        } else if (report.replyId) {
          set.add(`reply:${report.replyId}`);
        }
      }
    }
    return set;
  }, [reports, ownMember]);

  const activeMemberWarnings = useMemo(
    () =>
      ownMember ? getActiveWarningsForMember(warnings, ownMember.id) : [],
    [warnings, ownMember]
  );

  const viewedMemberWarnings = useMemo(
    () =>
      viewedProfileMember
        ? getActiveWarningsForMember(warnings, viewedProfileMember.id)
        : [],
    [warnings, viewedProfileMember]
  );

  const triggerWarningStampEffect = (effect: WarningStampEffect) => {
    if (warningStampTimerRef.current !== null) {
      window.clearTimeout(warningStampTimerRef.current);
    }
    setWarningStampEffect(effect);
    warningStampTimerRef.current = window.setTimeout(() => {
      setWarningStampEffect(null);
      warningStampTimerRef.current = null;
    }, 1850);
  };

  useEffect(() => {
    return () => {
      if (warningStampTimerRef.current !== null) {
        window.clearTimeout(warningStampTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!ownMember) return;
    const highSeverityWarning = activeMemberWarnings.find(
      (w) =>
        !w.acknowledgedAt &&
        (w.level === WarningLevel.MID || w.level === WarningLevel.CRITICAL)
    );
    if (!highSeverityWarning) return;
    const stampKey = `${ownMember.id}:${highSeverityWarning.id}`;
    if (shownWarningStampKeysRef.current.has(stampKey)) return;
    shownWarningStampKeysRef.current.add(stampKey);
    triggerWarningStampEffect({
      id: `${highSeverityWarning.id}-${Date.now()}`,
      level: highSeverityWarning.level as WarningLevel.MID | WarningLevel.CRITICAL,
      mode: 'received',
      reason: highSeverityWarning.reason,
      timestamp: highSeverityWarning.createdAt,
    });
  }, [ownMember, activeMemberWarnings]);

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const list = posts.filter((post) => {
      if (activeTab === NavTab.SAVED && !bookmarks.includes(post.id)) {
        return false;
      }
      if (selectedLessonId && post.lessonId !== selectedLessonId) {
        return false;
      }
      if (selectedSubject !== 'all' && post.subjectId !== selectedSubject) {
        return false;
      }
      if (selectedGrade !== 'all' && post.gradeLevel !== selectedGrade) {
        return false;
      }
      if (activeTab === NavTab.FEED) {
        if (feedFilter === FeedFilter.QUESTIONS && post.kind !== PostKind.QUESTION) {
          return false;
        }
        if (feedFilter === FeedFilter.IDEAS && post.kind !== PostKind.IDEA) {
          return false;
        }
        if (
          feedFilter === FeedFilter.UNANSWERED &&
          (post.kind !== PostKind.QUESTION ||
            post.replies.some((r) => r.isAccepted))
        ) {
          return false;
        }
      }

      if (query) {
        const lesson = lessons.find((l) => l.id === post.lessonId);
        const subject = SUBJECTS.find((s) => s.id === post.subjectId);
        const author = members.find((m) => m.id === post.authorId);
        const haystack = [
          post.title,
          post.body,
          post.formulaNote || '',
          post.gradeLevel || '',
          lesson?.title || '',
          lesson?.unitNumber || '',
          subject?.name || '',
          author?.name || '',
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });

    return [...list].sort((a, b) => {
      if (sortOrder === SortOrder.HELPFUL) {
        return b.upvoterIds.length - a.upvoterIds.length;
      }
      if (sortOrder === SortOrder.DISCUSSED) {
        return b.replies.length - a.replies.length;
      }
      return b.createdAt - a.createdAt;
    });
  }, [
    posts,
    activeTab,
    bookmarks,
    selectedLessonId,
    selectedSubject,
    selectedGrade,
    feedFilter,
    searchQuery,
    sortOrder,
    lessons,
    members,
  ]);

  // Auth Actions
  const handleGoogleSignIn = async (): Promise<string | null> => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
      return null;
    } catch (err) {
      const message = formatFirebaseAuthError(err);
      setAuthError(message);
      return message;
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleCompleteOnboarding = async (payload: {
    name: string;
    username: string;
    avatarUrl?: string;
    role: UserRole;
    gradeOrDept: string;
    section: string;
    courseOrTrack: string;
    club?: string;
    monitoredClub?: string;
    focusSubject: SubjectId;
    enrolledSubjects: SubjectId[];
    taughtSubjects?: SubjectId[];
  }): Promise<{ error?: string; pendingApproval?: boolean }> => {
    if (!firebaseUser) {
      return { error: 'Please sign in with Google first.' };
    }
    try {
      const result = await createMemberProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: payload.name,
        username: payload.username,
        avatarUrl: payload.avatarUrl,
        role: payload.role,
        gradeOrDept: payload.gradeOrDept,
        section: payload.section,
        courseOrTrack: payload.courseOrTrack,
        club: payload.club,
        monitoredClub: payload.monitoredClub,
        focusSubject: payload.focusSubject,
        enrolledSubjects: payload.enrolledSubjects,
        taughtSubjects: payload.taughtSubjects,
        isAdminUser: isBootstrappedAdminEmail(firebaseUser.email),
      });
      if (!result.pendingApproval) {
        setIsSettingsOpen(false);
        setViewedProfileMemberId(null);
        setActiveTab(NavTab.FEED);
      }
      return result;
    } catch (err) {
      return {
        error:
          err instanceof Error
            ? err.message
            : 'Could not save your StudyCommons profile.',
      };
    }
  };

  const handleSignOut = () => {
    setIsSettingsOpen(false);
    setOpenThreadId(null);
    setViewedProfileMemberId(null);
    setHasPassedWelcome(false);
    setAuthError(null);
    void signOutFirebase();
  };

  // Navigation & Profile Actions
  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    setOpenThreadId(null);
    setIsSettingsOpen(false);
    setViewedProfileMemberId(null);
  };

  const handleOpenAccountInfo = (memberId: string) => {
    setViewedProfileMemberId(memberId);
    setOpenThreadId(null);
    setIsSettingsOpen(false);
  };

  const handleOpenComposer = (
    kind: PostKind = PostKind.QUESTION,
    subjectId?: SubjectId,
    lessonId?: string
  ) => {
    if (isActiveUserDisabled || !ownMember) return;
    setComposerState({
      isOpen: true,
      kind,
      subjectId:
        subjectId ||
        (selectedSubject !== 'all' ? selectedSubject : SubjectId.BIOLOGY),
      lessonId: lessonId || selectedLessonId || undefined,
    });
  };

  const handleUpdateMemberAvatar = (memberId: string, avatarUrl: string) => {
    if (!ownMember || memberId !== ownMember.id) return;
    void updateMemberAvatarDoc(memberId, avatarUrl);
  };

  const handleUpdateMemberProfile = (
    memberId: string,
    updates: {
      username: string;
      gradeOrDept: string;
      section: string;
      courseOrTrack: string;
      club?: string;
      monitoredClub?: string;
      focusSubject: SubjectId;
      enrolledSubjects: SubjectId[];
      taughtSubjects?: SubjectId[];
      bio: string;
    }
  ) => {
    if (!ownMember || memberId !== ownMember.id) return;
    void updateMemberProfileDoc(
      memberId,
      ownMember.role === UserRole.TEACHER,
      updates
    );
  };

  // Posts & Replies Actions
  const handleCreatePost = (payload: {
    kind: PostKind;
    subjectId: SubjectId;
    lessonId: string;
    gradeLevel: GradeLevel;
    title: string;
    body: string;
    formulaNote?: string;
    includeLessonDiagram: boolean;
  }) => {
    if (isActiveUserDisabled || !ownMember) return;
    const lesson = lessons.find((l) => l.id === payload.lessonId);
    const postId = createId('post');
    void createPostDoc({
      id: postId,
      kind: payload.kind,
      subjectId: payload.subjectId,
      lessonId: payload.lessonId,
      gradeLevel: payload.gradeLevel,
      authorId: ownMember.id,
      title: payload.title,
      body: payload.body,
      formulaNote: payload.formulaNote,
      imageUrl: payload.includeLessonDiagram ? lesson?.diagramUrl : undefined,
      imageAlt: payload.includeLessonDiagram
        ? lesson?.diagramCaption || lesson?.title
        : undefined,
      upvoterIds: [ownMember.id],
      replies: [],
    });
    setActiveTab(NavTab.FEED);
    setOpenThreadId(postId);
  };

  const handleToggleUpvotePost = (postId: string) => {
    if (isActiveUserDisabled || !ownMember) return;
    const target = posts.find((p) => p.id === postId);
    if (!target) return;
    const exists = target.upvoterIds.includes(ownMember.id);
    const nextUpvoters = exists
      ? target.upvoterIds.filter((id) => id !== ownMember.id)
      : [...target.upvoterIds, ownMember.id];
    void updatePostInteractionDoc(postId, { upvoterIds: nextUpvoters });
  };

  const handleToggleBookmark = (postId: string) => {
    if (!firebaseUser) return;
    const nextBookmarks = bookmarks.includes(postId)
      ? bookmarks.filter((id) => id !== postId)
      : [...bookmarks, postId];
    void saveUserPrivateFields(firebaseUser.uid, firebaseUser.email || '', {
      bookmarks: nextBookmarks,
    });
  };

  const handleAddReply = (
    postId: string,
    body: string,
    formulaNote?: string
  ) => {
    if (isActiveUserDisabled || !ownMember) return;
    const target = posts.find((p) => p.id === postId);
    if (!target) return;
    const nextReplies: ReplyItem[] = [
      ...target.replies,
      {
        id: createId('reply'),
        authorId: ownMember.id,
        body,
        ...(formulaNote ? { formulaNote } : {}),
        createdAt: Date.now(),
        upvoterIds: [ownMember.id],
        isAccepted: false,
      },
    ];
    void updatePostInteractionDoc(postId, { replies: nextReplies });
  };

  const handleToggleUpvoteReply = (postId: string, replyId: string) => {
    if (isActiveUserDisabled || !ownMember) return;
    const target = posts.find((p) => p.id === postId);
    if (!target) return;
    const nextReplies = target.replies.map((reply) => {
      if (reply.id !== replyId) return reply;
      const exists = reply.upvoterIds.includes(ownMember.id);
      return {
        ...reply,
        upvoterIds: exists
          ? reply.upvoterIds.filter((id) => id !== ownMember.id)
          : [...reply.upvoterIds, ownMember.id],
      };
    });
    void updatePostInteractionDoc(postId, { replies: nextReplies });
  };

  const handleToggleAcceptReply = (postId: string, replyId: string) => {
    if (isActiveUserDisabled || !ownMember) return;
    const target = posts.find((p) => p.id === postId);
    if (!target) return;
    const nextReplies = target.replies.map((reply) => ({
      ...reply,
      isAccepted: reply.id === replyId ? !reply.isAccepted : false,
    }));
    void updatePostInteractionDoc(postId, { replies: nextReplies });
  };

  const handleDeletePost = (postId: string) => {
    if (!ownMember) return;
    void deletePostDoc(postId);
    if (firebaseUser && bookmarks.includes(postId)) {
      void saveUserPrivateFields(firebaseUser.uid, firebaseUser.email || '', {
        bookmarks: bookmarks.filter((id) => id !== postId),
      });
    }
    if (isTeacherMonitor) {
      for (const report of reports) {
        if (report.postId === postId && report.status === ReportStatus.PENDING) {
          void resolveReportDoc(
            report.id,
            ReportStatus.RESOLVED,
            ownMember.id,
            'Post deleted during moderation.'
          );
        }
      }
    }
    if (openThreadId === postId) {
      setOpenThreadId(null);
    }
  };

  const handleDeleteReply = (postId: string, replyId: string) => {
    if (!ownMember) return;
    const target = posts.find((p) => p.id === postId);
    if (target) {
      const nextReplies = target.replies.filter((r) => r.id !== replyId);
      void updatePostInteractionDoc(postId, { replies: nextReplies });
    }
    if (isTeacherMonitor) {
      for (const report of reports) {
        if (
          report.replyId === replyId &&
          report.status === ReportStatus.PENDING
        ) {
          void resolveReportDoc(
            report.id,
            ReportStatus.RESOLVED,
            ownMember.id,
            'Message deleted during moderation.'
          );
        }
      }
    }
  };

  // Reporting & Moderation Actions
  const handleOpenReportPost = (post: DiscussionPost) => {
    const targetAuthor = members.find((m) => m.id === post.authorId);
    setReportTarget({
      targetType: ReportTargetType.POST,
      postId: post.id,
      targetAuthorId: post.authorId,
      targetAuthorName: targetAuthor?.name || 'Classmate',
      contentSnapshot: `${post.title} — ${post.body}`,
      sourceLocation: openThreadId === post.id ? 'thread' : 'feed',
    });
  };

  const handleOpenReportReply = (
    post: DiscussionPost,
    reply: ReplyItem,
    sourceLocation: 'mail' | 'thread' = 'thread'
  ) => {
    const targetAuthor = members.find((m) => m.id === reply.authorId);
    setReportTarget({
      targetType: ReportTargetType.REPLY,
      postId: post.id,
      replyId: reply.id,
      targetAuthorId: reply.authorId,
      targetAuthorName: targetAuthor?.name || 'Classmate',
      contentSnapshot: reply.body,
      sourceLocation,
    });
  };

  const handleSubmitReport = (payload: {
    targetType: ReportTargetType;
    postId: string;
    replyId?: string;
    targetAuthorId: string;
    reason: string;
    details?: string;
    contentSnapshot: string;
    sourceLocation: 'feed' | 'thread' | 'mail';
  }) => {
    if (!ownMember || isActiveUserDisabled) return;
    void createReportDoc({
      id: createId('rep'),
      targetType: payload.targetType,
      postId: payload.postId,
      replyId: payload.replyId,
      targetAuthorId: payload.targetAuthorId,
      reporterId: ownMember.id,
      reason: payload.reason,
      details: payload.details,
      contentSnapshot: payload.contentSnapshot,
      status: ReportStatus.PENDING,
      sourceLocation: payload.sourceLocation,
    });
    const targetAuthor = members.find((m) => m.id === payload.targetAuthorId);
    setReportNotice(
      `Report sent to Teacher Monitor regarding ${
        targetAuthor?.name || 'this member'
      }'s ${
        payload.targetType === ReportTargetType.POST ? 'shared post' : 'message'
      }.`
    );
  };

  const handleIssueWarning = (payload: {
    targetMemberId: string;
    level: WarningLevel;
    reason: string;
    relatedContentPreview?: string;
  }) => {
    if (!ownMember || !isTeacherMonitor) return;
    void createWarningDoc({
      id: createId('warn'),
      targetMemberId: payload.targetMemberId,
      issuedByMemberId: ownMember.id,
      level: payload.level,
      reason: payload.reason,
      relatedContentPreview: payload.relatedContentPreview,
    });
  };

  const handleAcknowledgeWarning = (warningId: string) => {
    const nowTs = Date.now();
    const target = warnings.find((w) => w.id === warningId);
    void acknowledgeWarningDoc(warningId);
    if (
      target &&
      (target.level === WarningLevel.MID ||
        target.level === WarningLevel.CRITICAL)
    ) {
      triggerWarningStampEffect({
        id: `${target.id}-ack-${nowTs}`,
        level: target.level,
        mode: 'acknowledged',
        reason: target.reason,
        timestamp: nowTs,
      });
    }
  };

  const handleClearWarning = (warningId: string) => {
    if (!isTeacherMonitor) return;
    void clearWarningDoc(warningId);
  };

  const handleToggleDisableMember = (
    memberId: string,
    disable: boolean,
    reason?: string
  ) => {
    if (!ownMember || !isTeacherMonitor || memberId === ownMember.id) return;
    const targetMember = members.find((m) => m.id === memberId);
    if (
      !isAppOwner &&
      (targetMember?.role === UserRole.TEACHER || targetMember?.isMonitor)
    ) {
      return;
    }
    void toggleDisableMemberDoc(memberId, disable, ownMember.id, reason);
  };

  const handleReviewTeacherApproval = (
    memberId: string,
    approve: boolean,
    note?: string,
    grantMonitor = false
  ) => {
    if (!ownMember || !isAppOwner) return;
    void reviewTeacherApprovalDoc(
      memberId,
      approve,
      ownMember.id,
      note,
      grantMonitor
    );
  };

  const handleToggleTeacherMonitor = (
    memberId: string,
    makeMonitor: boolean
  ) => {
    if (!ownMember || !isAppOwner) return;
    const targetMember = members.find((m) => m.id === memberId);
    if (!targetMember || targetMember.role !== UserRole.TEACHER) return;
    void toggleTeacherMonitorDoc(memberId, makeMonitor, ownMember.id);
  };

  const handleUpdateReportStatus = (
    reportId: string,
    status: ReportStatus,
    resolutionNote?: string
  ) => {
    if (!ownMember || !isTeacherMonitor) return;
    if (status === ReportStatus.PENDING) return;
    void resolveReportDoc(reportId, status, ownMember.id, resolutionNote);
  };

  // Lessons & Events Actions
  const handleAddLesson = (payload: {
    subjectId: SubjectId;
    unitNumber: string;
    title: string;
    summary: string;
    teacherName: string;
  }) => {
    if (!firebaseUser || isActiveUserDisabled) return;
    void createLessonDoc(
      {
        id: createId('lesson'),
        ...payload,
      },
      firebaseUser.uid
    );
  };

  const handleAddEvent = (payload: {
    title: string;
    description: string;
    category: SchoolEventCategory;
    subjectId: SubjectId | 'all';
    gradeLevel: GradeLevel | 'All Grades';
    startsAt: number;
    location: string;
    clubName?: string;
  }) => {
    if (!ownMember || !canManageEvents) return;
    void createEventDoc({
      id: createId('event'),
      title: payload.title,
      description: payload.description,
      category: payload.category,
      subjectId: payload.subjectId,
      gradeLevel: payload.gradeLevel,
      startsAt: payload.startsAt,
      location: payload.location,
      clubName: payload.clubName || undefined,
      createdByMemberId: ownMember.id,
      attendeeIds: [ownMember.id],
    });
  };

  const handleToggleEventRsvp = (eventId: string) => {
    if (isActiveUserDisabled || !ownMember) return;
    const ev = events.find((e) => e.id === eventId);
    if (!ev) return;
    const isGoing = ev.attendeeIds.includes(ownMember.id);
    const nextAttendees = isGoing
      ? ev.attendeeIds.filter((id) => id !== ownMember.id)
      : [...ev.attendeeIds, ownMember.id];
    void updateEventAttendeesDoc(eventId, nextAttendees);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (!canManageEvents) return;
    void deleteEventDoc(eventId);
  };

  const handleOpenEvents = (openComposer = false) => {
    setActiveTab(NavTab.EVENTS);
    setOpenThreadId(null);
    setIsSettingsOpen(false);
    setViewedProfileMemberId(null);
    setOpenEventComposerOnNavigate(Boolean(openComposer));
  };

  // Friends Actions
  const handleSendFriendRequest = (receiverId: string, note?: string) => {
    if (isActiveUserDisabled || !ownMember) return;
    if (!receiverId || receiverId === ownMember.id) return;

    const existing = getFriendRelation(
      friendRequests,
      ownMember.id,
      receiverId
    );
    if (existing.status !== 'none') return;

    void createFriendRequestDoc({
      id: createId('fr'),
      senderId: ownMember.id,
      receiverId,
      note: note?.trim() || undefined,
      status: FriendRequestStatus.PENDING,
    });
    const targetMember = members.find((m) => m.id === receiverId);
    setFriendNotice(
      targetMember
        ? `Friend request sent to ${targetMember.name}.`
        : 'Friend request sent.'
    );
  };

  const handleAcceptFriendRequest = (requestId: string) => {
    if (!ownMember || isActiveUserDisabled) return;
    const targetRequest = friendRequests.find(
      (r) =>
        r.id === requestId &&
        r.receiverId === ownMember.id &&
        r.status === FriendRequestStatus.PENDING
    );
    if (!targetRequest) return;

    void respondFriendRequestDoc(requestId, FriendRequestStatus.ACCEPTED);
    const sender = members.find((m) => m.id === targetRequest.senderId);
    setFriendNotice(
      sender
        ? `You and ${sender.name} are now study friends.`
        : 'Friend request accepted.'
    );
  };

  const handleDeclineFriendRequest = (requestId: string) => {
    if (!ownMember || isActiveUserDisabled) return;
    const targetRequest = friendRequests.find(
      (r) =>
        r.id === requestId &&
        r.receiverId === ownMember.id &&
        r.status === FriendRequestStatus.PENDING
    );
    if (!targetRequest) return;
    void respondFriendRequestDoc(requestId, FriendRequestStatus.DECLINED);
  };

  const handleCancelFriendRequest = (requestId: string) => {
    if (!ownMember) return;
    const targetRequest = friendRequests.find(
      (r) =>
        r.id === requestId &&
        r.senderId === ownMember.id &&
        r.status === FriendRequestStatus.PENDING
    );
    if (!targetRequest) return;
    void deleteFriendRequestDoc(requestId);
    setFriendNotice('Outgoing friend request cancelled.');
  };

  const handleRemoveFriend = (friendMemberId: string) => {
    if (!ownMember) return;
    const targetRequest = friendRequests.find(
      (r) =>
        r.status === FriendRequestStatus.ACCEPTED &&
        ((r.senderId === ownMember.id && r.receiverId === friendMemberId) ||
          (r.receiverId === ownMember.id && r.senderId === friendMemberId))
    );
    if (!targetRequest) return;
    void deleteFriendRequestDoc(targetRequest.id);
    const friendMember = members.find((m) => m.id === friendMemberId);
    setFriendNotice(
      friendMember
        ? `Removed ${friendMember.name} from your study friends.`
        : 'Study friend removed.'
    );
  };

  // User Private Data Actions
  const handleMarkMessageRead = (replyId: string) => {
    if (!firebaseUser) return;
    const readTimestamp = Date.now();
    void saveUserPrivateFields(firebaseUser.uid, firebaseUser.email || '', {
      mailReads: {
        ...memberReadMap,
        [replyId]: readTimestamp,
      },
    });
  };

  const handleMarkAllRead = (replyIds: string[]) => {
    if (!firebaseUser) return;
    const readTimestamp = Date.now();
    const nextReads = { ...memberReadMap };
    for (const id of replyIds) {
      nextReads[id] = readTimestamp;
    }
    void saveUserPrivateFields(firebaseUser.uid, firebaseUser.email || '', {
      mailReads: nextReads,
    });
  };

  const handleToggleLessonComplete = (
    lessonId: string,
    memberId?: string
  ) => {
    if (!firebaseUser || !ownMember) return;
    if (memberId && memberId !== ownMember.id) return;
    const exists = activeMemberStudyGoal.completedLessonIds.includes(lessonId);
    const nextCompleted = exists
      ? activeMemberStudyGoal.completedLessonIds.filter((id) => id !== lessonId)
      : [...activeMemberStudyGoal.completedLessonIds, lessonId];
    void saveUserPrivateFields(firebaseUser.uid, firebaseUser.email || '', {
      studyGoal: {
        ...activeMemberStudyGoal,
        completedLessonIds: nextCompleted,
        updatedAt: Date.now(),
      },
    });
  };

  const handleUpdateWeeklyTarget = (target: number, memberId?: string) => {
    if (!firebaseUser || !ownMember) return;
    if (memberId && memberId !== ownMember.id) return;
    const clampedTarget = Math.max(1, Math.min(12, Math.round(target)));
    void saveUserPrivateFields(firebaseUser.uid, firebaseUser.email || '', {
      studyGoal: {
        ...activeMemberStudyGoal,
        weeklyTarget: clampedTarget,
        updatedAt: Date.now(),
      },
    });
  };

  const handleAddPersonalNote = (
    content: string,
    subjectId: SubjectId | 'general'
  ) => {
    if (!firebaseUser) return;
    const nowTs = Date.now();
    const newNote: PersonalNote = {
      id: createId('pnote'),
      content,
      subjectId,
      createdAt: nowTs,
      updatedAt: nowTs,
    };
    void saveUserPrivateFields(firebaseUser.uid, firebaseUser.email || '', {
      personalNotes: [newNote, ...activeMemberPersonalNotes],
    });
  };

  const handleUpdatePersonalNote = (noteId: string, content: string) => {
    if (!firebaseUser) return;
    const nowTs = Date.now();
    void saveUserPrivateFields(firebaseUser.uid, firebaseUser.email || '', {
      personalNotes: activeMemberPersonalNotes.map((note) =>
        note.id === noteId ? { ...note, content, updatedAt: nowTs } : note
      ),
    });
  };

  const handleDeletePersonalNote = (noteId: string) => {
    if (!firebaseUser) return;
    void saveUserPrivateFields(firebaseUser.uid, firebaseUser.email || '', {
      personalNotes: activeMemberPersonalNotes.filter(
        (note) => note.id !== noteId
      ),
    });
  };

  const handleAddReminder = (
    title: string,
    subjectId: SubjectId | 'general',
    dueAt: number
  ) => {
    if (!firebaseUser) return;
    const nowTs = Date.now();
    const newReminder: StudyReminder = {
      id: createId('rem'),
      title,
      subjectId,
      dueAt,
      isCompleted: false,
      createdAt: nowTs,
    };
    void saveUserPrivateFields(firebaseUser.uid, firebaseUser.email || '', {
      reminders: [newReminder, ...activeMemberReminders],
    });
    setCurrentTimeMs(nowTs);
  };

  const handleToggleReminderComplete = (reminderId: string) => {
    if (!firebaseUser) return;
    void saveUserPrivateFields(firebaseUser.uid, firebaseUser.email || '', {
      reminders: activeMemberReminders.map((r) =>
        r.id === reminderId ? { ...r, isCompleted: !r.isCompleted } : r
      ),
    });
  };

  const handleSnoozeReminder = (reminderId: string, minutes = 15) => {
    if (!firebaseUser) return;
    const nowTs = Date.now();
    const nextDue = nowTs + minutes * 60 * 1000;
    void saveUserPrivateFields(firebaseUser.uid, firebaseUser.email || '', {
      reminders: activeMemberReminders.map((r) =>
        r.id === reminderId
          ? { ...r, dueAt: nextDue, isCompleted: false, notifiedAt: undefined }
          : r
      ),
    });
    setCurrentTimeMs(nowTs);
  };

  const handleDeleteReminder = (reminderId: string) => {
    if (!firebaseUser) return;
    void saveUserPrivateFields(firebaseUser.uid, firebaseUser.email || '', {
      reminders: activeMemberReminders.filter((r) => r.id !== reminderId),
    });
  };

  // Pomodoro Handlers
  const handleToggleTimerRun = () => {
    setPomodoro((prev) => {
      if (prev.isRunning) {
        const remaining =
          prev.targetEndTime !== null
            ? Math.max(0, Math.ceil((prev.targetEndTime - Date.now()) / 1000))
            : prev.secondsRemaining;
        return {
          ...prev,
          isRunning: false,
          targetEndTime: null,
          secondsRemaining: remaining,
        };
      }
      const duration =
        prev.secondsRemaining > 0
          ? prev.secondsRemaining
          : getPhaseDurationSeconds(prev.phase, prev.cadenceId);
      return {
        ...prev,
        isRunning: true,
        secondsRemaining: duration,
        targetEndTime: Date.now() + duration * 1000,
        lastCompletedPhase: null,
      };
    });
  };

  const handleResetTimer = () => {
    setPomodoro((prev) => ({
      ...prev,
      isRunning: false,
      targetEndTime: null,
      secondsRemaining: getPhaseDurationSeconds(prev.phase, prev.cadenceId),
      lastCompletedPhase: null,
    }));
  };

  const handleSelectTimerPhase = (phase: PomodoroPhase) => {
    setPomodoro((prev) => ({
      ...prev,
      phase,
      isRunning: false,
      targetEndTime: null,
      secondsRemaining: getPhaseDurationSeconds(phase, prev.cadenceId),
      lastCompletedPhase: null,
    }));
  };

  const handleSkipTimerPhase = () => {
    setPomodoro((prev) => {
      const nextPhase: PomodoroPhase =
        prev.phase === 'focus'
          ? (prev.completedFocusSessions + 1) % 4 === 0
            ? 'longBreak'
            : 'shortBreak'
          : 'focus';
      return {
        ...prev,
        phase: nextPhase,
        isRunning: false,
        targetEndTime: null,
        secondsRemaining: getPhaseDurationSeconds(nextPhase, prev.cadenceId),
        lastCompletedPhase: null,
      };
    });
  };

  const handleChangeTimerCadence = (cadenceId: PomodoroCadenceId) => {
    setPomodoro((prev) => ({
      ...prev,
      cadenceId,
      isRunning: false,
      targetEndTime: null,
      secondsRemaining: getPhaseDurationSeconds(prev.phase, cadenceId),
      lastCompletedPhase: null,
    }));
  };

  const showFeedWorkspace =
    activeTab === NavTab.FEED || activeTab === NavTab.SAVED;

  // Loading gate while Firebase Auth or Own Member Document initializes
  if (!authReady || (firebaseUser && !memberLoaded)) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--theme-canvas)] text-[#1C1917] dark:text-[#F7F3EA] p-6">
        <div className="heritage-card border rounded-xl p-6 sm:p-8 max-w-sm w-full text-center space-y-3">
          <p className="heritage-eyebrow">StudyCommons Cloud</p>
          <h1 className="font-display text-2xl font-semibold">
            Opening Study Hall...
          </h1>
          <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0]">
            Connecting your Google scholar session and real-time classroom ledger.
          </p>
          {slowMemberLoad && (
            <div className="pt-2 space-y-2.5">
              <p className="text-[11px] text-[#7C4A03] dark:text-[#FCD34D]">
                Taking longer than usual on this connection.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setSyncRetryNonce((n) => n + 1)}
                  className="px-3.5 py-2 text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md transition-colors"
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="px-3.5 py-2 text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] rounded-md transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Gate 1: Not signed in with Google yet
  if (!firebaseUser) {
    if (isSettingsOpen) {
      return (
        <div className="min-h-dvh flex flex-col bg-[var(--theme-canvas)] text-[#1C1917] dark:text-[#F7F3EA] transition-colors duration-150">
          <header className="bg-[#FFFDF8]/95 dark:bg-[#12100E]/95 backdrop-blur-md border-b border-[#E2D9C6] dark:border-[#3D362D]">
            <div className="max-w-[1200px] mx-auto px-3 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-2 sm:gap-8">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="font-display text-2xl font-bold tracking-[0.01em] text-[#1C1917] dark:text-[#F7F3EA] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent-text)] rounded"
              >
                StudyCommons
              </button>

              <span className="hidden sm:inline text-xs text-[#6B6155] dark:text-[#B8AFA0] whitespace-nowrap shrink-0">
                Theme & Appearance Settings
              </span>

              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                aria-label="Close settings page"
                aria-pressed={true}
                title="Settings"
                className="inline-flex items-center justify-center gap-1 w-10 h-10 rounded-lg sm:rounded-md border bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)] text-[var(--theme-accent-text)] transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent-text)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#12100E]"
              >
                <span className="w-1 h-1 rounded-full bg-current" aria-hidden="true" />
                <span className="w-1 h-1 rounded-full bg-current" aria-hidden="true" />
                <span className="w-1 h-1 rounded-full bg-current" aria-hidden="true" />
              </button>
            </div>
          </header>

          <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <SettingsView
              theme={theme}
              onUpdateTheme={setTheme}
              onBack={() => setIsSettingsOpen(false)}
              backLabel={hasPassedWelcome ? 'Back to Sign In' : 'Back to Welcome'}
            />
          </main>
        </div>
      );
    }

    if (!hasPassedWelcome) {
      return (
        <WelcomeView
          isSigningIn={isSigningIn}
          authError={authError}
          onContinueWithGoogle={(preferredRole) => {
            setAuthInitialRole(
              preferredRole === 'teacher' ? UserRole.TEACHER : UserRole.STUDENT
            );
            setHasPassedWelcome(true);
            void handleGoogleSignIn();
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      );
    }

    return (
      <AuthView
        firebaseUser={null}
        ownMember={null}
        initialRole={authInitialRole}
        isSigningIn={isSigningIn}
        authError={authError}
        onGoogleSignIn={handleGoogleSignIn}
        onCompleteOnboarding={handleCompleteOnboarding}
        onSignOut={handleSignOut}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onBackToWelcome={() => {
          setHasPassedWelcome(false);
          setAuthError(null);
        }}
      />
    );
  }

  // Gate 2: Signed in with Google, but onboarding incomplete OR Teacher waiting/rejected for Faculty Approval
  const isPendingOrDeclinedTeacher =
    ownMember &&
    (isTeacherAccountPendingApproval(ownMember) ||
      isTeacherAccountRejected(ownMember));

  if (!ownMember || isPendingOrDeclinedTeacher) {
    if (isSettingsOpen) {
      return (
        <div className="min-h-dvh flex flex-col bg-[var(--theme-canvas)] text-[#1C1917] dark:text-[#F7F3EA] transition-colors duration-150">
          <header className="bg-[#FFFDF8]/95 dark:bg-[#12100E]/95 backdrop-blur-md border-b border-[#E2D9C6] dark:border-[#3D362D]">
            <div className="max-w-[1200px] mx-auto px-3 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-2 sm:gap-8">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="font-display text-2xl font-bold tracking-[0.01em] text-[#1C1917] dark:text-[#F7F3EA] whitespace-nowrap shrink-0"
              >
                StudyCommons
              </button>
              <span className="hidden sm:inline text-xs text-[#6B6155] dark:text-[#B8AFA0] whitespace-nowrap shrink-0">
                Theme & Appearance Settings
              </span>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                aria-label="Close settings page"
                className="inline-flex items-center justify-center gap-1 w-10 h-10 rounded-lg sm:rounded-md border bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)] text-[var(--theme-accent-text)] transition-colors shrink-0"
              >
                <span className="w-1 h-1 rounded-full bg-current" aria-hidden="true" />
                <span className="w-1 h-1 rounded-full bg-current" aria-hidden="true" />
                <span className="w-1 h-1 rounded-full bg-current" aria-hidden="true" />
              </button>
            </div>
          </header>
          <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <SettingsView
              theme={theme}
              onUpdateTheme={setTheme}
              onBack={() => setIsSettingsOpen(false)}
              backLabel={
                ownMember ? 'Back to Approval Status' : 'Back to Profile Setup'
              }
            />
          </main>
        </div>
      );
    }

    return (
      <AuthView
        firebaseUser={{
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Scholar',
          photoURL: firebaseUser.photoURL || undefined,
        }}
        ownMember={ownMember}
        initialRole={authInitialRole}
        isSigningIn={isSigningIn}
        authError={syncError || authError}
        onGoogleSignIn={handleGoogleSignIn}
        onCompleteOnboarding={handleCompleteOnboarding}
        onSignOut={handleSignOut}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
    );
  }

  const activeMember = ownMember;

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--theme-canvas)] text-[#1C1917] dark:text-[#F7F3EA] transition-colors duration-150">
      <TopBar
        activeTab={activeTab}
        unreadMailCount={unreadMailCount}
        pendingReportsCount={
          pendingReportsCount + (isAppOwner ? pendingTeacherApprovalsCount : 0)
        }
        upcomingEventsCount={upcomingEventsCount}
        pendingFriendRequestsCount={pendingFriendRequestsCount}
        isTeacherMonitor={isTeacherMonitor}
        isAppOwner={isAppOwner}
        isAccountDisabled={isActiveUserDisabled}
        isSettingsOpen={isSettingsOpen}
        activeSettingsSection={settingsSection}
        activeMemberName={activeMember.name}
        isSignedIn={true}
        onSelectTab={handleSelectTab}
        onOpenComposer={() => {
          setIsSettingsOpen(false);
          setViewedProfileMemberId(null);
          handleOpenComposer(PostKind.QUESTION);
        }}
        onOpenSettingsSection={(section) => {
          setSettingsSection(section);
          setIsSettingsOpen(true);
          setViewedProfileMemberId(null);
        }}
        onLogOut={handleSignOut}
      />

      {isSettingsOpen ? (
        <main className="flex-1 w-full max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-5 pb-24 md:py-8">
          <SettingsView
            theme={theme}
            onUpdateTheme={setTheme}
            onBack={() => setIsSettingsOpen(false)}
            canManageAccount
            activeSection={settingsSection}
            onChangeSection={setSettingsSection}
            activeMember={activeMember}
            isAppOwner={isAppOwner}
            allMembers={members}
            linkedAccount={ownLinkedAccount}
            onUpdateMemberAvatar={handleUpdateMemberAvatar}
            onUpdateMemberProfile={handleUpdateMemberProfile}
            onViewAccountDossier={(memberId) => {
              setIsSettingsOpen(false);
              handleOpenAccountInfo(memberId);
            }}
            onLogOut={handleSignOut}
          />
        </main>
      ) : viewedProfileMember && viewedProfileStudyGoal && viewedProfileStreak ? (
        <main className="flex-1 w-full max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-5 pb-24 md:py-8">
          <AccountInfoView
            member={viewedProfileMember}
            allMembers={members}
            linkedAccount={viewedLinkedAccount}
            activeMemberId={activeMember.id}
            posts={posts}
            lessons={lessons}
            studyGoal={viewedProfileStudyGoal}
            memberStreak={viewedProfileStreak}
            activeWarnings={viewedMemberWarnings}
            isViewerTeacher={isTeacherMonitor}
            isAppOwner={isAppOwner}
            friendRequests={friendRequests}
            isViewerDisabled={isActiveUserDisabled}
            onSendFriendRequest={handleSendFriendRequest}
            onAcceptFriendRequest={handleAcceptFriendRequest}
            onDeclineFriendRequest={handleDeclineFriendRequest}
            onCancelFriendRequest={handleCancelFriendRequest}
            onRemoveFriend={handleRemoveFriend}
            onOpenFriendsPage={() => {
              setViewedProfileMemberId(null);
              handleSelectTab(NavTab.FRIENDS);
            }}
            onIssueWarning={(memberId, level, reason) =>
              handleIssueWarning({ targetMemberId: memberId, level, reason })
            }
            onClearWarning={handleClearWarning}
            onAcknowledgeWarning={handleAcknowledgeWarning}
            onToggleDisableMember={handleToggleDisableMember}
            onReviewTeacherApproval={handleReviewTeacherApproval}
            onToggleTeacherMonitor={handleToggleTeacherMonitor}
            onToggleLessonComplete={(lessonId) =>
              handleToggleLessonComplete(lessonId, viewedProfileMember.id)
            }
            onUpdateWeeklyTarget={(target) =>
              handleUpdateWeeklyTarget(target, viewedProfileMember.id)
            }
            onBack={() => setViewedProfileMemberId(null)}
            onSelectMemberToView={(id) => setViewedProfileMemberId(id)}
            onSwitchActiveProfile={() => {}}
            onOpenThread={(postId) => {
              setViewedProfileMemberId(null);
              setOpenThreadId(postId);
            }}
            onOpenAccountSettings={() => {
              setViewedProfileMemberId(null);
              setSettingsSection(SettingsSection.ACCOUNT);
              setIsSettingsOpen(true);
            }}
          />
        </main>
      ) : (
        <main className="flex-1 w-full max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 pt-4 pb-24 md:py-8">
          {syncError && (
            <div
              role="alert"
              className="mb-4 rounded-xl sm:rounded-lg border border-[#E5C9C5] dark:border-[#7F3232] bg-[#FAF3F1] dark:bg-[#2D1414] p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <AlertTriangle
                  className="w-4 h-4 text-[#7C1D1D] dark:text-[#FCA5A5] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <p className="text-xs text-[#7C1D1D] dark:text-[#FCA5A5] leading-relaxed">
                  {syncError}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSyncError(null);
                    setSyncRetryNonce((n) => n + 1);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md transition-colors whitespace-nowrap"
                >
                  Retry Sync
                </button>
                <button
                  type="button"
                  onClick={() => setSyncError(null)}
                  aria-label="Dismiss sync warning"
                  className="p-1 text-[#7C1D1D] dark:text-[#FCA5A5] hover:opacity-75"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {isActiveUserDisabled && (
            <div
              role="alert"
              className="mb-4 rounded-xl sm:rounded-lg border border-[#E5C9C5] dark:border-[#7F3232] bg-[#FAF3F1] dark:bg-[#2D1414] p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <Ban
                  className="w-4 h-4 text-[#7C1D1D] dark:text-[#FCA5A5] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#7C1D1D] dark:text-[#FCA5A5]">
                    Account Disabled by Teacher Monitor
                  </p>
                  <p className="text-xs text-[#443D34] dark:text-[#E0D8CA] mt-0.5">
                    {activeMember.disabledReason ||
                      'Your account is currently disabled from posting or replying until a teacher turns it back on.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#E5C9C5] dark:border-[#7F3232] rounded-md transition-colors whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          {activeMemberWarnings.length > 0 && (() => {
            const topWarning = activeMemberWarnings[0];
            const display = getWarningLevelDisplay(topWarning.level);
            const WarnIcon =
              topWarning.level === WarningLevel.CRITICAL
                ? AlertOctagon
                : topWarning.level === WarningLevel.MID
                  ? AlertTriangle
                  : Info;
            return (
              <div
                role="status"
                className={`mb-4 rounded-xl sm:rounded-lg border p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 ${display.panelClass}`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <WarnIcon
                    className={`w-4 h-4 shrink-0 mt-0.5 ${display.textClass}`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold ${display.textClass}`}>
                      {display.label} Account Warning
                      {activeMemberWarnings.length > 1
                        ? ` (${activeMemberWarnings.length} active)`
                        : ''}
                    </p>
                    <p className="text-xs text-[#1C1917] dark:text-[#F7F3EA] mt-0.5">
                      {topWarning.reason}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {(topWarning.level === WarningLevel.MID ||
                    topWarning.level === WarningLevel.CRITICAL) && (
                    <button
                      type="button"
                      onClick={() =>
                        triggerWarningStampEffect({
                          id: `${topWarning.id}-manual-${Date.now()}`,
                          level: topWarning.level as
                            | WarningLevel.MID
                            | WarningLevel.CRITICAL,
                          mode: topWarning.acknowledgedAt
                            ? 'acknowledged'
                            : 'received',
                          reason: topWarning.reason,
                          timestamp:
                            topWarning.acknowledgedAt || topWarning.createdAt,
                        })
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap ${display.badgeClass}`}
                    >
                      <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Stamp Check</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenAccountInfo(activeMember.id)}
                    className="px-3 py-1.5 text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] rounded-md transition-colors whitespace-nowrap"
                  >
                    View Details
                  </button>
                  {!topWarning.acknowledgedAt && (
                    <button
                      type="button"
                      onClick={() => handleAcknowledgeWarning(topWarning.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md transition-colors whitespace-nowrap"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {isAppOwner &&
            pendingTeacherApprovalsCount > 0 &&
            activeTab !== NavTab.MONITOR && (
              <div
                role="status"
                className="mb-4 rounded-xl sm:rounded-lg border border-[var(--theme-accent-border)] bg-[var(--theme-accent-soft)] p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <ShieldCheck
                    className="w-4 h-4 text-[var(--theme-accent-text)] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--theme-accent-text)]">
                      Owner Approval Required · {pendingTeacherApprovalsCount}{' '}
                      New Teacher{' '}
                      {pendingTeacherApprovalsCount === 1
                        ? 'Account'
                        : 'Accounts'}
                    </p>
                    <p className="text-xs text-[#443D34] dark:text-[#E0D8CA] mt-0.5">
                      Review new teacher registrations and choose which approved teachers receive Monitor access.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMonitorTabRequest({
                      tab: 'approvals',
                      nonce: Date.now(),
                    });
                    handleSelectTab(NavTab.MONITOR);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Manage Teachers & Monitors</span>
                </button>
              </div>
            )}

          {isTeacherMonitor &&
            pendingReportsCount > 0 &&
            activeTab !== NavTab.MONITOR && (
              <div
                role="status"
                className="mb-4 rounded-xl sm:rounded-lg border border-[#E5C98B] dark:border-[#78571D] bg-[#FEF7E8] dark:bg-[#2B2110] p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <ShieldAlert
                    className="w-4 h-4 text-[#7C4A03] dark:text-[#FCD34D] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#7C4A03] dark:text-[#FCD34D]">
                      Teacher Monitor Notification · {pendingReportsCount}{' '}
                      {pendingReportsCount === 1
                        ? 'Pending Report'
                        : 'Pending Reports'}
                    </p>
                    <p className="text-xs text-[#443D34] dark:text-[#E0D8CA] mt-0.5">
                      Students flagged shared posts or messages for your review.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectTab(NavTab.MONITOR)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Open Teacher Monitor</span>
                </button>
              </div>
            )}

          {reportNotice && (
            <div
              role="status"
              className="mb-4 rounded-xl sm:rounded-lg border border-[#B8D7C0] dark:border-[#2F6842] bg-[#EFF7F1] dark:bg-[#13291B] p-3.5 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2 min-w-0 text-xs font-medium text-[#1F4E2E] dark:text-[#86EFAC]">
                <Flag className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{reportNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setReportNotice(null)}
                aria-label="Dismiss report confirmation"
                className="p-1 text-[#1F4E2E] dark:text-[#86EFAC] hover:opacity-75 shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {friendNotice && (
            <div
              role="status"
              className="mb-4 rounded-xl sm:rounded-lg border border-[var(--theme-accent-border)] bg-[var(--theme-accent-soft)] p-3.5 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2 min-w-0 text-xs font-medium text-[var(--theme-accent-text)]">
                <UserPlus className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{friendNotice}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {activeTab !== NavTab.FRIENDS && (
                  <button
                    type="button"
                    onClick={() => handleSelectTab(NavTab.FRIENDS)}
                    className="text-xs font-semibold text-[var(--theme-accent-text)] hover:underline whitespace-nowrap"
                  >
                    Open Friends
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFriendNotice(null)}
                  aria-label="Dismiss friend update"
                  className="p-1 text-[var(--theme-accent-text)] hover:opacity-75 shrink-0"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {ownMember.role !== UserRole.TEACHER && dueReminders.length > 0 && (
            <div
              role="status"
              aria-live="polite"
              className="mb-4 heritage-card border border-[var(--theme-accent-border)] bg-[var(--theme-accent-soft)] rounded-xl sm:rounded-lg p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <BellRing
                  className="w-4 h-4 text-[var(--theme-accent-text)] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--theme-accent-text)]">
                    Study Reminder Due ({dueReminders.length})
                  </p>
                  <p className="text-sm font-medium text-[#1C1917] dark:text-[#F7F3EA] truncate">
                    {dueReminders[0].title}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSnoozeReminder(dueReminders[0].id, 15)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] rounded-md transition-colors whitespace-nowrap"
                >
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Snooze 15m</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleToggleReminderComplete(dueReminders[0].id)
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md transition-colors whitespace-nowrap"
                >
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Mark Done</span>
                </button>
              </div>
            </div>
          )}

          <MobileWorkspaceBar
            members={members}
            activeMember={activeMember}
            isAppOwner={isAppOwner}
            posts={posts}
            lessons={lessons}
            studyGoal={activeMemberStudyGoal}
            memberStreak={activeMemberStreak}
            friendsCount={activeMemberFriendsCount}
            pendingFriendRequestsCount={pendingFriendRequestsCount}
            onOpenFriends={() => handleSelectTab(NavTab.FRIENDS)}
            selectedSubject={selectedSubject}
            selectedGrade={selectedGrade}
            selectedLessonId={selectedLessonId}
            showFeedFilters={showFeedWorkspace && !activeThread}
            onOpenAccountInfo={handleOpenAccountInfo}
            onToggleLessonComplete={(lessonId) =>
              handleToggleLessonComplete(lessonId, activeMember.id)
            }
            onUpdateWeeklyTarget={(target) =>
              handleUpdateWeeklyTarget(target, activeMember.id)
            }
            pomodoro={pomodoro}
            isTimerMuted={isTimerMuted}
            onToggleTimerMute={() => setIsTimerMuted((v) => !v)}
            onToggleTimerRun={handleToggleTimerRun}
            onResetTimer={handleResetTimer}
            onSelectTimerPhase={handleSelectTimerPhase}
            onSkipTimerPhase={handleSkipTimerPhase}
            onChangeTimerCadence={handleChangeTimerCadence}
            personalNotes={activeMemberPersonalNotes}
            onAddPersonalNote={handleAddPersonalNote}
            onUpdatePersonalNote={handleUpdatePersonalNote}
            onDeletePersonalNote={handleDeletePersonalNote}
            reminders={activeMemberReminders}
            currentTimeMs={currentTimeMs}
            onAddReminder={handleAddReminder}
            onToggleReminderComplete={handleToggleReminderComplete}
            onSnoozeReminder={handleSnoozeReminder}
            onDeleteReminder={handleDeleteReminder}
            onSignOut={handleSignOut}
            onSelectSubject={(subject) => {
              setSelectedSubject(subject);
              setOpenThreadId(null);
              setIsSettingsOpen(false);
              setViewedProfileMemberId(null);
              if (activeTab !== NavTab.FEED && activeTab !== NavTab.SAVED) {
                setActiveTab(NavTab.FEED);
              }
            }}
            onSelectGrade={(grade) => {
              setSelectedGrade(grade);
              setOpenThreadId(null);
              setIsSettingsOpen(false);
              setViewedProfileMemberId(null);
              if (activeTab !== NavTab.FEED && activeTab !== NavTab.SAVED) {
                setActiveTab(NavTab.FEED);
              }
            }}
            onClearLessonFilter={() => setSelectedLessonId(null)}
          />

          <div className="flex flex-col lg:flex-row items-start gap-8">
            <div className="hidden lg:block shrink-0">
              <Sidebar
                members={members}
                activeMember={activeMember}
                isAppOwner={isAppOwner}
                userEmail={firebaseUser.email}
                onOpenAccountInfo={handleOpenAccountInfo}
                onSignOut={handleSignOut}
                posts={posts}
                lessons={lessons}
                events={events}
                canManageEvents={canManageEvents}
                onOpenEvents={handleOpenEvents}
                friendRequests={friendRequests}
                onOpenFriends={() => handleSelectTab(NavTab.FRIENDS)}
                onAcceptFriendRequest={handleAcceptFriendRequest}
                onDeclineFriendRequest={handleDeclineFriendRequest}
                studyGoal={activeMemberStudyGoal}
                memberStreak={activeMemberStreak}
                onToggleLessonComplete={(lessonId) =>
                  handleToggleLessonComplete(lessonId, activeMember.id)
                }
                onUpdateWeeklyTarget={(target) =>
                  handleUpdateWeeklyTarget(target, activeMember.id)
                }
                pomodoro={pomodoro}
                isTimerMuted={isTimerMuted}
                onToggleTimerMute={() => setIsTimerMuted((v) => !v)}
                onToggleTimerRun={handleToggleTimerRun}
                onResetTimer={handleResetTimer}
                onSelectTimerPhase={handleSelectTimerPhase}
                onSkipTimerPhase={handleSkipTimerPhase}
                onChangeTimerCadence={handleChangeTimerCadence}
                personalNotes={activeMemberPersonalNotes}
                onAddPersonalNote={handleAddPersonalNote}
                onUpdatePersonalNote={handleUpdatePersonalNote}
                onDeletePersonalNote={handleDeletePersonalNote}
                reminders={activeMemberReminders}
                currentTimeMs={currentTimeMs}
                onAddReminder={handleAddReminder}
                onToggleReminderComplete={handleToggleReminderComplete}
                onSnoozeReminder={handleSnoozeReminder}
                onDeleteReminder={handleDeleteReminder}
                selectedSubject={selectedSubject}
                onSelectSubject={(subject) => {
                  setSelectedSubject(subject);
                  setOpenThreadId(null);
                  setIsSettingsOpen(false);
                  setViewedProfileMemberId(null);
                  if (
                    activeTab !== NavTab.FEED &&
                    activeTab !== NavTab.SAVED
                  ) {
                    setActiveTab(NavTab.FEED);
                  }
                }}
                selectedGrade={selectedGrade}
                onSelectGrade={(grade) => {
                  setSelectedGrade(grade);
                  setOpenThreadId(null);
                  setIsSettingsOpen(false);
                  setViewedProfileMemberId(null);
                  if (
                    activeTab !== NavTab.FEED &&
                    activeTab !== NavTab.SAVED
                  ) {
                    setActiveTab(NavTab.FEED);
                  }
                }}
                selectedLessonId={selectedLessonId}
                onClearLessonFilter={() => setSelectedLessonId(null)}
              />
            </div>

            <div className="flex-1 min-w-0 w-full">
              {activeThread ? (
                <ThreadDetail
                  post={activeThread}
                  members={members}
                  lessons={lessons}
                  activeMember={activeMember}
                  isTeacherMonitor={isTeacherMonitor}
                  isBookmarked={bookmarks.includes(activeThread.id)}
                  reportedKeys={reportedKeys}
                  onBack={() => setOpenThreadId(null)}
                  onToggleUpvotePost={handleToggleUpvotePost}
                  onToggleBookmark={handleToggleBookmark}
                  onAddReply={handleAddReply}
                  onToggleUpvoteReply={handleToggleUpvoteReply}
                  onToggleAcceptReply={handleToggleAcceptReply}
                  onDeletePost={handleDeletePost}
                  onDeleteReply={handleDeleteReply}
                  onOpenAuthorInfo={handleOpenAccountInfo}
                  onReportPost={handleOpenReportPost}
                  onReportReply={(post, reply) =>
                    handleOpenReportReply(post, reply, 'thread')
                  }
                  onOpenMonitor={() => handleSelectTab(NavTab.MONITOR)}
                />
              ) : activeTab === NavTab.EVENTS ? (
                <EventsView
                  events={events}
                  members={members}
                  activeMember={activeMember}
                  canManageEvents={canManageEvents}
                  currentTimeMs={currentTimeMs}
                  initialOpenComposer={openEventComposerOnNavigate}
                  onConsumeOpenComposer={() =>
                    setOpenEventComposerOnNavigate(false)
                  }
                  onAddEvent={handleAddEvent}
                  onToggleRsvp={handleToggleEventRsvp}
                  onDeleteEvent={handleDeleteEvent}
                  onOpenMemberInfo={handleOpenAccountInfo}
                />
              ) : activeTab === NavTab.LESSONS ? (
                <LessonsView
                  lessons={lessons}
                  posts={posts}
                  activeMember={activeMember}
                  onViewLessonFeed={(lesson) => {
                    setSelectedSubject(lesson.subjectId);
                    setSelectedLessonId(lesson.id);
                    setFeedFilter(FeedFilter.ALL);
                    setActiveTab(NavTab.FEED);
                  }}
                  onStartPostForLesson={(lesson, kind) =>
                    handleOpenComposer(kind, lesson.subjectId, lesson.id)
                  }
                  onAddLesson={handleAddLesson}
                />
              ) : activeTab === NavTab.MAIL ? (
                <MailView
                  posts={posts}
                  members={members}
                  lessons={lessons}
                  activeMember={activeMember}
                  memberReadMap={memberReadMap}
                  reportedKeys={reportedKeys}
                  onMarkMessageRead={handleMarkMessageRead}
                  onMarkAllRead={handleMarkAllRead}
                  onOpenThread={(postId) => {
                    setOpenThreadId(postId);
                  }}
                  onAskQuestion={() => handleOpenComposer(PostKind.QUESTION)}
                  onReportReply={(post, reply, source) =>
                    handleOpenReportReply(post, reply, source || 'mail')
                  }
                />
              ) : activeTab === NavTab.FRIENDS ? (
                <FriendsView
                  members={members}
                  activeMember={activeMember}
                  friendRequests={friendRequests}
                  isActiveUserDisabled={isActiveUserDisabled}
                  onSendFriendRequest={handleSendFriendRequest}
                  onAcceptFriendRequest={handleAcceptFriendRequest}
                  onDeclineFriendRequest={handleDeclineFriendRequest}
                  onCancelFriendRequest={handleCancelFriendRequest}
                  onRemoveFriend={handleRemoveFriend}
                  onOpenMemberInfo={handleOpenAccountInfo}
                />
              ) : activeTab === NavTab.CONTRIBUTORS ? (
                <ContributorsView
                  members={members}
                  posts={posts}
                  activeMemberId={activeMember.id}
                  warnings={warnings}
                  isViewerTeacher={isTeacherMonitor}
                  isAppOwner={isAppOwner}
                  friendRequests={friendRequests}
                  isActiveUserDisabled={isActiveUserDisabled}
                  onOpenFriendsPage={() => handleSelectTab(NavTab.FRIENDS)}
                  onSendFriendRequest={handleSendFriendRequest}
                  onAcceptFriendRequest={handleAcceptFriendRequest}
                  onDeclineFriendRequest={handleDeclineFriendRequest}
                  onCancelFriendRequest={handleCancelFriendRequest}
                  onOpenMonitor={() => handleSelectTab(NavTab.MONITOR)}
                  onToggleDisableMember={handleToggleDisableMember}
                  onReviewTeacherApproval={handleReviewTeacherApproval}
                  onToggleTeacherMonitor={handleToggleTeacherMonitor}
                  onSwitchMember={() => {}}
                  onViewAccountInfo={handleOpenAccountInfo}
                />
              ) : activeTab === NavTab.MONITOR ? (
                isTeacherMonitor ? (
                  <TeacherMonitorView
                    activeMember={activeMember}
                    isAppOwner={isAppOwner}
                    members={members}
                    accounts={[]}
                    posts={posts}
                    reports={reports}
                    warnings={warnings}
                    events={events}
                    requestedTab={monitorTabRequest}
                    onOpenThread={(postId) => setOpenThreadId(postId)}
                    onOpenAccountInfo={handleOpenAccountInfo}
                    onDeletePost={handleDeletePost}
                    onDeleteReply={handleDeleteReply}
                    onIssueWarning={handleIssueWarning}
                    onClearWarning={handleClearWarning}
                    onToggleDisableMember={handleToggleDisableMember}
                    onReviewTeacherApproval={handleReviewTeacherApproval}
                    onToggleTeacherMonitor={handleToggleTeacherMonitor}
                    onUpdateReportStatus={handleUpdateReportStatus}
                    onAddEvent={handleAddEvent}
                    onDeleteEvent={handleDeleteEvent}
                    onOpenEventsPage={() => handleOpenEvents(false)}
                  />
                ) : (
                  <div className="heritage-card border rounded-lg p-8 text-center space-y-3">
                    <ShieldAlert
                      className="w-8 h-8 text-[#7C4A03] dark:text-[#FCD34D] mx-auto"
                      aria-hidden="true"
                    />
                    <h2 className="font-display text-2xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                      Teacher Monitor Access Only
                    </h2>
                    <p className="text-sm text-[#574F45] dark:text-[#CEC5B6] max-w-md mx-auto">
                      Only the App Owner (vincentcasintahancarl@gmail.com) and Owner-appointed Teacher Monitors can review reports, issue warnings, or moderate posts and accounts.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab(NavTab.FEED)}
                      className="px-4 py-2 text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md transition-colors"
                    >
                      Return to Feed
                    </button>
                  </div>
                )
              ) : (
                <div className="space-y-6">
                  {/* Editorial Classroom Intro Strip */}
                  {activeTab === NavTab.FEED &&
                    !selectedLesson &&
                    selectedSubject === 'all' &&
                    selectedGrade === 'all' &&
                    !searchQuery && (
                      <section className="heritage-card border rounded-xl sm:rounded-lg overflow-hidden grid grid-cols-1 md:grid-cols-12 items-stretch">
                        <div className="md:col-span-7 p-5 sm:p-8 flex flex-col justify-between gap-5 sm:gap-6">
                          <div>
                            <p className="heritage-eyebrow mb-2">
                              Classroom Commons · Autumn Term
                            </p>
                            <h1 className="font-display text-2xl sm:text-4xl font-semibold text-[#1C1917] dark:text-[#F7F3EA] leading-[1.15] text-balance">
                              Ask questions on lessons and share notes with your class.
                            </h1>
                            <p className="mt-2.5 sm:mt-3 text-sm text-[#574F45] dark:text-[#CEC5B6] leading-relaxed max-w-xl">
                              Work through difficult coursework together, exchange revision checklists, and build a lasting study archive across every department.
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                            <button
                              type="button"
                              disabled={isActiveUserDisabled}
                              onClick={() =>
                                handleOpenComposer(PostKind.QUESTION)
                              }
                              className="inline-flex items-center justify-center gap-2 px-4 min-h-[44px] sm:min-h-0 sm:py-2 text-sm font-medium text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg sm:rounded-md transition-colors whitespace-nowrap shrink-0 flex-1 sm:flex-initial"
                            >
                              <HelpCircle className="w-4 h-4" aria-hidden="true" />
                              <span>Ask a Question</span>
                            </button>
                            <button
                              type="button"
                              disabled={isActiveUserDisabled}
                              onClick={() => handleOpenComposer(PostKind.IDEA)}
                              className="inline-flex items-center justify-center gap-2 px-4 min-h-[44px] sm:min-h-0 sm:py-2 text-sm font-medium text-[#1C1917] dark:text-[#F7F3EA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg sm:rounded-md transition-colors whitespace-nowrap shrink-0 flex-1 sm:flex-initial"
                            >
                              <Lightbulb
                                className="w-4 h-4 text-[var(--theme-accent-text)]"
                                aria-hidden="true"
                              />
                              <span>Share Study Idea</span>
                            </button>
                          </div>
                        </div>

                        <div className="md:col-span-5 min-h-[160px] sm:min-h-[200px] bg-[#F5F0E6] dark:bg-[#1E1A16] border-t md:border-t-0 md:border-l border-[#E2D9C6] dark:border-[#3D362D]">
                          <ResilientImage
                            src={HERO_BANNER_IMAGE}
                            alt="Students studying together with open notebooks at a sunlit school library table"
                            fallbackTitle="School Study Table"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </section>
                    )}

                  {/* Saved Tab Heading */}
                  {activeTab === NavTab.SAVED && (
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="heritage-eyebrow mb-1">Personal Folios</p>
                        <h1 className="font-display text-3xl font-semibold text-[#1C1917] dark:text-[#F7F3EA] text-balance">
                          Saved for Exam Review
                        </h1>
                        <p className="mt-1 text-sm text-[#574F45] dark:text-[#CEC5B6]">
                          Bookmarked lesson questions, formulas, and study ideas.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Active Lesson Unit Banner */}
                  {selectedLesson && (
                    <div className="heritage-card border rounded-lg p-5 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-xs text-[#6B6155] dark:text-[#B8AFA0] flex items-center gap-2">
                          <span className="font-medium text-[#1C1917] dark:text-[#F7F3EA]">
                            {
                              SUBJECTS.find(
                                (s) => s.id === selectedLesson.subjectId
                              )?.name
                            }
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{selectedLesson.unitNumber}</span>
                        </div>
                        <h2 className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA] mt-0.5">
                          {selectedLesson.title}
                        </h2>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedLessonId(null)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] hover:bg-[#ECE5D5] dark:hover:bg-[#2C2721] rounded-md transition-colors whitespace-nowrap shrink-0"
                      >
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Show all lessons</span>
                      </button>
                    </div>
                  )}

                  {/* Workspace Toolbar */}
                  {showFeedWorkspace && (
                    <div className="heritage-card border rounded-xl sm:rounded-lg p-3.5 sm:p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                        <div className="relative flex-1">
                          <Search
                            className="w-4 h-4 text-[#8C7F6D] dark:text-[#9C9385] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                            aria-hidden="true"
                          />
                          <label htmlFor="feed-search" className="sr-only">
                            Search lesson questions and study ideas
                          </label>
                          <input
                            id="feed-search"
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search lessons, questions, formulas..."
                            className="w-full pl-10 pr-4 min-h-[42px] sm:min-h-0 sm:py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-lg sm:rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2 shrink-0">
                          <label htmlFor="sort-select" className="sr-only">
                            Sort posts
                          </label>
                          <select
                            id="sort-select"
                            value={sortOrder}
                            onChange={(e) =>
                              setSortOrder(e.target.value as SortOrder)
                            }
                            className="w-full sm:w-auto px-3 min-h-[42px] sm:min-h-0 sm:py-2 text-xs font-medium text-[#443D34] dark:text-[#F7F3EA] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-lg sm:rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
                          >
                            <option value={SortOrder.RECENT}>Most Recent</option>
                            <option value={SortOrder.HELPFUL}>
                              Most Helpful
                            </option>
                            <option value={SortOrder.DISCUSSED}>
                              Most Discussed
                            </option>
                          </select>
                        </div>
                      </div>

                      {activeTab === NavTab.FEED && (
                        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
                          <div className="flex items-center gap-1 p-1 bg-[#EFE8D9] dark:bg-[#24201B] border border-[#E2D9C6] dark:border-[#3D362D] rounded-lg sm:rounded-md overflow-x-auto no-scrollbar max-w-full">
                            {[
                              { id: FeedFilter.ALL, label: 'All Posts' },
                              { id: FeedFilter.QUESTIONS, label: 'Questions' },
                              { id: FeedFilter.IDEAS, label: 'Study Ideas' },
                              {
                                id: FeedFilter.UNANSWERED,
                                label: 'Needs Answer',
                              },
                            ].map((tab) => (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => setFeedFilter(tab.id)}
                                className={`px-3 min-h-[38px] sm:min-h-0 sm:py-1.5 text-xs font-medium rounded-md sm:rounded transition-colors whitespace-nowrap shrink-0 ${
                                  feedFilter === tab.id
                                    ? 'bg-[#FFFDF8] dark:bg-[#161412] text-[var(--theme-accent-text)] shadow-xs border border-[#E2D9C6] dark:border-[#3D362D]'
                                    : 'text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]'
                                }`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>

                          <span className="text-xs text-[#6B6155] dark:text-[#B8AFA0] font-mono tabular-nums ml-auto">
                            {filteredPosts.length}{' '}
                            {filteredPosts.length === 1 ? 'post' : 'posts'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feed List or Empty State */}
                  {filteredPosts.length === 0 ? (
                    <div className="heritage-card border rounded-lg p-10 text-center">
                      {activeTab === NavTab.SAVED ? (
                        <>
                          <Bookmark
                            className="w-7 h-7 text-[#8C6D3B] dark:text-[#D4B475] mx-auto mb-3"
                            aria-hidden="true"
                          />
                          <h2 className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                            No saved posts yet
                          </h2>
                          <p className="mt-1 text-sm text-[#574F45] dark:text-[#CEC5B6] max-w-md mx-auto">
                            Bookmark helpful explanations or study checklists in the feed to review them quickly before tests.
                          </p>
                          <button
                            type="button"
                            onClick={() => setActiveTab(NavTab.FEED)}
                            className="mt-5 px-4 py-2 text-sm font-medium text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md transition-colors"
                          >
                            Browse Lesson Feed
                          </button>
                        </>
                      ) : (
                        <>
                          <HelpCircle
                            className="w-7 h-7 text-[#8C6D3B] dark:text-[#D4B475] mx-auto mb-3"
                            aria-hidden="true"
                          />
                          <h2 className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                            No matching posts found
                          </h2>
                          <p className="mt-1 text-sm text-[#574F45] dark:text-[#CEC5B6] max-w-md mx-auto">
                            Try clearing your search or filter, or start a new discussion for this lesson topic.
                          </p>
                          <div className="mt-5 flex items-center justify-center gap-3">
                            {(searchQuery ||
                              selectedSubject !== 'all' ||
                              selectedGrade !== 'all' ||
                              selectedLessonId ||
                              feedFilter !== FeedFilter.ALL) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchQuery('');
                                  setSelectedSubject('all');
                                  setSelectedGrade('all');
                                  setSelectedLessonId(null);
                                  setFeedFilter(FeedFilter.ALL);
                                }}
                                className="px-4 py-2 text-sm font-medium text-[#443D34] dark:text-[#E0D8CA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] rounded-md transition-colors"
                              >
                                Clear Filters
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenComposer(PostKind.QUESTION)}
                              className="px-4 py-2 text-sm font-medium text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md transition-colors"
                            >
                              Ask a Question
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredPosts.map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          author={members.find((m) => m.id === post.authorId)}
                          lesson={lessons.find((l) => l.id === post.lessonId)}
                          activeMemberId={activeMember.id}
                          isBookmarked={bookmarks.includes(post.id)}
                          isReportedByMe={reportedKeys.has(`post:${post.id}`)}
                          pendingReportCount={
                            pendingReportsByPostId.get(post.id) || 0
                          }
                          isTeacherMonitor={isTeacherMonitor}
                          isActiveUserDisabled={isActiveUserDisabled}
                          onOpenThread={(id) => setOpenThreadId(id)}
                          onToggleUpvote={handleToggleUpvotePost}
                          onToggleBookmark={handleToggleBookmark}
                          onOpenAuthorInfo={handleOpenAccountInfo}
                          onReportPost={handleOpenReportPost}
                          onDeletePost={
                            isTeacherMonitor || post.authorId === activeMember.id
                              ? handleDeletePost
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      <footer className="hidden md:block border-t border-[#E2D9C6] dark:border-[#3D362D] bg-[#FFFDF8] dark:bg-[#12100E] mt-12">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-4 text-xs text-[#6B6155] dark:text-[#B8AFA0]">
          <span>StudyCommons · Collaborative School Q&A and Study Notes</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleOpenAccountInfo(activeMember.id)}
              className="font-medium text-[#574F45] dark:text-[#CEC5B6] hover:text-[var(--theme-accent-text)] transition-colors"
            >
              Account Information
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => {
                setSettingsSection(SettingsSection.APPEARANCE);
                setIsSettingsOpen(true);
                setOpenThreadId(null);
                setViewedProfileMemberId(null);
              }}
              className="font-medium text-[#574F45] dark:text-[#CEC5B6] hover:text-[var(--theme-accent-text)] transition-colors"
            >
              Theme Settings
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => {
                setSettingsSection(SettingsSection.ACCOUNT);
                setIsSettingsOpen(true);
                setOpenThreadId(null);
                setViewedProfileMemberId(null);
              }}
              className="font-medium text-[#574F45] dark:text-[#CEC5B6] hover:text-[var(--theme-accent-text)] transition-colors"
            >
              Edit Account
            </button>
            <span aria-hidden="true">·</span>
            <span>Synced in real time with StudyCommons Cloud</span>
          </div>
        </div>
      </footer>

      <MobileBottomNav
        activeTab={activeTab}
        unreadMailCount={unreadMailCount}
        pendingReportsCount={
          pendingReportsCount + (isAppOwner ? pendingTeacherApprovalsCount : 0)
        }
        pendingFriendRequestsCount={pendingFriendRequestsCount}
        isTeacherMonitor={isTeacherMonitor}
        isOverlayViewActive={isSettingsOpen || Boolean(viewedProfileMember)}
        onSelectTab={handleSelectTab}
      />

      <NewPostModal
        isOpen={composerState.isOpen}
        initialKind={composerState.kind}
        initialSubjectId={composerState.subjectId}
        initialLessonId={composerState.lessonId}
        lessons={lessons}
        activeMember={activeMember}
        onClose={() => setComposerState((prev) => ({ ...prev, isOpen: false }))}
        onCreatePost={handleCreatePost}
      />

      <ReportModal
        target={reportTarget}
        onClose={() => setReportTarget(null)}
        onSubmitReport={handleSubmitReport}
      />

      <WarningStampOverlay effect={warningStampEffect} />
    </div>
  );
}
