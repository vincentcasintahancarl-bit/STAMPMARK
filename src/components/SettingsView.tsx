import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  Check,
  CheckCheck,
  CheckCircle2,
  ImagePlus,
  Link2,
  LogOut,
  Mail,
  Moon,
  Palette,
  RotateCcw,
  Save,
  Sun,
  Trash2,
  Upload,
  User,
  UserCog,
} from 'lucide-react';
import {
  COURSE_TRACK_OPTIONS,
  GRADE_LEVEL_OPTIONS,
  SCHOLAR_AVATAR_PRESETS,
  SCHOOL_CLUBS,
  SUBJECTS,
} from '../data/seedData';
import {
  CanvasTone,
  ColorMode,
  GradeLevel,
  RegisteredAccount,
  SchoolMember,
  SettingsSection,
  SubjectId,
  ThemePreference,
  ThemePresetId,
  UserRole,
} from '../types/school';
import { resizeAvatarFileToDataUrl, validateImageUrl } from '../utils/image';
import {
  getMemberUsername,
  getTeacherMonitoredClub,
  getTeacherTaughtSubjects,
  normalizeUsername,
  TEACHER_MAX_SUBJECTS,
  TEACHER_MIN_SUBJECTS,
} from '../utils/storage';
import {
  CANVAS_TONES,
  computeThemeTokens,
  DEFAULT_THEME_PREFERENCE,
  normalizeHex,
  THEME_PRESETS,
} from '../utils/theme';
import { ClubBadge } from './ClubBadge';
import { MemberAvatar } from './MemberAvatar';
import { OwnerBadge } from './OwnerBadge';

interface SettingsViewProps {
  theme: ThemePreference;
  onUpdateTheme: (next: ThemePreference) => void;
  onBack: () => void;
  backLabel?: string;
  activeSection?: SettingsSection;
  onChangeSection?: (section: SettingsSection) => void;
  canManageAccount?: boolean;
  activeMember?: SchoolMember;
  isAppOwner?: boolean;
  allMembers?: SchoolMember[];
  linkedAccount?: RegisteredAccount | null;
  onUpdateMemberAvatar?: (memberId: string, avatarUrl: string) => void;
  onUpdateMemberProfile?: (
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
  ) => void;
  onViewAccountDossier?: (memberId: string) => void;
  onLogOut?: () => void;
}

