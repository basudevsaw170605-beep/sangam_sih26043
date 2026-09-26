import mongoose from 'mongoose';
const universitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    shortName: String,
    email: { type: String, lowercase: true, trim: true },
    website: String,
    location: String,
    district: { type: String, index: true },
    state: String,
    departments: [String],
    expertise: { type: [String], index: true },
    contactPerson: String,
    verified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
export default mongoose.model('University', universitySchema);
