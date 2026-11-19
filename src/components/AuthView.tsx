import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  BookOpen,
  Camera,
  CheckCheck,
  CheckCircle2,
  Clock,
  ImagePlus,
  Link2,
  LogIn,
  LogOut,
  Palette,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
} from 'lucide-react';
import {
  COURSE_TRACK_OPTIONS,
  GRADE_LEVEL_OPTIONS,
  HERO_BANNER_IMAGE,
  SCHOLAR_AVATAR_PRESETS,
  SCHOOL_CLUBS,
  SUBJECTS,
} from '../data/seedData';
import {
  GradeLevel,
  SchoolMember,
  SubjectId,
  TeacherApprovalStatus,
  UserRole,
} from '../types/school';
import { resizeAvatarFileToDataUrl, validateImageUrl } from '../utils/image';
import {
  getTeacherMonitoredClub,
  getTeacherTaughtSubjects,
  normalizeUsername,
  TEACHER_MAX_SUBJECTS,
  TEACHER_MIN_SUBJECTS,
} from '../utils/storage';
import { ClubBadge } from './ClubBadge';
import { MemberAvatar } from './MemberAvatar';
import { ResilientImage } from './ResilientImage';

interface AuthViewProps {
  firebaseUser: {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
  } | null;
  ownMember?: SchoolMember | null;
  initialRole?: UserRole;
  isSigningIn?: boolean;
  authError?: string | null;
  onGoogleSignIn: () => Promise<string | null>;
  onCompleteOnboarding: (payload: {
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
  }) => Promise<{ error?: string; pendingApproval?: boolean }>;
  onSignOut: () => void;
  onOpenSettings?: () => void;
  onBackToWelcome?: () => void;
}

