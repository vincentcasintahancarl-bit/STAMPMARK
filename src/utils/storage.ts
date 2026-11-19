import {
  INITIAL_EVENTS,
  INITIAL_FRIEND_REQUESTS,
  INITIAL_LESSONS,
  INITIAL_MAIL_READS,
  INITIAL_MEMBERS,
  INITIAL_POSTS,
} from '../data/seedData';
import {
  AccountWarning,
  ContentReport,
  DiscussionPost,
  FriendRequest,
  FriendRequestStatus,
  LessonUnit,
  MailReadMap,
  MemberStreak,
  MemberStudyGoal,
  PersonalNote,
  PersonalNotesMap,
  PomodoroCadenceId,
  PomodoroPhase,
  PomodoroState,
  RegisteredAccount,
  SchoolEvent,
  SchoolEventCategory,
  SchoolMember,
  StreakMap,
  StudyGoalMap,
  StudyReminder,
  StudyRemindersMap,
  SubjectId,
  TeacherApprovalStatus,
  ThemePreference,
  UserRole,
  WarningLevel,
} from '../types/school';
import { DEFAULT_THEME_PREFERENCE } from './theme';

const STORAGE_KEYS = {
  POSTS: 'studycommons_posts_v1',
  LESSONS: 'studycommons_lessons_v1',
  MEMBERS: 'studycommons_members_v1',
  ACTIVE_MEMBER: 'studycommons_active_member_v1',
  BOOKMARKS: 'studycommons_bookmarks_v1',
  MAIL_READS: 'studycommons_mail_reads_v1',
  ACCOUNTS: 'studycommons_accounts_v1',
  CURRENT_ACCOUNT: 'studycommons_current_account_v1',
  THEME: 'studycommons_theme_v2',
  STUDY_GOALS: 'studycommons_study_goals_v1',
  STREAKS: 'studycommons_streaks_v1',
  POMODORO: 'studycommons_pomodoro_v1',
  PERSONAL_NOTES: 'studycommons_personal_notes_v1',
  REMINDERS: 'studycommons_reminders_v1',
  REPORTS: 'studycommons_reports_v1',
  WARNINGS: 'studycommons_warnings_v1',
  EVENTS: 'studycommons_events_v1',
  FRIEND_REQUESTS: 'studycommons_friend_requests_v1',
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota or storage restriction errors silently
  }
}

export function loadPosts(): DiscussionPost[] {
  return readJson<DiscussionPost[]>(STORAGE_KEYS.POSTS, INITIAL_POSTS);
}

export function savePosts(posts: DiscussionPost[]): void {
  writeJson(STORAGE_KEYS.POSTS, posts);
}

export function loadLessons(): LessonUnit[] {
  const stored = readJson<LessonUnit[]>(STORAGE_KEYS.LESSONS, INITIAL_LESSONS);
  const storedIds = new Set(stored.map((l) => l.id));
  const merged = [...stored];
  for (const seedLesson of INITIAL_LESSONS) {
    if (!storedIds.has(seedLesson.id)) {
      merged.push(seedLesson);
    }
  }
  return merged;
}

export function saveLessons(lessons: LessonUnit[]): void {
  writeJson(STORAGE_KEYS.LESSONS, lessons);
}

