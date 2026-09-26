import mongoose from 'mongoose';
const activitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: mongoose.Schema.Types.ObjectId,
    description: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);
activitySchema.index({ createdAt: -1 });
export default mongoose.model('Activity', activitySchema);
