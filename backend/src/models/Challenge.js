import mongoose from 'mongoose';
const evidenceSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['image', 'video', 'document'] },
    path: String,
    originalName: String,
    mimeType: String,
    size: Number,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);
const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: undefined },
  },
  { _id: false }
);
const challengeSchema = new mongoose.Schema(
  {
    challengeId: { type: String, unique: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, required: true, minlength: 30, maxlength: 5000 },
    category: {
      type: String,
      required: true,
      enum: [
        'Water Resources',
        'Healthcare',
        'Education',
        'Sanitation',
        'Transportation',
        'Environment',
        'Agriculture',
        'Public Safety',
        'Digital Services',
        'Women & Child Welfare',
        'Infrastructure',
        'Energy',
        'Accessibility',
        'Other',
      ],
      index: true,
    },
    subCategory: String,
    location: { type: pointSchema, default: undefined },
    district: { type: String, required: true, index: true },
    state: { type: String, default: 'Jharkhand', index: true },
    block: String,
    affectedPeople: { type: Number, default: 0, min: 0 },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true,
    },
    status: {
      type: String,
      enum: [
        'SUBMITTED',
        'UNDER_REVIEW',
        'VALIDATED',
        'REJECTED',
        'ASSIGNED',
        'ACCEPTED',
        'IN_PROGRESS',
        'PILOT',
        'RESOLVED',
        'CLOSED',
      ],
      default: 'SUBMITTED',
      index: true,
    },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedUniversity: { type: mongoose.Schema.Types.ObjectId, ref: 'University' },
    assignedDepartment: String,
    assignedTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    evidence: [evidenceSchema],
    aiAnalysis: mongoose.Schema.Types.Mixed,
    duplicateAnalysis: mongoose.Schema.Types.Mixed,
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
    duplicateProbability: Number,
    semanticScore: Number,
    geospatialScore: Number,
  },
  { timestamps: true }
);
challengeSchema.index({ location: '2dsphere' });
challengeSchema.index({ title: 'text', description: 'text' });
challengeSchema.pre('validate', async function id(next) {
  if (!this.challengeId) {
    const count = await this.constructor.countDocuments();
    this.challengeId = `CH-26043-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});
export default mongoose.model('Challenge', challengeSchema);
