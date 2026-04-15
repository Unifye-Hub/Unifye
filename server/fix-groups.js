const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Group = require('./models/Group');

dotenv.config();
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(async () => {
  const groups = await Group.find({});
  for (const group of groups) {
    const uniqueMembers = [];
    const seen = new Set();
    for (const m of group.members) {
      if (!seen.has(m.toString())) {
        seen.add(m.toString());
        uniqueMembers.push(m);
      }
    }
    group.members = uniqueMembers;
    await group.save();
  }
  console.log("Groups deduplicated.");
  process.exit();
});