export function loadMembers(): SchoolMember[] {
  const stored = readJson<SchoolMember[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
  const seedById = new Map(INITIAL_MEMBERS.map((m) => [m.id, m]));
  const storedIds = new Set(stored.map((m) => m.id));
  const merged = [...stored];

  for (const seedMember of INITIAL_MEMBERS) {
    if (!storedIds.has(seedMember.id)) {
      merged.push(seedMember);
    }
  }

  return merged.map((member) => {
    const seed = seedById.get(member.id);
    if (!seed) return member;
    const nextAvatar =
      member.avatarUrl === undefined && seed.avatarUrl
        ? seed.avatarUrl
        : member.avatarUrl;
    const nextClub =
      member.club === undefined && seed.club ? seed.club : member.club;
    const nextMonitoredClub =
      member.monitoredClub === undefined && seed.monitoredClub
        ? seed.monitoredClub
        : member.monitoredClub;
    const needsTeacherSubjectMigration =
      member.role === UserRole.TEACHER &&
      member.taughtSubjects === undefined &&
      Boolean(seed.taughtSubjects);
    const nextTaughtSubjects = needsTeacherSubjectMigration
      ? seed.taughtSubjects
      : member.taughtSubjects;
    const nextEnrolledSubjects = needsTeacherSubjectMigration
      ? seed.enrolledSubjects
      : member.enrolledSubjects;

    if (
      nextAvatar !== member.avatarUrl ||
      nextClub !== member.club ||
      nextMonitoredClub !== member.monitoredClub ||
      nextTaughtSubjects !== member.taughtSubjects ||
      nextEnrolledSubjects !== member.enrolledSubjects
    ) {
      return {
        ...member,
        avatarUrl: nextAvatar,
        club: nextClub,
        monitoredClub: nextMonitoredClub,
        taughtSubjects: nextTaughtSubjects,
        enrolledSubjects: nextEnrolledSubjects,
      };
    }
    return member;
  });
}

export function saveMembers(members: SchoolMember[]): void {
  writeJson(STORAGE_KEYS.MEMBERS, members);
}

export function loadActiveMemberId(): string {
  return readJson<string>(STORAGE_KEYS.ACTIVE_MEMBER, INITIAL_MEMBERS[0].id);
}

export function saveActiveMemberId(memberId: string): void {
  writeJson(STORAGE_KEYS.ACTIVE_MEMBER, memberId);
}

export function loadBookmarks(): string[] {
  return readJson<string[]>(STORAGE_KEYS.BOOKMARKS, ['post-101', 'post-102']);
}

export function saveBookmarks(ids: string[]): void {
  writeJson(STORAGE_KEYS.BOOKMARKS, ids);
}

export function loadMailReads(): MailReadMap {
  return readJson<MailReadMap>(STORAGE_KEYS.MAIL_READS, INITIAL_MAIL_READS);
}

export function saveMailReads(reads: MailReadMap): void {
  writeJson(STORAGE_KEYS.MAIL_READS, reads);
}

export function loadAccounts(): RegisteredAccount[] {
  return readJson<RegisteredAccount[]>(STORAGE_KEYS.ACCOUNTS, []);
}

export function saveAccounts(accounts: RegisteredAccount[]): void {
  writeJson(STORAGE_KEYS.ACCOUNTS, accounts);
}

export function loadCurrentAccountId(): string | null {
  return readJson<string | null>(STORAGE_KEYS.CURRENT_ACCOUNT, null);
}

export function saveCurrentAccountId(accountId: string | null): void {
  writeJson(STORAGE_KEYS.CURRENT_ACCOUNT, accountId);
}

export function loadThemePreference(): ThemePreference {
  const stored = readJson<Partial<ThemePreference>>(
    STORAGE_KEYS.THEME,
    DEFAULT_THEME_PREFERENCE
  );
  return {
    presetId: stored.presetId || DEFAULT_THEME_PREFERENCE.presetId,
    customHex: stored.customHex || DEFAULT_THEME_PREFERENCE.customHex,
    canvasTone: stored.canvasTone || DEFAULT_THEME_PREFERENCE.canvasTone,
    colorMode: stored.colorMode === 'dark' ? 'dark' : 'light',
  };
}

export function saveThemePreference(theme: ThemePreference): void {
  writeJson(STORAGE_KEYS.THEME, theme);
}

const DEFAULT_WEEKLY_TARGET = 4;

export const INITIAL_STUDY_GOALS: StudyGoalMap = {
  'member-maya': {
    weeklyTarget: 4,
    completedLessonIds: ['lesson-bio-4', 'lesson-math-5', 'lesson-lit-6'],
    updatedAt: Date.now() - 3600 * 1000,
  },
  'member-rivera': {
    weeklyTarget: 4,
    completedLessonIds: ['lesson-bio-4', 'lesson-phys-3'],
    updatedAt: Date.now() - 7200 * 1000,
  },
  'member-jordan': {
    weeklyTarget: 5,
    completedLessonIds: ['lesson-math-5', 'lesson-cs-3', 'lesson-phys-3'],
    updatedAt: Date.now() - 5400 * 1000,
  },
  'member-elena': {
    weeklyTarget: 4,
    completedLessonIds: ['lesson-phys-3', 'lesson-math-5'],
    updatedAt: Date.now() - 9000 * 1000,
  },
  'member-chen': {
    weeklyTarget: 4,
    completedLessonIds: ['lesson-hist-2', 'lesson-lit-6'],
    updatedAt: Date.now() - 10800 * 1000,
  },
  'member-omar': {
    weeklyTarget: 3,
    completedLessonIds: ['lesson-cs-3', 'lesson-math-5', 'lesson-hist-2'],
    updatedAt: Date.now() - 1800 * 1000,
  },
};

export function createDefaultStudyGoal(
  weeklyTarget = DEFAULT_WEEKLY_TARGET
): MemberStudyGoal {
  return {
    weeklyTarget,
    completedLessonIds: [],
    updatedAt: Date.now(),
  };
}

export function getMemberStudyGoal(
  studyGoals: StudyGoalMap,
  memberId: string
): MemberStudyGoal {
  const existing = studyGoals[memberId];
  if (!existing) {
    return createDefaultStudyGoal();
  }
  return {
    weeklyTarget: Math.max(1, Math.min(12, existing.weeklyTarget || DEFAULT_WEEKLY_TARGET)),
    completedLessonIds: Array.isArray(existing.completedLessonIds)
      ? existing.completedLessonIds
      : [],
    updatedAt: existing.updatedAt || Date.now(),
  };
}

export function loadStudyGoals(): StudyGoalMap {
  return readJson<StudyGoalMap>(STORAGE_KEYS.STUDY_GOALS, INITIAL_STUDY_GOALS);
}

export function saveStudyGoals(studyGoals: StudyGoalMap): void {
  writeJson(STORAGE_KEYS.STUDY_GOALS, studyGoals);
}

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getOffsetDateKey(offsetDays: number, baseDate: Date = new Date()): string {
  const shifted = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate() + offsetDays
  );
  return getLocalDateKey(shifted);
}

