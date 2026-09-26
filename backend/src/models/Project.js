import mongoose from 'mongoose';
const projectSchema = new mongoose.Schema(
  {
    projectId: { type: String, unique: true, index: true },
    title: { type: String, required: true },
    description: String,
    challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
    university: { type: mongoose.Schema.Types.ObjectId, ref: 'University', required: true },
    department: String,
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    status: {
      type: String,
      enum: ['IDEA', 'PROPOSAL', 'DEVELOPMENT', 'PILOT', 'DEPLOYED', 'COMPLETED'],
      default: 'IDEA',
      index: true,
    },
    technologies: [String],
    mentor: String,
    industryPartner: String,
    governmentPartner: String,
    funding: Number,
    progress: { type: Number, default: 0, min: 0, max: 100 },
    milestones: [{ title: String, dueDate: Date, completed: Boolean }],
    outcomes: String,
  },
  { timestamps: true }
);
projectSchema.pre('validate', async function id(next) {
  if (!this.projectId)
    this.projectId = `PR-${1000 + (await this.constructor.countDocuments()) + 1}`;
  next();
});
export default mongoose.model('Project', projectSchema);
