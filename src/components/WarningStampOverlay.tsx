import { AlertOctagon, AlertTriangle, CheckCheck } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { WarningLevel } from '../types/school';
import { formatStampTime } from '../utils/storage';

export interface WarningStampEffect {
  id: string;
  level: WarningLevel.MID | WarningLevel.CRITICAL;
  mode: 'received' | 'acknowledged';
  reason: string;
  timestamp: number;
}

interface WarningStampOverlayProps {
  effect: WarningStampEffect | null;
}

export function WarningStampOverlay({ effect }: WarningStampOverlayProps) {
  const prefersReducedMotion = useReducedMotion();

  const isCritical = effect?.level === WarningLevel.CRITICAL;
  const flashColor = isCritical
    ? 'rgba(185, 28, 28, 0.14)'
    : 'rgba(194, 65, 12, 0.10)';
  const ringColor = isCritical
    ? 'rgba(220, 38, 38, 0.55)'
    : 'rgba(217, 119, 6, 0.50)';

  return (
    <AnimatePresence>
      {effect && (
        <motion.div
          key={effect.id}
          role="alert"
          aria-live="assertive"
          className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          {/* Full-screen severity ink flash */}
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: flashColor }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.3] }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.18 : 0.55 }}
          />

          {/* Expanding shockwave ring */}
          {!prefersReducedMotion && (
            <motion.div
              className="absolute w-80 h-36 rounded-md border-2 -rotate-6"
              style={{ borderColor: ringColor }}
              initial={{ opacity: 0.95, scale: 0.85 }}
              animate={{ opacity: 0, scale: 1.65 }}
              transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
            />
          )}

          {/* Secondary shockwave ring for Critical / High warnings */}
          {!prefersReducedMotion && isCritical && (
            <motion.div
              className="absolute w-80 h-36 rounded-md border-2 -rotate-6"
              style={{ borderColor: ringColor }}
              initial={{ opacity: 0.85, scale: 0.9 }}
              animate={{ opacity: 0, scale: 1.95 }}
              transition={{
                duration: 0.85,
                delay: 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          )}

          {/* Collegiate Warning Stamp Seal */}
          <motion.div
            className={`relative max-w-md w-[90vw] rounded-md px-5 sm:px-8 py-4 sm:py-5 shadow-2xl text-center -rotate-6 border-[3px] ${
              isCritical
                ? 'bg-[#FFFDF8]/95 dark:bg-[#230E0E]/95 border-[#991B1B] dark:border-[#FCA5A5] ring-2 ring-[#E5C9C5] dark:ring-[#8C3737]'
                : 'bg-[#FFFDF8]/95 dark:bg-[#1E140B]/95 border-[#9A3412] dark:border-[#FDBA74] ring-1 ring-[#F0D5B5] dark:ring-[#7C4B1E]'
            }`}
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 2.2, rotate: -15 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : {
                    opacity: 1,
                    scale: [2.2, 0.93, 1],
                    rotate: [-15, -4, -6],
                  }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 1.04 }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0.18 }
                : {
                    duration: 0.38,
                    times: [0, 0.65, 1],
                    ease: [0.16, 1, 0.3, 1],
                  }
            }
          >
            <div
              className={`border rounded px-4 py-3 space-y-1.5 ${
                isCritical
                  ? 'border-[#E5C9C5] dark:border-[#8C3737]'
                  : 'border-[#F0D5B5] dark:border-[#7C4B1E]'
              }`}
            >
              <div
                className={`flex items-center justify-center gap-2 ${
                  isCritical
                    ? 'text-[#7C1D1D] dark:text-[#FCA5A5]'
                    : 'text-[#9A3412] dark:text-[#FDBA74]'
                }`}
              >
                {effect.mode === 'acknowledged' ? (
                  <CheckCheck className="w-6 h-6 shrink-0" aria-hidden="true" />
                ) : isCritical ? (
                  <AlertOctagon className="w-6 h-6 shrink-0" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="w-6 h-6 shrink-0" aria-hidden="true" />
                )}
                <span className="font-display text-2xl sm:text-3xl font-bold tracking-wider uppercase">
                  {effect.mode === 'acknowledged'
                    ? 'STAMP CHECKED'
                    : isCritical
                      ? 'HIGH WARNING'
                      : 'MID WARNING'}
                </span>
              </div>

              <p
                className={`text-[11px] font-mono font-semibold uppercase tracking-widest ${
                  isCritical
                    ? 'text-[#991B1B] dark:text-[#FCA5A5]'
                    : 'text-[#B45309] dark:text-[#FDBA74]'
                }`}
              >
                {effect.mode === 'acknowledged'
                  ? isCritical
                    ? 'CRITICAL / HIGH WARNING ACKNOWLEDGED'
                    : 'MID WARNING ACKNOWLEDGED'
                  : isCritical
                    ? 'CRITICAL CONDUCT STAMP CHECK'
                    : 'MID CONDUCT STAMP CHECK'}
              </p>

              {effect.reason && (
                <p className="text-xs font-medium text-[#1C1917] dark:text-[#F7F3EA] line-clamp-2 pt-0.5">
                  {effect.reason}
                </p>
              )}

              <p className="font-mono text-[11px] text-[#574F45] dark:text-[#CEC5B6]">
                {formatStampTime(effect.timestamp)}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
