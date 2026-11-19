import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  INITIAL_EVENTS,
  INITIAL_LESSONS,
  INITIAL_MEMBERS,
  INITIAL_POSTS,
} from '../data/seedData';
import {
  db,
  handleFirestoreError,
  OperationType,
  reportFirestoreError,
} from '../firebase';
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
  ReportStatus,
  SchoolEvent,
  SchoolMember,
  StudyReminder,
  SubjectId,
  TeacherApprovalStatus,
  UserRole,
} from '../types/school';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'vincentcasintahancarl@gmail.com';

export interface UserPrivateData {
  uid: string;
  email: string;
  bookmarks: string[];
  mailReads: Record<string, number>;
  studyGoal: MemberStudyGoal;
  streak: MemberStreak;
  personalNotes: PersonalNote[];
  reminders: StudyReminder[];
  updatedAt: number;
}

function toMillis(val: unknown, fallback = Date.now()): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (val instanceof Timestamp) return val.toMillis();
  if (
    val &&
    typeof val === 'object' &&
    'toMillis' in val &&
    typeof (val as { toMillis: () => number }).toMillis === 'function'
  ) {
    return (val as { toMillis: () => number }).toMillis();
  }
  return fallback;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}

function clampString(val: string | undefined, maxLen: number): string | undefined {
  if (val === undefined) return undefined;
  const trimmed = val.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLen);
}

function normalizeMemberDoc(raw: Record<string, unknown>, docId: string): SchoolMember {
  return {
    id: String(raw.id || docId),
    uid: typeof raw.uid === 'string' ? raw.uid : String(raw.id || docId),
    name: String(raw.name || 'Member'),
    username: typeof raw.username === 'string' ? raw.username : undefined,
    avatarUrl: typeof raw.avatarUrl === 'string' ? raw.avatarUrl : undefined,
    role: (raw.role as UserRole) || UserRole.STUDENT,
    gradeOrDept: String(raw.gradeOrDept || 'Grade 11'),
    section: typeof raw.section === 'string' ? raw.section : undefined,
    courseOrTrack: typeof raw.courseOrTrack === 'string' ? raw.courseOrTrack : undefined,
    club: typeof raw.club === 'string' ? raw.club : undefined,
    monitoredClub: typeof raw.monitoredClub === 'string' ? raw.monitoredClub : undefined,
    focusSubject: (raw.focusSubject as SubjectId) || SubjectId.MATHEMATICS,
    enrolledSubjects: Array.isArray(raw.enrolledSubjects)
      ? (raw.enrolledSubjects as SubjectId[])
      : undefined,
    taughtSubjects: Array.isArray(raw.taughtSubjects)
      ? (raw.taughtSubjects as SubjectId[])
      : undefined,
    bio: typeof raw.bio === 'string' ? raw.bio : undefined,
    isDisabled: Boolean(raw.isDisabled),
    disabledReason:
      typeof raw.disabledReason === 'string' ? raw.disabledReason : undefined,
    disabledAt: raw.disabledAt !== undefined ? toMillis(raw.disabledAt) : undefined,
    disabledByMemberId:
      typeof raw.disabledByMemberId === 'string'
        ? raw.disabledByMemberId
        : undefined,
    teacherApprovalStatus: raw.teacherApprovalStatus as
      | TeacherApprovalStatus
      | undefined,
    teacherApprovedAt:
      raw.teacherApprovedAt !== undefined
        ? toMillis(raw.teacherApprovedAt)
        : undefined,
    teacherApprovedByMemberId:
      typeof raw.teacherApprovedByMemberId === 'string'
        ? raw.teacherApprovedByMemberId
        : undefined,
    teacherApprovalNote:
      typeof raw.teacherApprovalNote === 'string'
        ? raw.teacherApprovalNote
        : undefined,
    isOwner: Boolean(raw.isOwner),
    isMonitor: Boolean(raw.isMonitor),
    monitorGrantedAt:
      raw.monitorGrantedAt !== undefined
        ? toMillis(raw.monitorGrantedAt)
        : undefined,
    monitorGrantedByMemberId:
      typeof raw.monitorGrantedByMemberId === 'string'
        ? raw.monitorGrantedByMemberId
        : undefined,
    createdAt: raw.createdAt !== undefined ? toMillis(raw.createdAt) : undefined,
    updatedAt: raw.updatedAt !== undefined ? toMillis(raw.updatedAt) : undefined,
  };
}

