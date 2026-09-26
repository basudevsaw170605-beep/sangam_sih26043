import mongoose from 'mongoose';
const proposalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    organization: String,
    type: {
      type: String,
      enum: ['MENTORSHIP', 'FUNDING', 'TECHNOLOGY', 'PILOT', 'CSR', 'RESEARCH'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED'],
      default: 'PENDING',
    },
    fundingAmount: Number,
    timeline: String,
    attachments: [String],
  },
  { timestamps: true }
);
export default mongoose.model('Proposal', proposalSchema);
