import { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Plus, LogIn, LogOut, UserPlus, Crown, ChevronDown, ChevronUp, Check, X, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createGroup,
  joinGroup,
  requestToJoin,
  acceptJoinRequest,
  rejectJoinRequest,
  leaveGroup,
  acceptInvite,
  getGroupsByEvent,
  registerGroup,
} from '../services/groupService';
import { registerForEvent } from '../services/eventService';
import { getFriends } from '../services/friendService';
import { Link } from 'react-router-dom';

// ─── Small sub-components ──────────────────────────────────────────────────────

const MemberChip = ({ member, isLeader }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.375rem 0.625rem',
    background: 'var(--bg-secondary)', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
  }}>
    <div style={{
      width: '22px', height: '22px', borderRadius: '50%',
      background: isLeader ? 'var(--accent)' : 'var(--bg-hover)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.6rem', color: isLeader ? '#fff' : 'var(--text-tertiary)', fontWeight: '700',
    }}>
      {isLeader ? <Crown size={10} /> : (member.name?.[0] || '?').toUpperCase()}
    </div>
    <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
      <Link to={`/profile/${member._id || member}`} style={{ textDecoration: 'none', color: 'inherit' }} className="hover:underline">
        {member.name || member.email}
      </Link>
    </span>
    {isLeader && (
      <span style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: '600', marginLeft: '2px' }}>Leader</span>
    )}
  </div>
);