function normalizePostDoc(raw: Record<string, unknown>, docId: string): DiscussionPost {
  return {
    id: String(raw.id || docId),
    kind: raw.kind as DiscussionPost['kind'],
    subjectId: raw.subjectId as SubjectId,
    lessonId: String(raw.lessonId || ''),
    gradeLevel: raw.gradeLevel as DiscussionPost['gradeLevel'],
    authorId: String(raw.authorId || ''),
    title: String(raw.title || ''),
    body: String(raw.body || ''),
    formulaNote: typeof raw.formulaNote === 'string' ? raw.formulaNote : undefined,
    imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : undefined,
    imageAlt: typeof raw.imageAlt === 'string' ? raw.imageAlt : undefined,
    createdAt: toMillis(raw.createdAt),
    upvoterIds: Array.isArray(raw.upvoterIds) ? (raw.upvoterIds as string[]) : [],
    replies: Array.isArray(raw.replies)
      ? (raw.replies as DiscussionPost['replies'])
      : [],
  };
}

function normalizeEventDoc(raw: Record<string, unknown>, docId: string): SchoolEvent {
  return {
    id: String(raw.id || docId),
    title: String(raw.title || ''),
    description: String(raw.description || ''),
    category: raw.category as SchoolEvent['category'],
    subjectId: raw.subjectId as SchoolEvent['subjectId'],
    gradeLevel: raw.gradeLevel as SchoolEvent['gradeLevel'],
    startsAt: toMillis(raw.startsAt),
    location: String(raw.location || ''),
    clubName: typeof raw.clubName === 'string' ? raw.clubName : undefined,
    createdByMemberId: String(raw.createdByMemberId || ''),
    createdAt: toMillis(raw.createdAt),
    attendeeIds: Array.isArray(raw.attendeeIds) ? (raw.attendeeIds as string[]) : [],
  };
}

function normalizeFriendRequestDoc(
  raw: Record<string, unknown>,
  docId: string
): FriendRequest {
  return {
    id: String(raw.id || docId),
    senderId: String(raw.senderId || ''),
    receiverId: String(raw.receiverId || ''),
    note: typeof raw.note === 'string' ? raw.note : undefined,
    status: (raw.status as FriendRequestStatus) || FriendRequestStatus.PENDING,
    createdAt: toMillis(raw.createdAt),
    respondedAt:
      raw.respondedAt !== undefined ? toMillis(raw.respondedAt) : undefined,
  };
}

function normalizeReportDoc(raw: Record<string, unknown>, docId: string): ContentReport {
  return {
    id: String(raw.id || docId),
    targetType: raw.targetType as ContentReport['targetType'],
    postId: String(raw.postId || ''),
    replyId: typeof raw.replyId === 'string' ? raw.replyId : undefined,
    targetAuthorId: String(raw.targetAuthorId || ''),
    reporterId: String(raw.reporterId || ''),
    reason: String(raw.reason || ''),
    details: typeof raw.details === 'string' ? raw.details : undefined,
    contentSnapshot: String(raw.contentSnapshot || ''),
    status: (raw.status as ReportStatus) || ReportStatus.PENDING,
    sourceLocation: raw.sourceLocation as ContentReport['sourceLocation'],
    createdAt: toMillis(raw.createdAt),
    resolvedAt:
      raw.resolvedAt !== undefined ? toMillis(raw.resolvedAt) : undefined,
    resolvedByMemberId:
      typeof raw.resolvedByMemberId === 'string'
        ? raw.resolvedByMemberId
        : undefined,
    resolutionNote:
      typeof raw.resolutionNote === 'string' ? raw.resolutionNote : undefined,
  };
}

function normalizeWarningDoc(
  raw: Record<string, unknown>,
  docId: string
): AccountWarning {
  return {
    id: String(raw.id || docId),
    targetMemberId: String(raw.targetMemberId || ''),
    issuedByMemberId: String(raw.issuedByMemberId || ''),
    level: raw.level as AccountWarning['level'],
    reason: String(raw.reason || ''),
    relatedContentPreview:
      typeof raw.relatedContentPreview === 'string'
        ? raw.relatedContentPreview
        : undefined,
    createdAt: toMillis(raw.createdAt),
    acknowledgedAt:
      raw.acknowledgedAt !== undefined
        ? toMillis(raw.acknowledgedAt)
        : undefined,
    clearedAt:
      raw.clearedAt !== undefined ? toMillis(raw.clearedAt) : undefined,
  };
}

export function isBootstrappedAdminEmail(email?: string | null): boolean {
  return (email || '').trim().toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL;
}

