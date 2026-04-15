const mongoose = require('mongoose');

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
    invitedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['OPEN', 'FULL', 'CLOSED'],
      default: 'OPEN',
    },
    // createdAt is handled automatically by timestamps: true
  },
  {
    timestamps: true,
  }
);

// ─── Pre-validate: Ensure leader is always in members ───────────────────────
// Using pre('validate') so it fires on both create() and save()
groupSchema.pre('validate', function () {
  if (!this.leaderId) return;

  const leaderStr = this.leaderId.toString();
  const memberStrs = this.members.map((m) => m.toString());

  if (!memberStrs.includes(leaderStr)) {
    this.members.unshift(this.leaderId);
  }
});
// ─────────────────────────────────────────────────────────────────────────────

// Prevent a user from being in two groups for the same event
groupSchema.index({ eventId: 1, members: 1 });

const Group = mongoose.model('Group', groupSchema);
module.exports = Group;