const GroupCard = ({ group, currentUserId, onAction, eventStatus, event, userIsInAnyGroup, onRegisterSuccess, allFriends }) => {
  const [expanded, setExpanded] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviting, setInviting] = useState(false);
  const [acting, setActing] = useState(false);

  const isLeader = group.leaderId?._id === currentUserId || group.leaderId === currentUserId;
  const isMember = group.members?.some(
    (m) => (m._id || m) === currentUserId || (m._id || m).toString() === currentUserId
  );
  const leaderId = group.leaderId?._id || group.leaderId;
  const isInvited = group.invitedUsers?.some(
    (u) => (u._id || u) === currentUserId || (u._id || u).toString() === currentUserId
  );

  const hasRequested = group.joinRequests?.some(
    (r) => (r.userId?._id || r.userId) === currentUserId && r.status === 'PENDING'
  );

  const pendingRequests = group.joinRequests?.filter(r => r.status === 'PENDING') || [];

  const handleJoin = async () => {
    setActing(true);
    try {
      await joinGroup(group._id);
      toast.success('Joined group!');
      onAction();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join group');
    } finally { setActing(false); }
  };

  const handleRequestJoin = async () => {
    setActing(true);
    try {
      await requestToJoin(group._id);
      toast.success('Join request sent!');
      onAction();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    } finally { setActing(false); }
  };

  const handleAcceptRequest = async (userId) => {
    setActing(true);
    try {
      await acceptJoinRequest(group._id, userId);
      toast.success('Request accepted');
      onAction();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept request');
    } finally { setActing(false); }
  };

  const handleRejectRequest = async (userId) => {
    setActing(true);
    try {
      await rejectJoinRequest(group._id, userId);
      toast.success('Request rejected');
      onAction();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject request');
    } finally { setActing(false); }
  };

  const handleLeave = async () => {
    setActing(true);
    try {
      const res = await leaveGroup(group._id);
      toast.success(res.data?.data?.message || 'Left the group');
      onAction();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave group');
    } finally { setActing(false); }
  };

  const handleAcceptInvite = async () => {
    setActing(true);
    try {
      await acceptInvite(group._id);
      toast.success('Invite accepted!');
      onAction();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept invite');
    } finally { setActing(false); }
  };

  const handleInvite = async () => {
    if (!inviteUserId.trim()) { toast.error('Enter a User ID to invite'); return; }
    setInviting(true);
    try {
      await inviteUser(group._id, inviteUserId.trim());
      toast.success('Invite sent!');
      setInviteUserId('');
      onAction();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invite');
    } finally { setInviting(false); }
  };

  const handleInviteFriend = async (friendId) => {
    setInviting(true);
    try {
      await inviteUser(group._id, friendId);
      toast.success('Friend added to group directly!');
      onAction();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add friend');
    } finally { setInviting(false); }
  };

  const handleRegisterGroup = async () => {
    const minM = event?.groupConfig?.minMembers;
    const maxM = event?.groupConfig?.maxMembers;

    if (minM && group.members.length < minM) {
      toast.error(`You need at least ${minM} members to register. Currently ${group.members.length}.`);
      return;
    }

    setActing(true);
    try {
      // Instead of groupService.registerGroup, we use eventService's full checkout 
      // so it creates actual Registration docs in DB
      await registerForEvent(event._id);
      toast.success('Group registered for the event! Your team is LOCKED. ✅');
      if (onRegisterSuccess) onRegisterSuccess();
      onAction();
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setActing(false);
    }
  };

  const maxMembers = event?.groupConfig?.maxMembers || '∞';
  
  return (
    <div style={{
      background: 'var(--bg-card)', border: isMember ? '1px solid var(--accent)' : '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}>
      {/* Header row */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.875rem 1rem', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: 'var(--radius)',
            background: isMember ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'var(--bg-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Users size={15} color={isMember ? 'var(--accent)' : 'var(--text-tertiary)'} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              {group.name}
              {isMember && <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', color: 'var(--accent)', fontWeight: '700' }}>YOUR GROUP</span>}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              {group.members?.length || 0} / {maxMembers} members ·
              <span style={{ marginLeft: '4px', color: group.status === 'OPEN' ? 'var(--success)' : group.status === 'FULL' ? 'var(--danger)' : group.status === 'LOCKED' ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                {group.status}
              </span>
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={15} color="var(--text-tertiary)" /> : <ChevronDown size={15} color="var(--text-tertiary)" />}
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid var(--border)' }}>
          {/* Members */}
          <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0.875rem 0 0.5rem' }}>
            Members
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1rem' }}>
            {group.members?.map((m) => {
              const mid = m._id || m;
              return <MemberChip key={mid} member={m} isLeader={mid === leaderId || mid?.toString() === leaderId?.toString()} />;
            })}
          </div>

          {/* Pending Requests Array (Leader only) */}
          {isLeader && pendingRequests.length > 0 && group.status !== 'LOCKED' && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem' }}>
                Join Requests
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {pendingRequests.map((req) => {
                  const reqUser = req.userId;
                  if (!reqUser) return null;
                  return (
                    <div key={reqUser._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px dashed var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--accent)', fontWeight: '700' }}>
                          {(reqUser.name?.[0] || '?').toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '500', lineHeight: 1.2 }}>{reqUser.name}</p>
                          <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', lineHeight: 1.2 }}>{reqUser.email}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button onClick={() => handleAcceptRequest(reqUser._id)} disabled={acting} style={{ padding: '0.25rem', background: 'var(--success)', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#fff' }} title="Accept">
                          <Check size={12} />
                        </button>
                        <button onClick={() => handleRejectRequest(reqUser._id)} disabled={acting} style={{ padding: '0.25rem', background: 'var(--danger)', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#fff' }} title="Reject">
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* If group is locked, disable actions */}
            {group.status === 'LOCKED' ? (
              <div style={{ textAlign: 'center', padding: '0.75rem', background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)', borderRadius: 'var(--radius)', fontSize: '0.8rem', fontWeight: '600' }}>
                <Check size={14} style={{ inlineSize: '14px', verticalAlign: 'text-bottom', marginRight: '4px' }}/>
                Group Registered and Locked
              </div>
            ) : (
              <>
                {/* Accept invite */}
                {isInvited && !isMember && (
                  <button onClick={handleAcceptInvite} disabled={acting} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem' }}>
                    <UserPlus size={13} /> Accept Invite
                  </button>
                )}

                {/* Join / Request to Join (non-member) */}
                {!isMember && !isInvited && eventStatus === 'upcoming' && (
                  userIsInAnyGroup ? (
                    <div style={{
                      fontSize: '0.75rem', color: 'var(--text-tertiary)',
                      textAlign: 'center', padding: '0.5rem 0.25rem',
                      border: '1px dashed var(--border)', borderRadius: 'var(--radius)',
                    }}>
                      Leave your current group first to join this one.
                    </div>
                  ) : group.status === 'FULL' ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--danger)', textAlign: 'center', padding: '0.5rem' }}>
                      This group is full.
                    </div>
                  ) : hasRequested ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--warning)', textAlign: 'center', padding: '0.5rem', background: 'color-mix(in srgb, var(--warning) 10%, transparent)', borderRadius: 'var(--radius)' }}>
                      <Clock size={12} /> Join Request Pending
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {/* Direct Join is allowed ONLY if friend with leader */}
                      {group.status === 'OPEN' && group.isFriendWithLeader && (
                        <button onClick={handleJoin} disabled={acting} className="btn-secondary" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}>
                          <LogIn size={13} /> {acting ? 'Joining...' : 'Join Directly'}
                        </button>
                      )}
                      
                      {/* Also allow Request to Join for everyone */}
                      {group.status === 'OPEN' && (
                         <button onClick={handleRequestJoin} disabled={acting} className="btn-secondary" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}>
                           <UserPlus size={13} /> Request to Join
                         </button>
                      )}
                    </div>
                  )
                )}

                {/* Register group (leader only, group is open/full but not locked) */}
                {isMember && isLeader && eventStatus === 'upcoming' && (
                  <button onClick={handleRegisterGroup} disabled={acting} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem' }}>
                    {acting ? 'Registering...' : 'Register Group for Event'}
                  </button>
                )}

                {/* Invite (leader only) */}
                {isMember && isLeader && group.status === 'OPEN' && (
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem' }}>
                      Suggested Friends
                    </p>
                    {allFriends && allFriends.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {allFriends.map(friend => (
                          <div key={friend._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between', padding: '0.4rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                                {(friend.name?.[0] || '?').toUpperCase()}
                              </div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{friend.name}</span>
                            </div>
                            <button onClick={() => handleInviteFriend(friend._id)} disabled={inviting} className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}>
                              <UserPlus size={12} style={{ display: 'inline', marginRight: '4px' }}/> Add
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>You don't have any friends available to invite.</p>
                    )}
                  </div>
                )}

                {/* Leave Group */}
                {isMember && (
                  <button onClick={handleLeave} disabled={acting} className="btn-ghost" style={{ fontSize: '0.75rem', padding: '0.4rem', color: 'var(--danger)' }}>
                    <LogOut size={12} /> Leave Group
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main GroupPanel ───────────────────────────────────────────────────────────

const GroupPanel = ({ event, currentUserId, onRegisterSuccess }) => {
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const [friendsList, setFriendsList] = useState([]);

  const { eventType, groupConfig } = event;
  const supportsGroups = eventType === 'GROUP' || eventType === 'BOTH';

  const fetchGroups = useCallback(async () => {
    try {
      const res = await getGroupsByEvent(event._id);
      setGroups(res.data.data.groups || []);
    } catch {
      // Silently fail — group list is non-critical
    } finally {
      setLoadingGroups(false);
    }
  }, [event._id]);

  const fetchFriends = useCallback(async () => {
    try {
      const res = await getFriends();
      setFriendsList(res.data.data.friends || []);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    if (supportsGroups) {
      fetchGroups();
      fetchFriends();
    }
  }, [supportsGroups, fetchGroups, fetchFriends]);

  // Determine if the current user is in ANY group for this event
  const userIsInAnyGroup = useMemo(() => groups.some((g) =>
    g.members?.some((m) => (m._id || m)?.toString() === currentUserId?.toString())
  ), [groups, currentUserId]);

  // Determine available friends across all groups
  const availableFriends = useMemo(() => {
    return friendsList.filter(friend => {
      // check if friend is in any group
      const inAnyGroup = groups.some(g => g.members?.some(m => (m._id || m).toString() === friend._id.toString()));
      return !inAnyGroup;
    });
  }, [friendsList, groups]);

  // Sort: user's own group first, then friends' groups, then others alphabetically
  const sortedGroups = useMemo(() => [...groups].sort((a, b) => {
    const aIsOwn = a.members?.some((m) => (m._id || m)?.toString() === currentUserId?.toString());
    const bIsOwn = b.members?.some((m) => (m._id || m)?.toString() === currentUserId?.toString());
    if (aIsOwn && !bIsOwn) return -1;
    if (!aIsOwn && bIsOwn) return 1;

    if (a.isFriendWithLeader && !b.isFriendWithLeader) return -1;
    if (!a.isFriendWithLeader && b.isFriendWithLeader) return 1;

    return a.name.localeCompare(b.name);
  }), [groups, currentUserId]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) { toast.error('Enter a group name'); return; }
    
    // Prevent creating if already in a group
    if (userIsInAnyGroup) {
      toast.error('You are already part of a group for this event.');
      return;
    }

    setCreating(true);
    try {
      await createGroup(event._id, groupName.trim());
      toast.success('Group created!');
      setGroupName('');
      setShowCreateForm(false);
      fetchGroups();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally { setCreating(false); }
  };

  if (!supportsGroups) return null;

  return (
    <div style={{ marginTop: '2rem' }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1rem',
      }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.125rem' }}>
            Groups
          </h3>
          {groupConfig && (
            <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              {groupConfig.minMembers}–{groupConfig.maxMembers} members per group
            </p>
          )}
        </div>
        {event.status === 'upcoming' && (
          <button
            onClick={() => setShowCreateForm(v => !v)}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.875rem' }}
          >
            <Plus size={13} /> Create Group
          </button>
        )}
      </div>

      {/* Create group form */}
      {showCreateForm && (
        <form onSubmit={handleCreateGroup} style={{
          background: 'var(--bg-card)', border: '1px solid var(--accent)',
          borderRadius: 'var(--radius-lg)', padding: '1rem',
          marginBottom: '1rem',
        }}>
          <p style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.625rem' }}>
            New Group
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="e.g. Team Rocket"
              className="input-premium"
              style={{ flex: 1, fontSize: '0.8rem' }}
              autoFocus
            />
            <button type="submit" disabled={creating} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}>
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowCreateForm(false)} className="btn-ghost" style={{ fontSize: '0.8rem', padding: '0.5rem' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Groups list */}
      {loadingGroups ? (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '1.5rem' }}>
          Loading groups...
        </p>
      ) : groups.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '2rem 1rem',
          background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--border)',
        }}>
          <Users size={28} color="var(--text-tertiary)" style={{ marginBottom: '0.625rem' }} />
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>No groups yet</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Be the first to create one!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {sortedGroups.map(group => (
            <GroupCard
              key={group._id}
              group={group}
              currentUserId={currentUserId}
              onAction={fetchGroups}
              eventStatus={event.status}
              event={event}
              userIsInAnyGroup={userIsInAnyGroup}
              onRegisterSuccess={onRegisterSuccess}
              allFriends={availableFriends}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupPanel;
