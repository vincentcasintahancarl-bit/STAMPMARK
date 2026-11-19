import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCheck,
  Flag,
  Mail,
  MailOpen,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { SUBJECTS } from '../data/seedData';
import {
  DiscussionPost,
  LessonUnit,
  PostKind,
  ReplyItem,
  SchoolMember,
} from '../types/school';
import { formatRelativeTime, formatStampTime } from '../utils/storage';
import { ClubBadge } from './ClubBadge';
import { MemberAvatar } from './MemberAvatar';
import { OwnerBadge } from './OwnerBadge';

export interface InboxMessage {
  reply: ReplyItem;
  post: DiscussionPost;
  sender?: SchoolMember;
  lesson?: LessonUnit;
  subjectName: string;
  readAt?: number;
}

interface MailViewProps {
  posts: DiscussionPost[];
  members: SchoolMember[];
  lessons: LessonUnit[];
  activeMember: SchoolMember;
  memberReadMap: Record<string, number>;
  reportedKeys?: Set<string>;
  onMarkMessageRead: (replyId: string) => void;
  onMarkAllRead: (replyIds: string[]) => void;
  onOpenThread: (postId: string) => void;
  onAskQuestion: () => void;
  onReportReply?: (
    post: DiscussionPost,
    reply: ReplyItem,
    sourceLocation?: 'mail' | 'thread'
  ) => void;
}

type MailFilter = 'all' | 'unread' | 'checked';

interface StampEffectState {
  id: number;
  label: string;
  sublabel: string;
}