export function AuthView({
  firebaseUser,
  ownMember = null,
  initialRole = UserRole.STUDENT,
  isSigningIn = false,
  authError = null,
  onGoogleSignIn,
  onCompleteOnboarding,
  onSignOut,
  onOpenSettings,
  onBackToWelcome,
}: AuthViewProps) {
  const [name, setName] = useState(firebaseUser?.displayName || '');
  const [username, setUsername] = useState(
    firebaseUser?.displayName
      ? normalizeUsername(firebaseUser.displayName)
      : ''
  );
  const [avatarUrl, setAvatarUrl] = useState(firebaseUser?.photoURL || '');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [gradeOrDept, setGradeOrDept] = useState<string>(
    initialRole === UserRole.TEACHER ? 'Science Faculty' : GradeLevel.GRADE_12
  );
  const [section, setSection] = useState(
    initialRole === UserRole.TEACHER ? 'Faculty Advisory' : ''
  );
  const [courseOrTrack, setCourseOrTrack] = useState<string>(
    COURSE_TRACK_OPTIONS[0]
  );
  const [clubSelection, setClubSelection] = useState<string>(
    SCHOOL_CLUBS[0].name
  );
  const [customClubName, setCustomClubName] = useState<string>('');
  const [focusSubject, setFocusSubject] = useState<SubjectId>(
    SubjectId.MATHEMATICS
  );
  const [enrolledSubjects, setEnrolledSubjects] = useState<SubjectId[]>(
    initialRole === UserRole.TEACHER
      ? [SubjectId.MATHEMATICS, SubjectId.BIOLOGY, SubjectId.PHYSICS]
      : [SubjectId.MATHEMATICS]
  );

  const [errorMsg, setErrorMsg] = useState<string | null>(authError);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setErrorMsg(authError);
  }, [authError]);

  useEffect(() => {
    if (firebaseUser) {
      setName((prev) => prev || firebaseUser.displayName || '');
      setUsername((prev) =>
        prev ||
        (firebaseUser.displayName
          ? normalizeUsername(firebaseUser.displayName)
          : '')
      );
      setAvatarUrl((prev) => prev || firebaseUser.photoURL || '');
    }
  }, [firebaseUser]);

  const normalizeTeacherSubjects = (
    current: SubjectId[],
    lead: SubjectId
  ): SubjectId[] => {
    const unique = Array.from(new Set([lead, ...current]));
    const defaults = [
      SubjectId.MATHEMATICS,
      SubjectId.BIOLOGY,
      SubjectId.PHYSICS,
      SubjectId.ICT,
    ];
    for (const candidate of defaults) {
      if (unique.length >= TEACHER_MIN_SUBJECTS) break;
      if (!unique.includes(candidate)) {
        unique.push(candidate);
      }
    }
    return unique.slice(0, TEACHER_MAX_SUBJECTS);
  };

  useEffect(() => {
    setRole(initialRole);
    if (initialRole === UserRole.TEACHER) {
      setGradeOrDept((prev) =>
        !prev || GRADE_LEVEL_OPTIONS.includes(prev as GradeLevel)
          ? 'Science Faculty'
          : prev
      );
      setSection((prev) => prev || 'Faculty Advisory');
      setEnrolledSubjects((prev) =>
        normalizeTeacherSubjects(prev, focusSubject)
      );
    } else {
      setGradeOrDept((prev) =>
        GRADE_LEVEL_OPTIONS.includes(prev as GradeLevel)
          ? prev
          : GradeLevel.GRADE_12
      );
    }
  }, [initialRole]);

  const processAvatarFile = async (file: File) => {
    setErrorMsg(null);
    setIsProcessingAvatar(true);
    try {
      const dataUrl = await resizeAvatarFileToDataUrl(file, 256);
      setAvatarUrl(dataUrl);
      setAvatarUrlInput('');
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Could not read the selected portrait.'
      );
    } finally {
      setIsProcessingAvatar(false);
    }
  };

  const handleAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await processAvatarFile(file);
  };

  const handleAvatarDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingAvatar(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processAvatarFile(file);
    }
  };

  const handleApplyAvatarUrl = async () => {
    setErrorMsg(null);
    setIsProcessingAvatar(true);
    try {
      const validUrl = await validateImageUrl(avatarUrlInput);
      setAvatarUrl(validUrl);
      setAvatarUrlInput('');
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Could not load an image from that URL.'
      );
    } finally {
      setIsProcessingAvatar(false);
    }
  };

  const handleRoleChange = (nextRole: UserRole) => {
    setRole(nextRole);
    setErrorMsg(null);
    if (nextRole === UserRole.TEACHER) {
      if (
        !gradeOrDept ||
        GRADE_LEVEL_OPTIONS.includes(gradeOrDept as GradeLevel)
      ) {
        setGradeOrDept('Science Faculty');
      }
      if (!section) {
        setSection('Faculty Advisory');
      }
      setEnrolledSubjects((prev) =>
        normalizeTeacherSubjects(prev, focusSubject)
      );
    } else if (!GRADE_LEVEL_OPTIONS.includes(gradeOrDept as GradeLevel)) {
      setGradeOrDept(GradeLevel.GRADE_12);
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setErrorMsg('Please enter your full name (at least 2 characters).');
      return;
    }

    const normalizedEnrolled = enrolledSubjects.includes(focusSubject)
      ? enrolledSubjects
      : [focusSubject, ...enrolledSubjects];

    if (
      role === UserRole.TEACHER &&
      (normalizedEnrolled.length < TEACHER_MIN_SUBJECTS ||
        normalizedEnrolled.length > TEACHER_MAX_SUBJECTS)
    ) {
      setErrorMsg(
        `Teachers must select between ${TEACHER_MIN_SUBJECTS} and ${TEACHER_MAX_SUBJECTS} subjects to teach.`
      );
      return;
    }

    const cleanedUsername = normalizeUsername(username || trimmedName);
    if (cleanedUsername.length < 2) {
      setErrorMsg('Username must be at least 2 letters or numbers.');
      return;
    }

    const resolvedClub =
      clubSelection === '__custom__'
        ? customClubName.trim()
        : clubSelection.trim();

    setIsSubmitting(true);
    const result = await onCompleteOnboarding({
      name: trimmedName,
      username: cleanedUsername,
      avatarUrl: avatarUrl || undefined,
      role,
      gradeOrDept:
        gradeOrDept.trim() ||
        (role === UserRole.TEACHER ? 'Science Faculty' : GradeLevel.GRADE_12),
      section:
        section.trim() ||
        (role === UserRole.TEACHER ? 'Faculty Advisory' : 'Section A'),
      courseOrTrack: courseOrTrack.trim() || COURSE_TRACK_OPTIONS[0],
      club: resolvedClub || undefined,
      monitoredClub:
        role === UserRole.TEACHER ? resolvedClub || undefined : undefined,
      focusSubject,
      enrolledSubjects: normalizedEnrolled,
      taughtSubjects:
        role === UserRole.TEACHER ? normalizedEnrolled : undefined,
    });
    setIsSubmitting(false);

    if (result.error) {
      setErrorMsg(result.error);
    }
  };

  const isPendingTeacher =
    ownMember?.role === UserRole.TEACHER &&
    ownMember.teacherApprovalStatus === TeacherApprovalStatus.PENDING;
  const isRejectedTeacher =
    ownMember?.role === UserRole.TEACHER &&
    ownMember.teacherApprovalStatus === TeacherApprovalStatus.REJECTED;

  const formCard = (
    <section className="heritage-card border rounded-xl sm:rounded-lg overflow-hidden">
      <div className="p-5 sm:p-8 border-b border-[#E2D9C6] dark:border-[#3D362D]">
        <p className="heritage-eyebrow mb-2">
          {isPendingTeacher || isRejectedTeacher
            ? 'Faculty Verification Status'
            : firebaseUser
              ? 'Complete Your StudyCommons Profile'
              : 'School Sign-In'}
        </p>
        <h1 className="font-display text-3xl font-semibold text-[#1C1917] dark:text-[#F7F3EA] text-balance">
          {isPendingTeacher
            ? 'Waiting for Faculty Approval'
            : isRejectedTeacher
              ? 'Teacher Request Declined'
              : firebaseUser
                ? 'Set up your school dossier'
                : 'Sign in with your Google account'}
        </h1>
        <p className="mt-2 text-sm text-[#574F45] dark:text-[#CEC5B6] leading-relaxed">
          {isPendingTeacher
            ? 'Your teacher application is waiting for approval from the App Owner (vincentcasintahancarl@gmail.com). This screen will unlock automatically once approved.'
            : isRejectedTeacher
              ? 'The App Owner reviewed and declined this teacher account request.'
              : firebaseUser
                ? 'Finish your academic profile to join lessons, discussions, clubs, and faculty-moderated study spaces.'
                : 'Use Google Sign-In to verify your email and access your StudyCommons workspace across devices.'}
        </p>
      </div>

      <div className="p-5 sm:p-8">
        {(errorMsg || authError) && (
          <div
            role="alert"
            className="mb-5 px-4 py-3 text-xs font-medium text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FAF3F1] dark:bg-[#2D1414] border border-[#E5C9C5] dark:border-[#7F3232] rounded-md break-words"
          >
            {errorMsg || authError}
          </div>
        )}

        {!firebaseUser ? (
          <div className="space-y-5">
            <div className="p-5 rounded-lg border border-[#E2D9C6] dark:border-[#3D362D] bg-[#F5F0E6] dark:bg-[#221E1A] space-y-4">
              <p className="text-sm text-[#443D34] dark:text-[#E0D8CA] leading-relaxed">
                Sign in with your Google account to enter StudyCommons. First-time students, peer tutors, and teachers will complete a short school profile right after signing in.
              </p>
              <button
                type="button"
                disabled={isSigningIn}
                onClick={async () => {
                  setErrorMsg(null);
                  const err = await onGoogleSignIn();
                  if (err) setErrorMsg(err);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] disabled:opacity-60 rounded-md transition-colors whitespace-nowrap"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span>
                  {isSigningIn ? 'Signing in...' : 'Continue with Google'}
                </span>
              </button>
            </div>
          </div>
        ) : (isPendingTeacher || isRejectedTeacher) && ownMember ? (
          <div className="space-y-5">
            <div
              className={`p-4 sm:p-5 rounded-lg border space-y-2.5 ${
                isRejectedTeacher
                  ? 'border-[#E5C9C5] dark:border-[#7F3232] bg-[#FAF3F1] dark:bg-[#2D1414]'
                  : 'border-[#E5C98B] dark:border-[#78571D] bg-[#FEF7E8] dark:bg-[#2B2110]'
              }`}
            >
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border bg-[#FFFDF8] dark:bg-[#1C1916] text-xs font-semibold ${
                  isRejectedTeacher
                    ? 'border-[#E5C9C5] dark:border-[#7F3232] text-[#7C1D1D] dark:text-[#FCA5A5]'
                    : 'border-[#E5C98B] dark:border-[#78571D] text-[#7C4A03] dark:text-[#FCD34D]'
                }`}
              >
                {isRejectedTeacher ? (
                  <Ban className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>
                  {isRejectedTeacher
                    ? 'Declined by Faculty'
                    : 'Pending Faculty Approval'}
                </span>
              </div>

              <h2 className="font-display text-2xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                {ownMember.name}
              </h2>
              <p className="text-xs sm:text-sm text-[#443D34] dark:text-[#E0D8CA] leading-relaxed">
                {isRejectedTeacher
                  ? ownMember.teacherApprovalNote ||
                    'Your teacher account request was declined by the App Owner. Contact vincentcasintahancarl@gmail.com for assistance.'
                  : 'New Teacher accounts require approval from the App Owner (vincentcasintahancarl@gmail.com) before accessing faculty tools, school events, and classroom posting. The App Owner also assigns Teacher Monitor permissions.'}
              </p>
            </div>

            <div className="p-4 rounded-lg border border-[#E2D9C6] dark:border-[#3D362D] bg-[#F5F0E6] dark:bg-[#221E1A] space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[#6B6155] dark:text-[#B8AFA0]">
                  Signed-in Email
                </span>
                <span className="font-mono text-[#1C1917] dark:text-[#F7F3EA] break-all">
                  {firebaseUser.email}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[#6B6155] dark:text-[#B8AFA0]">
                  Department
                </span>
                <span className="font-medium text-[#1C1917] dark:text-[#F7F3EA]">
                  {ownMember.gradeOrDept}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[#6B6155] dark:text-[#B8AFA0]">
                  Subjects to Teach ({getTeacherTaughtSubjects(ownMember).length}/4)
                </span>
                <span className="font-medium text-[#1C1917] dark:text-[#F7F3EA] text-right">
                  {getTeacherTaughtSubjects(ownMember)
                    .map((id) => SUBJECTS.find((s) => s.id === id)?.name)
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
              {getTeacherMonitoredClub(ownMember) && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[#6B6155] dark:text-[#B8AFA0]">
                    Club to Monitor
                  </span>
                  <ClubBadge
                    club={getTeacherMonitoredClub(ownMember)}
                    size="xs"
                  />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#ECE5D5] dark:border-[#342E26] flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-[#6B6155] dark:text-[#B8AFA0]">
                {isPendingTeacher
                  ? 'Listening live for faculty approval...'
                  : 'Signed in as ' + firebaseUser.email}
              </span>
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#443D34] dark:text-[#E0D8CA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] rounded-md transition-colors whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Sign Out & Switch Account</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleOnboardingSubmit} className="space-y-4">
            {/* Verified Google Email Banner */}
            <div className="p-3 rounded-lg border border-[#E2D9C6] dark:border-[#3D362D] bg-[#F5F0E6] dark:bg-[#221E1A] flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="min-w-0">
                <span className="text-[#6B6155] dark:text-[#B8AFA0]">
                  Verified Google Account:{' '}
                </span>
                <span className="font-mono font-medium text-[#1C1917] dark:text-[#F7F3EA] break-all">
                  {firebaseUser.email}
                </span>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="text-xs font-medium text-[var(--theme-accent-text)] hover:underline whitespace-nowrap"
              >
                Use different Google account
              </button>
            </div>

            {/* Account Type Selector */}
            <div className="p-3.5 rounded-lg bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D]">
              <p className="text-xs font-semibold text-[#1C1917] dark:text-[#F7F3EA] mb-2">
                Select Account Type
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleRoleChange(UserRole.STUDENT)}
                  className={`p-2.5 rounded-md border text-left transition-colors ${
                    role === UserRole.STUDENT
                      ? 'bg-[#FFFDF8] dark:bg-[#161412] border-[var(--theme-accent-border)] ring-1 ring-[var(--theme-accent-text)]'
                      : 'bg-[#FFFDF8]/60 dark:bg-[#161412]/60 border-[#DDD4C0] dark:border-[#4A4137] hover:border-[#C5B99F] dark:hover:border-[#635648]'
                  }`}
                >
                  <p className="text-xs font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                    Student
                  </p>
                  <p className="text-[11px] text-[#574F45] dark:text-[#CEC5B6] mt-0.5">
                    Ask questions, share notes & RSVP.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange(UserRole.STUDY_LEAD)}
                  className={`p-2.5 rounded-md border text-left transition-colors ${
                    role === UserRole.STUDY_LEAD
                      ? 'bg-[#FFFDF8] dark:bg-[#161412] border-[var(--theme-accent-border)] ring-1 ring-[var(--theme-accent-text)]'
                      : 'bg-[#FFFDF8]/60 dark:bg-[#161412]/60 border-[#DDD4C0] dark:border-[#4A4137] hover:border-[#C5B99F] dark:hover:border-[#635648]'
                  }`}
                >
                  <p className="text-xs font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                    Peer Tutor
                  </p>
                  <p className="text-[11px] text-[#574F45] dark:text-[#CEC5B6] mt-0.5">
                    Mentor peers & guide study units.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange(UserRole.TEACHER)}
                  className={`p-2.5 rounded-md border text-left transition-colors flex items-start gap-2 ${
                    role === UserRole.TEACHER
                      ? 'bg-[#FFFDF8] dark:bg-[#161412] border-[var(--theme-accent-border)] ring-1 ring-[var(--theme-accent-text)]'
                      : 'bg-[#FFFDF8]/60 dark:bg-[#161412]/60 border-[#DDD4C0] dark:border-[#4A4137] hover:border-[#C5B99F] dark:hover:border-[#635648]'
                  }`}
                >
                  <ShieldCheck
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      role === UserRole.TEACHER
                        ? 'text-[var(--theme-accent-text)]'
                        : 'text-[#6B6155] dark:text-[#B8AFA0]'
                    }`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                      Own Teacher Account
                    </p>
                    <p className="text-[11px] text-[#574F45] dark:text-[#CEC5B6] mt-0.5">
                      Monitor posts, issue warnings & add events.
                    </p>
                  </div>
                </button>
              </div>

              {role === UserRole.TEACHER && (
                <div className="mt-2.5 rounded-md border border-[#E5C98B] dark:border-[#78571D] bg-[#FEF7E8] dark:bg-[#2B2110] px-3 py-2 flex items-start gap-2">
                  <Clock
                    className="w-3.5 h-3.5 text-[#7C4A03] dark:text-[#FCD34D] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <p className="text-[11px] text-[#7C4A03] dark:text-[#FCD34D] leading-relaxed">
                    <span className="font-semibold">Owner Approval Required:</span>{' '}
                    New teacher accounts must be reviewed and approved by the App Owner (vincentcasintahancarl@gmail.com). Only teachers granted Monitor access by the App Owner can open Teacher Monitor.
                  </p>
                </div>
              )}
            </div>

            {/* Optional Profile Picture */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingAvatar(true);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setIsDraggingAvatar(false);
                }
              }}
              onDrop={handleAvatarDrop}
              className={`p-3.5 rounded-lg border transition-colors ${
                isDraggingAvatar
                  ? 'bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)]'
                  : 'bg-[#F5F0E6] dark:bg-[#221E1A] border-[#E2D9C6] dark:border-[#3D362D]'
              }`}
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative shrink-0">
                  <MemberAvatar
                    name={name.trim() || 'New Scholar'}
                    src={avatarUrl || undefined}
                    size="xl"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    aria-label="Upload profile picture image"
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-[#FFFDF8] border-2 border-[#FFFDF8] dark:border-[#161412] flex items-center justify-center shadow-xs transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex-1 min-w-0 sm:min-w-[200px] space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                      Profile Picture (Optional)
                    </p>
                    <p className="text-[11px] text-[#574F45] dark:text-[#CEC5B6]">
                      Upload or drop an image file, paste a picture URL, or pick a school portrait.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="sr-only"
                    />
                    <button
                      type="button"
                      disabled={isProcessingAvatar}
                      onClick={() => avatarInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1C1917] dark:text-[#F7F3EA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] hover:bg-[#ECE5D5] dark:hover:bg-[#2C2721] disabled:opacity-50 rounded-md transition-colors whitespace-nowrap"
                    >
                      <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>
                        {isProcessingAvatar ? 'Processing...' : 'Upload Image'}
                      </span>
                    </button>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#E5C9C5] dark:border-[#7F3232] hover:bg-[#FAF3F1] dark:hover:bg-[#2D1414] rounded-md transition-colors whitespace-nowrap"
                      >
                        <Trash2 className="w-3 h-3" aria-hidden="true" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[#E2D9C6] dark:border-[#3D362D] grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <label
                    htmlFor="reg-avatar-url"
                    className="block text-[11px] font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1"
                  >
                    Or paste image URL
                  </label>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1 min-w-0">
                      <Link2
                        className="w-3.5 h-3.5 text-[#8C7F6D] dark:text-[#9C9385] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        aria-hidden="true"
                      />
                      <input
                        id="reg-avatar-url"
                        type="url"
                        value={avatarUrlInput}
                        onChange={(e) => setAvatarUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            void handleApplyAvatarUrl();
                          }
                        }}
                        placeholder="https://example.com/photo.jpg"
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#8C7F6D] dark:placeholder:text-[#9C9385] bg-[#FFFDF8] dark:bg-[#161412] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isProcessingAvatar || !avatarUrlInput.trim()}
                      onClick={() => void handleApplyAvatarUrl()}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] hover:bg-[var(--theme-accent-soft-hover)] disabled:opacity-50 rounded-md transition-colors whitespace-nowrap shrink-0"
                    >
                      <ImagePlus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Use URL</span>
                    </button>
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1">
                    Or choose a portrait preset
                  </span>
                  <div className="flex items-center gap-2">
                    {SCHOLAR_AVATAR_PRESETS.map((preset) => {
                      const isPicked = avatarUrl === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setAvatarUrl(preset.url)}
                          title={preset.label}
                          aria-label={`Use ${preset.label} portrait`}
                          className={`rounded-md p-0.5 border transition-colors ${
                            isPicked
                              ? 'border-[var(--theme-accent-text)] ring-2 ring-[var(--theme-accent-text)]'
                              : 'border-[#DDD4C0] dark:border-[#4A4137] hover:border-[var(--theme-accent-border)]'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="w-8 h-8 rounded object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div
                role="note"
                className="mt-3 rounded-md border border-[#E5C98B] dark:border-[#78571D] bg-[#FEF7E8] dark:bg-[#2B2110] px-3 py-2 flex items-start gap-2"
              >
                <AlertTriangle
                  className="w-3.5 h-3.5 text-[#7C4A03] dark:text-[#FCD34D] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <p className="text-[11px] text-[#7C4A03] dark:text-[#FCD34D] leading-relaxed">
                  <span className="font-semibold">Profile Picture Rule:</span>{' '}
                  Use an appropriate school portrait. Uploading an inappropriate image can lead to a{' '}
                  <span className="font-semibold">Mid Warning</span> from Teacher Monitor.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="reg-name"
                  className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sophia Reyes"
                  className="w-full px-3.5 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
                />
              </div>

              <div>
                <label
                  htmlFor="reg-username"
                  className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
                >
                  Username
                </label>
                <div className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-[#786E62] dark:text-[#9C9385]"
                  >
                    @
                  </span>
                  <input
                    id="reg-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="sophia.reyes"
                    className="w-full pl-8 pr-3.5 py-2 text-sm font-mono text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="reg-grade"
                  className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
                >
                  {role === UserRole.TEACHER
                    ? 'Faculty Department'
                    : 'Grade Level'}
                </label>
                {role === UserRole.TEACHER ? (
                  <input
                    id="reg-grade"
                    type="text"
                    required
                    value={gradeOrDept}
                    onChange={(e) => setGradeOrDept(e.target.value)}
                    placeholder="e.g. Science Faculty"
                    className="w-full px-3.5 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
                  />
                ) : (
                  <select
                    id="reg-grade"
                    value={gradeOrDept}
                    onChange={(e) => setGradeOrDept(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
                  >
                    {GRADE_LEVEL_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label
                  htmlFor="reg-section"
                  className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
                >
                  {role === UserRole.TEACHER
                    ? 'Faculty Office / Room'
                    : 'Section / Advisory'}
                </label>
                <input
                  id="reg-section"
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder={
                    role === UserRole.TEACHER
                      ? 'e.g. Room 302 · Lab Wing'
                      : 'e.g. Section 12-Curie'
                  }
                  className="w-full px-3.5 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="reg-track"
                  className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
                >
                  {role === UserRole.TEACHER
                    ? 'Teaching Specialty'
                    : 'Course / Academic Strand'}
                </label>
                {role === UserRole.TEACHER ? (
                  <input
                    id="reg-track"
                    type="text"
                    value={courseOrTrack}
                    onChange={(e) => setCourseOrTrack(e.target.value)}
                    placeholder="e.g. Academic Monitor & Sciences"
                    className="w-full px-3.5 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
                  />
                ) : (
                  <select
                    id="reg-track"
                    value={courseOrTrack}
                    onChange={(e) => setCourseOrTrack(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
                  >
                    {COURSE_TRACK_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label
                  htmlFor="reg-subject"
                  className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
                >
                  {role === UserRole.TEACHER
                    ? 'Lead Subject Taught'
                    : 'Primary Subject'}
                </label>
                <select
                  id="reg-subject"
                  value={focusSubject}
                  onChange={(e) => {
                    const next = e.target.value as SubjectId;
                    setFocusSubject(next);
                    setEnrolledSubjects((prev) => {
                      if (prev.includes(next)) return prev;
                      if (
                        role === UserRole.TEACHER &&
                        prev.length >= TEACHER_MAX_SUBJECTS
                      ) {
                        return [next, ...prev.slice(0, TEACHER_MAX_SUBJECTS - 1)];
                      }
                      return [...prev, next];
                    });
                  }}
                  className="w-full px-3.5 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* School Club Badge / Monitored Club */}
            <div className="p-3.5 rounded-lg bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D] space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="reg-club"
                  className="text-xs font-medium text-[#443D34] dark:text-[#E0D8CA]"
                >
                  {role === UserRole.TEACHER
                    ? 'Club You Monitor'
                    : 'School Club Badge'}
                </label>
                {(clubSelection === '__custom__'
                  ? customClubName.trim()
                  : clubSelection.trim()) && (
                  <ClubBadge
                    club={
                      clubSelection === '__custom__'
                        ? customClubName.trim()
                        : clubSelection.trim()
                    }
                    size="xs"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <select
                  id="reg-club"
                  value={clubSelection}
                  onChange={(e) => setClubSelection(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium text-[#1C1917] dark:text-[#F7F3EA] bg-[#FFFDF8] dark:bg-[#161412] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
                >
                  <option value="">
                    {role === UserRole.TEACHER
                      ? 'No club monitored yet'
                      : 'No club badge yet'}
                  </option>
                  {SCHOOL_CLUBS.map((club) => (
                    <option key={club.id} value={club.name}>
                      {club.name} — {club.tagline}
                    </option>
                  ))}
                  <option value="__custom__">Other club (enter name)</option>
                </select>

                {clubSelection === '__custom__' && (
                  <input
                    type="text"
                    value={customClubName}
                    onChange={(e) => setCustomClubName(e.target.value)}
                    placeholder="Enter club name"
                    className="w-full px-3 py-2 text-xs text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#FFFDF8] dark:bg-[#161412] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
                  />
                )}
              </div>
            </div>

            {/* Enrolled Courses or Teacher 3-4 Subjects Taught */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <p className="text-xs font-medium text-[#443D34] dark:text-[#E0D8CA]">
                  {role === UserRole.TEACHER
                    ? `Subjects You Teach (Choose ${TEACHER_MIN_SUBJECTS} to ${TEACHER_MAX_SUBJECTS})`
                    : 'Enrolled Courses'}
                </p>
                {role === UserRole.TEACHER && (
                  <span className="text-[11px] font-mono tabular-nums text-[#6B6155] dark:text-[#B8AFA0]">
                    {enrolledSubjects.length}/{TEACHER_MAX_SUBJECTS} selected
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SUBJECTS.map((sub) => {
                  const selected = enrolledSubjects.includes(sub.id);
                  const isLead = focusSubject === sub.id;
                  const teacherAtMax =
                    role === UserRole.TEACHER &&
                    !selected &&
                    enrolledSubjects.length >= TEACHER_MAX_SUBJECTS;
                  const teacherAtMin =
                    role === UserRole.TEACHER &&
                    selected &&
                    enrolledSubjects.length <= TEACHER_MIN_SUBJECTS;
                  const isLocked = isLead || teacherAtMax || teacherAtMin;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      disabled={isLocked}
                      onClick={() => {
                        if (isLocked) return;
                        setEnrolledSubjects((prev) =>
                          prev.includes(sub.id)
                            ? prev.filter((id) => id !== sub.id)
                            : [...prev, sub.id]
                        );
                      }}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                        selected
                          ? 'bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)] text-[var(--theme-accent-text)]'
                          : 'bg-[#FFFDF8] dark:bg-[#1C1916] border-[#DDD4C0] dark:border-[#4A4137] text-[#574F45] dark:text-[#CEC5B6] hover:bg-[#F5F0E6] dark:hover:bg-[#221E1A]'
                      } ${isLocked && !isLead ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {sub.name}
                      {isLead ? ' · Lead' : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-[#ECE5D5] dark:border-[#342E26] flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1.5 text-xs text-[#6B6155] dark:text-[#B8AFA0]">
                <CheckCircle2
                  className="w-3.5 h-3.5 text-[var(--theme-accent-text)]"
                  aria-hidden="true"
                />
                <span>
                  {role === UserRole.TEACHER
                    ? 'Requires faculty approval before sign-in'
                    : 'Includes Mail Stamp Check & School Events RSVP'}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 text-sm font-medium text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] disabled:opacity-60 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-4 h-4" aria-hidden="true" />
                <span>
                  {isSubmitting
                    ? 'Submitting...'
                    : role === UserRole.TEACHER
                      ? 'Submit for Faculty Approval'
                      : 'Complete Registration'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--theme-canvas)] text-[#1C1917] dark:text-[#F7F3EA]">
      <header className="sticky top-0 z-30 bg-[#FFFDF8]/95 dark:bg-[#12100E]/95 backdrop-blur-md border-b border-[#E2D9C6] dark:border-[#3D362D]">
        <div className="max-w-[1200px] mx-auto px-3 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-2 sm:gap-8">
          <div className="flex items-center gap-2 min-w-0">
            {onBackToWelcome ? (
              <button
                type="button"
                onClick={onBackToWelcome}
                className="font-display text-lg sm:text-[26px] font-bold tracking-[0.01em] text-[#1C1917] dark:text-[#F7F3EA] hover:text-[var(--theme-accent-text)] transition-colors whitespace-nowrap truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent-text)] rounded py-1"
              >
                StudyCommons
              </button>
            ) : (
              <span className="font-display text-lg sm:text-[26px] font-bold tracking-[0.01em] text-[#1C1917] dark:text-[#F7F3EA] whitespace-nowrap truncate">
                StudyCommons
              </span>
            )}
          </div>

          <span className="hidden sm:inline text-xs text-[#6B6155] dark:text-[#B8AFA0] whitespace-nowrap shrink-0">
            Collaborative School Q&A & Study Archive
          </span>

          <div className="shrink-0 flex items-center gap-2.5">
            {firebaseUser && (
              <button
                type="button"
                onClick={onSignOut}
                className="px-3.5 py-2 text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                Sign Out
              </button>
            )}

            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                aria-label="Open settings page"
                title="Settings"
                className="inline-flex items-center justify-center gap-1 w-10 h-10 rounded-md border border-[#D8CEBA] dark:border-[#52483C] bg-[#FFFDF8] dark:bg-[#1C1916] text-[#443D34] dark:text-[#E0D8CA] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] hover:border-[#C5B99F] dark:hover:border-[#6B5F4E] transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent-text)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#12100E]"
              >
                <span className="w-1 h-1 rounded-full bg-current" aria-hidden="true" />
                <span className="w-1 h-1 rounded-full bg-current" aria-hidden="true" />
                <span className="w-1 h-1 rounded-full bg-current" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-12 space-y-5">
        {onBackToWelcome && !firebaseUser && (
          <button
            type="button"
            onClick={onBackToWelcome}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Welcome</span>
          </button>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="order-2 lg:order-1 lg:col-span-5 space-y-5 sm:space-y-6">
            <div>
              <p className="heritage-eyebrow mb-2">
                Welcome to Classroom Commons
              </p>
              <h2 className="font-display text-4xl font-semibold text-[#1C1917] dark:text-[#F7F3EA] leading-[1.1] text-balance">
                Build shared class understanding together.
              </h2>
              <p className="mt-3 text-sm text-[#574F45] dark:text-[#CEC5B6] leading-relaxed">
                Join classmates and faculty across Grades 7–12 to ask targeted lesson questions, share study strategies, and track every reply with stamped read confirmations.
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border heritage-card">
              <ResilientImage
                src={HERO_BANNER_IMAGE}
                alt="Students studying together with open notebooks at a sunlit school library table"
                fallbackTitle="StudyCommons Classroom"
                className="w-full h-52 object-cover"
              />
              <div className="p-5 space-y-3 border-t border-[#E2D9C6] dark:border-[#3D362D]">
                <div className="flex items-start gap-2.5 text-xs text-[#443D34] dark:text-[#E0D8CA]">
                  <BookOpen
                    className="w-4 h-4 text-[var(--theme-accent-text)] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>
                    <strong className="font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                      Grades 7–12 & Faculty Units:
                    </strong>{' '}
                    Filter discussions by grade level, subject, and syllabus unit.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-[#443D34] dark:text-[#E0D8CA]">
                  <CheckCheck
                    className="w-4 h-4 text-[var(--theme-accent-text)] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>
                    <strong className="font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                      Question Mail & Stamp Check:
                    </strong>{' '}
                    Receive replies to your questions with dated read stamps.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-[#443D34] dark:text-[#E0D8CA]">
                  <Palette
                    className="w-4 h-4 text-[var(--theme-accent-text)] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>
                    <strong className="font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                      Custom Theme Settings:
                    </strong>{' '}
                    Personalize your accent ink color, backdrop, and high-contrast dark mode anytime.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-7 space-y-4">
            {formCard}
          </div>
        </div>
      </main>
    </div>
  );
}