function emitSnapshotError(
  error: unknown,
  operationType: OperationType,
  path: string,
  onError?: (err: Error) => void
): void {
  const json = reportFirestoreError(error, operationType, path);
  if (onError) {
    onError(new Error(json));
  }
}

export function subscribeToMemberProfile(
  uid: string,
  onData: (member: SchoolMember | null) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `members/${uid}`;
  return onSnapshot(
    doc(db, 'members', uid),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      onData(normalizeMemberDoc(snapshot.data() as Record<string, unknown>, snapshot.id));
    },
    (error) => {
      emitSnapshotError(error, OperationType.GET, path, onError);
    }
  );
}

export function subscribeToUserPrivate(
  uid: string,
  email: string,
  onData: (data: UserPrivateData) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `userPrivate/${uid}`;
  return onSnapshot(
    doc(db, 'userPrivate', uid),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData({
          uid,
          email,
          bookmarks: [],
          mailReads: {},
          studyGoal: { weeklyTarget: 4, completedLessonIds: [], updatedAt: Date.now() },
          streak: {
            currentStreak: 1,
            longestStreak: 1,
            totalDaysOpened: 1,
            lastOpenedDate: '',
          },
          personalNotes: [],
          reminders: [],
          updatedAt: Date.now(),
        });
        return;
      }
      const raw = snapshot.data() as Record<string, unknown>;
      onData({
        uid,
        email: typeof raw.email === 'string' ? raw.email : email,
        bookmarks: Array.isArray(raw.bookmarks) ? (raw.bookmarks as string[]) : [],
        mailReads:
          raw.mailReads && typeof raw.mailReads === 'object'
            ? (raw.mailReads as Record<string, number>)
            : {},
        studyGoal:
          raw.studyGoal && typeof raw.studyGoal === 'object'
            ? (raw.studyGoal as MemberStudyGoal)
            : { weeklyTarget: 4, completedLessonIds: [], updatedAt: Date.now() },
        streak:
          raw.streak && typeof raw.streak === 'object'
            ? (raw.streak as MemberStreak)
            : {
                currentStreak: 1,
                longestStreak: 1,
                totalDaysOpened: 1,
                lastOpenedDate: '',
              },
        personalNotes: Array.isArray(raw.personalNotes)
          ? (raw.personalNotes as PersonalNote[])
          : [],
        reminders: Array.isArray(raw.reminders)
          ? (raw.reminders as StudyReminder[])
          : [],
        updatedAt: toMillis(raw.updatedAt),
      });
    },
    (error) => {
      emitSnapshotError(error, OperationType.GET, path, onError);
    }
  );
}

