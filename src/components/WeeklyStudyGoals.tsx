import { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Minus,
  Plus,
  Target,
  TrendingUp,
  User,
} from 'lucide-react';
import { SUBJECTS } from '../data/seedData';
import { LessonUnit, MemberStudyGoal, SchoolMember } from '../types/school';

interface WeeklyStudyGoalsProps {
  activeMember: SchoolMember;
  lessons: LessonUnit[];
  studyGoal: MemberStudyGoal;
  onToggleLessonComplete: (lessonId: string) => void;
  onUpdateWeeklyTarget: (target: number) => void;
  onOpenAccountInfo: (memberId: string) => void;
  compact?: boolean;
}

export function WeeklyStudyGoals({
  activeMember,
  lessons,
  studyGoal,
  onToggleLessonComplete,
  onUpdateWeeklyTarget,
  onOpenAccountInfo,
  compact = false,
}: WeeklyStudyGoalsProps) {
  const [scope, setScope] = useState<'enrolled' | 'all'>('enrolled');

  const enrolledSubjects = useMemo(() => {
    return activeMember.enrolledSubjects &&
      activeMember.enrolledSubjects.length > 0
      ? activeMember.enrolledSubjects
      : [activeMember.focusSubject];
  }, [activeMember.enrolledSubjects, activeMember.focusSubject]);

  const validLessonIds = useMemo(
    () => new Set(lessons.map((lesson) => lesson.id)),
    [lessons]
  );

  const completedIdsSet = useMemo(
    () =>
      new Set(
        studyGoal.completedLessonIds.filter((id) => validLessonIds.has(id))
      ),
    [studyGoal.completedLessonIds, validLessonIds]
  );

  const completedCount = completedIdsSet.size;
  const targetCount = Math.max(1, studyGoal.weeklyTarget);
  const progressPercent = Math.min(
    100,
    Math.round((completedCount / targetCount) * 100)
  );
  const remainingCount = Math.max(0, targetCount - completedCount);

  const enrolledLessons = useMemo(
    () =>
      lessons.filter((lesson) => enrolledSubjects.includes(lesson.subjectId)),
    [lessons, enrolledSubjects]
  );

  const visibleLessons =
    scope === 'enrolled' && enrolledLessons.length > 0
      ? enrolledLessons
      : lessons;

  const statusMeta = useMemo(() => {
    if (completedCount >= targetCount) {
      return {
        label: 'Goal Reached',
        Icon: Award,
        toneClass: 'text-[var(--theme-accent-text)]',
      };
    }
    if (progressPercent >= 50) {
      return {
        label: 'On Track',
        Icon: TrendingUp,
        toneClass: 'text-[#574F45] dark:text-[#CEC5B6]',
      };
    }
    if (completedCount > 0) {
      return {
        label: 'In Progress',
        Icon: Target,
        toneClass: 'text-[#6B6155] dark:text-[#B8AFA0]',
      };
    }
    return {
      label: 'Not Started',
      Icon: BookOpen,
      toneClass: 'text-[#6B6155] dark:text-[#B8AFA0]',
    };
  }, [completedCount, targetCount, progressPercent]);

  const StatusIcon = statusMeta.Icon;

  return (
    <section
      aria-label="Weekly Study Goals"
      className={
        compact
          ? 'p-3.5 bg-[#F5F0E6] dark:bg-[#1E1A16] border border-[#E2D9C6] dark:border-[#3D362D] rounded-xl space-y-3'
          : 'heritage-card border rounded-lg p-5 space-y-3.5'
      }
    >
      {/* Header & Target Stepper */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="heritage-eyebrow mb-0.5">Weekly Study Ledger</p>
          <h2 className="font-display text-lg font-semibold text-[#1C1917] dark:text-[#F7F3EA] leading-snug">
            Weekly Study Goals
          </h2>
        </div>

        <div
          className="inline-flex items-center bg-[#FFFDF8] dark:bg-[#161412] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md shrink-0"
          role="group"
          aria-label="Weekly lesson target"
        >
          <button
            type="button"
            onClick={() => onUpdateWeeklyTarget(Math.max(1, targetCount - 1))}
            disabled={targetCount <= 1}
            aria-label="Decrease weekly lesson goal"
            className="w-7 h-7 inline-flex items-center justify-center text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] disabled:opacity-40 disabled:pointer-events-none rounded-l-md transition-colors"
          >
            <Minus className="w-3 h-3" aria-hidden="true" />
          </button>
          <span
            className="px-2 text-[11px] font-mono font-semibold tabular-nums text-[#1C1917] dark:text-[#F7F3EA]"
            title="Weekly lesson target"
          >
            {targetCount}/wk
          </span>
          <button
            type="button"
            onClick={() => onUpdateWeeklyTarget(Math.min(12, targetCount + 1))}
            disabled={targetCount >= 12}
            aria-label="Increase weekly lesson goal"
            className="w-7 h-7 inline-flex items-center justify-center text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] disabled:opacity-40 disabled:pointer-events-none rounded-r-md transition-colors"
          >
            <Plus className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Summary Progress Readout & Status Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 font-medium ${statusMeta.toneClass}`}
          >
            <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{statusMeta.label}</span>
          </span>

          <span className="font-mono font-semibold tabular-nums text-[#1C1917] dark:text-[#F7F3EA]">
            {completedCount} / {targetCount}{' '}
            <span className="font-sans font-normal text-[#6B6155] dark:text-[#B8AFA0]">
              ({progressPercent}%)
            </span>
          </span>
        </div>

        <div
          role="progressbar"
          aria-label="Weekly lesson goal completion"
          aria-valuenow={completedCount}
          aria-valuemin={0}
          aria-valuemax={targetCount}
          className="h-2.5 w-full bg-[#ECE5D5] dark:bg-[#2C2721] border border-[#DDD4C0] dark:border-[#4A4137] rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-[var(--theme-accent)] dark:bg-[var(--theme-accent-text)] transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-[11px] text-[#6B6155] dark:text-[#B8AFA0]">
          {remainingCount === 0
            ? 'Weekly lesson quota fulfilled. Status bars updated.'
            : `${remainingCount} ${
                remainingCount === 1 ? 'lesson' : 'lessons'
              } remaining to meet this week's goal.`}
        </p>
      </div>

      {/* Scope Toggle (Enrolled vs All Curriculum) */}
      {enrolledLessons.length > 0 &&
        enrolledLessons.length < lessons.length && (
          <div className="flex items-center gap-4 border-b border-[#ECE5D5] dark:border-[#342E26] text-xs">
            <button
              type="button"
              onClick={() => setScope('enrolled')}
              className={`pb-1.5 font-medium transition-colors border-b-2 -mb-px ${
                scope === 'enrolled'
                  ? 'border-[var(--theme-accent-text)] text-[#1C1917] dark:text-[#F7F3EA]'
                  : 'border-transparent text-[#6B6155] dark:text-[#B8AFA0] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]'
              }`}
            >
              My Courses ({enrolledLessons.length})
            </button>
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`pb-1.5 font-medium transition-colors border-b-2 -mb-px ${
                scope === 'all'
                  ? 'border-[var(--theme-accent-text)] text-[#1C1917] dark:text-[#F7F3EA]'
                  : 'border-transparent text-[#6B6155] dark:text-[#B8AFA0] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]'
              }`}
            >
              All Units ({lessons.length})
            </button>
          </div>
        )}

      {/* Lesson Completion Checklist */}
      {visibleLessons.length === 0 ? (
        <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] py-2">
          No lesson units available yet.
        </p>
      ) : (
        <ul className="space-y-1.5 max-h-[232px] overflow-y-auto pr-0.5">
          {visibleLessons.map((lesson) => {
            const isCompleted = completedIdsSet.has(lesson.id);
            const subjectName =
              SUBJECTS.find((s) => s.id === lesson.subjectId)?.name ||
              'General';
            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isCompleted}
                  onClick={() => onToggleLessonComplete(lesson.id)}
                  className={`w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-md border transition-colors min-h-[42px] ${
                    isCompleted
                      ? 'bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)]'
                      : 'bg-[#FFFDF8] dark:bg-[#1C1916] border-[#E2D9C6] dark:border-[#3D362D] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C]'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                      isCompleted
                        ? 'bg-[var(--theme-accent)] border-[var(--theme-accent)] text-[#FFFDF8]'
                        : 'bg-[#FFFDF8] dark:bg-[#26211C] border-[#C5B99F] dark:border-[#635648] text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-xs leading-snug ${
                        isCompleted
                          ? 'font-medium text-[#1C1917] dark:text-[#F7F3EA] line-through decoration-[#8C7F6D]/60 dark:decoration-[#B8AFA0]/60'
                          : 'font-medium text-[#1C1917] dark:text-[#F7F3EA]'
                      }`}
                    >
                      {lesson.title}
                    </span>
                    <span className="block text-[11px] text-[#6B6155] dark:text-[#B8AFA0] mt-0.5 truncate">
                      {subjectName} · {lesson.unitNumber}
                    </span>
                  </span>

                  {isCompleted && (
                    <CheckCircle2
                      className="w-3.5 h-3.5 text-[var(--theme-accent-text)] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Link to Account Information Status Bars */}
      <button
        type="button"
        onClick={() => onOpenAccountInfo(activeMember.id)}
        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[40px] sm:min-h-0 text-xs font-medium text-[var(--theme-accent-text)] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#DDD4C0] dark:border-[#4A4137] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] rounded-md transition-colors"
      >
        <User className="w-3.5 h-3.5" aria-hidden="true" />
        <span>View Status Bars in Account</span>
      </button>
    </section>
  );
}
