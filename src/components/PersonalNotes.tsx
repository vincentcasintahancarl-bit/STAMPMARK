import { useState } from 'react';
import {
  Check,
  Lock,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { SUBJECTS } from '../data/seedData';
import { PersonalNote, SchoolMember, SubjectId } from '../types/school';
import { formatRelativeTime } from '../utils/storage';

interface PersonalNotesProps {
  activeMember: SchoolMember;
  notes: PersonalNote[];
  onAddNote: (content: string, subjectId: SubjectId | 'general') => void;
  onUpdateNote: (noteId: string, content: string) => void;
  onDeleteNote: (noteId: string) => void;
  compact?: boolean;
}

export function PersonalNotes({
  activeMember,
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  compact = false,
}: PersonalNotesProps) {
  const [draft, setDraft] = useState('');
  const [subjectId, setSubjectId] = useState<SubjectId | 'general'>('general');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const inputId = compact ? 'mobile-personal-note-input' : 'sidebar-personal-note-input';
  const selectId = compact
    ? 'mobile-personal-note-subject'
    : 'sidebar-personal-note-subject';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAddNote(trimmed, subjectId);
    setDraft('');
  };

  const startEditing = (note: PersonalNote) => {
    setEditingNoteId(note.id);
    setEditDraft(note.content);
  };

  const handleSaveEdit = (noteId: string) => {
    const trimmed = editDraft.trim();
    if (!trimmed) return;
    onUpdateNote(noteId, trimmed);
    setEditingNoteId(null);
    setEditDraft('');
  };

  return (
    <section
      aria-label="Personal Notes"
      className={
        compact
          ? 'p-3.5 bg-[#F5F0E6] dark:bg-[#1E1A16] border border-[#E2D9C6] dark:border-[#3D362D] rounded-xl space-y-3'
          : 'heritage-card border rounded-lg p-5 space-y-3.5'
      }
    >
      {/* Header & Privacy Indicator */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="heritage-eyebrow inline-flex items-center gap-1 mb-0.5">
            <Lock className="w-3 h-3 text-[#8C6D3B] dark:text-[#D4B475]" aria-hidden="true" />
            <span>Private Folio</span>
          </p>
          <h2 className="font-display text-lg font-semibold text-[#1C1917] dark:text-[#F7F3EA] leading-snug">
            Personal Notes
          </h2>
        </div>

        <span className="text-xs font-mono font-medium tabular-nums text-[#6B6155] dark:text-[#B8AFA0] shrink-0">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        </span>
      </div>

      <p className="text-[11px] text-[#6B6155] dark:text-[#B8AFA0] leading-relaxed">
        Private to {activeMember.name} — saved in your browser and hidden from the rest of the class.
      </p>

      {/* New Private Note Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <label htmlFor={inputId} className="sr-only">
          Write a private study note or reminder
        </label>
        <textarea
          id={inputId}
          rows={2}
          maxLength={400}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Jot a private summary or reminder..."
          className={`w-full px-3 py-2 text-xs text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#8A7F70] dark:placeholder:text-[#968C7D] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#2A2520] ${
            compact ? 'bg-[#FFFDF8] dark:bg-[#161412]' : 'bg-[#F5F0E6] dark:bg-[#221E1A]'
          }`}
        />

        <div className="flex items-center justify-between gap-2">
          <label htmlFor={selectId} className="sr-only">
            Note subject tag
          </label>
          <select
            id={selectId}
            value={subjectId}
            onChange={(e) =>
              setSubjectId(e.target.value as SubjectId | 'general')
            }
            className="min-w-0 flex-1 px-2.5 min-h-[38px] text-xs font-medium text-[#443D34] dark:text-[#F7F3EA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
          >
            <option value="general">General Reminder</option>
            {SUBJECTS.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={!draft.trim()}
            className="inline-flex items-center justify-center gap-1 px-3 min-h-[38px] text-xs font-medium text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] disabled:opacity-45 disabled:pointer-events-none rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Save</span>
          </button>
        </div>
      </form>

      {/* Saved Notes List */}
      {notes.length === 0 ? (
        <div
          className={`p-3 rounded-md border border-dashed border-[#D8CEBA] dark:border-[#4A4137] text-center ${
            compact ? 'bg-[#FFFDF8] dark:bg-[#161412]' : 'bg-[#F5F0E6] dark:bg-[#221E1A]'
          }`}
        >
          <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0]">
            No private notes yet. Add a reminder or quick summary above.
          </p>
        </div>
      ) : (
        <ul className="space-y-2 max-h-[240px] overflow-y-auto pr-0.5">
          {notes.map((note) => {
            const subjectLabel =
              note.subjectId === 'general'
                ? 'General'
                : SUBJECTS.find((s) => s.id === note.subjectId)?.name ||
                  'General';
            const isEditing = editingNoteId === note.id;

            return (
              <li
                key={note.id}
                className={`p-3 rounded-md border border-[#E2D9C6] dark:border-[#3D362D] space-y-1.5 ${
                  compact ? 'bg-[#FFFDF8] dark:bg-[#161412]' : 'bg-[#F5F0E6] dark:bg-[#221E1A]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[11px] text-[#6B6155] dark:text-[#B8AFA0]">
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    <span className="font-medium text-[var(--theme-accent-text)] truncate">
                      {subjectLabel}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="shrink-0">
                      {formatRelativeTime(note.updatedAt)}
                    </span>
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditing(note)}
                        aria-label="Edit private note"
                        title="Edit note"
                        className="w-6 h-6 inline-flex items-center justify-center rounded text-[#6B6155] dark:text-[#B8AFA0] hover:text-[#1C1917] dark:hover:text-[#F7F3EA] hover:bg-[#ECE5D5] dark:hover:bg-[#2E2922] transition-colors"
                      >
                        <Pencil className="w-3 h-3" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteNote(note.id)}
                        aria-label="Delete private note"
                        title="Delete note"
                        className="w-6 h-6 inline-flex items-center justify-center rounded text-[#6B6155] dark:text-[#B8AFA0] hover:text-[#7C1D1D] dark:hover:text-[#FCA5A5] hover:bg-[#FAF3F1] dark:hover:bg-[#2D1414] transition-colors"
                      >
                        <Trash2 className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2 pt-0.5">
                    <textarea
                      rows={3}
                      maxLength={400}
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs text-[#1C1917] dark:text-[#F7F3EA] bg-[#FFFDF8] dark:bg-[#161412] border border-[#DDD4C0] dark:border-[#4A4137] rounded focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] resize-none"
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNoteId(null);
                          setEditDraft('');
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#574F45] dark:text-[#CEC5B6] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#4A4137] hover:bg-[#ECE5D5] dark:hover:bg-[#2C2721] rounded transition-colors"
                      >
                        <X className="w-3 h-3" aria-hidden="true" />
                        <span>Cancel</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(note.id)}
                        disabled={!editDraft.trim()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] disabled:opacity-45 rounded transition-colors"
                      >
                        <Check className="w-3 h-3" aria-hidden="true" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#1C1917] dark:text-[#F7F3EA] leading-relaxed whitespace-pre-wrap break-words">
                    {note.content}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