function getDayDifference(fromDateKey: string, toDateKey: string): number {
  const parseParts = (key: string): number | null => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    return Date.UTC(year, month, day);
  };
  const fromUtc = parseParts(fromDateKey);
  const toUtc = parseParts(toDateKey);
  if (fromUtc === null || toUtc === null) return 999;
  return Math.round((toUtc - fromUtc) / (24 * 60 * 60 * 1000));
}

function createInitialStreaks(): StreakMap {
  const yesterday = getOffsetDateKey(-1);
  return {
    'member-maya': {
      currentStreak: 4,
      longestStreak: 6,
      totalDaysOpened: 7,
      lastOpenedDate: yesterday,
    },
    'member-rivera': {
      currentStreak: 3,
      longestStreak: 5,
      totalDaysOpened: 6,
      lastOpenedDate: yesterday,
    },
    'member-jordan': {
      currentStreak: 6,
      longestStreak: 8,
      totalDaysOpened: 11,
      lastOpenedDate: yesterday,
    },
    'member-elena': {
      currentStreak: 2,
      longestStreak: 4,
      totalDaysOpened: 5,
      lastOpenedDate: yesterday,
    },
    'member-chen': {
      currentStreak: 5,
      longestStreak: 5,
      totalDaysOpened: 9,
      lastOpenedDate: yesterday,
    },
    'member-omar': {
      currentStreak: 3,
      longestStreak: 4,
      totalDaysOpened: 4,
      lastOpenedDate: yesterday,
    },
  };
}

export function getMemberStreak(
  streaks: StreakMap,
  memberId: string
): MemberStreak {
  const existing = streaks[memberId];
  if (!existing) {
    return {
      currentStreak: 1,
      longestStreak: 1,
      totalDaysOpened: 1,
      lastOpenedDate: getLocalDateKey(),
    };
  }
  return {
    currentStreak: Math.max(0, existing.currentStreak || 0),
    longestStreak: Math.max(
      existing.currentStreak || 0,
      existing.longestStreak || 0
    ),
    totalDaysOpened: Math.max(0, existing.totalDaysOpened || 0),
    lastOpenedDate: existing.lastOpenedDate || '',
  };
}

