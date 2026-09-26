import mongoose from 'mongoose';
const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    university: { type: mongoose.Schema.Types.ObjectId, ref: 'University', required: true },
    leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, default: 'member' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    mentor: String,
  },
  { timestamps: true }
);
export default mongoose.model('Team', teamSchema);
