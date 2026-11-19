import { useState } from 'react';
import {
  ArrowLeft,
  ArrowUp,
  Ban,
  Bookmark,
  CheckCircle2,
  Flag,
  HelpCircle,
  Lightbulb,
  Send,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { SUBJECTS } from '../data/seedData';
import {
  DiscussionPost,
  LessonUnit,
  PostKind,
  ReplyItem,
  SchoolMember,
  UserRole,
} from '../types/school';
import { formatRelativeTime } from '../utils/storage';
import { ClubBadge } from './ClubBadge';
import { MemberAvatar } from './MemberAvatar';
import { OwnerBadge } from './OwnerBadge';
import { ResilientImage } from './ResilientImage';

interface ThreadDetailProps {
  post: DiscussionPost;
  members: SchoolMember[];
  lessons: LessonUnit[];
  activeMember: SchoolMember;
  isTeacherMonitor?: boolean;
  isBookmarked: boolean;
  reportedKeys?: Set<string>;
  onBack: () => void;
  onToggleUpvotePost: (postId: string) => void;
  onToggleBookmark: (postId: string) => void;
  onAddReply: (postId: string, body: string, formulaNote?: string) => void;
  onToggleUpvoteReply: (postId: string, replyId: string) => void;
  onToggleAcceptReply: (postId: string, replyId: string) => void;
  onDeletePost: (postId: string) => void;
  onDeleteReply: (postId: string, replyId: string) => void;
  onOpenAuthorInfo?: (memberId: string) => void;
  onReportPost?: (post: DiscussionPost) => void;
  onReportReply?: (post: DiscussionPost, reply: ReplyItem) => void;
  onOpenMonitor?: () => void;
}

export function ThreadDetail({
  post,
  members,
  lessons,
  activeMember,
  isTeacherMonitor = false,
  isBookmarked,
  reportedKeys,
  onBack,
  onToggleUpvotePost,
  onToggleBookmark,
  onAddReply,
  onToggleUpvoteReply,
  onToggleAcceptReply,
  onDeletePost,
  onDeleteReply,
  onOpenAuthorInfo,
  onReportPost,
  onReportReply,
  onOpenMonitor,
}: ThreadDetailProps) {
  const [replyBody, setReplyBody] = useState('');
  const [replyFormula, setReplyFormula] = useState('');
  const [showFormulaInput, setShowFormulaInput] = useState(false);
  const [confirmDeletePost, setConfirmDeletePost] = useState(false);

  const isDisabledUser = Boolean(activeMember.isDisabled);
  const isPostReportedByMe = reportedKeys?.has(`post:${post.id}`) ?? false;

  const subject = SUBJECTS.find((s) => s.id === post.subjectId);
  const lesson = lessons.find((l) => l.id === post.lessonId);
  const author = members.find((m) => m.id === post.authorId);

  const hasUpvotedPost = post.upvoterIds.includes(activeMember.id);
  const hasAcceptedReply = post.replies.some((r) => r.isAccepted);

  const canMarkAccepted =
    activeMember.id === post.authorId ||
    activeMember.role === UserRole.TEACHER ||
    activeMember.role === UserRole.STUDY_LEAD;

  const canDeletePost =
    activeMember.id === post.authorId || isTeacherMonitor;

  const sortedReplies = [...post.replies].sort((a, b) => {
    if (a.isAccepted !== b.isAccepted) return a.isAccepted ? -1 : 1;
    return a.createdAt - b.createdAt;
  });

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = replyBody.trim();
    if (!trimmed) return;
    onAddReply(post.id, trimmed, replyFormula.trim() || undefined);
    setReplyBody('');
    setReplyFormula('');
    setShowFormulaInput(false);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Back Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to Feed</span>
        </button>

        {canDeletePost && (
          <div>
            {!confirmDeletePost ? (
              <button
                type="button"
                onClick={() => setConfirmDeletePost(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B6155] dark:text-[#B8AFA0] hover:text-[var(--theme-accent-text)] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Delete post</span>
              </button>
            ) : (
              <div className="flex items-center gap-3 text-xs">
                <span className="text-[#574F45] dark:text-[#CEC5B6]">
                  Remove this post?
                </span>
                <button
                  type="button"
                  onClick={() => onDeletePost(post.id)}
                  className="font-semibold text-[var(--theme-accent-text)] hover:opacity-80"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeletePost(false)}
                  className="text-[#6B6155] dark:text-[#B8AFA0] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Primary Question or Study Idea Card */}
      <article className="heritage-card border rounded-xl sm:rounded-lg p-4 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#6B6155] dark:text-[#B8AFA0] mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-[#1C1917] dark:text-[#F7F3EA]">
              {subject?.name ?? 'Subject'}
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

          <div className="font-medium whitespace-nowrap shrink-0">
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

        <h1 className="font-display text-2xl sm:text-[32px] font-semibold text-[#1C1917] dark:text-[#F7F3EA] leading-snug text-balance">
          {post.title}
        </h1>

        <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs text-[#6B6155] dark:text-[#B8AFA0]">
          <MemberAvatar
            name={author?.name ?? 'Class Member'}
            src={author?.avatarUrl}
            size="sm"
          />
          <span>Posted by</span>
          {author && onOpenAuthorInfo ? (
            <button
              type="button"
              onClick={() => onOpenAuthorInfo(author.id)}
              className="font-medium text-[#1C1917] dark:text-[#F7F3EA] hover:text-[var(--theme-accent-text)] transition-colors"
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
          {author?.section && (
            <>
              <span aria-hidden="true">·</span>
              <span>{author.section}</span>
            </>
          )}
          {author?.club && <ClubBadge club={author.club} size="xs" />}
        </div>

        <p className="mt-5 text-[15px] text-[#3B342D] dark:text-[#E2DACB] leading-relaxed whitespace-pre-line max-w-3xl">
          {post.body}
        </p>

        {post.formulaNote && (
          <div className="mt-5 px-4 py-3 bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D] rounded-md font-mono text-xs sm:text-sm text-[#2E2924] dark:text-[#EAE3D5] overflow-x-auto">
            {post.formulaNote}
          </div>
        )}

        {post.imageUrl && (
          <figure className="mt-6 overflow-hidden rounded-md border border-[#E2D9C6] dark:border-[#3D362D] bg-[#F5F0E6] dark:bg-[#221E1A]">
            <ResilientImage
              src={post.imageUrl}
              alt={post.imageAlt || post.title}
              fallbackTitle={lesson?.title || post.title}
              className="w-full max-h-[420px] object-contain bg-[#FFFDF8] dark:bg-[#1C1916]"
            />
            {lesson?.diagramCaption && (
              <figcaption className="px-4 py-2.5 text-xs font-display italic text-[#574F45] dark:text-[#CEC5B6] border-t border-[#E2D9C6] dark:border-[#3D362D] bg-[#F5F0E6] dark:bg-[#221E1A]">
                {lesson.diagramCaption}
              </figcaption>
            )}
          </figure>
        )}

        <div className="mt-6 pt-5 border-t border-[#ECE5D5] dark:border-[#342E26] flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              disabled={isDisabledUser}
              onClick={() => onToggleUpvotePost(post.id)}
              aria-pressed={hasUpvotedPost}
              className={`inline-flex items-center justify-center gap-2 px-4 min-h-[42px] sm:min-h-0 sm:py-2 text-xs font-medium rounded-lg sm:rounded-md border transition-colors disabled:opacity-45 disabled:pointer-events-none ${
                hasUpvotedPost
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
              onClick={() => onToggleBookmark(post.id)}
              aria-pressed={isBookmarked}
              className={`inline-flex items-center justify-center gap-2 px-4 min-h-[42px] sm:min-h-0 sm:py-2 text-xs font-medium rounded-lg sm:rounded-md border transition-colors ${
                isBookmarked
                  ? 'bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)] text-[var(--theme-accent-text)]'
                  : 'bg-[#FFFDF8] dark:bg-[#1C1916] border-[#D8CEBA] dark:border-[#52483C] text-[#443D34] dark:text-[#E0D8CA] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C]'
              }`}
            >
              <Bookmark
                className="w-3.5 h-3.5"
                fill={isBookmarked ? 'currentColor' : 'none'}
                aria-hidden="true"
              />
              <span>{isBookmarked ? 'Saved' : 'Save for Review'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onReportPost && (
              <button
                type="button"
                onClick={() => onReportPost(post)}
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 min-h-[42px] sm:min-h-0 sm:py-2 text-xs font-medium rounded-lg sm:rounded-md border transition-colors ${
                  isPostReportedByMe
                    ? 'bg-[#FAF3F1] dark:bg-[#3A1616] border-[#E5C9C5] dark:border-[#8C3737] text-[#7C1D1D] dark:text-[#FCA5A5]'
                    : 'bg-[#FFFDF8] dark:bg-[#1C1916] border-[#D8CEBA] dark:border-[#52483C] text-[#6B6155] dark:text-[#B8AFA0] hover:text-[#7C1D1D] dark:hover:text-[#FCA5A5] hover:bg-[#FAF3F1] dark:hover:bg-[#2A1414]'
                }`}
              >
                <Flag className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isPostReportedByMe ? 'Reported' : 'Report Post'}</span>
              </button>
            )}

            {isTeacherMonitor && onOpenMonitor && (
              <button
                type="button"
                onClick={onOpenMonitor}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 min-h-[42px] sm:min-h-0 sm:py-2 text-xs font-medium rounded-lg sm:rounded-md border border-[#E8D8A8] dark:border-[#6B5723] bg-[#FBF8EC] dark:bg-[#2D2614] text-[#7A5615] dark:text-[#FCD34D] hover:opacity-90 transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Open Teacher Monitor</span>
              </button>
            )}
          </div>
        </div>
      </article>

      {/* Class Replies & Explanations */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
            Class Replies{' '}
            <span className="font-mono text-sm font-normal tabular-nums text-[#6B6155] dark:text-[#B8AFA0]">
              ({post.replies.length})
            </span>
          </h2>
        </div>

        {sortedReplies.length === 0 ? (
          <div className="heritage-card border rounded-lg p-8 text-center">
            <p className="text-sm font-medium text-[#1C1917] dark:text-[#F7F3EA]">
              No replies yet on this lesson topic
            </p>
            <p className="mt-1 text-xs text-[#6B6155] dark:text-[#B8AFA0]">
              Share an explanation, worked example, or study tip below to help your class.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedReplies.map((reply) => {
              const replyAuthor = members.find((m) => m.id === reply.authorId);
              const hasUpvotedReply = reply.upvoterIds.includes(activeMember.id);
              const canDeleteReply =
                activeMember.id === reply.authorId || isTeacherMonitor;

              return (
                <div
                  key={reply.id}
                  className={`rounded-xl sm:rounded-lg p-4 sm:p-5 border ${
                    reply.isAccepted
                      ? 'bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)]'
                      : 'heritage-card'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B6155] dark:text-[#B8AFA0] mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <MemberAvatar
                        name={replyAuthor?.name ?? 'Class Member'}
                        src={replyAuthor?.avatarUrl}
                        size="sm"
                      />
                      {replyAuthor && onOpenAuthorInfo ? (
                        <button
                          type="button"
                          onClick={() => onOpenAuthorInfo(replyAuthor.id)}
                          className="font-medium text-[#1C1917] dark:text-[#F7F3EA] hover:text-[var(--theme-accent-text)] transition-colors"
                        >
                          {replyAuthor.name}
                        </button>
                      ) : (
                        <span className="font-medium text-[#1C1917] dark:text-[#F7F3EA]">
                          {replyAuthor?.name ?? 'Class Member'}
                        </span>
                      )}
                      {replyAuthor?.isOwner && <OwnerBadge size="xs" />}
                      <span aria-hidden="true">·</span>
                      <span>{replyAuthor?.role ?? 'Student'}</span>
                      {replyAuthor?.club && (
                        <ClubBadge club={replyAuthor.club} size="xs" />
                      )}
                      <span aria-hidden="true">·</span>
                      <span>{formatRelativeTime(reply.createdAt)}</span>
                    </div>

                    {reply.isAccepted && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--theme-accent-text)] whitespace-nowrap shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Accepted Solution</span>
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-[#3B342D] dark:text-[#E2DACB] leading-relaxed whitespace-pre-line">
                    {reply.body}
                  </p>

                  {reply.formulaNote && (
                    <div className="mt-3 px-3.5 py-2.5 bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#E2D9C6] dark:border-[#3D362D] rounded-md font-mono text-xs text-[#2E2924] dark:text-[#EAE3D5] overflow-x-auto">
                      {reply.formulaNote}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-[#E2D9C6]/80 dark:border-[#3D362D] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={isDisabledUser}
                        onClick={() => onToggleUpvoteReply(post.id, reply.id)}
                        aria-pressed={hasUpvotedReply}
                        className={`inline-flex items-center gap-1.5 px-3 min-h-[38px] sm:min-h-0 sm:py-1 text-xs font-medium rounded-lg sm:rounded-md border transition-colors disabled:opacity-45 disabled:pointer-events-none ${
                          hasUpvotedReply
                            ? 'bg-[var(--theme-accent-soft)] border-[var(--theme-accent-border)] text-[var(--theme-accent-text)]'
                            : 'bg-[#FFFDF8] dark:bg-[#1C1916] border-[#D8CEBA] dark:border-[#52483C] text-[#443D34] dark:text-[#E0D8CA] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C]'
                        }`}
                      >
                        <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="font-mono tabular-nums">
                          {reply.upvoterIds.length}
                        </span>
                        <span>Helpful</span>
                      </button>

                      {canMarkAccepted && post.kind === PostKind.QUESTION && (
                        <button
                          type="button"
                          onClick={() => onToggleAcceptReply(post.id, reply.id)}
                          className={`inline-flex items-center gap-1.5 px-3 min-h-[38px] sm:min-h-0 sm:py-1 text-xs font-medium rounded-lg sm:rounded-md border transition-colors ${
                            reply.isAccepted
                              ? 'bg-[var(--theme-accent)] border-[var(--theme-accent)] text-[#FFFDF8] hover:bg-[var(--theme-accent-hover)]'
                              : 'bg-[#FFFDF8] dark:bg-[#1C1916] border-[#D8CEBA] dark:border-[#52483C] text-[#443D34] dark:text-[#E0D8CA] hover:border-[var(--theme-accent-text)] hover:text-[var(--theme-accent-text)]'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>
                            {reply.isAccepted
                              ? 'Accepted'
                              : 'Mark as Solution'}
                          </span>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {onReportReply && (
                        <button
                          type="button"
                          onClick={() => onReportReply(post, reply)}
                          className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${
                            reportedKeys?.has(`reply:${reply.id}`)
                              ? 'text-[#7C1D1D] dark:text-[#FCA5A5]'
                              : 'text-[#786E62] dark:text-[#B8AFA0] hover:text-[#7C1D1D] dark:hover:text-[#FCA5A5]'
                          }`}
                        >
                          <Flag className="w-3 h-3" aria-hidden="true" />
                          <span>
                            {reportedKeys?.has(`reply:${reply.id}`)
                              ? 'Reported'
                              : 'Report'}
                          </span>
                        </button>
                      )}

                      {canDeleteReply && (
                        <button
                          type="button"
                          onClick={() => onDeleteReply(post.id, reply.id)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#7C1D1D] dark:text-[#FCA5A5] hover:underline transition-colors"
                        >
                          <Trash2 className="w-3 h-3" aria-hidden="true" />
                          <span>Delete Message</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reply Composer */}
        {isDisabledUser ? (
          <div className="heritage-card border border-[#E5C9C5] dark:border-[#7F3232] bg-[#FAF3F1] dark:bg-[#2A1313] rounded-xl sm:rounded-lg p-5 flex items-start gap-3">
            <Ban
              className="w-5 h-5 text-[#7C1D1D] dark:text-[#FCA5A5] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#7C1D1D] dark:text-[#FCA5A5]">
                Messaging & Replies Disabled
              </p>
              <p className="text-xs text-[#574F45] dark:text-[#CEC5B6]">
                Your account is currently disabled by a monitoring teacher. You cannot post replies until the teacher turns your account back on.
              </p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleReplySubmit}
            className="heritage-card border rounded-xl sm:rounded-lg p-4 sm:p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="reply-body"
                className="font-display text-lg font-semibold text-[#1C1917] dark:text-[#F7F3EA]"
              >
                Add Your Reply as {activeMember.name}
              </label>
              <button
                type="button"
                onClick={() => setShowFormulaInput((v) => !v)}
                className="text-xs font-medium text-[var(--theme-accent-text)] hover:opacity-80"
              >
                {showFormulaInput ? 'Hide formula field' : '+ Add formula or note'}
              </button>
            </div>

            <textarea
              id="reply-body"
              required
              rows={3}
              maxLength={2000}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Explain a step, share a helpful analogy, or answer the lesson question..."
              className="w-full px-3.5 py-2.5 text-sm text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
            />

            {showFormulaInput && (
              <div>
                <label
                  htmlFor="reply-formula"
                  className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] mb-1"
                >
                  Formula, Equation, or Code Snippet (optional)
                </label>
                <input
                  id="reply-formula"
                  type="text"
                  maxLength={240}
                  value={replyFormula}
                  onChange={(e) => setReplyFormula(e.target.value)}
                  placeholder="e.g. dy/dx = (dy/du) * (du/dx)"
                  className="w-full px-3.5 py-2 font-mono text-xs text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
                />
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto min-h-[42px] sm:min-h-0 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-lg sm:rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>Post Reply</span>
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