export function subscribeToMembers(
  onData: (members: SchoolMember[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'members';
  return onSnapshot(
    collection(db, 'members'),
    (snapshot) => {
      const list = snapshot.docs.map((d) =>
        normalizeMemberDoc(d.data() as Record<string, unknown>, d.id)
      );
      list.sort((a, b) => a.name.localeCompare(b.name));
      onData(list);
    },
    (error) => {
      emitSnapshotError(error, OperationType.LIST, path, onError);
    }
  );
}

export function subscribeToPosts(
  onData: (posts: DiscussionPost[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'posts';
  return onSnapshot(
    collection(db, 'posts'),
    (snapshot) => {
      const list = snapshot.docs.map((d) =>
        normalizePostDoc(d.data() as Record<string, unknown>, d.id)
      );
      list.sort((a, b) => b.createdAt - a.createdAt);
      onData(list);
    },
    (error) => {
      emitSnapshotError(error, OperationType.LIST, path, onError);
    }
  );
}

export function subscribeToLessons(
  onData: (lessons: LessonUnit[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'lessons';
  return onSnapshot(
    collection(db, 'lessons'),
    (snapshot) => {
      const list = snapshot.docs.map((d) => {
        const raw = d.data() as Record<string, unknown>;
        return {
          id: String(raw.id || d.id),
          subjectId: raw.subjectId as SubjectId,
          unitNumber: String(raw.unitNumber || ''),
          title: String(raw.title || ''),
          summary: String(raw.summary || ''),
          teacherName: String(raw.teacherName || ''),
          diagramUrl: typeof raw.diagramUrl === 'string' ? raw.diagramUrl : undefined,
          diagramCaption:
            typeof raw.diagramCaption === 'string' ? raw.diagramCaption : undefined,
        } satisfies LessonUnit;
      });
      onData(list);
    },
    (error) => {
      emitSnapshotError(error, OperationType.LIST, path, onError);
    }
  );
}

export function subscribeToEvents(
  onData: (events: SchoolEvent[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'events';
  return onSnapshot(
    collection(db, 'events'),
    (snapshot) => {
      const list = snapshot.docs.map((d) =>
        normalizeEventDoc(d.data() as Record<string, unknown>, d.id)
      );
      list.sort((a, b) => a.startsAt - b.startsAt);
      onData(list);
    },
    (error) => {
      emitSnapshotError(error, OperationType.LIST, path, onError);
    }
  );
}

export function subscribeToFriendRequests(
  uid: string,
  onData: (requests: FriendRequest[]) => void,
  onError?: (err: Error) => void
): () => void {
  let sentList: FriendRequest[] = [];
  let receivedList: FriendRequest[] = [];

  const emitMerged = () => {
    const byId = new Map<string, FriendRequest>();
    for (const req of [...sentList, ...receivedList]) {
      byId.set(req.id, req);
    }
    const merged = Array.from(byId.values()).sort(
      (a, b) => b.createdAt - a.createdAt
    );
    onData(merged);
  };

  const sentQ = query(
    collection(db, 'friendRequests'),
    where('senderId', '==', uid)
  );
  const receivedQ = query(
    collection(db, 'friendRequests'),
    where('receiverId', '==', uid)
  );

  const unsubSent = onSnapshot(
    sentQ,
    (snap) => {
      sentList = snap.docs.map((d) =>
        normalizeFriendRequestDoc(d.data() as Record<string, unknown>, d.id)
      );
      emitMerged();
    },
    (error) => {
      emitSnapshotError(error, OperationType.LIST, 'friendRequests', onError);
    }
  );

  const unsubReceived = onSnapshot(
    receivedQ,
    (snap) => {
      receivedList = snap.docs.map((d) =>
        normalizeFriendRequestDoc(d.data() as Record<string, unknown>, d.id)
      );
      emitMerged();
    },
    (error) => {
      emitSnapshotError(error, OperationType.LIST, 'friendRequests', onError);
    }
  );

  return () => {
    unsubSent();
    unsubReceived();
  };
}

export function subscribeToReports(
  uid: string,
  isTeacherMonitor: boolean,
  onData: (reports: ContentReport[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'reports';
  const ref = isTeacherMonitor
    ? collection(db, 'reports')
    : query(collection(db, 'reports'), where('reporterId', '==', uid));

  return onSnapshot(
    ref,
    (snapshot) => {
      const list = snapshot.docs.map((d) =>
        normalizeReportDoc(d.data() as Record<string, unknown>, d.id)
      );
      list.sort((a, b) => b.createdAt - a.createdAt);
      onData(list);
    },
    (error) => {
      emitSnapshotError(error, OperationType.LIST, path, onError);
    }
  );
}

export function subscribeToWarnings(
  uid: string,
  isTeacherMonitor: boolean,
  onData: (warnings: AccountWarning[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = 'warnings';
  const ref = isTeacherMonitor
    ? collection(db, 'warnings')
    : query(collection(db, 'warnings'), where('targetMemberId', '==', uid));

  return onSnapshot(
    ref,
    (snapshot) => {
      const list = snapshot.docs.map((d) =>
        normalizeWarningDoc(d.data() as Record<string, unknown>, d.id)
      );
      list.sort((a, b) => b.createdAt - a.createdAt);
      onData(list);
    },
    (error) => {
      emitSnapshotError(error, OperationType.LIST, path, onError);
    }
  );
}

export async function seedInitialSchoolDataIfNeeded(
  uid: string,
  isAdminUser: boolean
): Promise<void> {
  try {
    const lessonsSnap = await getDocs(query(collection(db, 'lessons'), limit(1)));
    if (lessonsSnap.empty) {
      for (const lesson of INITIAL_LESSONS) {
        await setDoc(
          doc(db, 'lessons', lesson.id),
          stripUndefined({
            id: lesson.id,
            subjectId: lesson.subjectId,
            unitNumber: lesson.unitNumber.slice(0, 40),
            title: lesson.title.slice(0, 160),
            summary: lesson.summary.slice(0, 2000),
            teacherName: lesson.teacherName.slice(0, 100),
            diagramUrl: clampString(lesson.diagramUrl, 2000),
            diagramCaption: clampString(lesson.diagramCaption, 240),
            createdByUid: uid,
          })
        );
      }
    }

    if (!isAdminUser) return;

    const membersSnap = await getDocs(query(collection(db, 'members'), limit(2)));
    if (membersSnap.size <= 1) {
      for (const member of INITIAL_MEMBERS) {
        if (member.id === uid) continue;
        await setDoc(
          doc(db, 'members', member.id),
          stripUndefined({
            id: member.id,
            uid: member.id,
            name: member.name.slice(0, 100),
            username: clampString(member.username, 40),
            avatarUrl: clampString(member.avatarUrl, 180000),
            role: member.role,
            gradeOrDept: member.gradeOrDept.slice(0, 100),
            section: clampString(member.section, 100),
            courseOrTrack: clampString(member.courseOrTrack, 140),
            club: clampString(member.club, 100),
            monitoredClub: clampString(member.monitoredClub, 100),
            focusSubject: member.focusSubject,
            enrolledSubjects:
              member.enrolledSubjects && member.enrolledSubjects.length > 0
                ? member.enrolledSubjects.slice(0, 7)
                : [member.focusSubject],
            taughtSubjects:
              member.role === UserRole.TEACHER && member.taughtSubjects
                ? member.taughtSubjects.slice(0, 4)
                : undefined,
            bio: clampString(member.bio, 600),
            isDisabled: false,
            teacherApprovalStatus:
              member.role === UserRole.TEACHER
                ? TeacherApprovalStatus.APPROVED
                : undefined,
            isMonitor: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        );
      }
    }

    const postsSnap = await getDocs(query(collection(db, 'posts'), limit(1)));
    if (postsSnap.empty) {
      for (const post of INITIAL_POSTS) {
        await setDoc(
          doc(db, 'posts', post.id),
          stripUndefined({
            id: post.id,
            kind: post.kind,
            subjectId: post.subjectId,
            lessonId: post.lessonId,
            gradeLevel: clampString(post.gradeLevel, 40),
            authorId: post.authorId,
            title: post.title.slice(0, 240),
            body: post.body.slice(0, 5000),
            formulaNote: clampString(post.formulaNote, 1000),
            imageUrl: clampString(post.imageUrl, 500000),
            imageAlt: clampString(post.imageAlt, 200),
            createdAt: serverTimestamp(),
            upvoterIds: post.upvoterIds.slice(0, 1000),
            replies: post.replies.slice(0, 200),
          })
        );
      }
    }

    const eventsSnap = await getDocs(query(collection(db, 'events'), limit(1)));
    if (eventsSnap.empty) {
      for (const ev of INITIAL_EVENTS) {
        await setDoc(
          doc(db, 'events', ev.id),
          stripUndefined({
            id: ev.id,
            title: ev.title.slice(0, 160),
            description: ev.description.slice(0, 2000),
            category: ev.category,
            subjectId: ev.subjectId,
            gradeLevel: ev.gradeLevel,
            startsAt: ev.startsAt,
            location: ev.location.slice(0, 160),
            clubName: clampString(ev.clubName, 100),
            createdByMemberId: ev.createdByMemberId,
            createdAt: serverTimestamp(),
            attendeeIds: ev.attendeeIds.slice(0, 1000),
          })
        );
      }
    }
  } catch (error) {
    reportFirestoreError(error, OperationType.WRITE, 'seed');
  }
}

export async function createMemberProfile(params: {
  uid: string;
  email: string;
  name: string;
  username: string;
  avatarUrl?: string;
  role: UserRole;
  gradeOrDept: string;
  section?: string;
  courseOrTrack?: string;
  club?: string;
  monitoredClub?: string;
  focusSubject: SubjectId;
  enrolledSubjects: SubjectId[];
  taughtSubjects?: SubjectId[];
  isAdminUser: boolean;
}): Promise<{ pendingApproval: boolean }> {
  const isTeacher = params.role === UserRole.TEACHER;
  const teacherApprovalStatus = isTeacher
    ? params.isAdminUser
      ? TeacherApprovalStatus.APPROVED
      : TeacherApprovalStatus.PENDING
    : undefined;

  const enrolledList =
    params.enrolledSubjects.length > 0
      ? params.enrolledSubjects.slice(0, 7)
      : [params.focusSubject];
  const taughtList = isTeacher
    ? (params.taughtSubjects && params.taughtSubjects.length > 0
        ? params.taughtSubjects
        : enrolledList
      ).slice(0, 4)
    : undefined;

  const memberPayload = stripUndefined({
    id: params.uid,
    uid: params.uid,
    name: params.name.trim().slice(0, 100),
    username: clampString(params.username, 40),
    avatarUrl: clampString(params.avatarUrl, 180000),
    role: params.role,
    gradeOrDept: params.gradeOrDept.trim().slice(0, 100),
    section: clampString(params.section, 100),
    courseOrTrack: clampString(params.courseOrTrack, 140),
    club: clampString(params.club, 100),
    monitoredClub: isTeacher
      ? clampString(params.monitoredClub || params.club, 100)
      : undefined,
    focusSubject: params.focusSubject,
    enrolledSubjects: taughtList || enrolledList,
    taughtSubjects: taughtList,
    isDisabled: false,
    teacherApprovalStatus,
    teacherApprovedAt:
      teacherApprovalStatus === TeacherApprovalStatus.APPROVED
        ? Date.now()
        : undefined,
    teacherApprovedByMemberId:
      teacherApprovalStatus === TeacherApprovalStatus.APPROVED
        ? params.uid
        : undefined,
    isOwner: params.isAdminUser,
    isMonitor: params.isAdminUser && isTeacher,
    monitorGrantedAt:
      params.isAdminUser && isTeacher ? Date.now() : undefined,
    monitorGrantedByMemberId:
      params.isAdminUser && isTeacher ? params.uid : undefined,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const today = new Date().toISOString().slice(0, 10);
  const safeEmail =
    params.email.trim().toLowerCase().slice(0, 200) ||
    `${params.uid.slice(0, 24)}@studycommons.local`;
  const privatePayload = {
    uid: params.uid,
    email: safeEmail,
    bookmarks: [],
    mailReads: {},
    studyGoal: {
      weeklyTarget: 4,
      completedLessonIds: [],
      updatedAt: Date.now(),
    },
    streak: {
      currentStreak: 1,
      longestStreak: 1,
      totalDaysOpened: 1,
      lastOpenedDate: today,
    },
    personalNotes: [],
    reminders: [],
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'members', params.uid), memberPayload);
    await setDoc(doc(db, 'userPrivate', params.uid), privatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `members/${params.uid}`);
  }

  return {
    pendingApproval: teacherApprovalStatus === TeacherApprovalStatus.PENDING,
  };
}

export async function updateMemberAvatarDoc(
  memberId: string,
  avatarUrl: string
): Promise<void> {
  const path = `members/${memberId}`;
  try {
    const cleaned = clampString(avatarUrl, 180000);
    await updateDoc(doc(db, 'members', memberId), {
      avatarUrl: cleaned ?? deleteField(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateMemberProfileDoc(
  memberId: string,
  isTeacher: boolean,
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
): Promise<void> {
  const path = `members/${memberId}`;
  try {
    const cleanedClub = clampString(updates.club, 100);
    const cleanedMonitoredClub = isTeacher
      ? clampString(
          updates.monitoredClub !== undefined ? updates.monitoredClub : updates.club,
          100
        )
      : undefined;
    const cleanedSection = clampString(updates.section, 100);
    const cleanedCourse = clampString(updates.courseOrTrack, 140);
    const cleanedBio = clampString(updates.bio, 600);
    const payload: Record<string, unknown> = {
      username: clampString(updates.username, 40) ?? deleteField(),
      gradeOrDept: updates.gradeOrDept.trim().slice(0, 100),
      section: cleanedSection ?? deleteField(),
      courseOrTrack: cleanedCourse ?? deleteField(),
      club: cleanedClub ?? deleteField(),
      focusSubject: updates.focusSubject,
      enrolledSubjects:
        updates.enrolledSubjects.length > 0
          ? updates.enrolledSubjects.slice(0, 7)
          : [updates.focusSubject],
      bio: cleanedBio ?? deleteField(),
      updatedAt: serverTimestamp(),
    };
    if (isTeacher) {
      payload.monitoredClub = cleanedMonitoredClub ?? deleteField();
      payload.taughtSubjects = (
        updates.taughtSubjects || updates.enrolledSubjects
      ).slice(0, 4);
    }
    await updateDoc(doc(db, 'members', memberId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function reviewTeacherApprovalDoc(
  memberId: string,
  approve: boolean,
  reviewerMemberId: string,
  note?: string,
  grantMonitor = false
): Promise<void> {
  const path = `members/${memberId}`;
  try {
    const cleanedNote = clampString(
      note || (approve ? undefined : 'Declined by App Owner.'),
      400
    );
    const shouldBeMonitor = Boolean(approve && grantMonitor);
    await updateDoc(doc(db, 'members', memberId), {
      teacherApprovalStatus: approve
        ? TeacherApprovalStatus.APPROVED
        : TeacherApprovalStatus.REJECTED,
      teacherApprovedAt: Date.now(),
      teacherApprovedByMemberId: reviewerMemberId.slice(0, 128),
      teacherApprovalNote: cleanedNote ?? deleteField(),
      isMonitor: shouldBeMonitor,
      monitorGrantedAt: shouldBeMonitor ? Date.now() : deleteField(),
      monitorGrantedByMemberId: shouldBeMonitor
        ? reviewerMemberId.slice(0, 128)
        : deleteField(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleTeacherMonitorDoc(
  memberId: string,
  makeMonitor: boolean,
  ownerMemberId: string
): Promise<void> {
  const path = `members/${memberId}`;
  try {
    await updateDoc(doc(db, 'members', memberId), {
      isMonitor: makeMonitor,
      monitorGrantedAt: makeMonitor ? Date.now() : deleteField(),
      monitorGrantedByMemberId: makeMonitor
        ? ownerMemberId.slice(0, 128)
        : deleteField(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function ensureOwnerBadgeDoc(memberId: string): Promise<void> {
  const path = `members/${memberId}`;
  try {
    await updateDoc(doc(db, 'members', memberId), {
      isOwner: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleDisableMemberDoc(
  memberId: string,
  disable: boolean,
  reviewerMemberId: string,
  reason?: string
): Promise<void> {
  const path = `members/${memberId}`;
  try {
    if (disable) {
      await updateDoc(doc(db, 'members', memberId), {
        isDisabled: true,
        disabledReason: clampString(
          reason || 'Disabled by monitoring teacher during review.',
          400
        ),
        disabledAt: Date.now(),
        disabledByMemberId: reviewerMemberId.slice(0, 128),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'members', memberId), {
        isDisabled: false,
        disabledReason: deleteField(),
        disabledAt: deleteField(),
        disabledByMemberId: deleteField(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function createPostDoc(post: Omit<DiscussionPost, 'createdAt'>): Promise<void> {
  const path = `posts/${post.id}`;
  try {
    await setDoc(
      doc(db, 'posts', post.id),
      stripUndefined({
        id: post.id,
        kind: post.kind,
        subjectId: post.subjectId,
        lessonId: post.lessonId,
        gradeLevel: clampString(post.gradeLevel, 40),
        authorId: post.authorId,
        title: post.title.trim().slice(0, 240),
        body: post.body.trim().slice(0, 5000),
        formulaNote: clampString(post.formulaNote, 1000),
        imageUrl: clampString(post.imageUrl, 500000),
        imageAlt: clampString(post.imageAlt, 200),
        createdAt: serverTimestamp(),
        upvoterIds: post.upvoterIds.slice(0, 1000),
        replies: post.replies.slice(0, 200),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updatePostInteractionDoc(
  postId: string,
  updates: {
    upvoterIds?: string[];
    replies?: DiscussionPost['replies'];
  }
): Promise<void> {
  const path = `posts/${postId}`;
  try {
    const payload: Record<string, unknown> = {};
    if (updates.upvoterIds !== undefined) {
      payload.upvoterIds = updates.upvoterIds.slice(0, 1000);
    }
    if (updates.replies !== undefined) {
      payload.replies = updates.replies.slice(0, 200);
    }
    await updateDoc(doc(db, 'posts', postId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deletePostDoc(postId: string): Promise<void> {
  const path = `posts/${postId}`;
  try {
    await deleteDoc(doc(db, 'posts', postId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createLessonDoc(
  lesson: LessonUnit,
  createdByUid: string
): Promise<void> {
  const path = `lessons/${lesson.id}`;
  try {
    await setDoc(
      doc(db, 'lessons', lesson.id),
      stripUndefined({
        id: lesson.id,
        subjectId: lesson.subjectId,
        unitNumber: lesson.unitNumber.trim().slice(0, 40),
        title: lesson.title.trim().slice(0, 160),
        summary: lesson.summary.trim().slice(0, 2000),
        teacherName: lesson.teacherName.trim().slice(0, 100),
        diagramUrl: clampString(lesson.diagramUrl, 2000),
        diagramCaption: clampString(lesson.diagramCaption, 240),
        createdByUid,
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function createEventDoc(
  event: Omit<SchoolEvent, 'createdAt'>
): Promise<void> {
  const path = `events/${event.id}`;
  try {
    await setDoc(
      doc(db, 'events', event.id),
      stripUndefined({
        id: event.id,
        title: event.title.trim().slice(0, 160),
        description: event.description.trim().slice(0, 2000),
        category: event.category,
        subjectId: event.subjectId,
        gradeLevel: event.gradeLevel,
        startsAt: event.startsAt,
        location: event.location.trim().slice(0, 160),
        clubName: clampString(event.clubName, 100),
        createdByMemberId: event.createdByMemberId,
        createdAt: serverTimestamp(),
        attendeeIds: event.attendeeIds.slice(0, 1000),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateEventAttendeesDoc(
  eventId: string,
  attendeeIds: string[]
): Promise<void> {
  const path = `events/${eventId}`;
  try {
    await updateDoc(doc(db, 'events', eventId), {
      attendeeIds: attendeeIds.slice(0, 1000),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteEventDoc(eventId: string): Promise<void> {
  const path = `events/${eventId}`;
  try {
    await deleteDoc(doc(db, 'events', eventId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createFriendRequestDoc(
  request: Omit<FriendRequest, 'createdAt'>
): Promise<void> {
  const path = `friendRequests/${request.id}`;
  try {
    await setDoc(
      doc(db, 'friendRequests', request.id),
      stripUndefined({
        id: request.id,
        senderId: request.senderId,
        receiverId: request.receiverId,
        note: clampString(request.note, 240),
        status: FriendRequestStatus.PENDING,
        createdAt: serverTimestamp(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function respondFriendRequestDoc(
  requestId: string,
  status: FriendRequestStatus.ACCEPTED | FriendRequestStatus.DECLINED
): Promise<void> {
  const path = `friendRequests/${requestId}`;
  try {
    await updateDoc(doc(db, 'friendRequests', requestId), {
      status,
      respondedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteFriendRequestDoc(requestId: string): Promise<void> {
  const path = `friendRequests/${requestId}`;
  try {
    await deleteDoc(doc(db, 'friendRequests', requestId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createReportDoc(
  report: Omit<ContentReport, 'createdAt'>
): Promise<void> {
  const path = `reports/${report.id}`;
  try {
    await setDoc(
      doc(db, 'reports', report.id),
      stripUndefined({
        id: report.id,
        targetType: report.targetType,
        postId: report.postId,
        replyId: clampString(report.replyId, 128),
        targetAuthorId: report.targetAuthorId,
        reporterId: report.reporterId,
        reason: report.reason.trim().slice(0, 300),
        details: clampString(report.details, 1000),
        contentSnapshot: report.contentSnapshot.trim().slice(0, 1500) || '[Content]',
        status: ReportStatus.PENDING,
        sourceLocation: report.sourceLocation,
        createdAt: serverTimestamp(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function resolveReportDoc(
  reportId: string,
  status: ReportStatus.RESOLVED | ReportStatus.DISMISSED,
  resolvedByMemberId: string,
  resolutionNote?: string
): Promise<void> {
  const path = `reports/${reportId}`;
  try {
    await updateDoc(doc(db, 'reports', reportId), {
      status,
      resolvedAt: Date.now(),
      resolvedByMemberId: resolvedByMemberId.slice(0, 128),
      resolutionNote: clampString(resolutionNote, 500) ?? deleteField(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function createWarningDoc(
  warning: Omit<AccountWarning, 'createdAt'>
): Promise<void> {
  const path = `warnings/${warning.id}`;
  try {
    await setDoc(
      doc(db, 'warnings', warning.id),
      stripUndefined({
        id: warning.id,
        targetMemberId: warning.targetMemberId,
        issuedByMemberId: warning.issuedByMemberId,
        level: warning.level,
        reason: warning.reason.trim().slice(0, 500),
        relatedContentPreview: clampString(warning.relatedContentPreview, 500),
        createdAt: serverTimestamp(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function acknowledgeWarningDoc(warningId: string): Promise<void> {
  const path = `warnings/${warningId}`;
  try {
    await updateDoc(doc(db, 'warnings', warningId), {
      acknowledgedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function clearWarningDoc(warningId: string): Promise<void> {
  const path = `warnings/${warningId}`;
  try {
    await updateDoc(doc(db, 'warnings', warningId), {
      clearedAt: Date.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveUserPrivateFields(
  uid: string,
  email: string,
  fields: Partial<
    Pick<
      UserPrivateData,
      'bookmarks' | 'mailReads' | 'studyGoal' | 'streak' | 'personalNotes' | 'reminders'
    >
  >
): Promise<void> {
  const path = `userPrivate/${uid}`;
  try {
    const safeEmail =
      email.trim().toLowerCase().slice(0, 200) ||
      `${uid.slice(0, 24)}@studycommons.local`;
    await setDoc(
      doc(db, 'userPrivate', uid),
      stripUndefined({
        uid,
        email: safeEmail,
        ...fields,
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function buildMailReadMap(
  uid: string,
  reads: Record<string, number>
): MailReadMap {
  return { [uid]: reads };
}
