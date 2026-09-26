import University from '../models/University.js';
import Project from '../models/Project.js';
import Team from '../models/Team.js';
import Proposal from '../models/Proposal.js';
import Notification from '../models/Notification.js';
import Challenge from '../models/Challenge.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import { asyncHandler, audit, notify, paging } from '../utils/helpers.js';
const respondList = (Model, populate = '') =>
  asyncHandler(async (req, res) => {
    const { page, limit } = paging(req.query),
      filter = {};
    if (req.query.search)
      filter.$or = ['name', 'title', 'email'].map((x) => ({
        [x]: new RegExp(req.query.search, 'i'),
      }));
    const [data, total] = await Promise.all([
      Model.find(filter)
        .populate(populate)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Model.countDocuments(filter),
    ]);
    res.json({
      success: true,
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  });
const getOne = (Model, populate = '') =>
  asyncHandler(async (req, res) => {
    const data = await Model.findById(req.params.id).populate(populate);
    if (!data) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, data });
  });
export const listUniversities = respondList(University);
export const getUniversity = getOne(University);
export const createUniversity = asyncHandler(async (req, res) => {
  const data = await University.create(req.body);
  res.status(201).json({ success: true, message: 'University created', data });
});
export const updateUniversity = asyncHandler(async (req, res) => {
  const data = await University.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!data) return res.status(404).json({ success: false, message: 'Record not found' });
  res.json({ success: true, message: 'University updated', data });
});
export const listProjects = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'university') {
    const uni = await University.findOne({ email: req.user.email });
    if (uni) filter.university = uni._id;
  }
  const data = await Project.find(filter)
    .populate('challenge', 'title challengeId')
    .populate('university', 'name')
    .populate('team', 'name')
    .sort({ createdAt: -1 });
  res.json({ success: true, data });
});
export const getProject = getOne(Project, 'challenge university team');
export const createProject = asyncHandler(async (req, res) => {
  const uni = (await University.findOne({ email: req.user.email })) || req.body.university;
  if (!uni) return res.status(422).json({ success: false, message: 'A university is required' });
  const data = await Project.create({ ...req.body, university: uni._id || uni });
  await Challenge.findByIdAndUpdate(data.challenge, { status: 'IN_PROGRESS' });
  await audit(req.user._id, 'CREATE_PROJECT', 'Project', data._id, 'University created project');
  res.status(201).json({ success: true, message: 'Project created successfully', data });
});
export const updateProject = asyncHandler(async (req, res) => {
  const data = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!data) return res.status(404).json({ success: false, message: 'Record not found' });
  res.json({ success: true, message: 'Project updated', data });
});
export const deleteProject = asyncHandler(async (req, res) => {
  const data = await Project.findByIdAndDelete(req.params.id);
  if (!data) return res.status(404).json({ success: false, message: 'Record not found' });
  res.json({ success: true, message: 'Project deleted' });
});
export const listTeams = respondList(Team, 'project university leader members.user');
export const getTeam = getOne(Team, 'project university leader members.user');
export const createTeam = asyncHandler(async (req, res) => {
  const uni = await University.findOne({ email: req.user.email });
  const data = await Team.create({
    ...req.body,
    university: req.body.university || uni?._id,
    leader: req.body.leader || req.user._id,
    members: [{ user: req.body.leader || req.user._id, role: 'leader' }],
  });
  await audit(req.user._id, 'CREATE_TEAM', 'Team', data._id, 'University created team');
  res.status(201).json({ success: true, message: 'Team created successfully', data });
});
export const updateTeam = asyncHandler(async (req, res) => {
  const data = await Team.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!data) return res.status(404).json({ success: false, message: 'Record not found' });
  res.json({ success: true, message: 'Team updated', data });
});
export const addMember = asyncHandler(async (req, res) => {
  const data = await Team.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { members: { user: req.body.userId, role: req.body.role || 'member' } } },
    { new: true }
  );
  if (!data) return res.status(404).json({ success: false, message: 'Record not found' });
  await notify(req.body.userId, 'Added to team', `You were added to ${data.name}.`, 'TEAM');
  res.json({ success: true, message: 'Member added', data });
});
export const removeMember = asyncHandler(async (req, res) => {
  const data = await Team.findByIdAndUpdate(
    req.params.id,
    { $pull: { members: { user: req.params.userId } } },
    { new: true }
  );
  if (!data) return res.status(404).json({ success: false, message: 'Record not found' });
  res.json({ success: true, message: 'Member removed', data });
});
export const listProposals = respondList(Proposal, 'challenge project submittedBy');
export const getProposal = getOne(Proposal, 'challenge project submittedBy');
export const createProposal = asyncHandler(async (req, res) => {
  const data = await Proposal.create({
    ...req.body,
    submittedBy: req.user._id,
    organization: req.body.organization || req.user.organization,
  });
  await audit(req.user._id, 'CREATE_PROPOSAL', 'Proposal', data._id, 'Proposal submitted');
  res.status(201).json({ success: true, message: 'Proposal submitted successfully', data });
});
export const updateProposal = asyncHandler(async (req, res) => {
  const data = await Proposal.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!data) return res.status(404).json({ success: false, message: 'Record not found' });
  res.json({ success: true, message: 'Proposal updated', data });
});
export const proposalStatus = asyncHandler(async (req, res) => {
  const data = await Proposal.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  );
  if (!data) return res.status(404).json({ success: false, message: 'Record not found' });
  await notify(
    data.submittedBy,
    'Proposal reviewed',
    `Your proposal is ${data.status}.`,
    'PROPOSAL'
  );
  res.json({ success: true, message: 'Proposal status updated', data });
});
export const notifications = asyncHandler(async (req, res) =>
  res.json({
    success: true,
    data: await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }),
  })
);
export const readNotification = asyncHandler(async (req, res) => {
  const data = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!data) return res.status(404).json({ success: false, message: 'Notification not found' });
  res.json({ success: true, data });
});
export const readAll = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id }, { isRead: true });
  res.json({ success: true, message: 'Notifications marked read' });
});
export const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.deleteOne({ _id: req.params.id, recipient: req.user._id });
  res.json({ success: true, message: 'Notification deleted' });
});
export const adminStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalCitizens,
    totalUniversities,
    totalChallenges,
    validatedChallenges,
    activeChallenges,
    resolvedChallenges,
    totalProjects,
    activeProjects,
    totalTeams,
    totalProposals,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'citizen' }),
    University.countDocuments(),
    Challenge.countDocuments(),
    Challenge.countDocuments({ status: 'VALIDATED' }),
    Challenge.countDocuments({ status: { $in: ['ASSIGNED', 'IN_PROGRESS', 'PILOT'] } }),
    Challenge.countDocuments({ status: { $in: ['RESOLVED', 'CLOSED'] } }),
    Project.countDocuments(),
    Project.countDocuments({ status: { $in: ['DEVELOPMENT', 'PILOT', 'DEPLOYED'] } }),
    Team.countDocuments(),
    Proposal.countDocuments(),
  ]);
  res.json({
    success: true,
    data: {
      totalUsers,
      totalCitizens,
      totalUniversities,
      totalChallenges,
      validatedChallenges,
      activeChallenges,
      resolvedChallenges,
      totalProjects,
      activeProjects,
      totalTeams,
      totalProposals,
    },
  });
});
export const analytics = asyncHandler(async (req, res) => {
  const group = (Model, field) =>
    Model.aggregate([
      { $group: { _id: `$${field}`, value: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', value: 1 } },
      { $sort: { value: -1 } },
    ]);
  const [
    byCategory,
    byDistrict,
    byStatus,
    byPriority,
    projectsByStatus,
    monthly,
    universityParticipation,
  ] = await Promise.all([
    group(Challenge, 'category'),
    group(Challenge, 'district'),
    group(Challenge, 'status'),
    group(Challenge, 'priority'),
    group(Project, 'status'),
    Challenge.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          value: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, name: '$_id', value: 1 } },
    ]),
    Project.aggregate([
      { $group: { _id: '$university', projects: { $sum: 1 } } },
      {
        $lookup: { from: 'universities', localField: '_id', foreignField: '_id', as: 'university' },
      },
      { $unwind: '$university' },
      { $project: { _id: 0, name: '$university.name', value: '$projects' } },
      { $sort: { value: -1 } },
    ]),
  ]);
  const [resolved, total] = await Promise.all([
    Challenge.countDocuments({ status: { $in: ['RESOLVED', 'CLOSED'] } }),
    Challenge.countDocuments(),
  ]);
  res.json({
    success: true,
    data: {
      byCategory,
      byDistrict,
      byStatus,
      byPriority,
      projectsByStatus,
      monthly,
      universityParticipation,
      resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
    },
  });
});
export const adminUsers = respondList(User);
export const adminChallenges = respondList(Challenge, 'submittedBy assignedUniversity');
export const adminProjects = respondList(Project, 'challenge university');
export const activities = respondList(Activity, 'user');
