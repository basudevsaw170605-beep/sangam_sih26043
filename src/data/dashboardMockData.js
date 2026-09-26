// Frontend-only dashboard seed. Every landing-page statistic is derived from this list.
export const dashboardProblems = [
  ['Ranchi', 'Water', 'Critical', 23.37, 85.38, 'IN PROGRESS', 1800, 22, 14],
  ['Ranchi', 'Roads', 'High', 23.42, 85.31, 'VALIDATED', 1250, 14, 0],
  ['Ranchi', 'Sanitation', 'Medium', 23.43, 85.48, 'SOLVED', 900, 0, 18],
  ['Dhanbad', 'Health', 'High', 23.8, 86.43, 'IN PROGRESS', 2400, 9, 30],
  ['Dhanbad', 'Roads', 'Critical', 23.72, 86.41, 'SUBMITTED', 1600, 16, 0],
  ['Dhanbad', 'Water', 'Medium', 23.87, 86.7, 'SOLVED', 700, 0, 24],
  ['East Singhbhum', 'Sanitation', 'High', 22.81, 86.2, 'VALIDATED', 2100, 8, 0],
  ['East Singhbhum', 'Education', 'Medium', 22.72, 86.28, 'IN PROGRESS', 850, 3, 38],
  ['West Singhbhum', 'Water', 'High', 22.55, 85.8, 'UNDER REVIEW', 1250, 11, 0],
  ['Bokaro', 'Roads', 'High', 23.64, 86.16, 'IN PROGRESS', 1750, 7, 26],
  ['Bokaro', 'Health', 'Medium', 23.75, 85.98, 'SOLVED', 620, 0, 20],
  ['Hazaribagh', 'Education', 'Medium', 24.15, 85.62, 'UNDER REVIEW', 950, 5, 0],
  ['Hazaribagh', 'Water', 'High', 23.99, 85.36, 'VALIDATED', 1150, 10, 0],
  ['Deoghar', 'Sanitation', 'Medium', 24.48, 86.7, 'SUBMITTED', 3200, 12, 0],
  ['Palamu', 'Education', 'Medium', 24.04, 84.07, 'SOLVED', 600, 0, 31],
  ['Palamu', 'Health', 'High', 24.52, 84.0, 'IN PROGRESS', 1400, 6, 19],
  ['Giridih', 'Roads', 'High', 24.18, 86.3, 'VALIDATED', 1200, 9, 0],
  ['Dumka', 'Water', 'Critical', 24.27, 87.25, 'SUBMITTED', 1900, 18, 0],
  ['Godda', 'Others', 'Medium', 24.83, 87.21, 'SOLVED', 550, 0, 22],
  ['Khunti', 'Sanitation', 'High', 23.08, 85.28, 'IN PROGRESS', 1100, 10, 27],
  ['Ramgarh', 'Roads', 'Medium', 23.63, 85.52, 'SOLVED', 800, 0, 17],
  ['Saraikela Kharsawan', 'Health', 'High', 22.7, 85.93, 'UNDER REVIEW', 1020, 5, 0],
  ['Latehar', 'Education', 'Low', 23.74, 84.5, 'SOLVED', 420, 0, 35],
  ['Gumla', 'Water', 'High', 23.04, 84.54, 'VALIDATED', 980, 7, 0],
].map(
  (
    [
      district,
      category,
      severity,
      latitude,
      longitude,
      status,
      people_impacted,
      duplicate_count,
      resolution_days,
    ],
    index
  ) => ({
    id: `SS-${String(index + 1).padStart(3, '0')}`,
    title: `${category} challenge in ${district}`,
    category,
    severity,
    latitude,
    longitude,
    district,
    block: district,
    local_body: `${district} local body`,
    duplicate_count,
    cluster_id: `CL-${district.slice(0, 3).toUpperCase()}`,
    status,
    people_impacted,
    resolution_days,
    reported_at: `2026-${String(4 + (index % 6)).padStart(2, '0')}-${String(3 + ((index * 7) % 25)).padStart(2, '0')}`,
  })
);

export const dashboardInstitutions = 8;
export const categoryOrder = ['Water', 'Roads', 'Sanitation', 'Education', 'Health', 'Others'];
export const isResolved = (problem) => ['SOLVED', 'RESOLVED', 'CLOSED'].includes(problem.status);
export const activeStatuses = [
  'SUBMITTED',
  'UNDER REVIEW',
  'UNDER_REVIEW',
  'VALIDATED',
  'ASSIGNED',
  'IN PROGRESS',
  'IN_PROGRESS',
  'PILOT',
];
export function getDashboardMetrics(problems = dashboardProblems) {
  const resolved = problems.filter(isResolved),
    active = problems.filter((p) => activeStatuses.includes(p.status)),
    days = resolved.map((p) => p.resolution_days).filter(Boolean);
  return {
    total: problems.length,
    active: active.length,
    resolved: resolved.length,
    critical: problems.filter((p) => p.severity === 'Critical' || p.priority === 'CRITICAL').length,
    districts: new Set(problems.map((p) => p.district)).size,
    institutions: dashboardInstitutions,
    people: problems.reduce((sum, p) => sum + (p.people_impacted || p.affectedPeople || 0), 0),
    resolutionRate: Math.round((resolved.length / problems.length) * 100),
    avgResolutionDays: days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 0,
  };
}
export function getCategoryBreakdown(problems = dashboardProblems) {
  const categories = [...new Set(problems.map((p) => p.category))];
  return (categories.length ? categories : categoryOrder).map((category) => {
    const count = problems.filter((p) => p.category === category).length;
    return { category, count, percentage: Math.round((count / problems.length) * 100) };
  });
}
export function getDistrictStats(district, problems = dashboardProblems) {
  const matches = problems.filter((p) => p.district === district);
  return {
    problems: matches.length,
    critical: matches.filter((p) => p.severity === 'Critical' || p.priority === 'CRITICAL').length,
    resolved: matches.filter(isResolved).length,
    people: matches.reduce((sum, p) => sum + (p.people_impacted || p.affectedPeople || 0), 0),
  };
}
