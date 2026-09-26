import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  DashboardLayout,
  StatCard,
  Badge,
  SearchInput,
  Modal,
  Button,
  Empty,
} from '../components/common/UI';
import { challengeService, universityService, adminService } from '../services/api';
const colors = ['#1d6e65', '#e18c3d', '#42689f', '#6f8192', '#8c5c4e'];
export function AdminDashboard() {
  const [stats, setStats] = useState(),
    [analytics, setAnalytics] = useState(),
    [err, setErr] = useState('');
  useEffect(() => {
    Promise.all([adminService.getStats(), adminService.getAnalytics()])
      .then(([s, a]) => {
        setStats(s);
        setAnalytics(a);
      })
      .catch((e) => setErr(e.message));
  }, []);
  const chartData = analytics?.byCategory || [];
  const statusData = analytics?.byStatus || [];
  return (
    <DashboardLayout title="Government overview">
      <section className="welcome">
        <div>
          <p className="eyebrow">PLATFORM AUTHORITY</p>
          <h2>Monitor innovation across Jharkhand.</h2>
        </div>
      </section>
      {err && <div className="error">{err}</div>}
      <div className="stats">
        <StatCard
          label="Total challenges"
          value={stats?.totalChallenges ?? '–'}
          note="Across the platform"
        />
        <StatCard
          label="Pending validation"
          value={stats ? stats.totalChallenges - stats.validatedChallenges : '–'}
          note="Needs attention"
        />
        <StatCard label="Active projects" value={stats?.activeProjects ?? '–'} note="In delivery" />
        <StatCard
          label="Completed solutions"
          value={stats?.resolvedChallenges ?? '–'}
          note="Impact verified"
        />
      </div>
      <section className="grid two">
        <div className="panel chart">
          <h2>Challenges by domain</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#1d6e65" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="panel chart">
          <h2>Status distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} dataKey="value" innerRadius={55} outerRadius={85}>
                {colors.map((c, i) => (
                  <Cell fill={c} key={c} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>
    </DashboardLayout>
  );
}
export function AdminTable({ kind }) {
  const [data, setData] = useState([]),
    [q, setQ] = useState(''),
    [err, setErr] = useState(''),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState();
  const load = () => {
    setErr('');
    return {
      challenges: adminService.getChallenges,
      projects: adminService.getProjects,
      universities: universityService.getUniversities,
      users: adminService.getUsers,
    }
      [kind]()
      .then(setData);
  };
  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, [kind]);
  const act = async (fn) => {
    setBusy(true);
    setErr('');
    try {
      await fn();
      await load();
      setSelected(null);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  const cols =
    kind === 'challenges'
      ? ['id', 'title', 'category', 'district', 'priority', 'status']
      : kind === 'projects'
        ? ['id', 'title', 'university', 'progress', 'status', 'deadline']
        : kind === 'universities'
          ? ['name', 'district', 'areas', 'departments', 'status']
          : ['name', 'email', 'role', 'organization', 'location'];
  return (
    <DashboardLayout title={kind[0].toUpperCase() + kind.slice(1) + ' management'}>
      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} />
      </div>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c}>{c}</th>
              ))}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {err && (
              <tr>
                <td colSpan={cols.length + 1}>
                  <div className="error">{err}</div>
                </td>
              </tr>
            )}
            {data
              .filter((x) => JSON.stringify(x).toLowerCase().includes(q.toLowerCase()))
              .map((x) => (
                <tr key={x.id || x._id || x.email}>
                  {cols.map((c) => (
                    <td key={c}>
                      {c === 'status' || c === 'priority' ? (
                        <Badge>{x[c]}</Badge>
                      ) : c === 'progress' ? (
                        `${x[c]}%`
                      ) : Array.isArray(x[c]) ? (
                        x[c].join(', ')
                      ) : (
                        (x[c] ?? '–')
                      )}
                    </td>
                  ))}
                  <td>
                    <button className="text-btn" onClick={() => setSelected(x)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Record review">
        {err && <div className="error">{err}</div>}
        <p>
          <b>{selected?.title || selected?.name}</b>
        </p>
        {selected?.description && <p>{selected.description}</p>}
        {kind === 'challenges' && (
          <>
            <p>
              <b>Current status:</b> <Badge>{selected?.status}</Badge>
            </p>
            <div className="modal-actions">
              <Button
                disabled={busy}
                onClick={() => act(() => challengeService.setStatus(selected.id, 'VALIDATED'))}
              >
                {busy ? 'Working…' : 'Validate'}
              </Button>
              <Button
                variant="danger"
                disabled={busy}
                onClick={() => act(() => challengeService.setStatus(selected.id, 'REJECTED'))}
              >
                Reject
              </Button>
            </div>
          </>
        )}
        {kind === 'universities' && (
          <>
            <p>
              <b>Verification:</b> <Badge>{selected?.status}</Badge>
            </p>
            <Button
              disabled={busy || selected?.status === 'VERIFIED'}
              onClick={() => act(() => universityService.verify(selected.id))}
            >
              {selected?.status === 'VERIFIED' ? 'Institution verified' : 'Verify institution'}
            </Button>
          </>
        )}
      </Modal>
    </DashboardLayout>
  );
}
export function Analytics() {
  const [analytics, setAnalytics] = useState(),
    [stats, setStats] = useState(),
    [err, setErr] = useState('');
  useEffect(() => {
    Promise.all([adminService.getAnalytics(), adminService.getStats()])
      .then(([a, s]) => {
        setAnalytics(a);
        setStats(s);
      })
      .catch((e) => setErr(e.message));
  }, []);
  const universities = analytics?.universityParticipation || [],
    monthly = analytics?.monthly || [],
    totalChallenges = monthly.reduce((sum, m) => sum + m.value, 0);
  return (
    <DashboardLayout title="Platform analytics">
      {err && <div className="error">{err}</div>}
      <div className="stats">
        <StatCard
          label="Resolution rate"
          value={`${analytics?.resolutionRate ?? '–'}%`}
          note="Challenges marked resolved"
        />
        <StatCard
          label="Participating universities"
          value={analytics ? universities.length : '–'}
          note="With at least one project"
        />
        <StatCard
          label="Total challenges"
          value={analytics ? totalChallenges : '–'}
          note="All time"
        />
        <StatCard
          label="Validated challenges"
          value={stats?.validatedChallenges ?? '–'}
          note="Approved by government"
        />
      </div>
      <section className="grid two">
        <div className="panel chart">
          <h2>Monthly submissions</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#42689f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {!monthly.length && !err && <Empty text="No submissions recorded yet." />}
        </div>
        <div className="panel">
          <h2>Universities by project count</h2>
          {universities.length ? (
            universities.map((u) => (
              <p key={u.name}>
                <b>{u.name}</b>
                <br />
                <small>
                  {u.value} project{u.value === 1 ? '' : 's'} delivered
                </small>
              </p>
            ))
          ) : (
            <Empty text="No university projects recorded yet." />
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}
