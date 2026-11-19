export enum SubjectId {
  MATHEMATICS = 'mathematics',
  BIOLOGY = 'biology',
  PHYSICS = 'physics',
  HISTORY = 'history',
  LITERATURE = 'literature',
  COMPUTER_SCIENCE = 'computer_science',
  ICT = 'ict',
}

export enum PostKind {
  QUESTION = 'question',
  IDEA = 'idea',
}

export enum UserRole {
  STUDENT = 'Student',
  TEACHER = 'Teacher',
  STUDY_LEAD = 'Peer Tutor',
}

export enum TeacherApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum GradeLevel {
  GRADE_7 = 'Grade 7',
  GRADE_8 = 'Grade 8',
  GRADE_9 = 'Grade 9',
  GRADE_10 = 'Grade 10',
  GRADE_11 = 'Grade 11',
  GRADE_12 = 'Grade 12',
  FACULTY = 'Faculty',
}

export enum NavTab {
  FEED = 'feed',
  LESSONS = 'lessons',
  EVENTS = 'events',
  FRIENDS = 'friends',
  SAVED = 'saved',
  MAIL = 'mail',
  CONTRIBUTORS = 'contributors',
  MONITOR = 'monitor',
}

export enum SchoolEventCategory {
  WORKSHOP = 'workshop',
  EXAM_PREP = 'exam_prep',
  CLUB_MEET = 'club_meet',
  ASSEMBLY = 'assembly',
  COMPETITION = 'competition',
}

export enum WarningLevel {
  LOW = 'low',
  MID = 'mid',
  CRITICAL = 'critical',
}

export enum ReportTargetType {
  POST = 'post',
  REPLY = 'reply',
}

export enum ReportStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export enum FeedFilter {
  ALL = 'all',
  QUESTIONS = 'questions',
  IDEAS = 'ideas',
  UNANSWERED = 'unanswered',
}

export enum SortOrder {
  RECENT = 'recent',
  HELPFUL = 'helpful',
  DISCUSSED = 'discussed',
}

export enum SettingsSection {
  APPEARANCE = 'appearance',
  ACCOUNT = 'account',
  LOGOUT = 'logout',
}

export interface SubjectMeta {
  id: SubjectId;
  name: string;
  department: string;
}

export interface SchoolClubMeta {
  id: string;
  name: string;
  tagline: string;
  crestTone:
    | 'emerald'
    | 'navy'
    | 'crimson'
    | 'indigo'
    | 'amber'
    | 'teal'
    | 'plum'
    | 'gold'
    | 'sky';
}