export function recordDailyVisit(
  streaks: StreakMap,
  memberId: string,
  todayKey: string = getLocalDateKey()
): { nextStreaks: StreakMap; changed: boolean } {
  const existing = streaks[memberId];
  if (!existing || !existing.lastOpenedDate) {
    return {
      nextStreaks: {
        ...streaks,
        [memberId]: {
          currentStreak: 1,
          longestStreak: 1,
          totalDaysOpened: 1,
          lastOpenedDate: todayKey,
        },
      },
      changed: true,
    };
  }

  if (existing.lastOpenedDate === todayKey) {
    return { nextStreaks: streaks, changed: false };
  }

  const diff = getDayDifference(existing.lastOpenedDate, todayKey);
  if (diff < 0) {
    // Clock moved backward; preserve streak without decrementing
    return { nextStreaks: streaks, changed: false };
  }

  const nextStreak = diff === 1 ? existing.currentStreak + 1 : 1;
  const nextTotalDays = Math.max(0, existing.totalDaysOpened) + 1;
  const nextLongest = Math.max(existing.longestStreak || 0, nextStreak);

  return {
    nextStreaks: {
      ...streaks,
      [memberId]: {
        currentStreak: nextStreak,
        longestStreak: nextLongest,
        totalDaysOpened: nextTotalDays,
        lastOpenedDate: todayKey,
      },
    },
    changed: true,
  };
}

export function loadStreaks(): StreakMap {
  return readJson<StreakMap>(STORAGE_KEYS.STREAKS, createInitialStreaks());
}

export function saveStreaks(streaks: StreakMap): void {
  writeJson(STORAGE_KEYS.STREAKS, streaks);
}

export interface PomodoroCadenceConfig {
  id: PomodoroCadenceId;
  label: string;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
}

export const POMODORO_CADENCES: Record<PomodoroCadenceId, PomodoroCadenceConfig> = {
  classic: {
    id: 'classic',
    label: '25m Focus · 5m Break',
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
  },
  deep: {
    id: 'deep',
    label: '50m Focus · 10m Break',
    focusMinutes: 50,
    shortBreakMinutes: 10,
    longBreakMinutes: 20,
  },
  sprint: {
    id: 'sprint',
    label: '15m Focus · 3m Break',
    focusMinutes: 15,
    shortBreakMinutes: 3,
    longBreakMinutes: 10,
  },
};

export function getPhaseDurationSeconds(
  phase: PomodoroPhase,
  cadenceId: PomodoroCadenceId
): number {
  const cadence = POMODORO_CADENCES[cadenceId] || POMODORO_CADENCES.classic;
  if (phase === 'shortBreak') return cadence.shortBreakMinutes * 60;
  if (phase === 'longBreak') return cadence.longBreakMinutes * 60;
  return cadence.focusMinutes * 60;
}

const DEFAULT_POMODORO_STATE: PomodoroState = {
  phase: 'focus',
  cadenceId: 'classic',
  secondsRemaining: 25 * 60,
  isRunning: false,
  targetEndTime: null,
  completedFocusSessions: 0,
  lastCompletedPhase: null,
};

export function loadPomodoroState(): PomodoroState {
  const stored = readJson<Partial<PomodoroState>>(
    STORAGE_KEYS.POMODORO,
    DEFAULT_POMODORO_STATE
  );
  const cadenceId: PomodoroCadenceId =
    stored.cadenceId && stored.cadenceId in POMODORO_CADENCES
      ? stored.cadenceId
      : 'classic';
  const phase: PomodoroPhase =
    stored.phase === 'shortBreak' || stored.phase === 'longBreak'
      ? stored.phase
      : 'focus';
  const fallbackDuration = getPhaseDurationSeconds(phase, cadenceId);

  if (stored.isRunning && typeof stored.targetEndTime === 'number') {
    const remaining = Math.max(
      0,
      Math.ceil((stored.targetEndTime - Date.now()) / 1000)
    );
    if (remaining > 0) {
      return {
        phase,
        cadenceId,
        secondsRemaining: remaining,
        isRunning: true,
        targetEndTime: stored.targetEndTime,
        completedFocusSessions: Math.max(0, stored.completedFocusSessions || 0),
        lastCompletedPhase: null,
      };
    }
    return {
      phase,
      cadenceId,
      secondsRemaining: 0,
      isRunning: true,
      targetEndTime: stored.targetEndTime,
      completedFocusSessions: Math.max(0, stored.completedFocusSessions || 0),
      lastCompletedPhase: null,
    };
  }

  return {
    phase,
    cadenceId,
    secondsRemaining:
      typeof stored.secondsRemaining === 'number' && stored.secondsRemaining >= 0
        ? stored.secondsRemaining
        : fallbackDuration,
    isRunning: false,
    targetEndTime: null,
    completedFocusSessions: Math.max(0, stored.completedFocusSessions || 0),
    lastCompletedPhase: stored.lastCompletedPhase || null,
  };
}

