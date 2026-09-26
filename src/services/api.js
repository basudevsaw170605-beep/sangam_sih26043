const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const request = async (path, options = {}) => {
  const token = localStorage.getItem('sih-token');
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const payload = await response
    .json()
    .catch(() => ({ success: false, message: 'Unexpected server response' }));
  if (response.status === 401) {
    localStorage.removeItem('sih-token');
    localStorage.removeItem('sih-user');
  }
  if (!response.ok || !payload.success) throw new Error(payload.message || 'Request failed');
  return payload;
};
const normalizeChallenge = (x) =>
  x && {
    ...x,
    id: x.challengeId || x._id,
    date: new Date(x.createdAt).toLocaleDateString(),
    affected: x.affectedPeople,
    university: x.assignedUniversity?.name || '',
    progress:
      x.status === 'RESOLVED' || x.status === 'CLOSED'
        ? 100
        : x.status === 'IN_PROGRESS'
          ? 55
          : x.status === 'ASSIGNED'
            ? 35
            : 10,
    aiConfidence: x.aiAnalysis?.confidence,
    matchScore: x.matchScore,
  };
const normalizeProject = (x) =>
  x && {
    ...x,
    id: x.projectId || x._id,
    challenge: x.challenge?.title || x.challenge,
    university: x.university?.name || x.university,
    team: x.team?.name || x.team,
    milestone: x.milestones?.[0]?.title,
    deadline: x.milestones?.[0]?.dueDate && new Date(x.milestones[0].dueDate).toLocaleDateString(),
  };
export const authService = {
  login: async (email, password) => {
    const r = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('sih-token', r.token);
    return r.data;
  },
  register: async (data) => {
    const r = await request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
    localStorage.setItem('sih-token', r.token);
    return r.data;
  },
  me: async () => (await request('/auth/me')).data,
  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('sih-token');
    }
  },
};
export const citizenService = {
  getDashboard: async () => {
    const r = await request('/citizen/dashboard');
    return { challenges: r.data.challenges.map(normalizeChallenge), stats: r.data.stats };
  },
};
export const challengeService = {
  getChallenges: async (params = '') =>
    (await request(`/challenges${params ? `?${params}` : ''}`)).data.map(normalizeChallenge),
  getById: async (id) => normalizeChallenge((await request(`/challenges/${id}`)).data),
  create: async (data, file) => {
    const form = new FormData();
    Object.entries({ ...data, affectedPeople: data.affected }).forEach(
      ([key, value]) => value !== undefined && value !== null && form.append(key, value)
    );
    if (file) form.append('evidence', file);
    return normalizeChallenge((await request('/challenges', { method: 'POST', body: form })).data);
  },
  update: async (id, data) =>
    normalizeChallenge(
      (await request(`/challenges/${id}`, { method: 'PUT', body: JSON.stringify(data) })).data
    ),
  setStatus: async (id, status) =>
    normalizeChallenge(
      (
        await request(`/challenges/${id}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status }),
        })
      ).data
    ),
  accept: async (id) =>
    normalizeChallenge((await request(`/challenges/${id}/accept`, { method: 'PUT' })).data),
  reject: async (id) =>
    normalizeChallenge((await request(`/challenges/${id}/reject`, { method: 'PUT' })).data),
};
export const projectService = {
  getProjects: async () => (await request('/projects')).data.map(normalizeProject),
  getById: async (id) => normalizeProject((await request(`/projects/${id}`)).data),
  create: async (data) =>
    normalizeProject(
      (await request('/projects', { method: 'POST', body: JSON.stringify(data) })).data
    ),
};
export const universityService = {
  getUniversities: async () =>
    (await request('/universities')).data.map((x) => ({
      ...x,
      id: x._id,
      areas: x.expertise?.join(', '),
      projects: x.projects ?? 0,
      status: x.verified ? 'VERIFIED' : 'PENDING',
    })),
  verify: async (id) =>
    (
      await request(`/universities/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ verified: true }),
      })
    ).data,
};
export const adminService = {
  getStats: async () => (await request('/admin/stats')).data,
  getAnalytics: async () => (await request('/admin/analytics')).data,
  getUsers: async () => (await request('/admin/users')).data,
  getChallenges: async () => (await request('/admin/challenges')).data.map(normalizeChallenge),
  getProjects: async () => (await request('/admin/projects')).data.map(normalizeProject),
};
export const notificationService = {
  get: async () => (await request('/notifications')).data,
  markRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
};