export function MailView({
  posts,
  members,
  lessons,
  activeMember,
  memberReadMap,
  reportedKeys,
  onMarkMessageRead,
  onMarkAllRead,
  onOpenThread,
  onAskQuestion,
  onReportReply,
}: MailViewProps) {
  const [filter, setFilter] = useState<MailFilter>('all');
  const [selectedReplyId, setSelectedReplyId] = useState<string | null>(null);
  const [stampEffect, setStampEffect] = useState<StampEffectState | null>(null);
  const timerRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const allMessages: InboxMessage[] = useMemo(() => {
    const collected: InboxMessage[] = [];
    for (const post of posts) {
      if (post.authorId !== activeMember.id) continue;
      const subjectName =
        SUBJECTS.find((s) => s.id === post.subjectId)?.name ?? 'General';
      const lesson = lessons.find((l) => l.id === post.lessonId);

      for (const reply of post.replies) {
        if (reply.authorId === activeMember.id) continue;
        collected.push({
          reply,
          post,
          sender: members.find((m) => m.id === reply.authorId),
          lesson,
          subjectName,
          readAt: memberReadMap[reply.id],
        });
      }
    }
    return collected.sort((a, b) => b.reply.createdAt - a.reply.createdAt);
  }, [posts, activeMember.id, lessons, members, memberReadMap]);

  const unreadIds = useMemo(
    () => allMessages.filter((m) => !m.readAt).map((m) => m.reply.id),
    [allMessages]
  );

  const filteredMessages = useMemo(() => {
    if (filter === 'unread') return allMessages.filter((m) => !m.readAt);
    if (filter === 'checked') return allMessages.filter((m) => Boolean(m.readAt));
    return allMessages;
  }, [allMessages, filter]);

  const selectedMessage = useMemo(
    () => allMessages.find((m) => m.reply.id === selectedReplyId) || null,
    [allMessages, selectedReplyId]
  );

  useEffect(() => {
    setSelectedReplyId(null);
    setStampEffect(null);
  }, [activeMember.id]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const triggerStampAnimation = (label: string, sublabel: string) => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    setStampEffect({
      id: Date.now(),
      label,
      sublabel,
    });
    timerRef.current = window.setTimeout(() => {
      setStampEffect(null);
      timerRef.current = null;
    }, 1250);
  };

  const handleSelectMessage = (item: InboxMessage) => {
    setSelectedReplyId(item.reply.id);
    onMarkMessageRead(item.reply.id);
    const senderName = item.sender?.name ?? 'Class Member';
    triggerStampAnimation(
      'STAMP CHECKED',
      `From ${senderName} · ${formatStampTime(Date.now())}`
    );
  };

  const handleRefreshStamp = (item: InboxMessage) => {
    onMarkMessageRead(item.reply.id);
    const senderName = item.sender?.name ?? 'Class Member';
    triggerStampAnimation(
      'STAMP CHECKED',
      `From ${senderName} · ${formatStampTime(Date.now())}`
    );
  };

  const handleStampAll = () => {
    const count = unreadIds.length;
    onMarkAllRead(unreadIds);
    triggerStampAnimation(
      'STAMP CHECKED',
      `${count} ${count === 1 ? 'message' : 'messages'} stamped · ${formatStampTime(Date.now())}`
    );
  };

  return (
    <div className="space-y-6 relative">
      {/* Screen-wide Stamp Impact Overlay */}
      <AnimatePresence>
        {stampEffect && (
          <motion.div
            key={stampEffect.id}
            aria-live="polite"
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            {/* Subtle full-screen theme ink flash */}
            <motion.div
              className="absolute inset-0"
              style={{ backgroundColor: 'rgba(var(--theme-accent-rgb), 0.06)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.25] }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.15 : 0.45 }}
            />

            {/* Expanding ink shockwave ring */}
            {!prefersReducedMotion && (
              <motion.div
                className="absolute w-72 h-32 rounded-md border-2 -rotate-6"
                style={{ borderColor: 'rgba(var(--theme-accent-rgb), 0.4)' }}
                initial={{ opacity: 0.9, scale: 0.85 }}
                animate={{ opacity: 0, scale: 1.55 }}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              />
            )}

            {/* Collegiate Stamp Seal */}
            <motion.div
              className="relative max-w-[90vw] bg-[#FFFDF8]/95 dark:bg-[#161412]/95 border-[3px] border-[var(--theme-accent-text)] rounded-md px-5 sm:px-8 py-4 sm:py-5 shadow-xl text-center -rotate-6 ring-1 ring-[rgba(140,109,59,0.25)] dark:ring-[rgba(212,180,117,0.35)]"
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 2.15, rotate: -14 }
              }
              animate={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : {
                      opacity: 1,
                      scale: [2.15, 0.93, 1],
                      rotate: [-14, -4, -6],
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
                      duration: 0.36,
                      times: [0, 0.65, 1],
                      ease: [0.16, 1, 0.3, 1],
                    }
              }
            >
              <div className="border border-[var(--theme-accent-border)] rounded px-4 py-2">
                <div className="flex items-center justify-center gap-2 text-[var(--theme-accent-text)]">
                  <CheckCheck className="w-6 h-6 shrink-0" aria-hidden="true" />
                  <span className="font-display text-2xl sm:text-3xl font-bold tracking-wider">
                    {stampEffect.label}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[11px] text-[#574F45] dark:text-[#CEC5B6]">
                  {stampEffect.sublabel}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="heritage-eyebrow mb-1">Academic Correspondence</p>
          <h1 className="font-display text-3xl font-semibold text-[#1C1917] dark:text-[#F7F3EA] text-balance">
            Question Mail & Replies Inbox
          </h1>
          <p className="mt-1 text-sm text-[#574F45] dark:text-[#CEC5B6]">
            Messages from classmates and teachers responding to {activeMember.name}’s posts. Opening any message stamps a verified read check.
          </p>
        </div>

        {unreadIds.length > 0 && (
          <button
            type="button"
            onClick={handleStampAll}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#1C1917] dark:text-[#F7F3EA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] hover:bg-[#F5F0E6] dark:hover:bg-[#26211C] rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <CheckCheck
              className="w-4 h-4 text-[var(--theme-accent-text)]"
              aria-hidden="true"
            />
            <span>Stamp all as read</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="heritage-card border rounded-xl sm:rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-[#F5F0E6] dark:bg-[#221E1A] rounded-lg sm:rounded-md overflow-x-auto no-scrollbar max-w-full">
          {[
            { id: 'all' as const, label: 'All Mail' },
            { id: 'unread' as const, label: 'Unread' },
            { id: 'checked' as const, label: 'Stamp Checked' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 min-h-[38px] sm:min-h-0 sm:py-1.5 text-xs font-medium rounded-md sm:rounded transition-colors whitespace-nowrap shrink-0 ${
                filter === tab.id
                  ? 'bg-[#FFFDF8] dark:bg-[#161412] text-[var(--theme-accent-text)] shadow-xs border border-[#E2D9C6] dark:border-[#3D362D]'
                  : 'text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-[#6B6155] dark:text-[#B8AFA0] font-mono tabular-nums">
          <span>{unreadIds.length} unread</span>
          <span aria-hidden="true">·</span>
          <span>{allMessages.length} total</span>
        </div>
      </div>

      {allMessages.length === 0 ? (
        <div className="heritage-card border rounded-lg p-10 text-center">
          <Mail
            className="w-7 h-7 text-[#8C6D3B] dark:text-[#D4B475] mx-auto mb-3"
            aria-hidden="true"
          />
          <h2 className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
            No incoming messages yet
          </h2>
          <p className="mt-1 text-sm text-[#574F45] dark:text-[#CEC5B6] max-w-md mx-auto">
            When classmates or teachers reply to your lesson questions or study ideas, every response will arrive here with a read stamp check.
          </p>
          <button
            type="button"
            onClick={onAskQuestion}
            className="mt-5 px-4 py-2 text-sm font-medium text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md transition-colors"
          >
            Ask a Lesson Question
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Message List (hidden on mobile when a message is opened) */}
          <div
            className={`${
              selectedMessage ? 'hidden lg:block' : 'block'
            } lg:col-span-5 heritage-card border rounded-xl sm:rounded-lg divide-y divide-[#ECE5D5] dark:divide-[#342E26] overflow-hidden`}
          >
            {filteredMessages.length === 0 ? (
              <div className="p-6 text-center text-sm text-[#6B6155] dark:text-[#B8AFA0]">
                No messages match this filter.
              </div>
            ) : (
              filteredMessages.map((item) => {
                const isSelected = selectedReplyId === item.reply.id;
                const isRead = Boolean(item.readAt);

                return (
                  <button
                    key={item.reply.id}
                    type="button"
                    onClick={() => handleSelectMessage(item)}
                    className={`w-full text-left p-4 min-h-[64px] transition-colors block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--theme-accent-text)] ${
                      isSelected
                        ? 'bg-[var(--theme-accent-soft)]'
                        : 'hover:bg-[#FAF6EE] dark:hover:bg-[#221E1A]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <MemberAvatar
                        name={item.sender?.name ?? 'Class Member'}
                        src={item.sender?.avatarUrl}
                        size="sm"
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 text-xs mb-1">
                          <span className="inline-flex items-center gap-1.5 min-w-0">
                            <span
                              className={`font-medium truncate ${
                                isRead
                                  ? 'text-[#443D34] dark:text-[#E0D8CA]'
                                  : 'text-[#1C1917] dark:text-[#F7F3EA] font-semibold'
                              }`}
                            >
                              {item.sender?.name ?? 'Class Member'}
                            </span>
                            {item.sender?.isOwner && <OwnerBadge size="xs" />}
                          </span>
                          <span className="text-[#6B6155] dark:text-[#B8AFA0] whitespace-nowrap shrink-0">
                            {formatRelativeTime(item.reply.createdAt)}
                          </span>
                        </div>

                        <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] truncate">
                          Re: {item.post.title}
                        </p>

                        <p className="mt-1.5 text-sm text-[#443D34] dark:text-[#E0D8CA] line-clamp-2 leading-snug">
                          {item.reply.body}
                        </p>

                        <div className="mt-2.5 flex items-center justify-between gap-2 text-xs">
                          <span className="text-[#6B6155] dark:text-[#B8AFA0] truncate">
                            {item.subjectName}
                          </span>

                          {isRead && item.readAt ? (
                            <span className="inline-flex items-center gap-1 font-medium text-[#443D34] dark:text-[#E0D8CA] whitespace-nowrap shrink-0">
                              <CheckCheck
                                className="w-3.5 h-3.5 text-[var(--theme-accent-text)]"
                                aria-hidden="true"
                              />
                              <span>Stamp Checked</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-[var(--theme-accent-text)] whitespace-nowrap shrink-0">
                              <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Unread</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Message Reader Pane */}
          <div
            className={`${
              selectedMessage ? 'block' : 'hidden lg:block'
            } lg:col-span-7 heritage-card border rounded-xl sm:rounded-lg p-4 sm:p-6`}
          >
            {!selectedMessage ? (
              <div className="py-12 text-center">
                <MailOpen
                  className="w-7 h-7 text-[#8C6D3B] dark:text-[#D4B475] mx-auto mb-3"
                  aria-hidden="true"
                />
                <h2 className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                  Select a message to read
                </h2>
                <p className="mt-1 text-sm text-[#6B6155] dark:text-[#B8AFA0] max-w-sm mx-auto">
                  Every time you open a reply from your question, the screen stamps a dated Stamp Check automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <button
                  type="button"
                  onClick={() => setSelectedReplyId(null)}
                  className="lg:hidden inline-flex items-center gap-1.5 min-h-[40px] text-xs font-medium text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  <span>Back to Inbox</span>
                </button>

                {/* Stamp Check Confirmation Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E2D9C6] dark:border-[#3D362D]">
                  <motion.div
                    key={selectedMessage.readAt || 'unread'}
                    initial={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 1.25 }
                    }
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-flex items-center gap-2 text-xs font-medium text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] px-3 py-1.5 rounded-md"
                  >
                    <CheckCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>
                      Stamp Checked · Read{' '}
                      {selectedMessage.readAt
                        ? formatStampTime(selectedMessage.readAt)
                        : 'just now'}
                    </span>
                  </motion.div>

                  <button
                    type="button"
                    onClick={() => onOpenThread(selectedMessage.post.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1C1917] dark:text-[#F7F3EA] hover:text-[var(--theme-accent-text)] transition-colors whitespace-nowrap"
                  >
                    <span>Open Question Thread</span>
                    <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>

                {/* Question Reference */}
                <div className="bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D] rounded-md p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6155] dark:text-[#B8AFA0] mb-1">
                    <span className="font-medium text-[#1C1917] dark:text-[#F7F3EA]">
                      {selectedMessage.subjectName}
                    </span>
                    {selectedMessage.post.gradeLevel && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{selectedMessage.post.gradeLevel}</span>
                      </>
                    )}
                    {selectedMessage.lesson && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>
                          {selectedMessage.lesson.unitNumber}:{' '}
                          {selectedMessage.lesson.title}
                        </span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>
                      {selectedMessage.post.kind === PostKind.QUESTION
                        ? 'Your Question'
                        : 'Your Study Idea'}
                    </span>
                  </div>
                  <h2 className="font-display text-lg font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                    {selectedMessage.post.title}
                  </h2>
                </div>

                {/* Sender Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B6155] dark:text-[#B8AFA0]">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <MemberAvatar
                      name={selectedMessage.sender?.name ?? 'Class Member'}
                      src={selectedMessage.sender?.avatarUrl}
                      size="sm"
                    />
                    <span className="text-sm font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                      {selectedMessage.sender?.name ?? 'Class Member'}
                    </span>
                    {selectedMessage.sender?.isOwner && (
                      <OwnerBadge size="xs" />
                    )}
                    <span aria-hidden="true">·</span>
                    <span>{selectedMessage.sender?.role ?? 'Student'}</span>
                    {selectedMessage.sender?.gradeOrDept && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{selectedMessage.sender.gradeOrDept}</span>
                      </>
                    )}
                    {selectedMessage.sender?.club && (
                      <ClubBadge club={selectedMessage.sender.club} size="xs" />
                    )}
                  </div>
                  <span>Sent {formatStampTime(selectedMessage.reply.createdAt)}</span>
                </div>

                {/* Message Body */}
                <p className="text-[15px] text-[#2E2924] dark:text-[#EAE3D5] leading-relaxed whitespace-pre-line">
                  {selectedMessage.reply.body}
                </p>

                {selectedMessage.reply.formulaNote && (
                  <div className="px-4 py-3 bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D] rounded-md font-mono text-xs sm:text-sm text-[#2E2924] dark:text-[#EAE3D5] overflow-x-auto">
                    {selectedMessage.reply.formulaNote}
                  </div>
                )}

                <div className="pt-4 border-t border-[#ECE5D5] dark:border-[#342E26] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleRefreshStamp(selectedMessage)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#574F45] dark:text-[#CEC5B6] hover:text-[var(--theme-accent-text)] transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Refresh Stamp Check</span>
                    </button>

                    {onReportReply && (
                      <button
                        type="button"
                        onClick={() =>
                          onReportReply(
                            selectedMessage.post,
                            selectedMessage.reply,
                            'mail'
                          )
                        }
                        className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
                          reportedKeys?.has(`reply:${selectedMessage.reply.id}`)
                            ? 'text-[#7C1D1D] dark:text-[#FCA5A5]'
                            : 'text-[#6B6155] dark:text-[#B8AFA0] hover:text-[#7C1D1D] dark:hover:text-[#FCA5A5]'
                        }`}
                      >
                        <Flag className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>
                          {reportedKeys?.has(`reply:${selectedMessage.reply.id}`)
                            ? 'Reported to Teacher'
                            : 'Report Message'}
                        </span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenThread(selectedMessage.post.id)}
                    className="px-4 py-2 text-xs font-medium text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md transition-colors"
                  >
                    Reply in Thread
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
