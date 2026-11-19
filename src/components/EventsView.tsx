import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  CalendarPlus,
  Check,
  Clock,
  Laptop,
  MapPin,
  Megaphone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  GRADE_LEVEL_OPTIONS,
  SCHOOL_CLUBS,
  SUBJECTS,
} from '../data/seedData';
import {
  GradeLevel,
  SchoolEvent,
  SchoolEventCategory,
  SchoolMember,
  SubjectId,
  UserRole,
} from '../types/school';
import { getEventCategoryDisplay } from '../utils/storage';
import { ClubBadge } from './ClubBadge';
import { MemberAvatar } from './MemberAvatar';
import { OwnerBadge } from './OwnerBadge';

interface EventsViewProps {
  events: SchoolEvent[];
  members: SchoolMember[];
  activeMember: SchoolMember;
  canManageEvents?: boolean;
  currentTimeMs: number;
  initialOpenComposer?: boolean;
  onConsumeOpenComposer?: () => void;
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
  onToggleRsvp: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
  onOpenMemberInfo: (memberId: string) => void;
}

type EventFilterTab = 'upcoming' | 'attending' | 'all';

function toLocalDateTimeInput(timestampMs: number): string {
  const date = new Date(timestampMs);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function renderCategoryIcon(category: SchoolEventCategory) {
  switch (category) {
    case SchoolEventCategory.WORKSHOP:
      return <Laptop className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
    case SchoolEventCategory.EXAM_PREP:
      return <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
    case SchoolEventCategory.CLUB_MEET:
      return <Users className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
    case SchoolEventCategory.COMPETITION:
      return <Award className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
    case SchoolEventCategory.ASSEMBLY:
    default:
      return <Megaphone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
  }
}

function formatEventCountdown(startsAt: number, nowMs: number): string {
  const diffMs = startsAt - nowMs;
  if (diffMs < -2 * 60 * 60 * 1000) return 'Past Event';
  if (diffMs <= 0) return 'Happening Now';
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  if (diffHours < 1) {
    const mins = Math.max(1, Math.floor(diffMs / (60 * 1000)));
    return `In ${mins}m`;
  }
  if (diffHours < 24) return `In ${diffHours}h`;
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  return diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`;
}

export function EventsView({
  events,
  members,
  activeMember,
  canManageEvents,
  currentTimeMs,
  initialOpenComposer = false,
  onConsumeOpenComposer,
  onAddEvent,
  onToggleRsvp,
  onDeleteEvent,
  onOpenMemberInfo,
}: EventsViewProps) {
  const isTeacher = canManageEvents ?? activeMember.role === UserRole.TEACHER;
  const isDisabled = Boolean(activeMember.isDisabled);

  const [showComposer, setShowComposer] = useState(
    initialOpenComposer && isTeacher
  );
  const [filterTab, setFilterTab] = useState<EventFilterTab>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Event composer state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SchoolEventCategory>(
    SchoolEventCategory.WORKSHOP
  );
  const [subjectId, setSubjectId] = useState<SubjectId | 'all'>('all');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel | 'All Grades'>(
    'All Grades'
  );
  const [clubName, setClubName] = useState<string>('');
  const [location, setLocation] = useState('');
  const [startsAtInput, setStartsAtInput] = useState<string>(() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    tomorrow.setHours(15, 0, 0, 0);
    return toLocalDateTimeInput(tomorrow.getTime());
  });
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initialOpenComposer && isTeacher) {
      setShowComposer(true);
      onConsumeOpenComposer?.();
    } else if (initialOpenComposer) {
      onConsumeOpenComposer?.();
    }
  }, [initialOpenComposer, isTeacher, onConsumeOpenComposer]);

  const upcomingCount = useMemo(
    () =>
      events.filter((ev) => ev.startsAt >= currentTimeMs - 2 * 60 * 60 * 1000)
        .length,
    [events, currentTimeMs]
  );

  const attendingCount = useMemo(
    () =>
      events.filter((ev) => ev.attendeeIds.includes(activeMember.id)).length,
    [events, activeMember.id]
  );

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = events.filter((ev) => {
      if (
        filterTab === 'upcoming' &&
        ev.startsAt < currentTimeMs - 2 * 60 * 60 * 1000
      ) {
        return false;
      }
      if (
        filterTab === 'attending' &&
        !ev.attendeeIds.includes(activeMember.id)
      ) {
        return false;
      }
      if (q) {
        const subName =
          ev.subjectId === 'all'
            ? 'all subjects'
            : SUBJECTS.find((s) => s.id === ev.subjectId)?.name || '';
        const organizer =
          members.find((m) => m.id === ev.createdByMemberId)?.name || '';
        const haystack = [
          ev.title,
          ev.description,
          ev.location,
          ev.clubName || '',
          ev.gradeLevel,
          subName,
          organizer,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    return [...list].sort((a, b) => a.startsAt - b.startsAt);
  }, [events, filterTab, searchQuery, currentTimeMs, activeMember.id, members]);

  const handleSubmitEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const trimmedTitle = title.trim();
    const trimmedLocation = location.trim();
    const trimmedDesc = description.trim();

    if (trimmedTitle.length < 3) {
      setFormError('Please enter an event title (at least 3 characters).');
      return;
    }
    if (!trimmedLocation) {
      setFormError('Please specify a room, lab, or event location.');
      return;
    }
    const parsedTime = new Date(startsAtInput).getTime();
    if (!startsAtInput || Number.isNaN(parsedTime)) {
      setFormError('Please choose a valid date and start time.');
      return;
    }

    onAddEvent({
      title: trimmedTitle,
      description:
        trimmedDesc ||
        'Faculty-hosted academic session open to participating students.',
      category,
      subjectId,
      gradeLevel,
      startsAt: parsedTime,
      location: trimmedLocation,
      clubName: clubName || undefined,
    });

    setTitle('');
    setLocation('');
    setDescription('');
    setClubName('');
    setShowComposer(false);
    setFilterTab('upcoming');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="heritage-eyebrow mb-1">Academic Calendar & Gatherings</p>
          <h1 className="font-display text-3xl font-semibold text-[#1C1917] dark:text-[#F7F3EA] text-balance">
            School Events & Study Workshops
          </h1>
          <p className="mt-1 text-sm text-[#574F45] dark:text-[#CEC5B6]">
            Upcoming labs, exam clinics, club fairs, and school assemblies posted by faculty teachers.
          </p>
        </div>

        {isTeacher && (
          <button
            type="button"
            disabled={isDisabled}
            onClick={() => {
              setFormError(null);
              setShowComposer((v) => !v);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] disabled:opacity-45 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            {showComposer ? (
              <>
                <X className="w-4 h-4" aria-hidden="true" />
                <span>Close Event Form</span>
              </>
            ) : (
              <>
                <CalendarPlus className="w-4 h-4" aria-hidden="true" />
                <span>Add School Event</span>
              </>
            )}
          </button>
        )}
      </div>

      {!isTeacher && (
        <div className="heritage-card border rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#574F45] dark:text-[#CEC5B6]">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck
              className="w-4 h-4 text-[var(--theme-accent-text)] shrink-0"
              aria-hidden="true"
            />
            <span>
              Events are published by Teachers from their Teacher account. Click{' '}
              <strong className="font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                Join Event
              </strong>{' '}
              below to RSVP to any session.
            </span>
          </span>
        </div>
      )}

      {/* Teacher Add Event Composer */}
      {isTeacher && showComposer && (
        <form
          onSubmit={handleSubmitEvent}
          className="heritage-card border border-[var(--theme-accent-border)] rounded-xl sm:rounded-lg p-5 sm:p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#ECE5D5] dark:border-[#342E26]">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                Publish New School Event
              </h2>
              <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] mt-0.5">
                Posted under Teacher account{' '}
                <span className="font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                  {activeMember.name}
                </span>
              </p>
            </div>
          </div>

          {formError && (
            <div
              role="alert"
              className="px-3.5 py-2.5 text-xs font-medium text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FAF3F1] dark:bg-[#2D1414] border border-[#E5C9C5] dark:border-[#7F3232] rounded-md"
            >
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="event-title"
                className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
              >
                Event Title
              </label>
              <input
                id="event-title"
                type="text"
                required
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. ICT Web Security & Networking Workshop"
                className="w-full px-3.5 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
              />
            </div>

            <div>
              <label
                htmlFor="event-category"
                className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
              >
                Event Category
              </label>
              <select
                id="event-category"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as SchoolEventCategory)
                }
                className="w-full px-3 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
              >
                <option value={SchoolEventCategory.WORKSHOP}>Workshop</option>
                <option value={SchoolEventCategory.EXAM_PREP}>Exam Prep</option>
                <option value={SchoolEventCategory.CLUB_MEET}>Club Meet</option>
                <option value={SchoolEventCategory.COMPETITION}>
                  Competition
                </option>
                <option value={SchoolEventCategory.ASSEMBLY}>
                  School Assembly
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="event-starts-at"
                className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
              >
                Date & Start Time
              </label>
              <input
                id="event-starts-at"
                type="datetime-local"
                required
                value={startsAtInput}
                onChange={(e) => setStartsAtInput(e.target.value)}
                className="w-full px-3 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
              />
            </div>

            <div>
              <label
                htmlFor="event-location"
                className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
              >
                Room / Location
              </label>
              <input
                id="event-location"
                type="text"
                required
                maxLength={80}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. ICT Lab 2 · Room 305"
                className="w-full px-3.5 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
              />
            </div>

            <div>
              <label
                htmlFor="event-subject"
                className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
              >
                Related Subject
              </label>
              <select
                id="event-subject"
                value={subjectId}
                onChange={(e) =>
                  setSubjectId(e.target.value as SubjectId | 'all')
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
                htmlFor="event-grade"
                className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
              >
                Audience / Grade Level
              </label>
              <select
                id="event-grade"
                value={gradeLevel}
                onChange={(e) =>
                  setGradeLevel(e.target.value as GradeLevel | 'All Grades')
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
                htmlFor="event-club"
                className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
              >
                Host Club (optional)
              </label>
              <select
                id="event-club"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
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
                htmlFor="event-description"
                className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
              >
                Agenda & Details
              </label>
              <textarea
                id="event-description"
                rows={3}
                maxLength={600}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what students should bring, topics covered, or registration notes..."
                className="w-full px-3.5 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowComposer(false)}
              className="px-4 py-2 text-xs font-medium text-[#574F45] dark:text-[#CEC5B6] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] rounded-md hover:bg-[#F5F0E6] dark:hover:bg-[#26211C]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Publish School Event</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter & Search Bar */}
      <div className="heritage-card border rounded-xl sm:rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-[#F5F0E6] dark:bg-[#221E1A] rounded-lg sm:rounded-md overflow-x-auto no-scrollbar">
          {[
            {
              id: 'upcoming' as const,
              label: `Upcoming (${upcomingCount})`,
            },
            {
              id: 'attending' as const,
              label: `My RSVPs (${attendingCount})`,
            },
            { id: 'all' as const, label: `All (${events.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              className={`px-3 min-h-[38px] sm:min-h-0 sm:py-1.5 text-xs font-medium rounded-md sm:rounded transition-colors whitespace-nowrap shrink-0 ${
                filterTab === tab.id
                  ? 'bg-[#FFFDF8] dark:bg-[#161412] text-[var(--theme-accent-text)] shadow-xs border border-[#E2D9C6] dark:border-[#3D362D]'
                  : 'text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search
            className="w-3.5 h-3.5 text-[#8C7F6D] dark:text-[#9C9385] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, rooms, clubs..."
            aria-label="Search school events"
            className="w-full pl-8 pr-3 py-1.5 text-xs text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
          />
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="heritage-card border rounded-lg p-10 text-center space-y-2">
          <Calendar
            className="w-7 h-7 text-[#8C6D3B] dark:text-[#D4B475] mx-auto"
            aria-hidden="true"
          />
          <h2 className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
            No school events match this filter
          </h2>
          <p className="text-sm text-[#574F45] dark:text-[#CEC5B6] max-w-md mx-auto">
            {isTeacher
              ? 'Use Add School Event above to post a workshop, exam clinic, club fair, or assembly.'
              : 'Check back soon for new faculty workshops and school club schedules.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((ev) => {
            const organizer = members.find(
              (m) => m.id === ev.createdByMemberId
            );
            const catDisplay = getEventCategoryDisplay(ev.category);
            const subjectName =
              ev.subjectId === 'all'
                ? 'All Subjects'
                : SUBJECTS.find((s) => s.id === ev.subjectId)?.name || 'General';
            const isGoing = ev.attendeeIds.includes(activeMember.id);
            const eventDate = new Date(ev.startsAt);
            const monthLabel = eventDate.toLocaleDateString('en-US', {
              month: 'short',
            });
            const dayNum = eventDate.getDate();
            const timeLabel = eventDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            });
            const weekdayLabel = eventDate.toLocaleDateString('en-US', {
              weekday: 'short',
            });
            const countdown = formatEventCountdown(ev.startsAt, currentTimeMs);

            return (
              <article
                key={ev.id}
                className="heritage-card border rounded-xl sm:rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-5"
              >
                {/* Collegiate Calendar Date Block */}
                <div className="flex sm:flex-col items-center sm:justify-center gap-3 sm:gap-0.5 px-3.5 py-2.5 sm:w-20 sm:h-24 rounded-lg bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D] shrink-0 text-center">
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[var(--theme-accent-text)]">
                    {monthLabel}
                  </span>
                  <span className="font-display text-2xl sm:text-3xl font-bold tabular-nums text-[#1C1917] dark:text-[#F7F3EA] leading-none">
                    {dayNum}
                  </span>
                  <span className="text-[11px] text-[#6B6155] dark:text-[#B8AFA0]">
                    {weekdayLabel} · {timeLabel}
                  </span>
                </div>

                {/* Main Event Content */}
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded border ${catDisplay.badgeClass}`}
                      >
                        {renderCategoryIcon(ev.category)}
                        <span>{catDisplay.label}</span>
                      </span>
                      <span className="font-medium text-[#1C1917] dark:text-[#F7F3EA]">
                        {subjectName}
                      </span>
                      <span
                        aria-hidden="true"
                        className="text-[#6B6155] dark:text-[#B8AFA0]"
                      >
                        ·
                      </span>
                      <span className="text-[#6B6155] dark:text-[#B8AFA0]">
                        {ev.gradeLevel}
                      </span>
                      {ev.clubName && (
                        <ClubBadge club={ev.clubName} size="xs" />
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-[var(--theme-accent-text)] whitespace-nowrap shrink-0">
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{countdown}</span>
                    </span>
                  </div>

                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-semibold text-[#1C1917] dark:text-[#F7F3EA] text-balance">
                      {ev.title}
                    </h2>
                    <p className="mt-1.5 text-sm text-[#574F45] dark:text-[#CEC5B6] leading-relaxed">
                      {ev.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#6B6155] dark:text-[#B8AFA0]">
                    <span className="inline-flex items-center gap-1.5 text-[#1C1917] dark:text-[#F7F3EA] font-medium">
                      <MapPin
                        className="w-3.5 h-3.5 text-[var(--theme-accent-text)] shrink-0"
                        aria-hidden="true"
                      />
                      <span>{ev.location}</span>
                    </span>

                    {organizer && (
                      <div className="inline-flex flex-wrap items-center gap-1.5">
                        <MemberAvatar
                          name={organizer.name}
                          src={organizer.avatarUrl}
                          size="xs"
                        />
                        <span>Hosted by</span>
                        <button
                          type="button"
                          onClick={() => onOpenMemberInfo(organizer.id)}
                          className="font-medium text-[#1C1917] dark:text-[#F7F3EA] hover:text-[var(--theme-accent-text)] transition-colors"
                        >
                          {organizer.name}
                        </button>
                        {organizer.isOwner && <OwnerBadge size="xs" />}
                        {organizer.club && (
                          <ClubBadge club={organizer.club} size="xs" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#ECE5D5] dark:border-[#342E26] flex flex-wrap items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#6B6155] dark:text-[#B8AFA0] font-mono tabular-nums">
                      <Users className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>
                        {ev.attendeeIds.length}{' '}
                        {ev.attendeeIds.length === 1
                          ? 'participant going'
                          : 'participants going'}
                      </span>
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={isDisabled}
                        onClick={() => onToggleRsvp(ev.id)}
                        aria-pressed={isGoing}
                        className={`inline-flex items-center gap-1.5 px-3.5 min-h-[38px] sm:min-h-0 sm:py-1.5 text-xs font-semibold rounded-lg sm:rounded-md border transition-colors whitespace-nowrap disabled:opacity-45 disabled:pointer-events-none ${
                          isGoing
                            ? 'bg-[var(--theme-accent)] border-[var(--theme-accent)] text-[#FFFDF8]'
                            : 'bg-[#FFFDF8] dark:bg-[#1C1916] border-[#D8CEBA] dark:border-[#52483C] text-[#1C1917] dark:text-[#F7F3EA] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C]'
                        }`}
                      >
                        {isGoing ? (
                          <>
                            <Check className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Going</span>
                          </>
                        ) : (
                          <>
                            <CalendarPlus
                              className="w-3.5 h-3.5 text-[var(--theme-accent-text)]"
                              aria-hidden="true"
                            />
                            <span>Join Event</span>
                          </>
                        )}
                      </button>

                      {isTeacher &&
                        (confirmDeleteId === ev.id ? (
                          <div className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md bg-[#FAF3F1] dark:bg-[#3A1616] border border-[#E5C9C5] dark:border-[#8C3737]">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteEvent(ev.id);
                                setConfirmDeleteId(null);
                              }}
                              className="font-semibold text-[#7C1D1D] dark:text-[#FCA5A5] hover:underline"
                            >
                              Confirm Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-[#574F45] dark:text-[#CEC5B6]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(ev.id)}
                            aria-label={`Delete event ${ev.title}`}
                            className="inline-flex items-center gap-1 px-2.5 min-h-[38px] sm:min-h-0 sm:py-1.5 text-xs font-medium text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FAF3F1] dark:bg-[#2A1414] border border-[#E5C9C5] dark:border-[#8C3737] rounded-lg sm:rounded-md hover:opacity-85 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Remove</span>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
