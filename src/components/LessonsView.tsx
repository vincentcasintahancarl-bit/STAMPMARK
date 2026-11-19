import { useState } from 'react';
import { ArrowRight, BookOpen, Plus } from 'lucide-react';
import { SUBJECTS } from '../data/seedData';
import {
  DiscussionPost,
  LessonUnit,
  PostKind,
  SchoolMember,
  SubjectId,
} from '../types/school';
import { ResilientImage } from './ResilientImage';

interface LessonsViewProps {
  lessons: LessonUnit[];
  posts: DiscussionPost[];
  activeMember: SchoolMember;
  onViewLessonFeed: (lesson: LessonUnit) => void;
  onStartPostForLesson: (lesson: LessonUnit, kind: PostKind) => void;
  onAddLesson: (payload: {
    subjectId: SubjectId;
    unitNumber: string;
    title: string;
    summary: string;
    teacherName: string;
  }) => void;
}

export function LessonsView({
  lessons,
  posts,
  activeMember,
  onViewLessonFeed,
  onStartPostForLesson,
  onAddLesson,
}: LessonsViewProps) {
  const [filterSubject, setFilterSubject] = useState<SubjectId | 'all'>('all');
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [subjectId, setSubjectId] = useState<SubjectId>(SubjectId.MATHEMATICS);
  const [unitNumber, setUnitNumber] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');

  const filteredLessons =
    filterSubject === 'all'
      ? lessons
      : lessons.filter((l) => l.subjectId === filterSubject);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitNumber.trim() || !title.trim() || !summary.trim()) return;
    onAddLesson({
      subjectId,
      unitNumber: unitNumber.trim(),
      title: title.trim(),
      summary: summary.trim(),
      teacherName: activeMember.name,
    });
    setUnitNumber('');
    setTitle('');
    setSummary('');
    setShowAddLesson(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="heritage-eyebrow mb-1">Syllabus & Curriculum</p>
          <h1 className="font-display text-3xl font-semibold text-[#1C1917] dark:text-[#F7F3EA] text-balance">
            Curriculum Lessons & Syllabus Archive
          </h1>
          <p className="mt-1 text-sm text-[#574F45] dark:text-[#CEC5B6]">
            Browse active class units to ask targeted questions or contribute revision notes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddLesson((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#1C1917] dark:text-[#F7F3EA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] rounded-md transition-colors whitespace-nowrap shrink-0"
        >
          <Plus
            className="w-4 h-4 text-[var(--theme-accent-text)]"
            aria-hidden="true"
          />
          <span>{showAddLesson ? 'Close Form' : 'Add Lesson Unit'}</span>
        </button>
      </div>

      {showAddLesson && (
        <form
          onSubmit={handleAddSubmit}
          className="heritage-card border rounded-xl sm:rounded-lg p-5 sm:p-6 space-y-4"
        >
          <h2 className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
            Add New Lesson Unit
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="lesson-subject"
                className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1"
              >
                Subject
              </label>
              <select
                id="lesson-subject"
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
                htmlFor="lesson-unit"
                className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1"
              >
                Unit Label
              </label>
              <input
                id="lesson-unit"
                type="text"
                required
                maxLength={24}
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                placeholder="e.g. Unit 6.2"
                className="w-full px-3 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
              />
            </div>
            <div>
              <label
                htmlFor="lesson-title"
                className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1"
              >
                Lesson Title
              </label>
              <input
                id="lesson-title"
                type="text"
                required
                maxLength={90}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Integration by Substitution"
                className="w-full px-3 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="lesson-summary"
              className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1"
            >
              Lesson Overview
            </label>
            <input
              id="lesson-summary"
              type="text"
              required
              maxLength={200}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Key learning goals, chapters, or lab focus for this unit..."
              className="w-full px-3 py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddLesson(false)}
              className="px-4 py-2 text-sm font-medium text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md transition-colors"
            >
              Save Lesson Unit
            </button>
          </div>
        </form>
      )}

      {/* Interactive Subject Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#EFE8D9] dark:bg-[#24201B] border border-[#E2D9C6] dark:border-[#3D362D] rounded-lg sm:rounded-md w-full sm:w-fit overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setFilterSubject('all')}
          className={`px-3 min-h-[38px] sm:min-h-0 sm:py-1.5 text-xs font-medium rounded-md sm:rounded transition-colors whitespace-nowrap shrink-0 ${
            filterSubject === 'all'
              ? 'bg-[#FFFDF8] dark:bg-[#161412] text-[var(--theme-accent-text)] shadow-xs border border-[#E2D9C6] dark:border-[#3D362D]'
              : 'text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]'
          }`}
        >
          All Subjects
        </button>
        {SUBJECTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setFilterSubject(s.id)}
            className={`px-3 min-h-[38px] sm:min-h-0 sm:py-1.5 text-xs font-medium rounded-md sm:rounded transition-colors whitespace-nowrap shrink-0 ${
              filterSubject === s.id
                ? 'bg-[#FFFDF8] dark:bg-[#161412] text-[var(--theme-accent-text)] shadow-xs border border-[#E2D9C6] dark:border-[#3D362D]'
                : 'text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Lessons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredLessons.map((lesson) => {
          const subject = SUBJECTS.find((s) => s.id === lesson.subjectId);
          const lessonPosts = posts.filter((p) => p.lessonId === lesson.id);
          const questionCount = lessonPosts.filter(
            (p) => p.kind === PostKind.QUESTION
          ).length;
          const ideaCount = lessonPosts.filter(
            (p) => p.kind === PostKind.IDEA
          ).length;

          return (
            <article
              key={lesson.id}
              className="heritage-card border rounded-xl sm:rounded-lg overflow-hidden flex flex-col justify-between"
            >
              <div>
                {lesson.diagramUrl && (
                  <div className="h-44 border-b border-[#E2D9C6] dark:border-[#3D362D] bg-[#F5F0E6] dark:bg-[#221E1A] overflow-hidden">
                    <ResilientImage
                      src={lesson.diagramUrl}
                      alt={lesson.diagramCaption || lesson.title}
                      fallbackTitle={lesson.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 text-xs text-[#6B6155] dark:text-[#B8AFA0] mb-2">
                    <span className="font-medium text-[#1C1917] dark:text-[#F7F3EA]">
                      {subject?.name}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{lesson.unitNumber}</span>
                    <span aria-hidden="true">·</span>
                    <span>Led by {lesson.teacherName}</span>
                  </div>

                  <h2 className="font-display text-2xl font-semibold text-[#1C1917] dark:text-[#F7F3EA] text-balance">
                    {lesson.title}
                  </h2>
                  <p className="mt-2 text-sm text-[#574F45] dark:text-[#CEC5B6] leading-relaxed">
                    {lesson.summary}
                  </p>

                  <div className="mt-4 flex items-center gap-3 text-xs text-[#6B6155] dark:text-[#B8AFA0]">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen
                        className="w-3.5 h-3.5 text-[#8C6D3B] dark:text-[#D4B475]"
                        aria-hidden="true"
                      />
                      <span className="font-mono tabular-nums text-[#1C1917] dark:text-[#F7F3EA] font-medium">
                        {questionCount}
                      </span>{' '}
                      {questionCount === 1 ? 'question' : 'questions'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      <span className="font-mono tabular-nums text-[#1C1917] dark:text-[#F7F3EA] font-medium">
                        {ideaCount}
                      </span>{' '}
                      {ideaCount === 1 ? 'study idea' : 'study ideas'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-4 sm:px-6 py-4 border-t border-[#ECE5D5] dark:border-[#342E26] flex flex-wrap items-center justify-between gap-3 bg-[#F7F3EA] dark:bg-[#1A1714]">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onStartPostForLesson(lesson, PostKind.QUESTION)}
                    className="text-xs font-medium text-[var(--theme-accent-text)] hover:opacity-80 whitespace-nowrap"
                  >
                    Ask Question
                  </button>
                  <span className="text-[#C9BC9F] dark:text-[#52483C]" aria-hidden="true">
                    /
                  </span>
                  <button
                    type="button"
                    onClick={() => onStartPostForLesson(lesson, PostKind.IDEA)}
                    className="text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] hover:text-[#1C1917] dark:hover:text-[#F7F3EA] whitespace-nowrap"
                  >
                    Share Idea
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onViewLessonFeed(lesson)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1C1917] dark:text-[#F7F3EA] hover:text-[var(--theme-accent-text)] transition-colors whitespace-nowrap"
                >
                  <span>View Discussion</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
