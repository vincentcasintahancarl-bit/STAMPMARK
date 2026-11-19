import { useState } from 'react';
import {
  ArrowUp,
  Ban,
  Bookmark,
  CheckCircle2,
  Flag,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { SUBJECTS } from '../data/seedData';
import {
  DiscussionPost,
  LessonUnit,
  PostKind,
  SchoolMember,
} from '../types/school';
import { formatRelativeTime } from '../utils/storage';
import { ClubBadge } from './ClubBadge';
import { MemberAvatar } from './MemberAvatar';
import { OwnerBadge } from './OwnerBadge';
import { ResilientImage } from './ResilientImage';

interface PostCardProps {
  post: DiscussionPost;
  author?: SchoolMember;
  lesson?: LessonUnit;
  activeMemberId: string;
  isBookmarked: boolean;
  isReportedByMe?: boolean;
  pendingReportCount?: number;
  isTeacherMonitor?: boolean;
  isActiveUserDisabled?: boolean;
  onOpenThread: (postId: string) => void;
  onToggleUpvote: (postId: string) => void;
  onToggleBookmark: (postId: string) => void;
  onOpenAuthorInfo?: (memberId: string) => void;
  onReportPost?: (post: DiscussionPost) => void;
  onDeletePost?: (postId: string) => void;
}

export function PostCard({
  post,
  author,
  lesson,
  activeMemberId,
  isBookmarked,
  isReportedByMe = false,
  pendingReportCount = 0,
  isTeacherMonitor = false,
  isActiveUserDisabled = false,
  onOpenThread,
  onToggleUpvote,
  onToggleBookmark,
  onOpenAuthorInfo,
  onReportPost,
  onDeletePost,
}: PostCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const subjectName =
    SUBJECTS.find((s) => s.id === post.subjectId)?.name ?? 'General';
  const hasUpvoted = post.upvoterIds.includes(activeMemberId);
  const hasAcceptedReply = post.replies.some((r) => r.isAccepted);

  return (
    <article className="heritage-card border rounded-xl sm:rounded-lg p-4 sm:p-6 transition-colors duration-150 hover:border-[#C9BC9F] dark:hover:border-[#52483C]">
      {/* Unboxed Zero-Pill Metadata Kicker */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs text-[#6B6155] dark:text-[#B8AFA0] mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-[#1C1917] dark:text-[#F7F3EA]">
            {subjectName}
          </span>
          {post.gradeLevel && (
            <>
              <span aria-hidden="true">·</span>
              <span>{post.gradeLevel}</span>
            </>
          )}
          {lesson && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                {lesson.unitNumber}: {lesson.title}
              </span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>{formatRelativeTime(post.createdAt)}</span>
        </div>

        {/* Semantic State with Explicit Icon + Text */}
        <div className="flex items-center gap-3 font-medium whitespace-nowrap shrink-0">
          {isTeacherMonitor && pendingReportCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#7C1D1D] dark:text-[#FCA5A5]">
              <Flag className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {pendingReportCount}{' '}
                {pendingReportCount === 1 ? 'Report' : 'Reports'}
              </span>
            </span>
          )}

          {post.kind === PostKind.IDEA ? (
            <span className="inline-flex items-center gap-1.5 text-[var(--theme-accent-text)]">
              <Lightbulb className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Study Idea</span>
            </span>
          ) : hasAcceptedReply ? (
            <span className="inline-flex items-center gap-1.5 text-[#1C1917] dark:text-[#F7F3EA]">
              <CheckCircle2
                className="w-3.5 h-3.5 text-[var(--theme-accent-text)]"
                aria-hidden="true"
              />
              <span>Resolved</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[var(--theme-accent-bright)]">
              <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Needs Answer</span>
            </span>
          )}
        </div>
      </div>

      {/* Headline & Body */}
      <button
        type="button"
        onClick={() => onOpenThread(post.id)}
        className="block w-full text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent-text)] rounded"
      >
        <h3 className="font-display text-[23px] font-semibold text-[#1C1917] dark:text-[#F7F3EA] group-hover:text-[var(--theme-accent-text)] transition-colors duration-150 leading-snug text-balance">
          {post.title}
        </h3>
        <p className="mt-2 text-sm text-[#574F45] dark:text-[#CEC5B6] leading-relaxed line-clamp-3">
          {post.body}
        </p>
      </button>

      {/* Optional Formula / Concept Note */}
      {post.formulaNote && (
        <div className="mt-4 px-3.5 py-2.5 bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D] rounded-md font-mono text-xs text-[#2E2924] dark:text-[#EAE3D5] overflow-x-auto">
          {post.formulaNote}
        </div>
      )}

      {/* Optional Lesson Diagram Thumbnail */}
      {post.imageUrl && (
        <button
          type="button"
          onClick={() => onOpenThread(post.id)}
          className="mt-4 block w-full overflow-hidden rounded-md border border-[#E2D9C6] dark:border-[#3D362D] bg-[#F5F0E6] dark:bg-[#221E1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent-text)]"
        >
          <ResilientImage
            src={post.imageUrl}
            alt={post.imageAlt || post.title}
            fallbackTitle={lesson?.title || post.title}
            className="w-full max-h-64 object-cover"
          />
        </button>
      )}

      {/* Footer Metadata & Actions */}
      <div className="mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-[#ECE5D5] dark:border-[#342E26] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#6B6155] dark:text-[#B8AFA0]">
          <MemberAvatar
            name={author?.name ?? 'Class Member'}
            src={author?.avatarUrl}
            size="xs"
          />
          {author && onOpenAuthorInfo ? (
            <button
              type="button"
              onClick={() => onOpenAuthorInfo(author.id)}
              className="font-medium text-[#1C1917] dark:text-[#F7F3EA] hover:text-[var(--theme-accent-text)] transition-colors py-1"
            >
              {author.name}
            </button>
          ) : (
            <span className="font-medium text-[#1C1917] dark:text-[#F7F3EA]">
              {author?.name ?? 'Class Member'}
            </span>
          )}
          {author?.isOwner && <OwnerBadge size="xs" />}
          <span aria-hidden="true">·</span>
          <span>{author?.role ?? 'Student'}</span>
          {author?.gradeOrDept && (
            <>
              <span aria-hidden="true">·</span>
              <span>{author.gradeOrDept}</span>
            </>
          )}
          {author?.club && <ClubBadge club={author.club} size="xs" />}
          {author?.isDisabled && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-medium text-[#7C1D1D] dark:text-[#FCA5A5]">
                <Ban className="w-3 h-3" aria-hidden="true" />
                <span>Account Disabled</span>
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isActiveUserDisabled}
            onClick={() => onToggleUpvote(post.id)}
            aria-pressed={hasUpvoted}
            className={`inline-flex items-center justify-center gap-1.5 px-3 min-h-[42px] sm:min-h-0 sm:py-1.5 text-xs font-medium rounded-lg sm:rounded-md border transition-colors duration-150 whitespace-nowrap shrink-0 flex-1 sm:flex-initial disabled:opacity-45 disabled:pointer-events-none ${
              hasUpvoted
                ? 'bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)] text-[var(--theme-accent-text)]'
                : 'bg-[#FFFDF8] dark:bg-[#1C1916] border-[#D8CEBA] dark:border-[#52483C] text-[#443D34] dark:text-[#E0D8CA] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C]'
            }`}
          >
            <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="font-mono tabular-nums">
              {post.upvoterIds.length}
            </span>
            <span>Helpful</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenThread(post.id)}
            className="inline-flex items-center justify-center gap-1.5 px-3 min-h-[42px] sm:min-h-0 sm:py-1.5 text-xs font-medium rounded-lg sm:rounded-md border border-[#D8CEBA] dark:border-[#52483C] bg-[#FFFDF8] dark:bg-[#1C1916] text-[#443D34] dark:text-[#E0D8CA] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] transition-colors duration-150 whitespace-nowrap shrink-0 flex-1 sm:flex-initial"
          >
            <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="font-mono tabular-nums">{post.replies.length}</span>
            <span>{post.replies.length === 1 ? 'Reply' : 'Replies'}</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleBookmark(post.id)}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Save for review'}
            aria-pressed={isBookmarked}
            className={`inline-flex items-center justify-center w-[42px] h-[42px] sm:w-8 sm:h-8 rounded-lg sm:rounded-md border transition-colors duration-150 shrink-0 ${
              isBookmarked
                ? 'bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)] text-[var(--theme-accent-text)]'
                : 'bg-[#FFFDF8] dark:bg-[#1C1916] border-[#D8CEBA] dark:border-[#52483C] text-[#6B6155] dark:text-[#B8AFA0] hover:text-[#1C1917] dark:hover:text-[#F7F3EA] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C]'
            }`}
          >
            <Bookmark
              className="w-4 h-4 sm:w-3.5 sm:h-3.5"
              fill={isBookmarked ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
          </button>

          {onReportPost && (
            <button
              type="button"
              onClick={() => onReportPost(post)}
              aria-label={
                isReportedByMe
                  ? 'Already reported to teacher monitor'
                  : 'Report post to monitoring teacher'
              }
              title="Report to monitoring teacher"
              className={`inline-flex items-center justify-center gap-1.5 px-2.5 min-h-[42px] sm:min-h-0 sm:py-1.5 text-xs font-medium rounded-lg sm:rounded-md border transition-colors duration-150 whitespace-nowrap shrink-0 ${
                isReportedByMe
                  ? 'bg-[#FAF3F1] dark:bg-[#3A1616] border-[#E5C9C5] dark:border-[#8C3737] text-[#7C1D1D] dark:text-[#FCA5A5]'
                  : 'bg-[#FFFDF8] dark:bg-[#1C1916] border-[#D8CEBA] dark:border-[#52483C] text-[#6B6155] dark:text-[#B8AFA0] hover:text-[#7C1D1D] dark:hover:text-[#FCA5A5] hover:bg-[#FAF3F1] dark:hover:bg-[#2A1414]'
              }`}
            >
              <Flag className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isReportedByMe ? 'Reported' : 'Report'}</span>
            </button>
          )}

          {isTeacherMonitor &&
            onDeletePost &&
            (confirmDelete ? (
              <div className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md bg-[#FAF3F1] dark:bg-[#3A1616] border border-[#E5C9C5] dark:border-[#8C3737]">
                <button
                  type="button"
                  onClick={() => {
                    onDeletePost(post.id);
                    setConfirmDelete(false);
                  }}
                  className="font-semibold text-[#7C1D1D] dark:text-[#FCA5A5] hover:underline"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-[#574F45] dark:text-[#CEC5B6]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                aria-label="Delete post as monitoring teacher"
                title="Delete post"
                className="inline-flex items-center justify-center w-[42px] h-[42px] sm:w-8 sm:h-8 rounded-lg sm:rounded-md border border-[#E5C9C5] dark:border-[#8C3737] bg-[#FAF3F1] dark:bg-[#2A1414] text-[#7C1D1D] dark:text-[#FCA5A5] hover:opacity-85 transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            ))}
        </div>
      </div>
    </article>
  );
}
