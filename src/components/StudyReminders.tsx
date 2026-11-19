import { useMemo, useState } from 'react';
import {
  BellPlus,
  BellRing,
  Check,
  CheckCircle2,
  Clock,
  Trash2,
} from 'lucide-react';
import { SUBJECTS } from '../data/seedData';
import { StudyReminder, SubjectId } from '../types/school';
import { formatStampTime } from '../utils/storage';

interface StudyRemindersProps {
  reminders: StudyReminder[];
  currentTimeMs: number;
  onAddReminder: (
    title: string,
    subjectId: SubjectId | 'general',
    dueAt: number
  ) => void;
  onToggleReminderComplete: (reminderId: string) => void;
  onSnoozeReminder: (reminderId: string, minutes?: number) => void;
  onDeleteReminder: (reminderId: string) => void;
  compact?: boolean;
}

function toLocalDateTimeInputValue(timestampMs: number): string {
  const date = new Date(timestampMs);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDueCountdown(dueAt: number, nowMs: number): string {
  const diffMs = dueAt - nowMs;
  if (diffMs <= 0) return 'Due now';
  const diffMins = Math.ceil(diffMs / 60000);
  if (diffMins < 60) return `In ${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `In ${diffHours}h`;
  return formatStampTime(dueAt);
}

export function StudyReminders({
  reminders,
  currentTimeMs,
  onAddReminder,
  onToggleReminderComplete,
  onSnoozeReminder,
  onDeleteReminder,
  compact = false,
}: StudyRemindersProps) {
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState<SubjectId | 'general'>('general');
  const [dueInput, setDueInput] = useState(() =>
    toLocalDateTimeInputValue(Date.now() + 60 * 60 * 1000)
  );
  const [formError, setFormError] = useState<string | null>(null);

  const titleInputId = compact
    ? 'mobile-reminder-title'
    : 'sidebar-reminder-title';
  const subjectSelectId = compact
    ? 'mobile-reminder-subject'
    : 'sidebar-reminder-subject';
  const dueInputId = compact ? 'mobile-reminder-due' : 'sidebar-reminder-due';

  const sortedReminders = useMemo(() => {
    return [...reminders].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      return a.dueAt - b.dueAt;
    });
  }, [reminders]);

  const activeCount = useMemo(
    () => reminders.filter((r) => !r.isCompleted).length,
    [reminders]
  );

  const applyQuickOffset = (minutesFromNow: number) => {
    setFormError(null);
    setDueInput(toLocalDateTimeInputValue(Date.now() + minutesFromNow * 60000));
  };

  const applyTomorrowMorning = () => {
    setFormError(null);
    const now = new Date();
    const tomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      9,
      0,
      0,
      0
    );
    setDueInput(toLocalDateTimeInputValue(tomorrow.getTime()));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmed = title.trim();
    if (!trimmed) {
      setFormError('Enter a study reminder title first.');
      return;
    }

    const parsedDue = new Date(dueInput).getTime();
    if (!Number.isFinite(parsedDue)) {
      setFormError('Choose a valid date and time for this reminder.');
      return;
    }

    onAddReminder(trimmed, subjectId, parsedDue);
    setTitle('');
    setDueInput(toLocalDateTimeInputValue(Date.now() + 60 * 60 * 1000));
  };

  return (
    <section
      aria-label="Study Reminders"
      className={
        compact
          ? 'p-3.5 bg-[#F5F0E6] dark:bg-[#1E1A16] border border-[#E2D9C6] dark:border-[#3D362D] rounded-xl space-y-3'
          : 'heritage-card border rounded-lg p-5 space-y-3.5'
      }
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="heritage-eyebrow mb-0.5">Reminder Set</p>
          <h2 className="font-display text-lg font-semibold text-[#1C1917] dark:text-[#F7F3EA] leading-snug">
            Study Reminders
          </h2>
        </div>

        <span className="text-xs font-mono font-medium tabular-nums text-[#6B6155] dark:text-[#B8AFA0] shrink-0">
          {activeCount} active
        </span>
      </div>

      {/* Add / Schedule Reminder Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        {formError && (
          <p
            role="alert"
            className="px-2.5 py-1.5 text-[11px] font-medium text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FAF3F1] dark:bg-[#2D1414] border border-[#E5C9C5] dark:border-[#7F3232] rounded"
          >
            {formError}
          </p>
        )}

        <div>
          <label htmlFor={titleInputId} className="sr-only">
            Reminder title
          </label>
          <input
            id={titleInputId}
            type="text"
            maxLength={100}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (formError) setFormError(null);
            }}
            placeholder="Remind me to..."
            className={`w-full px-3 min-h-[38px] text-xs text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#8A7F70] dark:placeholder:text-[#968C7D] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#2A2520] ${
              compact ? 'bg-[#FFFDF8] dark:bg-[#161412]' : 'bg-[#F5F0E6] dark:bg-[#221E1A]'
            }`}
          />
        </div>

        {/* Quick Time Presets */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => applyQuickOffset(15)}
            className="flex-1 py-1.5 px-2 text-[11px] font-medium text-[#443D34] dark:text-[#E5DEC9] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#DDD4C0] dark:border-[#4A4137] hover:bg-[#ECE5D5] dark:hover:bg-[#2C2721] rounded transition-colors whitespace-nowrap"
          >
            +15m
          </button>
          <button
            type="button"
            onClick={() => applyQuickOffset(60)}
            className="flex-1 py-1.5 px-2 text-[11px] font-medium text-[#443D34] dark:text-[#E5DEC9] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#DDD4C0] dark:border-[#4A4137] hover:bg-[#ECE5D5] dark:hover:bg-[#2C2721] rounded transition-colors whitespace-nowrap"
          >
            +1h
          </button>
          <button
            type="button"
            onClick={applyTomorrowMorning}
            className="flex-1 py-1.5 px-2 text-[11px] font-medium text-[#443D34] dark:text-[#E5DEC9] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#DDD4C0] dark:border-[#4A4137] hover:bg-[#ECE5D5] dark:hover:bg-[#2C2721] rounded transition-colors whitespace-nowrap"
          >
            Tomorrow
          </button>
        </div>

        <div>
          <label htmlFor={dueInputId} className="sr-only">
            Reminder date and time
          </label>
          <input
            id={dueInputId}
            type="datetime-local"
            value={dueInput}
            onChange={(e) => setDueInput(e.target.value)}
            className={`w-full px-2.5 min-h-[38px] text-xs font-mono text-[#1C1917] dark:text-[#F7F3EA] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#2A2520] ${
              compact ? 'bg-[#FFFDF8] dark:bg-[#161412]' : 'bg-[#F5F0E6] dark:bg-[#221E1A]'
            }`}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <label htmlFor={subjectSelectId} className="sr-only">
            Reminder subject
          </label>
          <select
            id={subjectSelectId}
            value={subjectId}
            onChange={(e) =>
              setSubjectId(e.target.value as SubjectId | 'general')
            }
            className="min-w-0 flex-1 px-2.5 min-h-[38px] text-xs font-medium text-[#443D34] dark:text-[#F7F3EA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
          >
            <option value="general">General Study</option>
            {SUBJECTS.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 px-3 min-h-[38px] text-xs font-medium text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <BellPlus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Set</span>
          </button>
        </div>
      </form>

      {/* Reminder Set List */}
      {sortedReminders.length === 0 ? (
        <div
          className={`p-3 rounded-md border border-dashed border-[#D8CEBA] dark:border-[#4A4137] text-center ${
            compact ? 'bg-[#FFFDF8] dark:bg-[#161412]' : 'bg-[#F5F0E6] dark:bg-[#221E1A]'
          }`}
        >
          <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0]">
            No reminders set yet. Schedule a quiz or homework alert above.
          </p>
        </div>
      ) : (
        <ul className="space-y-2 max-h-[240px] overflow-y-auto pr-0.5">
          {sortedReminders.map((reminder) => {
            const isDue = !reminder.isCompleted && reminder.dueAt <= currentTimeMs;
            const subjectLabel =
              reminder.subjectId === 'general'
                ? 'General'
                : SUBJECTS.find((s) => s.id === reminder.subjectId)?.name ||
                  'General';

            return (
              <li
                key={reminder.id}
                className={`p-2.5 rounded-md border space-y-1.5 ${
                  isDue
                    ? 'bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)]'
                    : reminder.isCompleted
                      ? 'bg-[#F5F0E6]/70 dark:bg-[#1A1714]/80 border-[#ECE5D5] dark:border-[#342E26]'
                      : compact
                        ? 'bg-[#FFFDF8] dark:bg-[#161412] border-[#E2D9C6] dark:border-[#3D362D]'
                        : 'bg-[#F5F0E6] dark:bg-[#221E1A] border-[#E2D9C6] dark:border-[#3D362D]'
                }`}
              >
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={reminder.isCompleted}
                    aria-label={`Mark "${reminder.title}" as ${
                      reminder.isCompleted ? 'incomplete' : 'complete'
                    }`}
                    onClick={() => onToggleReminderComplete(reminder.id)}
                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                      reminder.isCompleted
                        ? 'bg-[var(--theme-accent)] border-[var(--theme-accent)] text-[#FFFDF8]'
                        : 'bg-[#FFFDF8] dark:bg-[#26211C] border-[#C5B99F] dark:border-[#635648] text-transparent hover:border-[var(--theme-accent-text)]'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-medium leading-snug break-words ${
                        reminder.isCompleted
                          ? 'text-[#6B6155] dark:text-[#968C7D] line-through decoration-[#8C7F6D]/60'
                          : 'text-[#1C1917] dark:text-[#F7F3EA]'
                      }`}
                    >
                      {reminder.title}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-[#6B6155] dark:text-[#B8AFA0]">
                      <span className="inline-flex items-center gap-1 font-medium text-[#443D34] dark:text-[#E0D8CA]">
                        {reminder.isCompleted ? (
                          <CheckCircle2
                            className="w-3 h-3 text-[var(--theme-accent-text)]"
                            aria-hidden="true"
                          />
                        ) : isDue ? (
                          <BellRing
                            className="w-3 h-3 text-[var(--theme-accent-text)]"
                            aria-hidden="true"
                          />
                        ) : (
                          <Clock
                            className="w-3 h-3 text-[#8C6D3B] dark:text-[#D4B475]"
                            aria-hidden="true"
                          />
                        )}
                        <span
                          className={
                            isDue
                              ? 'font-semibold text-[var(--theme-accent-text)]'
                              : undefined
                          }
                        >
                          {reminder.isCompleted
                            ? 'Completed'
                            : formatDueCountdown(reminder.dueAt, currentTimeMs)}
                        </span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{subjectLabel}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteReminder(reminder.id)}
                    aria-label="Delete reminder"
                    title="Delete reminder"
                    className="w-6 h-6 inline-flex items-center justify-center rounded text-[#6B6155] dark:text-[#B8AFA0] hover:text-[#7C1D1D] dark:hover:text-[#FCA5A5] hover:bg-[#FAF3F1] dark:hover:bg-[#2D1414] transition-colors shrink-0"
                  >
                    <Trash2 className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>

                {isDue && (
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-[var(--theme-accent-border)]/50">
                    <button
                      type="button"
                      onClick={() => onSnoozeReminder(reminder.id, 15)}
                      className="text-[11px] font-medium text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA] transition-colors"
                    >
                      Snooze 15m
                    </button>
                    <span aria-hidden="true" className="text-[#C5B99F] dark:text-[#52483C]">
                      ·
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleReminderComplete(reminder.id)}
                      className="text-[11px] font-semibold text-[var(--theme-accent-text)] hover:underline transition-colors"
                    >
                      Mark Done
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
