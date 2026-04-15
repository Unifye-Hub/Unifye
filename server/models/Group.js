const mongoose = require('mongoose');

const joinRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
      default: 'PENDING',
    },
  },
  { _id: true }
);

const groupSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
    },
    leaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Leader ID is required'],
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    joinRequests: [joinRequestSchema],
    // ── Status lifecycle ─────────────────────────────────────────────────────
    // OPEN   → accepting members (members < maxMembers)
    // FULL   → maxMembers reached, no direct join allowed
    // LOCKED → group registered for the event; no further changes allowed
    status: {
      type: String,
      enum: ['OPEN', 'FULL', 'LOCKED'],
      default: 'OPEN',
    },
  },
  {
    timestamps: true,
  }
);

// ─── Pre-validate: leader is always in members (synchronous) ─────────────────
groupSchema.pre('validate', function () {
  if (!this.leaderId) return;
  const leaderIdValue = this.leaderId._id || this.leaderId;
  const leaderStr = leaderIdValue.toString();
  
  const memberStrs = this.members.map((m) => {
    return (m && m._id) ? m._id.toString() : m?.toString();
  });
  
  if (!memberStrs.includes(leaderStr)) {
    this.members.unshift(leaderIdValue);
  }

  // Deduplicate array entirely (useful for wiping out past duplicates natively)
  const uniqueStrs = new Set();
  const uniqueMembers = [];
  this.members.forEach(m => {
    const s = (m && m._id) ? m._id.toString() : m?.toString();
    if (s && !uniqueStrs.has(s)) {
      uniqueStrs.add(s);
      uniqueMembers.push(m);
    }
  });
  this.members = uniqueMembers;
});

// Prevent a user from being in two groups for the same event
groupSchema.index({ eventId: 1, members: 1 });

const Group = mongoose.model('Group', groupSchema);
module.exports = Group;