export function SettingsView({
  theme,
  onUpdateTheme,
  onBack,
  backLabel = 'Back to Classroom Feed',
  activeSection = SettingsSection.APPEARANCE,
  onChangeSection,
  canManageAccount = false,
  activeMember,
  isAppOwner = false,
  allMembers = [],
  linkedAccount = null,
  onUpdateMemberAvatar,
  onUpdateMemberProfile,
  onViewAccountDossier,
  onLogOut,
}: SettingsViewProps) {
  const [hexInput, setHexInput] = useState(theme.customHex);
  const [hexError, setHexError] = useState<string | null>(null);

  const memberEffectiveUsername = activeMember
    ? getMemberUsername(activeMember.name, activeMember.username)
    : '';
  const [username, setUsername] = useState(memberEffectiveUsername);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [gradeOrDept, setGradeOrDept] = useState(
    activeMember?.gradeOrDept || GradeLevel.GRADE_12
  );
  const [section, setSection] = useState(activeMember?.section || '');
  const [courseOrTrack, setCourseOrTrack] = useState(
    activeMember?.courseOrTrack || COURSE_TRACK_OPTIONS[0]
  );
  const isTeacher = activeMember?.role === UserRole.TEACHER;
  const initialClub = activeMember
    ? (isTeacher
        ? getTeacherMonitoredClub(activeMember)
        : activeMember.club?.trim()) || ''
    : '';
  const isPresetClub =
    initialClub !== '' &&
    SCHOOL_CLUBS.some(
      (c) => c.name.toLowerCase() === initialClub.toLowerCase()
    );
  const [clubSelection, setClubSelection] = useState(
    initialClub === '' ? '' : isPresetClub ? initialClub : '__custom__'
  );
  const [customClubName, setCustomClubName] = useState(
    isPresetClub ? '' : initialClub
  );
  const [focusSubject, setFocusSubject] = useState<SubjectId>(
    activeMember?.focusSubject || SubjectId.MATHEMATICS
  );
  const [enrolledSubjects, setEnrolledSubjects] = useState<SubjectId[]>(
    activeMember
      ? isTeacher
        ? getTeacherTaughtSubjects(activeMember)
        : activeMember.enrolledSubjects &&
            activeMember.enrolledSubjects.length > 0
          ? activeMember.enrolledSubjects
          : [activeMember.focusSubject]
      : [SubjectId.MATHEMATICS]
  );
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [bio, setBio] = useState(activeMember?.bio || '');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setHexInput(theme.customHex);
  }, [theme.customHex]);

  useEffect(() => {
    if (!activeMember) return;
    const memberIsTeacher = activeMember.role === UserRole.TEACHER;
    setSavedNotice(false);
    setUsernameError(null);
    setSubjectsError(null);
    setAvatarError(null);
    setAvatarUrlInput('');
    setIsDraggingAvatar(false);
    setUsername(getMemberUsername(activeMember.name, activeMember.username));
    setGradeOrDept(activeMember.gradeOrDept);
    setSection(activeMember.section || '');
    setCourseOrTrack(activeMember.courseOrTrack || COURSE_TRACK_OPTIONS[0]);
    const nextClub =
      (memberIsTeacher
        ? getTeacherMonitoredClub(activeMember)
        : activeMember.club?.trim()) || '';
    const matchesPreset =
      nextClub !== '' &&
      SCHOOL_CLUBS.some(
        (c) => c.name.toLowerCase() === nextClub.toLowerCase()
      );
    setClubSelection(
      nextClub === '' ? '' : matchesPreset ? nextClub : '__custom__'
    );
    setCustomClubName(matchesPreset ? '' : nextClub);
    setFocusSubject(activeMember.focusSubject);
    setEnrolledSubjects(
      memberIsTeacher
        ? getTeacherTaughtSubjects(activeMember)
        : activeMember.enrolledSubjects &&
            activeMember.enrolledSubjects.length > 0
          ? activeMember.enrolledSubjects
          : [activeMember.focusSubject]
    );
    setBio(activeMember.bio || '');
  }, [activeMember]);

  const computed = computeThemeTokens(theme);
  const isDark = theme.colorMode === 'dark';
  const currentSection = canManageAccount
    ? activeSection
    : SettingsSection.APPEARANCE;

  const handleSetColorMode = (colorMode: ColorMode) => {
    onUpdateTheme({
      ...theme,
      colorMode,
    });
  };

  const handleToggleDarkMode = () => {
    handleSetColorMode(isDark ? 'light' : 'dark');
  };

  const handleSelectPreset = (presetId: Exclude<ThemePresetId, 'custom'>) => {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    setHexError(null);
    onUpdateTheme({
      ...theme,
      presetId,
      customHex: preset ? preset.accent : theme.customHex,
    });
  };

  const handleColorPickerChange = (hex: string) => {
    const normalized = normalizeHex(hex) || hex.toUpperCase();
    setHexInput(normalized);
    setHexError(null);
    onUpdateTheme({
      ...theme,
      presetId: 'custom',
      customHex: normalized,
    });
  };

  const handleApplyHexInput = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeHex(hexInput);
    if (!normalized) {
      setHexError('Enter a valid 6-digit hex color such as #991B1B.');
      return;
    }
    setHexError(null);
    setHexInput(normalized);
    onUpdateTheme({
      ...theme,
      presetId: 'custom',
      customHex: normalized,
    });
  };

  const handleSelectCanvas = (canvasTone: CanvasTone) => {
    onUpdateTheme({
      ...theme,
      canvasTone,
    });
  };

  const handleResetDefault = () => {
    setHexError(null);
    onUpdateTheme(DEFAULT_THEME_PREFERENCE);
  };

  const processAvatarImageFile = async (file: File) => {
    if (!activeMember || !onUpdateMemberAvatar) return;
    setAvatarError(null);
    setIsProcessingAvatar(true);
    try {
      const dataUrl = await resizeAvatarFileToDataUrl(file, 256);
      onUpdateMemberAvatar(activeMember.id, dataUrl);
      setAvatarUrlInput('');
      setSavedNotice(true);
    } catch (err) {
      setAvatarError(
        err instanceof Error
          ? err.message
          : 'Unable to update profile portrait.'
      );
    } finally {
      setIsProcessingAvatar(false);
    }
  };

  const handleAvatarFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await processAvatarImageFile(file);
  };

  const handleAvatarDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingAvatar(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processAvatarImageFile(file);
    }
  };

  const handleApplyAvatarUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMember || !onUpdateMemberAvatar) return;
    setAvatarError(null);
    setIsProcessingAvatar(true);
    try {
      const validUrl = await validateImageUrl(avatarUrlInput);
      onUpdateMemberAvatar(activeMember.id, validUrl);
      setAvatarUrlInput('');
      setSavedNotice(true);
    } catch (err) {
      setAvatarError(
        err instanceof Error
          ? err.message
          : 'Unable to load an image from that URL.'
      );
    } finally {
      setIsProcessingAvatar(false);
    }
  };

  const handleToggleSubject = (id: SubjectId) => {
    setSubjectsError(null);
    setEnrolledSubjects((prev) => {
      if (prev.includes(id)) {
        const minRequired = isTeacher ? TEACHER_MIN_SUBJECTS : 1;
        if (prev.length <= minRequired) {
          if (isTeacher) {
            setSubjectsError(
              `Teachers must select ${TEACHER_MIN_SUBJECTS} to ${TEACHER_MAX_SUBJECTS} subjects taught.`
            );
          }
          return prev;
        }
        const next = prev.filter((item) => item !== id);
        if (focusSubject === id) {
          setFocusSubject(next[0]);
        }
        return next;
      }
      if (isTeacher && prev.length >= TEACHER_MAX_SUBJECTS) {
        setSubjectsError(
          `Teachers can teach up to ${TEACHER_MAX_SUBJECTS} subjects. Uncheck one to add another.`
        );
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMember || !onUpdateMemberProfile) return;
    setUsernameError(null);
    setSubjectsError(null);

    const cleanedUsername = normalizeUsername(username);
    if (cleanedUsername.length < 2) {
      setUsernameError(
        'Username must be at least 2 letters or numbers (e.g. maya.lin).'
      );
      return;
    }

    const duplicate = allMembers.some(
      (m) =>
        m.id !== activeMember.id &&
        getMemberUsername(m.name, m.username) === cleanedUsername
    );
    if (duplicate) {
      setUsernameError('That username is already taken by another member.');
      return;
    }

    const normalizedSubjects = enrolledSubjects.includes(focusSubject)
      ? enrolledSubjects
      : [focusSubject, ...enrolledSubjects];

    if (
      isTeacher &&
      (normalizedSubjects.length < TEACHER_MIN_SUBJECTS ||
        normalizedSubjects.length > TEACHER_MAX_SUBJECTS)
    ) {
      setSubjectsError(
        `Teachers must teach ${TEACHER_MIN_SUBJECTS} to ${TEACHER_MAX_SUBJECTS} subjects (currently ${normalizedSubjects.length}).`
      );
      return;
    }

    const resolvedClub =
      clubSelection === '__custom__'
        ? customClubName.trim()
        : clubSelection.trim();

    onUpdateMemberProfile(activeMember.id, {
      username: cleanedUsername,
      gradeOrDept: gradeOrDept.trim() || activeMember.gradeOrDept,
      section: section.trim(),
      courseOrTrack: courseOrTrack.trim(),
      club: resolvedClub || undefined,
      monitoredClub: isTeacher ? resolvedClub || undefined : undefined,
      focusSubject,
      enrolledSubjects: normalizedSubjects,
      taughtSubjects: isTeacher ? normalizedSubjects : undefined,
      bio: bio.trim(),
    });
    setUsername(cleanedUsername);
    setSavedNotice(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>{backLabel}</span>
        </button>

        {currentSection === SettingsSection.APPEARANCE && (
          <button
            type="button"
            onClick={handleResetDefault}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#574F45] dark:text-[#CEC5B6] hover:text-[var(--theme-accent-text)] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset to Oxblood Crest</span>
          </button>
        )}

        {currentSection === SettingsSection.ACCOUNT &&
          activeMember &&
          onViewAccountDossier && (
            <button
              type="button"
              onClick={() => onViewAccountDossier(activeMember.id)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--theme-accent-text)] hover:underline transition-colors"
            >
              <User className="w-3.5 h-3.5" aria-hidden="true" />
              <span>View Scholar Dossier</span>
            </button>
          )}
      </div>

      {/* Split Settings Section Switcher (Theme & Appearance | Edit Account | Log Out) */}
      {canManageAccount && onChangeSection && (
        <div
          role="tablist"
          aria-label="Settings sections"
          className="grid grid-cols-3 gap-1.5 p-1.5 bg-[#EFE8D9] dark:bg-[#24201B] border border-[#E2D9C6] dark:border-[#3D362D] rounded-xl sm:rounded-lg"
        >
          <button
            type="button"
            role="tab"
            aria-selected={currentSection === SettingsSection.APPEARANCE}
            onClick={() => onChangeSection(SettingsSection.APPEARANCE)}
            className={`inline-flex items-center justify-center gap-2 px-3 min-h-[42px] sm:min-h-[38px] text-xs font-medium rounded-lg sm:rounded-md transition-colors whitespace-nowrap ${
              currentSection === SettingsSection.APPEARANCE
                ? 'bg-[#FFFDF8] dark:bg-[#161412] text-[var(--theme-accent-text)] shadow-xs border border-[#E2D9C6] dark:border-[#3D362D]'
                : 'text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]'
            }`}
          >
            <Palette className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">Theme & Appearance</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={currentSection === SettingsSection.ACCOUNT}
            onClick={() => {
              setSavedNotice(false);
              onChangeSection(SettingsSection.ACCOUNT);
            }}
            className={`inline-flex items-center justify-center gap-2 px-3 min-h-[42px] sm:min-h-[38px] text-xs font-medium rounded-lg sm:rounded-md transition-colors whitespace-nowrap ${
              currentSection === SettingsSection.ACCOUNT
                ? 'bg-[#FFFDF8] dark:bg-[#161412] text-[var(--theme-accent-text)] shadow-xs border border-[#E2D9C6] dark:border-[#3D362D]'
                : 'text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]'
            }`}
          >
            <UserCog className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">Edit Account</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={currentSection === SettingsSection.LOGOUT}
            onClick={() => onChangeSection(SettingsSection.LOGOUT)}
            className={`inline-flex items-center justify-center gap-2 px-3 min-h-[42px] sm:min-h-[38px] text-xs font-medium rounded-lg sm:rounded-md transition-colors whitespace-nowrap ${
              currentSection === SettingsSection.LOGOUT
                ? 'bg-[#FFFDF8] dark:bg-[#161412] text-[#7C1D1D] dark:text-[#FCA5A5] shadow-xs border border-[#E2D9C6] dark:border-[#3D362D]'
                : 'text-[#574F45] dark:text-[#CEC5B6] hover:text-[#7C1D1D] dark:hover:text-[#FCA5A5]'
            }`}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">Log Out</span>
          </button>
        </div>
      )}

      {/* SECTION 1: THEME & APPEARANCE */}
      {currentSection === SettingsSection.APPEARANCE && (
        <>
          <div>
            <p className="heritage-eyebrow mb-1.5">
              Stationery & Heraldry Preferences
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#1C1917] dark:text-[#F7F3EA] text-balance">
              Theme Ink & Archival Paper
            </h1>
            <p className="mt-1 text-sm text-[#574F45] dark:text-[#CEC5B6]">
              Select an heirloom ink palette, paper stock, or high-contrast dark mode for study threads, buttons, and Mail Stamp Checks.
            </p>
          </div>

          {/* Display Contrast Mode (Light vs High-Contrast Dark Mode) */}
          <section
            aria-labelledby="display-contrast-heading"
            className="heritage-card border rounded-xl sm:rounded-lg p-4 sm:p-6 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2
                  id="display-contrast-heading"
                  className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]"
                >
                  Display & Contrast Mode
                </h2>
                <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] mt-0.5">
                  Switch between warm archival parchment and High-Contrast Dark Mode calibrated for low-glare reading.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isDark}
                onClick={handleToggleDarkMode}
                className={`inline-flex items-center gap-3 px-3.5 py-2 min-h-[44px] sm:min-h-0 rounded-lg sm:rounded-md border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent-text)] ${
                  isDark
                    ? 'bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)] text-[#F7F3EA]'
                    : 'bg-[#FFFDF8] border-[#D8CEBA] text-[#1C1917] hover:bg-[#F5F0E6]'
                }`}
              >
                {isDark ? (
                  <Moon
                    className="w-4 h-4 text-[var(--theme-accent-text)] shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <Sun
                    className="w-4 h-4 text-[#8C6D3B] shrink-0"
                    aria-hidden="true"
                  />
                )}
                <span className="text-xs font-semibold">
                  High-Contrast Dark Mode: {isDark ? 'On' : 'Off'}
                </span>
                <span
                  aria-hidden="true"
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors ${
                    isDark
                      ? 'bg-[var(--theme-accent)] border-[var(--theme-accent-text)]'
                      : 'bg-[#E2D9C6] border-[#C5B99F]'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-[#FFFDF8] transition-transform ${
                      isDark ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSetColorMode('light')}
                aria-pressed={!isDark}
                className={`text-left p-4 rounded-lg border transition-colors flex items-start gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent-text)] ${
                  !isDark
                    ? 'border-[var(--theme-accent)] bg-[var(--theme-accent-soft)]'
                    : 'border-[#3D362D] bg-[#1C1916] hover:bg-[#24201C]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="w-9 h-9 rounded-md border border-[#CFC3AA] bg-[#F6F2E9] text-[#1C1917] shrink-0 flex items-center justify-center"
                >
                  <Sun className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                      Archival Light
                    </span>
                    {!isDark && (
                      <span className="text-[11px] font-medium text-[var(--theme-accent-text)]">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] mt-0.5 leading-snug">
                    Daylight manuscript stock with deep charcoal ink typography.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSetColorMode('dark')}
                aria-pressed={isDark}
                className={`text-left p-4 rounded-lg border transition-colors flex items-start gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent-text)] ${
                  isDark
                    ? 'border-[var(--theme-accent-border)] bg-[var(--theme-accent-soft)]'
                    : 'border-[#E2D9C6] bg-[#FFFDF8] hover:bg-[#F5F0E6]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="w-9 h-9 rounded-md border border-[#52483C] bg-[#0C0B09] text-[#F7F3EA] shrink-0 flex items-center justify-center"
                >
                  <Moon className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                      High-Contrast Dark
                    </span>
                    {isDark && (
                      <span className="text-[11px] font-medium text-[var(--theme-accent-text)]">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] mt-0.5 leading-snug">
                    Obsidian inkwell backdrop, crisp hairline rules, and brightened ivory & crest accents.
                  </p>
                </div>
              </button>
            </div>
          </section>

          {/* Curated Collegiate Palettes */}
          <section className="heritage-card border rounded-xl sm:rounded-lg p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                  Heritage Ink Palettes
                </h2>
                <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] mt-0.5">
                  Restrained old-money crest inks tailored for long-form reading across light and dark modes.
                </p>
              </div>
              <span className="text-xs font-mono text-[#6B6155] dark:text-[#B8AFA0] tabular-nums whitespace-nowrap shrink-0">
                Active: {computed.accentText}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {THEME_PRESETS.map((preset) => {
                const isSelected = theme.presetId === preset.id;
                const displaySwatch = isDark ? preset.darkAccent : preset.accent;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    aria-pressed={isSelected}
                    className={`text-left p-4 rounded-lg border transition-colors flex items-start gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent-text)] ${
                      isSelected
                        ? 'border-[var(--theme-accent-border)] bg-[var(--theme-accent-soft)]'
                        : 'border-[#E2D9C6] dark:border-[#3D362D] bg-[#FFFDF8] dark:bg-[#1C1916] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] hover:border-[#CFC3AA] dark:hover:border-[#52483C]'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="w-9 h-9 rounded-md border border-black/15 dark:border-white/20 shrink-0 flex items-center justify-center text-[#FFFDF8]"
                      style={{ backgroundColor: displaySwatch }}
                    >
                      {isSelected && <Check className="w-4 h-4" />}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#1C1917] dark:text-[#F7F3EA] truncate">
                          {preset.name}
                        </span>
                        {isSelected && (
                          <span className="text-[11px] font-medium text-[var(--theme-accent-text)] shrink-0">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] mt-0.5 leading-snug">
                        {preset.subtitle}
                      </p>
                      <p className="text-[11px] font-mono text-[#8A7F70] dark:text-[#A39A8B] mt-1.5 tabular-nums">
                        {isDark ? preset.darkText : preset.accent}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Custom Accent Color Picker */}
          <section className="heritage-card border rounded-xl sm:rounded-lg p-4 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                  Custom Crest Ink
                </h2>
                <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] mt-0.5">
                  Choose any color from the spectrum or enter a hex value. Shades are automatically calibrated to preserve crisp WCAG contrast.
                </p>
              </div>
              {theme.presetId === 'custom' && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--theme-accent-text)] whitespace-nowrap shrink-0">
                  <Palette className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Custom Active</span>
                </span>
              )}
            </div>

            <form
              onSubmit={handleApplyHexInput}
              className="flex flex-wrap items-end gap-3"
            >
              <div>
                <label
                  htmlFor="custom-color-picker"
                  className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
                >
                  Ink Swatch
                </label>
                <input
                  id="custom-color-picker"
                  type="color"
                  value={normalizeHex(theme.customHex) || computed.accent}
                  onChange={(e) => handleColorPickerChange(e.target.value)}
                  className="w-12 h-10 p-1 bg-[#FFFDF8] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
                />
              </div>

              <div className="flex-1 min-w-0 sm:min-w-[180px] max-w-xs">
                <label
                  htmlFor="custom-color-hex"
                  className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
                >
                  Hex Code
                </label>
                <input
                  id="custom-color-hex"
                  type="text"
                  maxLength={7}
                  value={hexInput}
                  onChange={(e) => setHexInput(e.target.value)}
                  placeholder="#7C1D1D"
                  className="w-full px-3.5 py-2 font-mono text-sm text-[#1C1917] dark:text-[#F7F3EA] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#2A2520]"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 text-sm font-medium text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-lg sm:rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                Apply Color
              </button>
            </form>

            {hexError && (
              <p
                role="alert"
                className="text-xs font-medium text-[#7C1D1D] dark:text-[#FCA5A5]"
              >
                {hexError}
              </p>
            )}

            {theme.presetId === 'custom' && computed.wasDarkenedForContrast && (
              <p className="text-xs text-[#574F45] dark:text-[#CEC5B6]">
                Adjusted from <span className="font-mono">{theme.customHex}</span> to{' '}
                <span className="font-mono font-medium text-[#1C1917] dark:text-[#F7F3EA]">
                  {computed.accent}
                </span>{' '}
                so button text maintains accessible contrast.
              </p>
            )}
          </section>

          {/* Paper / Backdrop Surface Tone */}
          <section className="heritage-card border rounded-xl sm:rounded-lg p-4 sm:p-6 space-y-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                {isDark ? 'Obsidian Backdrop Tone' : 'Archival Paper Stock'}
              </h2>
              <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] mt-0.5">
                {isDark
                  ? 'Choose the high-contrast dark surface tone behind your cards and study threads.'
                  : 'Adjust the page backdrop behind study stationery and reading threads.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CANVAS_TONES.map((tone) => {
                const isActive = theme.canvasTone === tone.id;
                const swatchHex = isDark ? tone.darkHex : tone.hex;
                const toneName = isDark ? tone.darkName : tone.name;
                const toneDesc = isDark ? tone.darkDescription : tone.description;
                return (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => handleSelectCanvas(tone.id)}
                    aria-pressed={isActive}
                    className={`text-left p-4 rounded-lg border transition-colors flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent-text)] ${
                      isActive
                        ? 'border-[var(--theme-accent-border)] bg-[var(--theme-accent-soft)]'
                        : 'border-[#E2D9C6] dark:border-[#3D362D] bg-[#FFFDF8] dark:bg-[#1C1916] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C]'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="w-8 h-8 rounded-md border border-[#CFC3AA] dark:border-[#52483C] shrink-0"
                      style={{ backgroundColor: swatchHex }}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                        {toneName}
                      </div>
                      <div className="text-xs text-[#6B6155] dark:text-[#B8AFA0]">
                        {toneDesc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Live Preview Strip */}
          <section className="heritage-card border rounded-xl sm:rounded-lg p-4 sm:p-6 space-y-4">
            <h2 className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
              Live Stationery Preview
            </h2>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 text-sm font-medium text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md transition-colors whitespace-nowrap"
              >
                Primary Action Button
              </button>

              <span className="inline-flex items-center gap-2 text-xs font-medium text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] px-3 py-1.5 rounded-md">
                <CheckCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Stamp Checked Preview</span>
              </span>

              <span className="text-sm font-medium text-[var(--theme-accent-text)]">
                Active Link & Accent Heading
              </span>
            </div>
          </section>
        </>
      )}

      {/* SECTION 2: EDIT ACCOUNT (MOVED FROM ACCOUNT INFO) */}
      {currentSection === SettingsSection.ACCOUNT && activeMember && (
        <>
          <div>
            <p className="heritage-eyebrow mb-1.5">
              {isTeacher ? 'Faculty Account Settings' : 'Scholar Account Settings'}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#1C1917] dark:text-[#F7F3EA] text-balance">
              Edit Account & Portrait
            </h1>
            <p className="mt-1 text-sm text-[#574F45] dark:text-[#CEC5B6]">
              {isTeacher
                ? 'Update your profile portrait, @username, department, 3–4 taught subjects, and the club you monitor.'
                : 'Update your profile portrait, @username, grade level, enrolled subjects, and study bio.'}
            </p>
          </div>

          {savedNotice && (
            <div
              role="status"
              className="px-4 py-3 text-xs font-medium text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] rounded-lg sm:rounded-md flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Account settings saved and updated on your Scholar Dossier.</span>
            </div>
          )}

          {/* Profile Picture (Upload Image, Drag & Drop, Image URL, or Image Gallery) */}
          <section
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
            className={`heritage-card border rounded-xl sm:rounded-lg p-4 sm:p-6 space-y-5 transition-colors ${
              isDraggingAvatar
                ? 'border-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)]'
                : ''
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <button
                  type="button"
                  disabled={isProcessingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Choose an image file for your profile picture"
                  title="Click to upload an image"
                  className="relative group shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent-text)]"
                >
                  <MemberAvatar
                    name={activeMember.name}
                    src={activeMember.avatarUrl}
                    size="xl"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-[#1C1917]/85 dark:bg-[#F7F3EA]/90 text-[#FFFDF8] dark:text-[#161412] flex items-center justify-center shadow-sm border border-[#FFFDF8]/40 dark:border-[#161412]/30 group-hover:scale-105 transition-transform"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </span>
                </button>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA] truncate">
                      {activeMember.name}
                    </h2>
                    {(activeMember.isOwner ||
                      isAppOwner ||
                      linkedAccount?.isOwner) && <OwnerBadge size="sm" />}
                    <ClubBadge club={activeMember.club} size="sm" />
                  </div>
                  <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-mono font-medium text-[var(--theme-accent-text)]">
                      @{memberEffectiveUsername}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{activeMember.role}</span>
                    {linkedAccount?.email && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{linkedAccount.email}</span>
                      </>
                    )}
                  </p>
                  <p className="text-[11px] text-[#6B6155] dark:text-[#B8AFA0] mt-1">
                    Click your portrait, drag & drop an image file here, paste an image link, or choose a preset image below.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="sr-only"
                  aria-label="Upload profile picture image"
                />
                <button
                  type="button"
                  disabled={isProcessingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] disabled:opacity-60 rounded-md transition-colors whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {isProcessingAvatar
                      ? 'Loading Image...'
                      : activeMember.avatarUrl
                        ? 'Upload New Image'
                        : 'Upload Image'}
                  </span>
                </button>

                {activeMember.avatarUrl && onUpdateMemberAvatar && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarError(null);
                      onUpdateMemberAvatar(activeMember.id, '');
                      setSavedNotice(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#574F45] dark:text-[#CEC5B6] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] hover:text-[var(--theme-accent-text)] rounded-md transition-colors whitespace-nowrap"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Use Monogram</span>
                  </button>
                )}
              </div>
            </div>

            {/* Paste Any Image URL */}
            <form
              onSubmit={handleApplyAvatarUrl}
              className="pt-4 border-t border-[#ECE5D5] dark:border-[#342E26] space-y-2"
            >
              <label
                htmlFor="settings-avatar-url"
                className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA]"
              >
                Or Use an Image URL
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Link2
                    className="w-3.5 h-3.5 text-[#8C7F6D] dark:text-[#9C9385] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="settings-avatar-url"
                    type="text"
                    inputMode="url"
                    value={avatarUrlInput}
                    onChange={(e) => {
                      setAvatarUrlInput(e.target.value);
                      if (avatarError) setAvatarError(null);
                    }}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full pl-9 pr-3.5 py-2 text-xs text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isProcessingAvatar || !avatarUrlInput.trim()}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-[#1C1917] dark:text-[#F7F3EA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] disabled:opacity-50 rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  <ImagePlus
                    className="w-3.5 h-3.5 text-[var(--theme-accent-text)]"
                    aria-hidden="true"
                  />
                  <span>Use Image URL</span>
                </button>
              </div>
            </form>

            {/* Curated Image Presets */}
            <div className="pt-4 border-t border-[#ECE5D5] dark:border-[#342E26] space-y-2.5">
              <span className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA]">
                Scholar Portrait Images
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {SCHOLAR_AVATAR_PRESETS.map((preset) => {
                  const isSelected = activeMember.avatarUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        if (!onUpdateMemberAvatar) return;
                        setAvatarError(null);
                        onUpdateMemberAvatar(activeMember.id, preset.url);
                        setSavedNotice(true);
                      }}
                      aria-label={`Use ${preset.label} image`}
                      aria-pressed={isSelected}
                      className={`flex items-center gap-2.5 p-2 rounded-lg border text-left transition-colors ${
                        isSelected
                          ? 'bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)] ring-1 ring-[var(--theme-accent-text)]'
                          : 'bg-[#FFFDF8] dark:bg-[#1C1916] border-[#E2D9C6] dark:border-[#3D362D] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C]'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-10 h-10 rounded-md object-cover shrink-0 border border-[#D8CEBA] dark:border-[#52483C]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-medium text-[#1C1917] dark:text-[#F7F3EA] truncate">
                          {preset.label}
                        </span>
                        <span className="block text-[10px] text-[var(--theme-accent-text)]">
                          {isSelected ? 'Selected' : 'Use image'}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Profile Picture Rule Notice */}
            <div className="p-3.5 rounded-lg border bg-[#FDF6EC] dark:bg-[#271A0F] border-[#EBD2B4] dark:border-[#6B411B] flex items-start gap-2.5">
              <AlertTriangle
                className="w-4 h-4 text-[#9A3412] dark:text-[#FDBA74] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[#9A3412] dark:text-[#FDBA74]">
                    Profile Picture Rule
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-semibold rounded border bg-[#FFFDF8] dark:bg-[#342211] text-[#9A3412] dark:text-[#FDBA74] border-[#F0D5B5] dark:border-[#7C4B1E]">
                    <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden="true" />
                    <span>Mid Warning</span>
                  </span>
                </div>
                <p className="text-xs text-[#574F45] dark:text-[#E5D5C3] leading-relaxed">
                  Keep your profile picture respectful and school-appropriate. Uploading or linking an inappropriate image can lead to a{' '}
                  <strong className="font-semibold text-[#9A3412] dark:text-[#FDBA74]">
                    Mid Warning
                  </strong>{' '}
                  from the monitoring teacher, and repeated violations may escalate or disable your account.
                </p>
              </div>
            </div>

            {avatarError && (
              <div
                role="alert"
                className="px-3 py-2 text-xs font-medium text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FAF3F1] dark:bg-[#2D1414] border border-[#E5C9C5] dark:border-[#7F3232] rounded-md"
              >
                {avatarError}
              </div>
            )}
          </section>

          {/* Edit Account Form */}
          <section className="heritage-card border rounded-xl sm:rounded-lg p-4 sm:p-6">
            <h2 className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA] mb-4">
              Academic Identity & Courses
            </h2>

            <form onSubmit={handleSaveAccount} className="space-y-5">
              {usernameError && (
                <div
                  role="alert"
                  className="px-4 py-2.5 text-xs font-medium text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FAF3F1] dark:bg-[#2D1414] border border-[#E5C9C5] dark:border-[#7F3232] rounded-md"
                >
                  {usernameError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="settings-acct-username"
                    className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <span
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono text-[#8C7F6D] dark:text-[#9C9385] select-none"
                      aria-hidden="true"
                    >
                      @
                    </span>
                    <input
                      id="settings-acct-username"
                      type="text"
                      required
                      maxLength={30}
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setSavedNotice(false);
                      }}
                      placeholder="e.g. maya.lin"
                      className="w-full pl-8 pr-3.5 py-2 text-sm font-mono text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-[#6B6155] dark:text-[#B8AFA0]">
                    Full name ({activeMember.name}) stays fixed; only your handle changes.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="settings-acct-grade"
                    className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
                  >
                    {activeMember.role === UserRole.TEACHER
                      ? 'Department'
                      : 'Grade Level'}
                  </label>
                  {activeMember.role === UserRole.TEACHER ? (
                    <input
                      id="settings-acct-grade"
                      type="text"
                      required
                      maxLength={35}
                      value={gradeOrDept}
                      onChange={(e) => {
                        setGradeOrDept(e.target.value);
                        setSavedNotice(false);
                      }}
                      className="w-full px-3.5 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
                    />
                  ) : (
                    <select
                      id="settings-acct-grade"
                      value={gradeOrDept}
                      onChange={(e) => {
                        setGradeOrDept(e.target.value);
                        setSavedNotice(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
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
                    htmlFor="settings-acct-section"
                    className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
                  >
                    Section / Class Advisory
                  </label>
                  <input
                    id="settings-acct-section"
                    type="text"
                    maxLength={40}
                    value={section}
                    onChange={(e) => {
                      setSection(e.target.value);
                      setSavedNotice(false);
                    }}
                    placeholder="e.g. Section 12-Newton"
                    className="w-full px-3.5 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="settings-acct-course"
                    className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
                  >
                    Course / Academic Strand
                  </label>
                  <input
                    id="settings-acct-course"
                    type="text"
                    list="settings-course-track-list"
                    maxLength={60}
                    value={courseOrTrack}
                    onChange={(e) => {
                      setCourseOrTrack(e.target.value);
                      setSavedNotice(false);
                    }}
                    placeholder="e.g. STEM, HUMSS, ABM, ICT"
                    className="w-full px-3.5 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
                  />
                  <datalist id="settings-course-track-list">
                    {COURSE_TRACK_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* School Club Badge / Monitored Club Selector */}
              <div className="p-4 rounded-lg border border-[#E2D9C6] dark:border-[#3D362D] bg-[#F5F0E6] dark:bg-[#221E1A] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label
                      htmlFor="settings-acct-club"
                      className="block text-xs font-semibold text-[#1C1917] dark:text-[#F7F3EA]"
                    >
                      {isTeacher
                        ? 'Club You Monitor & Advise'
                        : 'School Club & Badge'}
                    </label>
                    <p className="text-[11px] text-[#6B6155] dark:text-[#B8AFA0] mt-0.5">
                      {isTeacher
                        ? 'Select the school club you monitor. Students inside this club appear in your Faculty Dossier.'
                        : 'Choose your school club to display your club crest beside your name across posts, replies, and profiles.'}
                    </p>
                  </div>
                  <ClubBadge
                    club={
                      clubSelection === '__custom__'
                        ? customClubName
                        : clubSelection
                    }
                    size="md"
                    showEmpty
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    id="settings-acct-club"
                    value={clubSelection}
                    onChange={(e) => {
                      setClubSelection(e.target.value);
                      setSavedNotice(false);
                    }}
                    className="w-full px-3 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] bg-[#FFFDF8] dark:bg-[#161412] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
                  >
                    <option value="">
                      {isTeacher
                        ? 'No Monitored Club Assigned'
                        : 'No Club Affiliation'}
                    </option>
                    {SCHOOL_CLUBS.map((club) => (
                      <option key={club.id} value={club.name}>
                        {club.name}
                      </option>
                    ))}
                    <option value="__custom__">Other / Custom Club...</option>
                  </select>

                  {clubSelection === '__custom__' && (
                    <input
                      id="settings-acct-custom-club"
                      type="text"
                      maxLength={40}
                      value={customClubName}
                      onChange={(e) => {
                        setCustomClubName(e.target.value);
                        setSavedNotice(false);
                      }}
                      placeholder="Enter your club name (e.g. Astronomy Club)"
                      aria-label="Custom club name"
                      className="w-full px-3.5 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#FFFDF8] dark:bg-[#161412] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
                    />
                  )}
                </div>

                {isTeacher && (() => {
                  const resolvedClubPreview =
                    clubSelection === '__custom__'
                      ? customClubName.trim()
                      : clubSelection.trim();
                  if (!resolvedClubPreview) return null;
                  const membersInClub = allMembers.filter(
                    (m) =>
                      m.id !== activeMember.id &&
                      m.club?.trim().toLowerCase() ===
                        resolvedClubPreview.toLowerCase()
                  );
                  return (
                    <p className="text-[11px] text-[#574F45] dark:text-[#CEC5B6]">
                      Currently in <strong className="font-semibold text-[#1C1917] dark:text-[#F7F3EA]">{resolvedClubPreview}</strong>:{' '}
                      {membersInClub.length === 0
                        ? 'No student members yet.'
                        : membersInClub.map((m) => m.name).join(', ')}
                    </p>
                  );
                })()}
              </div>

              <div>
                <label
                  htmlFor="settings-acct-primary-subject"
                  className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
                >
                  {isTeacher ? 'Lead Subject Taught' : 'Primary Focus Subject'}
                </label>
                <select
                  id="settings-acct-primary-subject"
                  value={focusSubject}
                  onChange={(e) => {
                    const next = e.target.value as SubjectId;
                    setFocusSubject(next);
                    setSavedNotice(false);
                    setSubjectsError(null);
                    if (!enrolledSubjects.includes(next)) {
                      setEnrolledSubjects((prev) => {
                        if (isTeacher && prev.length >= TEACHER_MAX_SUBJECTS) {
                          return [...prev.slice(0, TEACHER_MAX_SUBJECTS - 1), next];
                        }
                        return [...prev, next];
                      });
                    }
                  }}
                  className="w-full sm:max-w-xs px-3 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
                >
                  {(isTeacher
                    ? SUBJECTS.filter((s) => enrolledSubjects.includes(s.id))
                    : SUBJECTS
                  ).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA]">
                    {isTeacher
                      ? `Subjects You Teach (Select ${TEACHER_MIN_SUBJECTS} to ${TEACHER_MAX_SUBJECTS} Subjects)`
                      : 'Subjects / Courses You Are Enrolled In'}
                  </span>
                  {isTeacher && (
                    <span
                      className={`text-xs font-mono tabular-nums ${
                        enrolledSubjects.length < TEACHER_MIN_SUBJECTS ||
                        enrolledSubjects.length > TEACHER_MAX_SUBJECTS
                          ? 'text-[#7C1D1D] dark:text-[#FCA5A5] font-semibold'
                          : 'text-[var(--theme-accent-text)] font-medium'
                      }`}
                    >
                      {enrolledSubjects.length} / {TEACHER_MAX_SUBJECTS} selected (min {TEACHER_MIN_SUBJECTS})
                    </span>
                  )}
                </div>
                {subjectsError && (
                  <p
                    role="alert"
                    className="mb-2 text-xs font-medium text-[#7C1D1D] dark:text-[#FCA5A5]"
                  >
                    {subjectsError}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {SUBJECTS.map((subject) => {
                    const checked = enrolledSubjects.includes(subject.id);
                    const isMaxLocked =
                      isTeacher &&
                      !checked &&
                      enrolledSubjects.length >= TEACHER_MAX_SUBJECTS;
                    return (
                      <label
                        key={subject.id}
                        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-md border text-xs transition-colors ${
                          checked
                            ? 'bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)] text-[#1C1917] dark:text-[#F7F3EA] font-medium cursor-pointer'
                            : isMaxLocked
                              ? 'bg-[#F5F0E6]/60 dark:bg-[#181512] border-[#E2D9C6] dark:border-[#342E26] text-[#8C7F6D] dark:text-[#787166] opacity-60 cursor-not-allowed'
                              : 'bg-[#FFFDF8] dark:bg-[#1C1916] border-[#E2D9C6] dark:border-[#3D362D] text-[#443D34] dark:text-[#E0D8CA] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={isMaxLocked}
                          onChange={() => {
                            handleToggleSubject(subject.id);
                            setSavedNotice(false);
                          }}
                          className="h-4 w-4 rounded border-[#C5B99F] dark:border-[#52483C] accent-[var(--theme-accent)]"
                        />
                        <span>{subject.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="settings-acct-bio"
                  className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
                >
                  {isTeacher
                    ? 'Faculty Bio & Office Hours (optional)'
                    : 'Short Study Bio (optional)'}
                </label>
                <textarea
                  id="settings-acct-bio"
                  rows={3}
                  maxLength={240}
                  value={bio}
                  onChange={(e) => {
                    setBio(e.target.value);
                    setSavedNotice(false);
                  }}
                  placeholder={
                    isTeacher
                      ? 'Share your office hours, teaching advisory focus, or club monitoring notes...'
                      : 'Share your study goals, favorite topics, or subjects you help others with...'
                  }
                  className="w-full px-3.5 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-[#ECE5D5] dark:border-[#342E26]">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-4 py-2 text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] rounded-md transition-colors"
                >
                  Done
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md transition-colors"
                >
                  <Save className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Save Information</span>
                </button>
              </div>
            </form>
          </section>
        </>
      )}

      {/* SECTION 3: LOG OUT & SESSION */}
      {currentSection === SettingsSection.LOGOUT && activeMember && (
        <>
          <div>
            <p className="heritage-eyebrow mb-1.5">Account Session</p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#1C1917] dark:text-[#F7F3EA] text-balance">
              Log Out of StudyCommons
            </h1>
            <p className="mt-1 text-sm text-[#574F45] dark:text-[#CEC5B6]">
              End your active study hall session and return to the sign-in gate.
            </p>
          </div>

          <section className="heritage-card border rounded-xl sm:rounded-lg p-5 sm:p-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#ECE5D5] dark:border-[#342E26]">
              <div className="flex items-center gap-4 min-w-0">
                <MemberAvatar
                  name={activeMember.name}
                  src={activeMember.avatarUrl}
                  size="lg"
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[#6B6155] dark:text-[#B8AFA0]">
                    Signed In Account
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA] truncate">
                      {activeMember.name}
                    </h2>
                    <ClubBadge club={activeMember.club} size="sm" />
                  </div>
                  <p className="text-xs text-[#574F45] dark:text-[#CEC5B6] flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                    <span className="font-mono text-[var(--theme-accent-text)]">
                      @{memberEffectiveUsername}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{activeMember.role}</span>
                    {linkedAccount?.email && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3 h-3" aria-hidden="true" />
                          <span>{linkedAccount.email}</span>
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-[#574F45] dark:text-[#CEC5B6] leading-relaxed">
              Your StudyCommons profile, classroom posts, saved bookmarks, weekly study goals, personal notes, and study reminders are synced in real time across devices with your Google account.
            </p>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 text-sm font-medium text-[#443D34] dark:text-[#E0D8CA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] rounded-md transition-colors"
              >
                Stay Signed In
              </button>
              {onLogOut && (
                <button
                  type="button"
                  onClick={onLogOut}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-[#FFFDF8] bg-[#7C1D1D] hover:bg-[#631616] dark:bg-[#9E2626] dark:hover:bg-[#B52E2E] rounded-md transition-colors whitespace-nowrap"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
