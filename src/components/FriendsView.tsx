import { useMemo, useState } from 'react';
import {
  Check,
  Clock,
  MessageSquarePlus,
  Search,
  Send,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { SUBJECTS } from '../data/seedData';
import { FriendRequest, SchoolMember } from '../types/school';
import {
  formatRelativeTime,
  getFriendRelation,
  getFriendsForMember,
  getIncomingFriendRequests,
  getMemberUsername,
  getOutgoingFriendRequests,
} from '../utils/storage';
import { ClubBadge } from './ClubBadge';
import { MemberAvatar } from './MemberAvatar';
import { OwnerBadge } from './OwnerBadge';

interface FriendsViewProps {
  members: SchoolMember[];
  activeMember: SchoolMember;
  friendRequests: FriendRequest[];
  isActiveUserDisabled?: boolean;
  onSendFriendRequest: (receiverId: string, note?: string) => void;
  onAcceptFriendRequest: (requestId: string) => void;
  onDeclineFriendRequest: (requestId: string) => void;
  onCancelFriendRequest: (requestId: string) => void;
  onRemoveFriend: (friendMemberId: string) => void;
  onOpenMemberInfo: (memberId: string) => void;
}

type FriendsFilterTab = 'all' | 'friends' | 'requests' | 'discover';

export function FriendsView({
  members,
  activeMember,
  friendRequests,
  isActiveUserDisabled = false,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onDeclineFriendRequest,
  onCancelFriendRequest,
  onRemoveFriend,
  onOpenMemberInfo,
}: FriendsViewProps) {
  const [filterTab, setFilterTab] = useState<FriendsFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [noteDraftMemberId, setNoteDraftMemberId] = useState<string | null>(
    null
  );
  const [noteText, setNoteText] = useState('');
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const memberById = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members]
  );

  const friendIds = useMemo(
    () => getFriendsForMember(friendRequests, activeMember.id),
    [friendRequests, activeMember.id]
  );

  const incomingRequests = useMemo(
    () => getIncomingFriendRequests(friendRequests, activeMember.id),
    [friendRequests, activeMember.id]
  );

  const outgoingRequests = useMemo(
    () => getOutgoingFriendRequests(friendRequests, activeMember.id),
    [friendRequests, activeMember.id]
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchesMemberSearch = (member: SchoolMember, note?: string): boolean => {
    if (!normalizedQuery) return true;
    const subjectName =
      SUBJECTS.find((s) => s.id === member.focusSubject)?.name || '';
    const haystack = [
      member.name,
      getMemberUsername(member.name, member.username),
      member.role,
      member.gradeOrDept,
      member.section || '',
      member.courseOrTrack || '',
      member.club || '',
      subjectName,
      note || '',
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  };

  const filteredIncoming = useMemo(
    () =>
      incomingRequests.filter((req) => {
        const sender = memberById.get(req.senderId);
        return sender ? matchesMemberSearch(sender, req.note) : false;
      }),
    [incomingRequests, memberById, normalizedQuery]
  );

  const filteredOutgoing = useMemo(
    () =>
      outgoingRequests.filter((req) => {
        const receiver = memberById.get(req.receiverId);
        return receiver ? matchesMemberSearch(receiver, req.note) : false;
      }),
    [outgoingRequests, memberById, normalizedQuery]
  );

  const friendMembers = useMemo(
    () =>
      friendIds
        .map((id) => {
          const member = memberById.get(id);
          if (!member) return null;
          const relation = getFriendRelation(
            friendRequests,
            activeMember.id,
            id
          );
          return { member, request: relation.request };
        })
        .filter(
          (item): item is { member: SchoolMember; request: FriendRequest | undefined } =>
            item !== null && matchesMemberSearch(item.member)
        ),
    [friendIds, memberById, friendRequests, activeMember.id, normalizedQuery]
  );

  const discoverMembers = useMemo(
    () =>
      members.filter((m) => {
        if (m.id === activeMember.id) return false;
        const relation = getFriendRelation(friendRequests, activeMember.id, m.id);
        if (relation.status !== 'none') return false;
        return matchesMemberSearch(m);
      }),
    [members, activeMember.id, friendRequests, normalizedQuery]
  );

  const allOtherNonSelfCount = useMemo(
    () =>
      members.filter((m) => {
        if (m.id === activeMember.id) return false;
        return (
          getFriendRelation(friendRequests, activeMember.id, m.id).status ===
          'none'
        );
      }).length,
    [members, activeMember.id, friendRequests]
  );

  const handleSendWithNote = (receiverId: string) => {
    if (isActiveUserDisabled) return;
    onSendFriendRequest(receiverId, noteText.trim() || undefined);
    setNoteDraftMemberId(null);
    setNoteText('');
  };

  const totalPendingRequests = incomingRequests.length + outgoingRequests.length;

  const showIncomingSection =
    filterTab === 'all' || filterTab === 'requests';
  const showFriendsSection = filterTab === 'all' || filterTab === 'friends';
  const showOutgoingSection =
    filterTab === 'all' || filterTab === 'requests';
  const showDiscoverSection =
    filterTab === 'all' || filterTab === 'discover';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="heritage-eyebrow mb-1">Peer Connections</p>
          <h1 className="font-display text-3xl font-semibold text-[#1C1917] dark:text-[#F7F3EA] text-balance">
            Study Friends & Requests
          </h1>
          <p className="mt-1 text-sm text-[#574F45] dark:text-[#CEC5B6] max-w-2xl">
            Send friend requests to classmates, peer tutors, and teachers to build your trusted study circle across subjects and school clubs.
          </p>
        </div>
      </div>

      {/* Summary Ledger Strip */}
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setFilterTab('friends')}
          className={`heritage-card border rounded-lg p-3.5 sm:p-4 text-left transition-colors ${
            filterTab === 'friends'
              ? 'border-[var(--theme-accent-border)] bg-[var(--theme-accent-soft)]'
              : 'hover:bg-[#FAF6EE] dark:hover:bg-[#221E1A]'
          }`}
        >
          <p className="text-xs font-medium text-[#6B6155] dark:text-[#B8AFA0]">
            Study Friends
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#1C1917] dark:text-[#F7F3EA]">
            {friendIds.length}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('requests')}
          className={`heritage-card border rounded-lg p-3.5 sm:p-4 text-left transition-colors ${
            filterTab === 'requests'
              ? 'border-[var(--theme-accent-border)] bg-[var(--theme-accent-soft)]'
              : 'hover:bg-[#FAF6EE] dark:hover:bg-[#221E1A]'
          }`}
        >
          <p className="text-xs font-medium text-[#6B6155] dark:text-[#B8AFA0]">
            Incoming Requests
          </p>
          <p
            className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${
              incomingRequests.length > 0
                ? 'text-[var(--theme-accent-text)]'
                : 'text-[#1C1917] dark:text-[#F7F3EA]'
            }`}
          >
            {incomingRequests.length}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('discover')}
          className={`heritage-card border rounded-lg p-3.5 sm:p-4 text-left transition-colors ${
            filterTab === 'discover'
              ? 'border-[var(--theme-accent-border)] bg-[var(--theme-accent-soft)]'
              : 'hover:bg-[#FAF6EE] dark:hover:bg-[#221E1A]'
          }`}
        >
          <p className="text-xs font-medium text-[#6B6155] dark:text-[#B8AFA0]">
            Sent Pending
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#1C1917] dark:text-[#F7F3EA]">
            {outgoingRequests.length}
          </p>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="heritage-card border rounded-xl sm:rounded-lg p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-[#8C7F6D] dark:text-[#9C9385] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <label htmlFor="friends-search" className="sr-only">
              Search classmates and friends
            </label>
            <input
              id="friends-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, @username, subject, grade, or club..."
              className="w-full pl-10 pr-4 min-h-[42px] sm:min-h-0 sm:py-2 text-sm text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-lg sm:rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)] focus:bg-[#FFFDF8] dark:focus:bg-[#1C1916]"
            />
          </div>

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md hover:bg-[#ECE5D5] dark:hover:bg-[#2C2721] whitespace-nowrap shrink-0"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#EFE8D9] dark:bg-[#24201B] border border-[#E2D9C6] dark:border-[#3D362D] rounded-lg sm:rounded-md overflow-x-auto no-scrollbar">
          {[
            { id: 'all' as FriendsFilterTab, label: 'All Overview' },
            {
              id: 'friends' as FriendsFilterTab,
              label: `Friends (${friendIds.length})`,
            },
            {
              id: 'requests' as FriendsFilterTab,
              label: `Requests (${totalPendingRequests})`,
            },
            {
              id: 'discover' as FriendsFilterTab,
              label: `Find Classmates (${allOtherNonSelfCount})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              className={`px-3 min-h-[38px] sm:min-h-0 sm:py-1.5 text-xs font-medium rounded-md sm:rounded transition-colors whitespace-nowrap shrink-0 ${
                filterTab === tab.id
                  ? 'bg-[#FFFDF8] dark:bg-[#161412] text-[var(--theme-accent-text)] shadow-xs border border-[#E2D9C6] dark:border-[#3D362D]'
                  : 'text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Incoming Friend Requests */}
      {showIncomingSection &&
        (filteredIncoming.length > 0 || filterTab === 'requests') && (
          <section
            aria-labelledby="incoming-requests-heading"
            className="space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h2
                id="incoming-requests-heading"
                className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]"
              >
                Incoming Friend Requests ({filteredIncoming.length})
              </h2>
            </div>

            {filteredIncoming.length === 0 ? (
              <div className="heritage-card border rounded-lg p-6 text-center">
                <p className="text-sm text-[#574F45] dark:text-[#CEC5B6]">
                  No pending incoming friend requests right now.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredIncoming.map((req) => {
                  const sender = memberById.get(req.senderId);
                  if (!sender) return null;
                  const subjectName =
                    SUBJECTS.find((s) => s.id === sender.focusSubject)?.name ||
                    'General';

                  return (
                    <article
                      key={req.id}
                      className="heritage-card border border-[var(--theme-accent-border)] rounded-xl sm:rounded-lg p-4 sm:p-5 flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              type="button"
                              onClick={() => onOpenMemberInfo(sender.id)}
                              className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent-text)]"
                            >
                              <MemberAvatar
                                name={sender.name}
                                src={sender.avatarUrl}
                                size="md"
                              />
                            </button>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onOpenMemberInfo(sender.id)}
                                  className="font-display font-semibold text-lg text-[#1C1917] dark:text-[#F7F3EA] hover:text-[var(--theme-accent-text)] transition-colors text-left truncate"
                                >
                                  {sender.name}
                                </button>
                                {sender.isOwner && <OwnerBadge size="xs" />}
                              </div>
                              <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] truncate">
                                <span className="font-mono text-[var(--theme-accent-text)]">
                                  @{getMemberUsername(sender.name, sender.username)}
                                </span>{' '}
                                <span aria-hidden="true">·</span> {sender.role}{' '}
                                <span aria-hidden="true">·</span>{' '}
                                {sender.gradeOrDept}
                              </p>
                            </div>
                          </div>

                          <span className="text-xs font-mono text-[#6B6155] dark:text-[#B8AFA0] whitespace-nowrap shrink-0">
                            {formatRelativeTime(req.createdAt)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#574F45] dark:text-[#CEC5B6]">
                          <span>{subjectName}</span>
                          {sender.section && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{sender.section}</span>
                            </>
                          )}
                          {sender.club && <ClubBadge club={sender.club} size="xs" />}
                        </div>

                        {req.note && (
                          <p className="text-xs text-[#3B342D] dark:text-[#E2DACB] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#E2D9C6] dark:border-[#3D362D] rounded-md px-3 py-2 italic">
                            “{req.note}”
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-[#ECE5D5] dark:border-[#342E26]">
                        <button
                          type="button"
                          onClick={() => onAcceptFriendRequest(req.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 min-h-[40px] text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] rounded-md transition-colors whitespace-nowrap"
                        >
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Accept Request</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeclineFriendRequest(req.id)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 min-h-[40px] text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] hover:bg-[#FAF3F1] dark:hover:bg-[#2D1414] hover:text-[#7C1D1D] dark:hover:text-[#FCA5A5] rounded-md transition-colors whitespace-nowrap shrink-0"
                        >
                          <X className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Decline</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

      {/* Your Study Friends */}
      {showFriendsSection && (
        <section aria-labelledby="friends-list-heading" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2
              id="friends-list-heading"
              className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]"
            >
              Your Study Friends ({friendMembers.length})
            </h2>
          </div>

          {friendMembers.length === 0 ? (
            <div className="heritage-card border rounded-lg p-8 text-center space-y-2">
              <Users
                className="w-7 h-7 text-[#8C6D3B] dark:text-[#D4B475] mx-auto"
                aria-hidden="true"
              />
              <h3 className="font-display text-lg font-semibold text-[#1C1917] dark:text-[#F7F3EA]">
                {searchQuery
                  ? 'No friends match your search'
                  : 'No connected study friends yet'}
              </h3>
              <p className="text-sm text-[#574F45] dark:text-[#CEC5B6] max-w-md mx-auto">
                {searchQuery
                  ? 'Try clearing your search or switching to Find Classmates.'
                  : 'Accept an incoming request or send a friend request to any classmate below.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {friendMembers.map(({ member, request }) => {
                const subjectName =
                  SUBJECTS.find((s) => s.id === member.focusSubject)?.name ||
                  'General';
                const isConfirmingRemove = confirmRemoveId === member.id;

                return (
                  <article
                    key={member.id}
                    className="heritage-card border rounded-xl sm:rounded-lg p-4 sm:p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => onOpenMemberInfo(member.id)}
                            className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent-text)]"
                          >
                            <MemberAvatar
                              name={member.name}
                              src={member.avatarUrl}
                              size="md"
                            />
                          </button>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onOpenMemberInfo(member.id)}
                                className="font-display font-semibold text-lg text-[#1C1917] dark:text-[#F7F3EA] hover:text-[var(--theme-accent-text)] transition-colors text-left truncate"
                              >
                                {member.name}
                              </button>
                              {member.isOwner && <OwnerBadge size="xs" />}
                            </div>
                            <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] truncate">
                              <span className="font-mono text-[var(--theme-accent-text)]">
                                @{getMemberUsername(member.name, member.username)}
                              </span>{' '}
                              <span aria-hidden="true">·</span> {member.role}{' '}
                              <span aria-hidden="true">·</span>{' '}
                              {member.gradeOrDept}
                            </p>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F4E2E] dark:text-[#86EFAC] whitespace-nowrap shrink-0">
                          <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Friends</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#574F45] dark:text-[#CEC5B6]">
                        <span>{subjectName}</span>
                        {member.section && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{member.section}</span>
                          </>
                        )}
                        {member.club && <ClubBadge club={member.club} size="xs" />}
                      </div>

                      {request?.respondedAt && (
                        <p className="text-[11px] text-[#6B6155] dark:text-[#B8AFA0]">
                          Connected {formatRelativeTime(request.respondedAt)}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#ECE5D5] dark:border-[#342E26]">
                      <button
                        type="button"
                        onClick={() => onOpenMemberInfo(member.id)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 min-h-[38px] text-xs font-medium text-[var(--theme-accent-text)] bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] hover:bg-[var(--theme-accent-soft-hover)] rounded-md transition-colors whitespace-nowrap"
                      >
                        <span>View Profile</span>
                      </button>

                      {isConfirmingRemove ? (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-[#574F45] dark:text-[#CEC5B6]">
                            Unfriend?
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onRemoveFriend(member.id);
                              setConfirmRemoveId(null);
                            }}
                            className="px-2.5 py-1.5 font-semibold text-[#7C1D1D] dark:text-[#FCA5A5] bg-[#FAF3F1] dark:bg-[#2D1414] border border-[#E5C9C5] dark:border-[#7F3232] rounded-md whitespace-nowrap"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmRemoveId(null)}
                            className="px-2 py-1.5 text-[#6B6155] dark:text-[#B8AFA0] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmRemoveId(member.id)}
                          className="inline-flex items-center gap-1.5 px-3 min-h-[38px] text-xs font-medium text-[#6B6155] dark:text-[#B8AFA0] hover:text-[#7C1D1D] dark:hover:text-[#FCA5A5] transition-colors whitespace-nowrap"
                        >
                          <UserMinus className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Unfriend</span>
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Outgoing Sent Friend Requests */}
      {showOutgoingSection && filteredOutgoing.length > 0 && (
        <section aria-labelledby="sent-requests-heading" className="space-y-3">
          <h2
            id="sent-requests-heading"
            className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]"
          >
            Sent Friend Requests ({filteredOutgoing.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOutgoing.map((req) => {
              const receiver = memberById.get(req.receiverId);
              if (!receiver) return null;

              return (
                <article
                  key={req.id}
                  className="heritage-card border rounded-xl sm:rounded-lg p-4 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => onOpenMemberInfo(receiver.id)}
                        className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent-text)]"
                      >
                        <MemberAvatar
                          name={receiver.name}
                          src={receiver.avatarUrl}
                          size="md"
                        />
                      </button>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenMemberInfo(receiver.id)}
                            className="font-display font-semibold text-base text-[#1C1917] dark:text-[#F7F3EA] hover:text-[var(--theme-accent-text)] transition-colors text-left truncate"
                          >
                            {receiver.name}
                          </button>
                          {receiver.isOwner && <OwnerBadge size="xs" />}
                        </div>
                        <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] truncate">
                          <span className="font-mono text-[var(--theme-accent-text)]">
                            @{getMemberUsername(receiver.name, receiver.username)}
                          </span>{' '}
                          <span aria-hidden="true">·</span> {receiver.gradeOrDept}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#7A5615] dark:text-[#FCD34D] whitespace-nowrap shrink-0">
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Pending</span>
                    </span>
                  </div>

                  {req.note && (
                    <p className="text-xs text-[#574F45] dark:text-[#CEC5B6] italic">
                      Your note: “{req.note}”
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#ECE5D5] dark:border-[#342E26]">
                    <span className="text-[11px] text-[#6B6155] dark:text-[#B8AFA0]">
                      Sent {formatRelativeTime(req.createdAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onCancelFriendRequest(req.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#443D34] dark:text-[#E0D8CA] bg-[#FFFDF8] dark:bg-[#1C1916] border border-[#D8CEBA] dark:border-[#52483C] hover:bg-[#FAF3F1] dark:hover:bg-[#2D1414] hover:text-[#7C1D1D] dark:hover:text-[#FCA5A5] rounded-md transition-colors whitespace-nowrap"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Cancel Request</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Discover & Send Friend Requests */}
      {showDiscoverSection && (
        <section
          aria-labelledby="discover-classmates-heading"
          className="space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="discover-classmates-heading"
              className="font-display text-xl font-semibold text-[#1C1917] dark:text-[#F7F3EA]"
            >
              Send Friend Requests ({discoverMembers.length})
            </h2>
            {isActiveUserDisabled && (
              <span className="text-xs text-[#7C1D1D] dark:text-[#FCA5A5]">
                Account disabled — cannot send new friend requests
              </span>
            )}
          </div>

          {discoverMembers.length === 0 ? (
            <div className="heritage-card border rounded-lg p-6 text-center">
              <p className="text-sm text-[#574F45] dark:text-[#CEC5B6]">
                {searchQuery
                  ? 'No other classmates match your search.'
                  : 'You have connected with or sent requests to every member in this school archive.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {discoverMembers.map((member) => {
                const subjectName =
                  SUBJECTS.find((s) => s.id === member.focusSubject)?.name ||
                  'General';
                const isWritingNote = noteDraftMemberId === member.id;

                return (
                  <article
                    key={member.id}
                    className="heritage-card border rounded-xl sm:rounded-lg p-4 sm:p-5 flex flex-col justify-between gap-3.5"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => onOpenMemberInfo(member.id)}
                            className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent-text)]"
                          >
                            <MemberAvatar
                              name={member.name}
                              src={member.avatarUrl}
                              size="md"
                            />
                          </button>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onOpenMemberInfo(member.id)}
                                className="font-display font-semibold text-lg text-[#1C1917] dark:text-[#F7F3EA] hover:text-[var(--theme-accent-text)] transition-colors text-left truncate"
                              >
                                {member.name}
                              </button>
                              {member.isOwner && <OwnerBadge size="xs" />}
                            </div>
                            <p className="text-xs text-[#6B6155] dark:text-[#B8AFA0] truncate">
                              <span className="font-mono text-[var(--theme-accent-text)]">
                                @{getMemberUsername(member.name, member.username)}
                              </span>{' '}
                              <span aria-hidden="true">·</span> {member.role}{' '}
                              <span aria-hidden="true">·</span>{' '}
                              {member.gradeOrDept}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#574F45] dark:text-[#CEC5B6]">
                        <span>{subjectName}</span>
                        {member.section && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{member.section}</span>
                          </>
                        )}
                        {member.club && <ClubBadge club={member.club} size="xs" />}
                      </div>

                      {member.bio && (
                        <p className="text-xs text-[#574F45] dark:text-[#CEC5B6] line-clamp-2">
                          {member.bio}
                        </p>
                      )}
                    </div>

                    {isWritingNote ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendWithNote(member.id);
                        }}
                        className="pt-3 border-t border-[#ECE5D5] dark:border-[#342E26] space-y-2.5"
                      >
                        <label
                          htmlFor={`friend-note-${member.id}`}
                          className="block text-xs font-medium text-[#443D34] dark:text-[#E0D8CA]"
                        >
                          Optional greeting note
                        </label>
                        <input
                          id={`friend-note-${member.id}`}
                          type="text"
                          maxLength={140}
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder={`Say hello to ${member.name}...`}
                          className="w-full px-3 py-2 text-xs text-[#1C1917] dark:text-[#F7F3EA] placeholder:text-[#786E62] dark:placeholder:text-[#9C9385] bg-[#F5F0E6] dark:bg-[#221E1A] border border-[#DDD4C0] dark:border-[#4A4137] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent-text)]"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setNoteDraftMemberId(null);
                              setNoteText('');
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-[#574F45] dark:text-[#CEC5B6] hover:text-[#1C1917] dark:hover:text-[#F7F3EA]"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isActiveUserDisabled}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] disabled:opacity-50 rounded-md transition-colors whitespace-nowrap"
                          >
                            <Send className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Send Request</span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#ECE5D5] dark:border-[#342E26]">
                        <button
                          type="button"
                          disabled={isActiveUserDisabled}
                          onClick={() => onSendFriendRequest(member.id)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 min-h-[38px] text-xs font-semibold text-[#FFFDF8] bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] disabled:opacity-50 rounded-md transition-colors whitespace-nowrap"
                        >
                          <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Send Friend Request</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isActiveUserDisabled}
                            onClick={() => {
                              setNoteDraftMemberId(member.id);
                              setNoteText('');
                            }}
                            title="Send with a greeting note"
                            className="inline-flex items-center gap-1 px-2.5 min-h-[38px] text-xs font-medium text-[#574F45] dark:text-[#CEC5B6] hover:text-[var(--theme-accent-text)] disabled:opacity-50 transition-colors whitespace-nowrap"
                          >
                            <MessageSquarePlus
                              className="w-3.5 h-3.5"
                              aria-hidden="true"
                            />
                            <span>Add Note</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenMemberInfo(member.id)}
                            className="px-2.5 min-h-[38px] text-xs font-medium text-[var(--theme-accent-text)] hover:underline whitespace-nowrap"
                          >
                            Profile
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
