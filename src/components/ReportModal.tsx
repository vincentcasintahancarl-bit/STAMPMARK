import { useEffect, useState } from 'react';
import { Flag, Send, X } from 'lucide-react';
import { ReportTargetType } from '../types/school';

export interface ReportTargetContext {
  targetType: ReportTargetType;
  postId: string;
  replyId?: string;
  targetAuthorId: string;
  targetAuthorName: string;
  contentSnapshot: string;
  sourceLocation: 'feed' | 'thread' | 'mail';
}

interface ReportModalProps {
  target: ReportTargetContext | null;
  onClose: () => void;
  onSubmitReport: (payload: {
    targetType: ReportTargetType;
    postId: string;
    replyId?: string;
    targetAuthorId: string;
    reason: string;
    details?: string;
    contentSnapshot: string;
    sourceLocation: 'feed' | 'thread' | 'mail';
  }) => void;
}

const REPORT_REASONS = [
  'Inappropriate or Disrespectful Language',
  'Harassment or Personal Attack',
  'Spam or Off-Topic Content',
  'Academic Dishonesty / Cheating',
  'Misleading or Unsafe Information',
  'Other Classroom Concern',
];

export function ReportModal({
  target,
  onClose,
  onSubmitReport,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (!target) return;
    setSelectedReason(REPORT_REASONS[0]);
    setDetails('');
  }, [target]);

  if (!target) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReport({
      targetType: target.targetType,
      postId: target.postId,
      replyId: target.replyId,
      targetAuthorId: target.targetAuthorId,
      reason: selectedReason,
      details: details.trim() || undefined,
      contentSnapshot: target.contentSnapshot,
      sourceLocation: target.sourceLocation,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1C1917]/55 dark:bg-black/75 backdrop-blur-[2px] p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="w-full max-w-lg bg-[#FFFDF8] dark:bg-[#161412] border-t sm:border border-[#E2D9C6] dark:border-[#3D362D] rounded-t-2xl sm:rounded-lg overflow-hidden max-h-[90dvh] flex flex-col pb-safe shadow-2xl">
        <div
          aria-hidden="true"
          className="sm:hidden w-10 h-1 bg-[#D8CEBA] dark:bg-[#52483C] rounded-full mx-auto mt-2.5 mb-1 shrink-0"
        />
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#E2D9C6] dark:border-[#3D362D] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Flag
              className="w-4 h-4 text-[#7C1D1D] dark:text-[#FCA5A5] shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h2
                id="report-modal-title"
                className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]"
              >
                Report to Teacher Monitor
              </h2>
              <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] truncate">
                Notify a monitoring teacher about this{' '}
                {target.targetType === ReportTargetType.POST
                  ? 'shared post'
                  : 'message / reply'}{' '}
                by {target.targetAuthorName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close report dialog"
            className="w-10 h-10 inline-flex items-center justify-center text-[#6B6155] dark:text-[#B8AFA0] hover:text-[#1C1917] dark:hover:text-[#F7F3EA] rounded-lg hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] transition-colors shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-4 overflow-y-auto"
        >
          <div className="p-3.5 bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D] rounded-md space-y-1">
            <p className="text-[11px] font-medium text-[#6B6155] dark:text-[#B8AFA0]">
              Reported {target.targetType === ReportTargetType.POST ? 'Post' : 'Message'} · Author: {target.targetAuthorName}
            </p>
            <p className="text-xs text-[#1C1917] dark:text-[#F7F3EA] line-clamp-3 leading-relaxed">
              “{target.contentSnapshot}”
            </p>
          </div>

          <div>
            <span className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-2">
              Reason for Report
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {REPORT_REASONS.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReason(reason)}
                    className={`text-left px-3.5 py-2.5 text-xs font-medium rounded-md border transition-colors ${
                      isSelected
                        ? 'bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)] text-[var(--theme-accent-text)]'
                        : 'bg-[#FFFDF8] dark:bg-[#1C1916] border-[#E2D9C6] dark:border-[#3D362D] text-[#443D34] dark:text-[#E0D8CA] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C]'
                    }`}
                  >
                    {reason}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="report-details"
              className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
            >
              Additional Notes for Teacher Monitor (optional)
            </label>
            <textarea
              id="report-details"
              rows={3}
              maxLength={500}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Explain what happened or why this sharing/message needs teacher attention..."
              className="w-full px-3.5 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
            />
          </div>

          <div className="pt-3 border-t border-[#E2D9C6] dark:border-[#3D362D] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto min-h-[42px] sm:min-h-0 px-4 py-2 text-sm font-medium text-[#443D34] dark:text-[#E0D8CA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] rounded-lg sm:rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto min-h-[42px] sm:min-h-0 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-lg sm:rounded-md transition-colors whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Notify Monitoring Teacher</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
