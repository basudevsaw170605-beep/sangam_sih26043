import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import University from '../models/University.js';
import Challenge from '../models/Challenge.js';
import Project from '../models/Project.js';
import Team from '../models/Team.js';
import Proposal from '../models/Proposal.js';
import Notification from '../models/Notification.js';
import Activity from '../models/Activity.js';
const upsertUser = async (data) => {
  let user = await User.findOne({ email: data.email }).select('+password');
  if (user) {
    Object.assign(user, data);
    await user.save();
    return user;
  }
  return User.create(data);
};
try {
  await connectDB();
  const [citizen, universityUser, admin, industry] = await Promise.all([
    upsertUser({
      name: 'Priya Kumar',
      email: 'citizen@demo.com',
      password: 'password123',
      role: 'citizen',
      location: 'Ranchi',
    }),
    upsertUser({
      name: 'BIT Mesra Innovation Cell',
      email: 'university@demo.com',
      password: 'password123',
      role: 'university',
      organization: 'Birla Institute of Technology, Mesra',
      department: 'Innovation Cell',
    }),
    upsertUser({
      name: 'Anil Kumar',
      email: 'admin@demo.com',
      password: 'password123',
      role: 'admin',
      organization: 'Department of IT & e-Governance',
    }),
    upsertUser({
      name: 'Sangam Industries',
      email: 'industry@demo.com',
      password: 'password123',
      role: 'industry',
      organization: 'Sangam Industries',
    }),
  ]);
  const university = await University.findOneAndUpdate(
    { email: 'university@demo.com' },
    {
      name: 'Birla Institute of Technology, Mesra',
      shortName: 'BIT Mesra',
      email: 'university@demo.com',
      district: 'Ranchi',
      state: 'Jharkhand',
      departments: ['Computer Science', 'Civil Engineering', 'Environmental Engineering'],
      expertise: ['Water Resources', 'Water Management', 'IoT', 'AI', 'Environment'],
      verified: true,
      isActive: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  universityUser.university = university._id;
  await universityUser.save();
  let challenge = await Challenge.findOne({ title: 'Safe drinking water for Tatisilwai hamlets' });
  if (!challenge)
    challenge = await Challenge.create({
      title: 'Safe drinking water for Tatisilwai hamlets',
      description:
        'Several hamlets face irregular access to tested drinking water during summer months.',
      category: 'Water Resources',
      district: 'Ranchi',
      block: 'Namkum',
      affectedPeople: 1800,
      urgency: 'high',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      submittedBy: citizen._id,
      assignedUniversity: university._id,
      location: { type: 'Point', coordinates: [85.3809, 23.3441] },
    });
  let project = await Project.findOne({ title: 'JalSakhi Water Monitoring' });
  if (!project)
    project = await Project.create({
      title: 'JalSakhi Water Monitoring',
      description: 'An IoT-enabled water monitoring solution.',
      challenge: challenge._id,
      university: university._id,
      status: 'DEVELOPMENT',
      progress: 54,
      technologies: ['IoT', 'Water sensors'],
      mentor: 'Dr. R. Sinha',
      milestones: [{ title: 'Field sensor calibration', dueDate: new Date('2026-11-30') }],
    });
  let team = await Team.findOne({ name: 'AquaTech Collective' });
  if (!team)
    team = await Team.create({
      name: 'AquaTech Collective',
      project: project._id,
      university: university._id,
      leader: universityUser._id,
      members: [{ user: universityUser._id, role: 'leader' }],
      mentor: 'Dr. R. Sinha',
    });
  if (!project.team) {
    project.team = team._id;
    await project.save();
  }
  await Proposal.findOneAndUpdate(
    { title: 'Water sensor CSR pilot' },
    {
      title: 'Water sensor CSR pilot',
      description: 'CSR support for a water-monitoring pilot.',
      challenge: challenge._id,
      project: project._id,
      submittedBy: industry._id,
      organization: industry.organization,
      type: 'CSR',
      status: 'PENDING',
      fundingAmount: 250000,
      timeline: '6 months',
    },
    { upsert: true, new: true }
  );
  await Notification.findOneAndUpdate(
    { recipient: citizen._id, title: 'Challenge submitted' },
    {
      recipient: citizen._id,
      title: 'Challenge submitted',
      message: 'Your water-access challenge is in development.',
      type: 'STATUS',
      relatedChallenge: challenge._id,
    },
    { upsert: true, new: true }
  );
  await Activity.findOneAndUpdate(
    { action: 'CREATE_CHALLENGE', entityId: challenge._id },
    {
      user: citizen._id,
      action: 'CREATE_CHALLENGE',
      entityType: 'Challenge',
      entityId: challenge._id,
      description: 'Citizen submitted challenge',
    },
    { upsert: true, new: true }
  );
  console.log('Seed complete. Demo password for all accounts: password123');
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