export function savePomodoroState(state: PomodoroState): void {
  writeJson(STORAGE_KEYS.POMODORO, state);
}

const INITIAL_PERSONAL_NOTES: PersonalNotesMap = {
  'member-maya': [
    {
      id: 'pnote-maya-1',
      content:
        'Review NADH (~2.5 ATP) vs. FADH2 (~1.5 ATP) proton pumping steps before Friday’s biology lab quiz.',
      subjectId: SubjectId.BIOLOGY,
      createdAt: Date.now() - 4 * 3600 * 1000,
      updatedAt: Date.now() - 4 * 3600 * 1000,
    },
    {
      id: 'pnote-maya-2',
      content:
        'Finish Calculus Unit 5.3 implicit differentiation practice set #4–8 tonight.',
      subjectId: SubjectId.MATHEMATICS,
      createdAt: Date.now() - 22 * 3600 * 1000,
      updatedAt: Date.now() - 22 * 3600 * 1000,
    },
  ],
};

export function loadPersonalNotes(): PersonalNotesMap {
  return readJson<PersonalNotesMap>(
    STORAGE_KEYS.PERSONAL_NOTES,
    INITIAL_PERSONAL_NOTES
  );
}

export function savePersonalNotes(notesMap: PersonalNotesMap): void {
  writeJson(STORAGE_KEYS.PERSONAL_NOTES, notesMap);
}

export function getMemberPersonalNotes(
  notesMap: PersonalNotesMap,
  memberId: string
): PersonalNote[] {
  const list = notesMap[memberId];
  return Array.isArray(list) ? list : [];
}

function createInitialStudyReminders(): StudyRemindersMap {
  const base = Date.now();
  return {
    'member-maya': [
      {
        id: 'rem-maya-1',
        title: 'Biology Lab Quiz Review (Unit 4.2)',
        subjectId: SubjectId.BIOLOGY,
        dueAt: base + 2 * 3600 * 1000,
        isCompleted: false,
        createdAt: base - 3600 * 1000,
      },
      {
        id: 'rem-maya-2',
        title: 'Submit Calculus Implicit Differentiation Set',
        subjectId: SubjectId.MATHEMATICS,
        dueAt: base + 24 * 3600 * 1000,
        isCompleted: false,
        createdAt: base - 7200 * 1000,
      },
    ],
  };
}

export function loadStudyReminders(): StudyRemindersMap {
  return readJson<StudyRemindersMap>(
    STORAGE_KEYS.REMINDERS,
    createInitialStudyReminders()
  );
}

export function saveStudyReminders(remindersMap: StudyRemindersMap): void {
  writeJson(STORAGE_KEYS.REMINDERS, remindersMap);
}

export function getMemberReminders(
  remindersMap: StudyRemindersMap,
  memberId: string
): StudyReminder[] {
  const list = remindersMap[memberId];
  return Array.isArray(list) ? list : [];
}

export async function hashPassword(password: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoded = new TextEncoder().encode(password);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let hash = 0;
  for (let i = 0; i < password.length; i += 1) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0;
  }
  return `fallback-${Math.abs(hash).toString(16)}`;
}

