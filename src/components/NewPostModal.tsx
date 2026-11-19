import { useEffect, useState } from 'react';
import { HelpCircle, Lightbulb, X } from 'lucide-react';
import { GRADE_LEVEL_OPTIONS, SUBJECTS } from '../data/seedData';
import {
  GradeLevel,
  LessonUnit,
  PostKind,
  SchoolMember,
  SubjectId,
} from '../types/school';

interface NewPostModalProps {
  isOpen: boolean;
  initialKind?: PostKind;
  initialSubjectId?: SubjectId;
  initialLessonId?: string;
  lessons: LessonUnit[];
  activeMember: SchoolMember;
  onClose: () => void;
  onCreatePost: (payload: {
    kind: PostKind;
    subjectId: SubjectId;
    lessonId: string;
    gradeLevel: GradeLevel;
    title: string;
    body: string;
    formulaNote?: string;
    includeLessonDiagram: boolean;
  }) => void;
}

function resolveDefaultGrade(member: SchoolMember): GradeLevel {
  const match = GRADE_LEVEL_OPTIONS.find((g) => g === member.gradeOrDept);
  return match || GradeLevel.GRADE_12;
}

export function NewPostModal({
  isOpen,
  initialKind = PostKind.QUESTION,
  initialSubjectId = SubjectId.BIOLOGY,
  initialLessonId,
  lessons,
  activeMember,
  onClose,
  onCreatePost,
}: NewPostModalProps) {
  const [kind, setKind] = useState<PostKind>(initialKind);
  const [subjectId, setSubjectId] = useState<SubjectId>(initialSubjectId);
  const [lessonId, setLessonId] = useState<string>('');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(() =>
    resolveDefaultGrade(activeMember)
  );
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [formulaNote, setFormulaNote] = useState('');
  const [includeLessonDiagram, setIncludeLessonDiagram] = useState(false);

  const subjectLessons = lessons.filter((l) => l.subjectId === subjectId);
  const selectedLesson = lessons.find((l) => l.id === lessonId);

  useEffect(() => {
    if (!isOpen) return;
    setKind(initialKind);
    setSubjectId(initialSubjectId);
    const matching = lessons.filter((l) => l.subjectId === initialSubjectId);
    setLessonId(initialLessonId || matching[0]?.id || '');
    setGradeLevel(resolveDefaultGrade(activeMember));
    setTitle('');
    setBody('');
    setFormulaNote('');
    setIncludeLessonDiagram(false);
  }, [isOpen, initialKind, initialSubjectId, initialLessonId, lessons, activeMember]);

  useEffect(() => {
    const matching = lessons.filter((l) => l.subjectId === subjectId);
    if (!matching.some((l) => l.id === lessonId)) {
      setLessonId(matching[0]?.id || '');
      setIncludeLessonDiagram(false);
    }
  }, [subjectId, lessons, lessonId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !lessonId) return;
    onCreatePost({
      kind,
      subjectId,
      lessonId,
      gradeLevel,
      title: title.trim(),
      body: body.trim(),
      formulaNote: formulaNote.trim() || undefined,
      includeLessonDiagram: Boolean(
        includeLessonDiagram && selectedLesson?.diagramUrl
      ),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#1C1917]/55 dark:bg-black/75 backdrop-blur-[2px] p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="composer-title"
    >
      <div className="w-full max-w-2xl bg-[#FFFDF8] dark:bg-[#161412] border-t sm:border border-[#E2D9C6] dark:border-[#3D362D] rounded-t-2xl sm:rounded-lg overflow-hidden max-h-[92dvh] flex flex-col pb-safe shadow-2xl">
        <div
          aria-hidden="true"
          className="sm:hidden w-10 h-1 bg-[#D8CEBA] dark:bg-[#52483C] rounded-full mx-auto mt-2.5 mb-1 shrink-0"
        />
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#E2D9C6] dark:border-[#3D362D] flex items-center justify-between gap-4">
          <div>
            <h2
              id="composer-title"
              className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]"
            >
              Create Classroom Entry
            </h2>
            <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] mt-0.5">
              Posting as {activeMember.name} · {activeMember.role}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-10 h-10 inline-flex items-center justify-center text-[#6B6155] dark:text-[#B8AFA0] hover:text-[#1C1917] dark:hover:text-[#F7F3EA] rounded-lg hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] transition-colors shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          {/* Segmented Post Kind Selector */}
          <div>
            <span className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-2">
              Entry Type
            </span>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#EFE8D9] dark:bg-[#24201B] border border-[#E2D9C6] dark:border-[#3D362D] rounded-md">
              <button
                type="button"
                onClick={() => setKind(PostKind.QUESTION)}
                className={`inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded transition-colors ${
                  kind === PostKind.QUESTION
                    ? 'bg-[#FFFDF8] dark:bg-[#161412] text-[#1C1917] dark:text-[#F7F3EA] shadow-xs border border-[#E2D9C6] dark:border-[#3D362D]'
                    : 'text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]'
                }`}
              >
                <HelpCircle
                  className="w-3.5 h-3.5 text-[var(--theme-accent-bright)]"
                  aria-hidden="true"
                />
                <span>Ask a Lesson Question</span>
              </button>
              <button
                type="button"
                onClick={() => setKind(PostKind.IDEA)}
                className={`inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded transition-colors ${
                  kind === PostKind.IDEA
                    ? 'bg-[#FFFDF8] dark:bg-[#161412] text-[#1C1917] dark:text-[#F7F3EA] shadow-xs border border-[#E2D9C6] dark:border-[#3D362D]'
                    : 'text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]'
                }`}
              >
                <Lightbulb
                  className="w-3.5 h-3.5 text-[var(--theme-accent-text)]"
                  aria-hidden="true"
                />
                <span>Share a Study Idea</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="post-subject"
                className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
              >
                Subject
              </label>
              <select
                id="post-subject"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value as SubjectId)}
                className="w-full px-3 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
              >
                {SUBJECTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="post-grade"
                className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
              >
                Grade Level
              </label>
              <select
                id="post-grade"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
                className="w-full px-3 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
              >
                {GRADE_LEVEL_OPTIONS.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="post-lesson"
                className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
              >
                Lesson Unit
              </label>
              <select
                id="post-lesson"
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
              >
                {subjectLessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.unitNumber}: {lesson.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="post-title"
              className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
            >
              {kind === PostKind.QUESTION ? 'Question Title' : 'Study Idea Title'}
            </label>
            <input
              id="post-title"
              type="text"
              required
              maxLength={140}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                kind === PostKind.QUESTION
                  ? 'e.g. Why do we flip the inequality sign when dividing by a negative?'
                  : 'e.g. Quick visual trick for memorizing trigonometric unit circle angles'
              }
              className="w-full px-3.5 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
            />
          </div>

          <div>
            <label
              htmlFor="post-body"
              className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
            >
              {kind === PostKind.QUESTION
                ? 'What part of the lesson are you stuck on?'
                : 'Describe your idea, summary, or study strategy'}
            </label>
            <textarea
              id="post-body"
              required
              rows={4}
              maxLength={3000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                kind === PostKind.QUESTION
                  ? 'Share what you tried so far or which step in the textbook/lab is unclear...'
                  : 'Explain how this helps remember the concept or solve homework problems faster...'
              }
              className="w-full px-3.5 py-2.5 text-sm text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
            />
          </div>

          <div>
            <label
              htmlFor="post-formula"
              className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1.5"
            >
              Formula, Equation, or Key Line (optional)
            </label>
            <input
              id="post-formula"
              type="text"
              maxLength={240}
              value={formulaNote}
              onChange={(e) => setFormulaNote(e.target.value)}
              placeholder="e.g. E = mc^2 or d/dx [sin(x)] = cos(x)"
              className="w-full px-3.5 py-2 font-mono text-xs text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
            />
          </div>

          {selectedLesson?.diagramUrl && (
            <label className="flex items-start gap-3 p-3.5 bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D] rounded-md cursor-pointer">
              <input
                type="checkbox"
                checked={includeLessonDiagram}
                onChange={(e) => setIncludeLessonDiagram(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#C5B99F] dark:border-[#52483C] accent-[var(--theme-accent)] focus:ring-[var(--theme-accent-text)]"
              />
              <span className="text-xs text-[#443D34] dark:text-[#E0D8CA]">
                <strong className="font-medium text-[#1C1917] dark:text-[#F7F3EA]">
                  Attach reference lesson diagram
                </strong>
                <span className="block text-[#6B6155] dark:text-[#B8AFA0] mt-0.5">
                  {selectedLesson.diagramCaption || selectedLesson.title}
                </span>
              </span>
            </label>
          )}

          <div className="pt-3 border-t border-[#E2D9C6] dark:border-[#3D362D] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 text-sm font-medium text-[#443D34] dark:text-[#E0D8CA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] rounded-lg sm:rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0 px-4 py-2 text-sm font-medium text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-lg sm:rounded-md transition-colors"
            >
              {kind === PostKind.QUESTION ? 'Publish Question' : 'Share Idea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
