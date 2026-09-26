import mongoose from 'mongoose';
import Challenge from '../models/Challenge.js';
import University from '../models/University.js';
import { asyncHandler, audit, notify, paging } from '../utils/helpers.js';
const publicFields =
  'challengeId title description category district state block affectedPeople urgency priority status assignedUniversity createdAt updatedAt evidence';
const queryFor = (q) => {
  const filter = {};
  ['category', 'district', 'state', 'status', 'priority', 'urgency'].forEach((key) => {
    if (q[key]) filter[key] = q[key];
  });
  if (q.university) filter.assignedUniversity = q.university;
  if (q.search) filter.$text = { $search: q.search };
  if (q.date) {
    const start = new Date(q.date);
    if (!Number.isNaN(start)) filter.createdAt = { $gte: start };
  }
  return filter;
};
const byIdOrChallengeId = (id) =>
  mongoose.isValidObjectId(id) ? { $or: [{ _id: id }, { challengeId: id }] } : { challengeId: id };
const findChallenge = (id) => Challenge.findOne(byIdOrChallengeId(id));
const universityFor = (user) =>
  user.university
    ? University.findById(user.university)
    : University.findOne({ email: user.email });
const matchScoreFor = (uni, doc) => {
  const terms = [doc.category, doc.assignedDepartment].filter(Boolean);
  const shared = (uni.expertise || []).filter((x) => terms.includes(x)).length;
  return (uni.district && uni.district === doc.district ? 25 : 0) + shared * 35;
};
export const listChallenges = asyncHandler(async (req, res) => {
  const { page, limit } = paging(req.query),
    filter = queryFor(req.query);
  if (req.user?.role === 'citizen') filter.submittedBy = req.user._id;
  let uni;
  if (req.user?.role === 'university') {
    uni = await University.findOne({ email: req.user.email });
    if (uni) filter.$or = [{ assignedUniversity: uni._id }, { status: 'VALIDATED' }];
  }
  const sort = { [req.query.sortBy || 'createdAt']: req.query.order === 'asc' ? 1 : -1 };
  let query = Challenge.find(filter)
    .select(req.user ? undefined : publicFields)
    .populate('assignedUniversity', 'name shortName')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);
  if (req.user) query = query.populate('submittedBy', 'name');
  const [data, total] = await Promise.all([query, Challenge.countDocuments(filter)]);
  res.json({
    success: true,
    data: uni ? data.map((d) => ({ ...d.toObject(), matchScore: matchScoreFor(uni, d) })) : data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});
export const getChallenge = asyncHandler(async (req, res) => {
  const doc = await findChallenge(req.params.id)
    .populate('submittedBy', 'name email')
    .populate('assignedUniversity', 'name shortName');
  if (!doc) return res.status(404).json({ success: false, message: 'Challenge not found' });
  if (req.user?.role === 'citizen' && String(doc.submittedBy._id) !== String(req.user._id))
    return res.status(403).json({ success: false, message: 'Access denied' });
  res.json({ success: true, data: doc });
});
export const citizenDashboard = asyncHandler(async (req, res) => {
  const owner = req.user._id;
  const scope = { submittedBy: owner };
  const [challenges, totalSubmitted, underReview, inProgress, solved] = await Promise.all([
    Challenge.find(scope)
      .select(publicFields)
      .populate('assignedUniversity', 'name shortName')
      .sort({ createdAt: -1 }),
    Challenge.countDocuments(scope),
    Challenge.countDocuments({ ...scope, status: { $in: ['SUBMITTED', 'UNDER_REVIEW'] } }),
    Challenge.countDocuments({
      ...scope,
      status: { $in: ['ASSIGNED', 'IN_PROGRESS', 'PILOT'] },
    }),
    Challenge.countDocuments({ ...scope, status: { $in: ['RESOLVED', 'CLOSED'] } }),
  ]);
  res.json({
    success: true,
    data: { challenges, stats: { totalSubmitted, underReview, inProgress, solved } },
  });
});
export const createChallenge = asyncHandler(async (req, res) => {
  const body = {
    ...req.body,
    submittedBy: req.user._id,
    affectedPeople: Number(req.body.affectedPeople || req.body.affected || 0),
  };
  if (req.body.coordinates)
    body.location = { type: 'Point', coordinates: JSON.parse(req.body.coordinates) };
  body.evidence = (req.files || []).map((f) => ({
    type: f.mimetype.startsWith('image/')
      ? 'image'
      : f.mimetype.startsWith('video/')
        ? 'video'
        : 'document',
    path: `/uploads/${f.filename}`,
    originalName: f.originalname,
    mimeType: f.mimetype,
    size: f.size,
    uploadedBy: req.user._id,
  }));
  const doc = await Challenge.create(body);
  await audit(
    req.user._id,
    'CREATE_CHALLENGE',
    'Challenge',
    doc._id,
    'Citizen submitted challenge'
  );
  res.status(201).json({ success: true, message: 'Challenge created successfully', data: doc });
});
export const updateChallenge = asyncHandler(async (req, res) => {
  const doc = await findChallenge(req.params.id);
  if (!doc) return res.status(404).json({ success: false, message: 'Challenge not found' });
  const owner = String(doc.submittedBy) === String(req.user._id);
  if (!owner && req.user.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Access denied' });
  Object.assign(doc, req.body);
  await doc.save();
  res.json({ success: true, message: 'Challenge updated successfully', data: doc });
});
export const deleteChallenge = asyncHandler(async (req, res) => {
  const doc = await findChallenge(req.params.id);
  if (!doc) return res.status(404).json({ success: false, message: 'Challenge not found' });
  if (req.user.role !== 'admin' && String(doc.submittedBy) !== String(req.user._id))
    return res.status(403).json({ success: false, message: 'Access denied' });
  await doc.deleteOne();
  res.json({ success: true, message: 'Challenge deleted successfully' });
});
export const changeStatus = asyncHandler(async (req, res) => {
  const doc = await Challenge.findOneAndUpdate(
    byIdOrChallengeId(req.params.id),
    { status: req.body.status },
    { new: true, runValidators: true }
  );
  if (!doc) return res.status(404).json({ success: false, message: 'Challenge not found' });
  await notify(
    doc.submittedBy,
    'Challenge status updated',
    `Your challenge is now ${doc.status}.`,
    'STATUS',
    doc._id
  );
  await audit(
    req.user._id,
    'CHANGE_STATUS',
    'Challenge',
    doc._id,
    `Changed status to ${doc.status}`
  );
  res.json({ success: true, message: 'Status updated', data: doc });
});
export const assignChallenge = asyncHandler(async (req, res) => {
  const uni = await University.findById(req.body.universityId);
  if (!uni) return res.status(404).json({ success: false, message: 'University not found' });
  const doc = await Challenge.findOneAndUpdate(
    byIdOrChallengeId(req.params.id),
    { assignedUniversity: uni._id, assignedDepartment: req.body.department, status: 'ASSIGNED' },
    { new: true }
  );
  if (!doc) return res.status(404).json({ success: false, message: 'Challenge not found' });
  await audit(req.user._id, 'ASSIGN_CHALLENGE', 'Challenge', doc._id, `Assigned to ${uni.name}`);
  res.json({ success: true, message: 'Challenge assigned successfully', data: doc });
});
const DECIDED = ['ACCEPTED', 'REJECTED', 'RESOLVED', 'CLOSED'];
const respondToAssignment = (target) =>
  asyncHandler(async (req, res) => {
    const verb = target === 'ACCEPTED' ? 'accepted' : 'rejected';
    const doc = await findChallenge(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Challenge not found' });
    const uni = await universityFor(req.user);
    if (!uni)
      return res
        .status(403)
        .json({ success: false, message: 'No university is linked to this account' });
    if (!doc.assignedUniversity || String(doc.assignedUniversity) !== String(uni._id))
      return res.status(403).json({
        success: false,
        message: 'This challenge is not assigned to your university',
      });
    if (DECIDED.includes(doc.status))
      return res.status(409).json({
        success: false,
        message: `Challenge is already ${doc.status.toLowerCase()} and cannot be ${verb}`,
      });
    const from = doc.status;
    doc.status = target;
    await doc.save();
    await notify(
      doc.submittedBy,
      `Challenge ${verb}`,
      `${uni.name} ${verb} your challenge "${doc.title}".`,
      'STATUS',
      doc._id
    );
    await audit(
      req.user._id,
      target === 'ACCEPTED' ? 'ACCEPT_CHALLENGE' : 'REJECT_CHALLENGE',
      'Challenge',
      doc._id,
      `${from} -> ${target} by ${uni.name}`
    );
    res.json({ success: true, message: `Challenge ${verb} successfully`, data: doc });
  });
export const acceptChallenge = respondToAssignment('ACCEPTED');
export const rejectChallenge = respondToAssignment('REJECTED');
export const setPriority = asyncHandler(async (req, res) => {
  const doc = await Challenge.findOneAndUpdate(
    byIdOrChallengeId(req.params.id),
    { priority: req.body.priority },
    { new: true, runValidators: true }
  );
  if (!doc) return res.status(404).json({ success: false, message: 'Challenge not found' });
  res.json({ success: true, message: 'Priority updated', data: doc });
});
export const nearby = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 10000 } = req.query;
  if (![lat, lng].every(Number.isFinite))
    return res.status(422).json({ success: false, message: 'lat and lng are required numbers' });
  const data = await Challenge.find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
        $maxDistance: Math.min(Number(radius), 50000),
      },
    },
  }).limit(100);
  res.json({ success: true, data });
});
export const matches = asyncHandler(async (req, res) => {
  const doc = await findChallenge(req.params.id);
  if (!doc) return res.status(404).json({ success: false, message: 'Challenge not found' });
  const terms = [doc.category, doc.assignedDepartment].filter(Boolean);
  const data = await University.aggregate([
    { $match: { isActive: true } },
    {
      $addFields: {
        matchScore: {
          $add: [
            { $cond: [{ $eq: ['$district', doc.district] }, 25, 0] },
            { $multiply: [{ $size: { $setIntersection: ['$expertise', terms] } }, 35] },
          ],
        },
      },
    },
    { $sort: { matchScore: -1, verified: -1 } },
    { $limit: 10 },
  ]);
  res.json({ success: true, data });
});