export function resetDemoData(
  registeredMembers: SchoolMember[] = [],
  existingStudyGoals: StudyGoalMap = {},
  existingStreaks: StreakMap = {},
  existingPersonalNotes: PersonalNotesMap = {},
  existingReminders: StudyRemindersMap = {}
): {
  posts: DiscussionPost[];
  lessons: LessonUnit[];
  members: SchoolMember[];
  activeMemberId: string;
  bookmarks: string[];
  mailReads: MailReadMap;
  studyGoals: StudyGoalMap;
  streaks: StreakMap;
  personalNotes: PersonalNotesMap;
  reminders: StudyRemindersMap;
  events: SchoolEvent[];
  friendRequests: FriendRequest[];
} {
  const mergedMembers = [...INITIAL_MEMBERS];
  const mergedStudyGoals: StudyGoalMap = { ...INITIAL_STUDY_GOALS };
  const mergedStreaks: StreakMap = { ...createInitialStreaks() };
  const mergedNotes: PersonalNotesMap = { ...INITIAL_PERSONAL_NOTES };
  const mergedReminders: StudyRemindersMap = { ...createInitialStudyReminders() };
  for (const rm of registeredMembers) {
    if (!mergedMembers.some((m) => m.id === rm.id)) {
      mergedMembers.push(rm);
    }
    if (existingStudyGoals[rm.id]) {
      mergedStudyGoals[rm.id] = existingStudyGoals[rm.id];
    }
    if (existingStreaks[rm.id]) {
      mergedStreaks[rm.id] = existingStreaks[rm.id];
    }
    if (existingPersonalNotes[rm.id]) {
      mergedNotes[rm.id] = existingPersonalNotes[rm.id];
    }
    if (existingReminders[rm.id]) {
      mergedReminders[rm.id] = existingReminders[rm.id];
    }
  }
  savePosts(INITIAL_POSTS);
  saveLessons(INITIAL_LESSONS);
  saveMembers(mergedMembers);
  saveBookmarks(['post-101', 'post-102']);
  saveMailReads(INITIAL_MAIL_READS);
  saveStudyGoals(mergedStudyGoals);
  saveStreaks(mergedStreaks);
  savePersonalNotes(mergedNotes);
  saveStudyReminders(mergedReminders);
  saveEvents(INITIAL_EVENTS);
  saveFriendRequests(INITIAL_FRIEND_REQUESTS);
  return {
    posts: INITIAL_POSTS,
    lessons: INITIAL_LESSONS,
    members: mergedMembers,
    activeMemberId: INITIAL_MEMBERS[0].id,
    bookmarks: ['post-101', 'post-102'],
    mailReads: INITIAL_MAIL_READS,
    studyGoals: mergedStudyGoals,
    streaks: mergedStreaks,
    personalNotes: mergedNotes,
    reminders: mergedReminders,
    events: INITIAL_EVENTS,
    friendRequests: INITIAL_FRIEND_REQUESTS,
  };
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function formatRelativeTime(timestamp: number): string {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) return 'Just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatStampTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function normalizeUsername(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 30);
}

export function getMemberUsername(name: string, username?: string): string {
  const cleaned = username ? normalizeUsername(username) : '';
  if (cleaned.length >= 2) return cleaned;
  const fromName = normalizeUsername(name);
  return fromName.length >= 2 ? fromName : 'scholar';
}

export function loadReports(): ContentReport[] {
  return readJson<ContentReport[]>(STORAGE_KEYS.REPORTS, []);
}

export function saveReports(reports: ContentReport[]): void {
  writeJson(STORAGE_KEYS.REPORTS, reports);
}

export function loadWarnings(): AccountWarning[] {
  return readJson<AccountWarning[]>(STORAGE_KEYS.WARNINGS, []);
}

export function saveWarnings(warnings: AccountWarning[]): void {
  writeJson(STORAGE_KEYS.WARNINGS, warnings);
}

export function getWarningSeverityRank(level: WarningLevel): number {
  if (level === WarningLevel.CRITICAL) return 3;
  if (level === WarningLevel.MID) return 2;
  return 1;
}

export function getWarningLevelDisplay(level: WarningLevel): {
  label: string;
  shortLabel: string;
  description: string;
  badgeClass: string;
  panelClass: string;
  textClass: string;
} {
  if (level === WarningLevel.CRITICAL) {
    return {
      label: 'Critical Warning',
      shortLabel: 'Critical',
      description: 'Severe conduct or safety violation; account suspension risk.',
      badgeClass:
        'bg-[#FAF3F1] dark:bg-[#3A1616] text-[#7C1D1D] dark:text-[#FCA5A5] border-[#E5C9C5] dark:border-[#8C3737]',
      panelClass:
        'bg-[#FAF3F1] dark:bg-[#2A1313] border-[#E5C9C5] dark:border-[#7F3232]',
      textClass: 'text-[#7C1D1D] dark:text-[#FCA5A5]',
    };
  }
  if (level === WarningLevel.MID) {
    return {
      label: 'Mid Warning',
      shortLabel: 'Mid',
      description: 'Moderate guideline reminder; repeated issues may escalate.',
      badgeClass:
        'bg-[#FDF6EC] dark:bg-[#342211] text-[#9A3412] dark:text-[#FDBA74] border-[#F0D5B5] dark:border-[#7C4B1E]',
      panelClass:
        'bg-[#FDF6EC] dark:bg-[#271A0F] border-[#EBD2B4] dark:border-[#6B411B]',
      textClass: 'text-[#9A3412] dark:text-[#FDBA74]',
    };
  }
  return {
    label: 'Low Warning',
    shortLabel: 'Low',
    description: 'Gentle teacher reminder to keep posts respectful and on-topic.',
    badgeClass:
      'bg-[#FBF8EC] dark:bg-[#2D2614] text-[#7A5615] dark:text-[#FCD34D] border-[#E8D8A8] dark:border-[#6B5723]',
    panelClass:
      'bg-[#FBF8EC] dark:bg-[#241E11] border-[#E6D6A7] dark:border-[#5D4B1E]',
    textClass: 'text-[#7A5615] dark:text-[#FCD34D]',
  };
}