export interface SchoolMember {
  id: string;
  uid?: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  role: UserRole;
  gradeOrDept: string;
  section?: string;
  courseOrTrack?: string;
  club?: string;
  monitoredClub?: string;
  focusSubject: SubjectId;
  enrolledSubjects?: SubjectId[];
  taughtSubjects?: SubjectId[];
  bio?: string;
  isDisabled?: boolean;
  disabledReason?: string;
  disabledAt?: number;
  disabledByMemberId?: string;
  teacherApprovalStatus?: TeacherApprovalStatus;
  teacherApprovedAt?: number;
  teacherApprovedByMemberId?: string;
  teacherApprovalNote?: string;
  isOwner?: boolean;
  isMonitor?: boolean;
  monitorGrantedAt?: number;
  monitorGrantedByMemberId?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface RegisteredAccount {
  id: string;
  memberId: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  gradeOrDept: string;
  section?: string;
  courseOrTrack?: string;
  club?: string;
  monitoredClub?: string;
  focusSubject: SubjectId;
  enrolledSubjects?: SubjectId[];
  taughtSubjects?: SubjectId[];
  bio?: string;
  isDisabled?: boolean;
  disabledReason?: string;
  disabledAt?: number;
  disabledByMemberId?: string;
  teacherApprovalStatus?: TeacherApprovalStatus;
  teacherApprovedAt?: number;
  teacherApprovedByMemberId?: string;
  teacherApprovalNote?: string;
  isOwner?: boolean;
  isMonitor?: boolean;
  monitorGrantedAt?: number;
  monitorGrantedByMemberId?: string;
  createdAt: number;
}

export interface AccountWarning {
  id: string;
  targetMemberId: string;
  issuedByMemberId: string;
  level: WarningLevel;
  reason: string;
  relatedContentPreview?: string;
  createdAt: number;
  acknowledgedAt?: number;
  clearedAt?: number;
}

export interface ContentReport {
  id: string;
  targetType: ReportTargetType;
  postId: string;
  replyId?: string;
  targetAuthorId: string;
  reporterId: string;
  reason: string;
  details?: string;
  contentSnapshot: string;
  status: ReportStatus;
  sourceLocation?: 'feed' | 'thread' | 'mail';
  createdAt: number;
  resolvedAt?: number;
  resolvedByMemberId?: string;
  resolutionNote?: string;
}

export interface LessonUnit {
  id: string;
  subjectId: SubjectId;
  unitNumber: string;
  title: string;
  summary: string;
  teacherName: string;
  diagramUrl?: string;
  diagramCaption?: string;
}

export interface ReplyItem {
  id: string;
  authorId: string;
  body: string;
  formulaNote?: string;
  createdAt: number;
  upvoterIds: string[];
  isAccepted: boolean;
}

export interface DiscussionPost {
  id: string;
  kind: PostKind;
  subjectId: SubjectId;
  lessonId: string;
  gradeLevel?: GradeLevel;
  authorId: string;
  title: string;
  body: string;
  formulaNote?: string;
  imageUrl?: string;
  imageAlt?: string;
  createdAt: number;
  upvoterIds: string[];
  replies: ReplyItem[];
}

export type MailReadMap = Record<string, Record<string, number>>;

export type ThemePresetId =
  | 'crimson'
  | 'navy'
  | 'forest'
  | 'plum'
  | 'bronze'
  | 'slate'
  | 'custom';

export type CanvasTone = 'white' | 'ivory' | 'cool';

export type ColorMode = 'light' | 'dark';

export interface ThemePreference {
  presetId: ThemePresetId;
  customHex: string;
  canvasTone: CanvasTone;
  colorMode: ColorMode;
}

export interface MemberStudyGoal {
  weeklyTarget: number;
  completedLessonIds: string[];
  updatedAt: number;
}

export type StudyGoalMap = Record<string, MemberStudyGoal>;

export interface MemberStreak {
  currentStreak: number;
  longestStreak: number;
  totalDaysOpened: number;
  lastOpenedDate: string;
}

export type StreakMap = Record<string, MemberStreak>;

export type PomodoroPhase = 'focus' | 'shortBreak' | 'longBreak';

export type PomodoroCadenceId = 'classic' | 'deep' | 'sprint';

export interface PomodoroState {
  phase: PomodoroPhase;
  cadenceId: PomodoroCadenceId;
  secondsRemaining: number;
  isRunning: boolean;
  targetEndTime: number | null;
  completedFocusSessions: number;
  lastCompletedPhase: PomodoroPhase | null;
}

export interface PersonalNote {
  id: string;
  content: string;
  subjectId: SubjectId | 'general';
  createdAt: number;
  updatedAt: number;
}

export type PersonalNotesMap = Record<string, PersonalNote[]>;

export interface StudyReminder {
  id: string;
  title: string;
  subjectId: SubjectId | 'general';
  dueAt: number;
  isCompleted: boolean;
  notifiedAt?: number;
  createdAt: number;
}

export type StudyRemindersMap = Record<string, StudyReminder[]>;

export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  category: SchoolEventCategory;
  subjectId: SubjectId | 'all';
  gradeLevel: GradeLevel | 'All Grades';
  startsAt: number;
  location: string;
  clubName?: string;
  createdByMemberId: string;
  createdAt: number;
  attendeeIds: string[];
}

export enum FriendRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  note?: string;
  status: FriendRequestStatus;
  createdAt: number;
  respondedAt?: number;
}
