import {
  BookOpen,
  CheckCircle2,
  Coffee,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  PomodoroCadenceId,
  PomodoroPhase,
  PomodoroState,
} from '../types/school';
import {
  getPhaseDurationSeconds,
  POMODORO_CADENCES,
} from '../utils/storage';

interface StudyTimerProps {
  pomodoro: PomodoroState;
  isMuted: boolean;
  onToggleMute: () => void;
  onToggleRun: () => void;
  onReset: () => void;
  onSelectPhase: (phase: PomodoroPhase) => void;
  onSkipPhase: () => void;
  onChangeCadence: (cadenceId: PomodoroCadenceId) => void;
  compact?: boolean;
}

function formatTimerClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function StudyTimer({
  pomodoro,
  isMuted,
  onToggleMute,
  onToggleRun,
  onReset,
  onSelectPhase,
  onSkipPhase,
  onChangeCadence,
  compact = false,
}: StudyTimerProps) {
  const totalPhaseSeconds = Math.max(
    1,
    getPhaseDurationSeconds(pomodoro.phase, pomodoro.cadenceId)
  );
  const clampedRemaining = Math.min(
    totalPhaseSeconds,
    Math.max(0, pomodoro.secondsRemaining)
  );
  const elapsedSeconds = Math.max(0, totalPhaseSeconds - clampedRemaining);
  const progressPercent = Math.min(
    100,
    Math.round((elapsedSeconds / totalPhaseSeconds) * 100)
  );

  const isFocus = pomodoro.phase === 'focus';
  const phaseLabel =
    pomodoro.phase === 'focus'
      ? 'Focus Session'
      : pomodoro.phase === 'shortBreak'
        ? 'Short Pause'
        : 'Long Pause';

  const statusText = pomodoro.isRunning
    ? 'Running'
    : clampedRemaining < totalPhaseSeconds
      ? 'Paused'
      : 'Ready';

  const PhaseIcon = isFocus ? BookOpen : Coffee;
  const selectId = compact ? 'mobile-timer-cadence' : 'sidebar-timer-cadence';

  const primaryButtonLabel = pomodoro.isRunning
    ? 'Pause'
    : clampedRemaining < totalPhaseSeconds && clampedRemaining > 0
      ? 'Resume'
      : isFocus
        ? 'Start Focus'
        : 'Start Break';

  return (
    <section
      aria-label="Pomodoro Study Timer"
      className={
        compact
          ? 'p-3.5 bg-[#F5F0E6] dark:bg-[#1E1A16] border border-[#E2D9C6] dark:border-[#3D362D] rounded-xl space-y-3'
          : 'heritage-card border rounded-lg p-5 space-y-3.5'
      }
    >
      {/* Header & Session Counter */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="heritage-eyebrow mb-0.5">Pomodoro Cadence</p>
          <h2 className="font-display text-lg font-semibold text-[#1C1917] dark:text-[#F7F3EA] leading-snug">
            Study Timer
          </h2>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="text-xs font-mono font-medium tabular-nums text-[#6B6155] dark:text-[#B8AFA0]"
            title="Completed focus sessions"
          >
            {pomodoro.completedFocusSessions}{' '}
            {pomodoro.completedFocusSessions === 1 ? 'session' : 'sessions'}
          </span>
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute timer chime' : 'Mute timer chime'}
            aria-pressed={!isMuted}
            title={isMuted ? 'Sound off' : 'Sound on'}
            className="w-7 h-7 inline-flex items-center justify-center rounded-md text-[#6B6155] dark:text-[#B8AFA0] hover:text-[#1C1917] dark:hover:text-[#F7F3EA] hover:bg-[#ECE5D5] dark:hover:bg-[#2C2721] transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Phase Segmented Control */}
      <div
        role="group"
        aria-label="Timer session type"
        className="grid grid-cols-3 gap-1 p-1 bg-[#EFE8D9] dark:bg-[#24201B] border border-[#E2D9C6] dark:border-[#3D362D] rounded-md"
      >
        {(
          [
            { id: 'focus', label: 'Focus' },
            { id: 'shortBreak', label: 'Pause' },
            { id: 'longBreak', label: 'Long' },
          ] as { id: PomodoroPhase; label: string }[]
        ).map((tab) => {
          const active = pomodoro.phase === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectPhase(tab.id)}
              aria-pressed={active}
              className={`py-1.5 px-2 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                active
                  ? 'bg-[#FFFDF8] dark:bg-[#161412] text-[var(--theme-accent-text)] shadow-xs border border-[#E2D9C6] dark:border-[#52483C]'
                  : 'text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Clock Display & Elapsed Progress Track */}
      <div
        className={`rounded-md border border-[#E2D9C6] dark:border-[#3D362D] p-3.5 text-center space-y-2 ${
          compact ? 'bg-[#FFFDF8] dark:bg-[#161412]' : 'bg-[#F5F0E6] dark:bg-[#221E1A]'
        }`}
      >
        <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#574F45] dark:text-[#CEC5B6]">
          <PhaseIcon
            className={`w-3.5 h-3.5 ${
              isFocus
                ? 'text-[var(--theme-accent-text)]'
                : 'text-[#8C6D3B] dark:text-[#D4B475]'
            }`}
            aria-hidden="true"
          />
          <span>
            {phaseLabel} · {statusText}
          </span>
        </div>

        <p
          aria-live="off"
          className="font-mono text-3xl font-semibold tabular-nums tracking-tight text-[#1C1917] dark:text-[#F7F3EA]"
        >
          {formatTimerClock(clampedRemaining)}
        </p>

        <div
          role="progressbar"
          aria-label={`${phaseLabel} elapsed time`}
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 w-full bg-[#ECE5D5] dark:bg-[#2E2922] border border-[#DDD4C0] dark:border-[#4A4137] rounded-full overflow-hidden"
        >
          <div
            className={`h-full transition-all duration-200 ${
              isFocus
                ? 'bg-[var(--theme-accent)] dark:bg-[var(--theme-accent-text)]'
                : 'bg-[#8C6D3B] dark:bg-[#D4B475]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Phase Completion Notice */}
      {pomodoro.lastCompletedPhase && (
        <div
          role="status"
          className="px-3 py-2 text-xs font-medium text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] rounded-md flex items-center gap-2"
        >
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>
            {pomodoro.lastCompletedPhase === 'focus'
              ? 'Focus session complete. Ready for your pause.'
              : 'Pause finished. Ready for your next focus session.'}
          </span>
        </div>
      )}

      {/* Primary Action Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleRun}
          className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md transition-colors whitespace-nowrap"
        >
          {pomodoro.isRunning ? (
            <Pause className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <Play className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          <span>{primaryButtonLabel}</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          aria-label="Reset current timer"
          title="Reset timer"
          className="min-h-[40px] w-10 inline-flex items-center justify-center text-[#443D34] dark:text-[#F7F3EA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#4A4137] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] rounded-md transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onSkipPhase}
          aria-label="Skip to next phase"
          title="Next phase"
          className="min-h-[40px] w-10 inline-flex items-center justify-center text-[#443D34] dark:text-[#F7F3EA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#4A4137] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] rounded-md transition-colors shrink-0"
        >
          <SkipForward className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Cadence Duration Selector */}
      <div className="pt-2 border-t border-[#ECE5D5] dark:border-[#342E26] flex items-center justify-between gap-2 text-xs">
        <label htmlFor={selectId} className="text-[#6B6155] dark:text-[#B8AFA0] shrink-0">
          Cadence
        </label>
        <select
          id={selectId}
          value={pomodoro.cadenceId}
          onChange={(e) =>
            onChangeCadence(e.target.value as PomodoroCadenceId)
          }
          className="px-2.5 py-1.5 text-xs font-medium text-[#1C1917] dark:text-[#F7F3EA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
        >
          {Object.values(POMODORO_CADENCES).map((cadence) => (
            <option key={cadence.id} value={cadence.id}>
              {cadence.label}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