export function getActiveWarningsForMember(
  warnings: AccountWarning[],
  memberId: string
): AccountWarning[] {
  return warnings
    .filter((w) => w.targetMemberId === memberId && !w.clearedAt)
    .sort((a, b) => {
      const rankDiff =
        getWarningSeverityRank(b.level) - getWarningSeverityRank(a.level);
      if (rankDiff !== 0) return rankDiff;
      return b.createdAt - a.createdAt;
    });
}

export function loadEvents(): SchoolEvent[] {
  return readJson<SchoolEvent[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
}

export function saveEvents(events: SchoolEvent[]): void {
  writeJson(STORAGE_KEYS.EVENTS, events);
}

export function getEventCategoryDisplay(category: SchoolEventCategory): {
  label: string;
  badgeClass: string;
} {
  switch (category) {
    case SchoolEventCategory.WORKSHOP:
      return {
        label: 'Workshop',
        badgeClass:
          'bg-[#EDF7FC] dark:bg-[#0F2331] text-[#0C4A6E] dark:text-[#7DD3FC] border-[#B4D8EB] dark:border-[#23577A]',
      };
    case SchoolEventCategory.EXAM_PREP:
      return {
        label: 'Exam Prep',
        badgeClass:
          'bg-[#FBF8EC] dark:bg-[#2D2614] text-[#7A5615] dark:text-[#FCD34D] border-[#E8D8A8] dark:border-[#6B5723]',
      };
    case SchoolEventCategory.CLUB_MEET:
      return {
        label: 'Club Meet',
        badgeClass:
          'bg-[#EDF7F0] dark:bg-[#11271A] text-[#14532D] dark:text-[#86EFAC] border-[#B6D9C2] dark:border-[#2C6440]',
      };
    case SchoolEventCategory.COMPETITION:
      return {
        label: 'Competition',
        badgeClass:
          'bg-[#FAF1F0] dark:bg-[#2F1414] text-[#7C1D1D] dark:text-[#FCA5A5] border-[#E4C2BE] dark:border-[#7B3030]',
      };
    case SchoolEventCategory.ASSEMBLY:
    default:
      return {
        label: 'School Assembly',
        badgeClass:
          'bg-[#F6EFFB] dark:bg-[#261436] text-[#581C87] dark:text-[#D8B4FE] border-[#D9C0EC] dark:border-[#5D3282]',
      };
  }
}

export function loadFriendRequests(): FriendRequest[] {
  return readJson<FriendRequest[]>(
    STORAGE_KEYS.FRIEND_REQUESTS,
    INITIAL_FRIEND_REQUESTS
  );
}

export function saveFriendRequests(requests: FriendRequest[]): void {
  writeJson(STORAGE_KEYS.FRIEND_REQUESTS, requests);
}

export function getFriendsForMember(
  requests: FriendRequest[],
  memberId: string
): string[] {
  const set = new Set<string>();
  for (const req of requests) {
    if (req.status !== FriendRequestStatus.ACCEPTED) continue;
    if (req.senderId === memberId) {
      set.add(req.receiverId);
    } else if (req.receiverId === memberId) {
      set.add(req.senderId);
    }
  }
  return Array.from(set);
}

export function getIncomingFriendRequests(
  requests: FriendRequest[],
  memberId: string
): FriendRequest[] {
  return requests
    .filter(
      (req) =>
        req.status === FriendRequestStatus.PENDING &&
        req.receiverId === memberId
    )
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function getOutgoingFriendRequests(
  requests: FriendRequest[],
  memberId: string
): FriendRequest[] {
  return requests
    .filter(
      (req) =>
        req.status === FriendRequestStatus.PENDING &&
        req.senderId === memberId
    )
    .sort((a, b) => b.createdAt - a.createdAt);
}

export type FriendRelationKind =
  | 'self'
  | 'friends'
  | 'outgoing_pending'
  | 'incoming_pending'
  | 'none';

export function getFriendRelation(
  requests: FriendRequest[],
  currentMemberId: string,
  otherMemberId: string
): { status: FriendRelationKind; request?: FriendRequest } {
  if (currentMemberId === otherMemberId) {
    return { status: 'self' };
  }

  const accepted = requests.find(
    (req) =>
      req.status === FriendRequestStatus.ACCEPTED &&
      ((req.senderId === currentMemberId && req.receiverId === otherMemberId) ||
        (req.senderId === otherMemberId && req.receiverId === currentMemberId))
  );
  if (accepted) {
    return { status: 'friends', request: accepted };
  }

  const outgoing = requests.find(
    (req) =>
      req.status === FriendRequestStatus.PENDING &&
      req.senderId === currentMemberId &&
      req.receiverId === otherMemberId
  );
  if (outgoing) {
    return { status: 'outgoing_pending', request: outgoing };
  }

  const incoming = requests.find(
    (req) =>
      req.status === FriendRequestStatus.PENDING &&
      req.senderId === otherMemberId &&
      req.receiverId === currentMemberId
  );
  if (incoming) {
    return { status: 'incoming_pending', request: incoming };
  }

  return { status: 'none' };
}

export const TEACHER_MIN_SUBJECTS = 3;
export const TEACHER_MAX_SUBJECTS = 4;

export function getTeacherTaughtSubjects(
  member: Pick<SchoolMember, 'role' | 'focusSubject' | 'enrolledSubjects' | 'taughtSubjects'>
): SubjectId[] {
  const source =
    member.taughtSubjects && member.taughtSubjects.length > 0
      ? member.taughtSubjects
      : member.enrolledSubjects && member.enrolledSubjects.length > 0
        ? member.enrolledSubjects
        : [member.focusSubject];
  const unique = Array.from(new Set(source));
  if (member.role === UserRole.TEACHER) {
    return unique.slice(0, TEACHER_MAX_SUBJECTS);
  }
  return unique;
}

export function getTeacherMonitoredClub(
  member: Pick<SchoolMember, 'monitoredClub' | 'club'>
): string | undefined {
  const raw = member.monitoredClub?.trim() || member.club?.trim();
  return raw || undefined;
}

export function isTeacherAccountPendingApproval(
  member?: Pick<SchoolMember, 'role' | 'teacherApprovalStatus'> | null
): boolean {
  return Boolean(
    member &&
      member.role === UserRole.TEACHER &&
      member.teacherApprovalStatus === TeacherApprovalStatus.PENDING
  );
}

export function isTeacherAccountRejected(
  member?: Pick<SchoolMember, 'role' | 'teacherApprovalStatus'> | null
): boolean {
  return Boolean(
    member &&
      member.role === UserRole.TEACHER &&
      member.teacherApprovalStatus === TeacherApprovalStatus.REJECTED
  );
}

export function isApprovedFacultyTeacher(
  member?: Pick<SchoolMember, 'role' | 'teacherApprovalStatus'> | null
): boolean {
  return Boolean(
    member &&
      member.role === UserRole.TEACHER &&
      member.teacherApprovalStatus !== TeacherApprovalStatus.PENDING &&
      member.teacherApprovalStatus !== TeacherApprovalStatus.REJECTED
  );
}

export function isTeacherMonitorMember(
  member?: Pick<
    SchoolMember,
    'role' | 'teacherApprovalStatus' | 'isMonitor'
  > | null
): boolean {
  return Boolean(isApprovedFacultyTeacher(member) && member?.isMonitor);
}

export function canSwitchToMember(
  member?: Pick<SchoolMember, 'role' | 'teacherApprovalStatus'> | null
): boolean {
  return Boolean(
    member &&
      !isTeacherAccountPendingApproval(member) &&
      !isTeacherAccountRejected(member)
  );
}

