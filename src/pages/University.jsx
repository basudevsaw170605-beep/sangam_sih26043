import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  DashboardLayout,
  StatCard,
  Badge,
  Progress,
  SearchInput,
  Modal,
  Button,
} from '../components/common/UI';
import { challengeService, projectService } from '../services/api';
import { useAuth } from '../context/AuthContext';
export function UniversityDashboard() {
  const { user } = useAuth();
  return (
    <DashboardLayout title="University dashboard">
      <section className="welcome">
        <div>
          <p className="eyebrow">GOOD MORNING</p>
          <h2>{user.organization}</h2>
          <p>Turn research expertise into measurable community impact.</p>
        </div>
        <Link className="btn" to="/university/challenges">
          Review assigned challenges
        </Link>
      </section>
      <div className="stats">
        <StatCard label="Assigned challenges" value="08" note="2 need review" />
        <StatCard label="Active projects" value="06" note="Across 4 departments" />
        <StatCard label="Completed projects" value="14" note="Since joining" />
        <StatCard label="Active teams" value="09" note="42 student innovators" />
      </div>
      <section className="grid two">
        <div className="panel">
          <h2>Upcoming milestones</h2>
          <p>
            <b>Field sensor calibration</b>
            <br />
            <small>JalSakhi Water Monitoring · 04 Sep</small>
          </p>
          <p>
            <b>Accessibility audit</b>
            <br />
            <small>Barrier-Free Transit · 10 Sep</small>
          </p>
        </div>
        <div className="panel">
          <h2>Solution proposals</h2>
          <p>
            <Badge>DRAFT</Badge> Rural Water Monitoring Network
          </p>
          <p>
            <Badge>APPROVED</Badge> Inclusive Mobility Prototype
          </p>
          <Link className="text-link" to="/university/proposals">
            Manage proposals →
          </Link>
        </div>
      </section>
    </DashboardLayout>
  );
}
const DECIDED = ['ACCEPTED', 'REJECTED', 'RESOLVED', 'CLOSED'];
export function UniversityChallenges({ review = false }) {
  const [data, setData] = useState([]),
    [open, setOpen] = useState(false),
    [selected, setSelected] = useState(),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(''),
    [msg, setMsg] = useState();
  useEffect(() => {
    challengeService
      .getChallenges()
      .then(setData)
      .catch((e) => setMsg({ tone: 'error', text: e.message }))
      .finally(() => setLoading(false));
  }, []);
  const locked = !selected?.assignedUniversity || DECIDED.includes(selected?.status);
  const decide = async (target) => {
    if (busy || !selected || locked) return;
    setBusy(selected.id);
    setMsg();
    try {
      const updated =
        target === 'ACCEPTED'
          ? await challengeService.accept(selected.id)
          : await challengeService.reject(selected.id);
      setData((rows) => rows.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
      setSelected(updated);
      setOpen(false);
      setMsg({ tone: 'success', text: `Challenge ${updated.status.toLowerCase()} successfully.` });
    } catch (e) {
      setMsg({ tone: 'error', text: e.message });
    } finally {
      setBusy('');
    }
  };
  return (
    <DashboardLayout title={review ? 'Challenge review' : 'Assigned challenges'}>
      <div className="panel">
        {msg && <p className={msg.tone}>{msg.text}</p>}
        {loading ? (
          <div className="empty">Loading assigned challenges…</div>
        ) : data.length === 0 ? (
          <div className="empty">No challenges are currently available to your university.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Challenge</th>
                  <th>Location</th>
                  <th>Priority</th>
                  <th>Match score</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.map((x) => (
                  <tr key={x.id}>
                    <td>
                      <b>{x.title}</b>
                      <small>{x.category}</small>
                    </td>
                    <td>{x.district}</td>
                    <td>
                      <Badge>{x.priority}</Badge>
                    </td>
                    <td>
                      <b>{x.matchScore ?? '—'}</b>
                    </td>
                    <td>
                      <Badge>{x.status}</Badge>
                    </td>
                    <td>
                      <button
                        className="text-btn"
                        disabled={busy === x.id}
                        onClick={() => {
                          setSelected(x);
                          setOpen(true);
                        }}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={open} onClose={() => !busy && setOpen(false)} title="Challenge review">
        <p className="demo">Assigned challenge · {selected?.university || 'Not assigned'}</p>
        <h3>{selected?.title}</h3>
        <p>
          Category: <b>{selected?.category}</b> · District: <b>{selected?.district}</b>
        </p>
        <p>
          Match score: <b>{selected?.matchScore ?? '—'}</b> · AI confidence:{' '}
          <b>{selected?.aiConfidence != null ? `${selected.aiConfidence}%` : '—'}</b> · Current
          status: <Badge>{selected?.status}</Badge>
        </p>
        {locked && (
          <p className="error">
            {selected?.assignedUniversity
              ? `You already ${selected.status.toLowerCase()} this challenge.`
              : 'This challenge is not assigned to your university.'}
          </p>
        )}
        <div className="modal-actions">
          <Button type="button" onClick={() => decide('ACCEPTED')} disabled={!!busy || locked}>
            {busy ? 'Processing…' : 'Accept challenge'}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => decide('REJECTED')}
            disabled={!!busy || locked}
          >
            {busy ? 'Processing…' : 'Reject challenge'}
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
export function UniversityProjects() {
  const [data, setData] = useState([]),
    [q, setQ] = useState('');
  useEffect(() => {
    projectService.getProjects().then(setData);
  }, []);
  return (
    <DashboardLayout title="My projects">
      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} />
      </div>
      <div className="cards">
        {data
          .filter((x) => JSON.stringify(x).toLowerCase().includes(q.toLowerCase()))
          .map((x) => (
            <article className="project-card" key={x.id}>
              <Badge>{x.status}</Badge>
              <h3>{x.title}</h3>
              <p>{x.challenge}</p>
              <Progress value={x.progress} />
              <small>
                {x.progress}% · Next: {x.milestone}
              </small>
              <Link className="text-link" to={`/university/projects/${x.id}`}>
                Open project →
              </Link>
            </article>
          ))}
      </div>
    </DashboardLayout>
  );
}
export function ProjectDetails() {
  const { id } = useParams(),
    [x, setX] = useState();
  useEffect(() => {
    projectService.getById(id).then(setX);
  }, [id]);
  return (
    <DashboardLayout title="Project details">
      {x ? (
        <>
          <article className="detail-head">
            <div>
              <Badge>{x.status}</Badge>
              <h2>{x.title}</h2>
              <p>{x.challenge}</p>
              <p>
                Team: {x.team} · Faculty mentor: {x.mentor}
              </p>
            </div>
            <div>
              <strong>{x.progress}%</strong>
              <Progress value={x.progress} />
            </div>
          </article>
          <section className="grid two">
            <div className="panel">
              <h2>Project lifecycle</h2>
              <ol className="timeline">
                <li className="done">Planning</li>
                <li className="done">Research & design</li>
                <li className="done">Prototype</li>
                <li>Testing</li>
                <li>Pilot</li>
                <li>Completed</li>
              </ol>
            </div>
            <div className="panel">
              <h2>Next milestone</h2>
              <h3>{x.milestone}</h3>
              <p>Deadline: {x.deadline}</p>
              <p>
                Documents, testing results and pilot evidence will be available when connected to
                the backend.
              </p>
            </div>
          </section>
        </>
      ) : (
        <div className="panel">Loading project…</div>
      )}
    </DashboardLayout>
  );
}
export function Teams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([
      {
        name: 'AquaTech Collective',
        members: 6,
        leader: 'Not assigned',
        mentor: 'Dr. R. Sinha',
        institution: user.organization || 'Not specified',
        challenge: 'Not specified',
        status: 'Active',
        createdDate: 'Not specified',
        description: '',
      },
    ]),
    [open, setOpen] = useState(false),
    [form, setForm] = useState({
      name: '',
      leader: '',
      mentor: '',
      institution: user.organization || '',
      challenge: '',
      description: '',
    });
  const updateForm = (field, value) => setForm({ ...form, [field]: value });
  const createTeam = () => {
    if (!form.name.trim()) return;
    setTeams([
      ...teams,
      {
        name: form.name.trim(),
        members: form.leader.trim() ? 1 : 0,
        leader: form.leader.trim() || 'Not assigned',
        mentor: form.mentor.trim() || 'Not assigned',
        institution: form.institution.trim() || 'Not specified',
        challenge: form.challenge.trim() || 'Not specified',
        status: 'Active',
        createdDate: new Date().toLocaleDateString(),
        description: form.description.trim(),
      },
    ]);
    setForm({
      name: '',
      leader: '',
      mentor: '',
      institution: user.organization || '',
      challenge: '',
      description: '',
    });
    setOpen(false);
  };
  return (
    <DashboardLayout title="Team management">
      <Button onClick={() => setOpen(true)}>+ Create team</Button>
      <div className="cards">
        {teams.map((t) => (
          <article className="project-card" key={t.name}>
            <h3>{t.name}</h3>
            <p>Team Leader: {t.leader || 'Not assigned'}</p>
            <p>Members: {t.members}</p>
            <p>Mentor: {t.mentor || 'Not assigned'}</p>
            <p>Institution: {t.institution || 'Not specified'}</p>
            <p>Challenge: {t.challenge || 'Not specified'}</p>
            <p>
              Status: <Badge>{t.status || 'Not assigned'}</Badge>
            </p>
            <p>Created: {t.createdDate || 'Not specified'}</p>
            {t.description && <p>Description: {t.description}</p>}
            <button
              className="text-btn"
              onClick={() =>
                setTeams(
                  teams.map((a) => (a.name === t.name ? { ...a, members: a.members + 1 } : a))
                )
              }
            >
              Add member
            </button>
          </article>
        ))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Create team">
        <label>
          Team name
          <input value={form.name} onChange={(e) => updateForm('name', e.target.value)} required />
        </label>
        <label>
          Team leader
          <input value={form.leader} onChange={(e) => updateForm('leader', e.target.value)} />
        </label>
        <label>
          Mentor
          <input value={form.mentor} onChange={(e) => updateForm('mentor', e.target.value)} />
        </label>
        <label>
          Institution / University
          <input
            value={form.institution}
            onChange={(e) => updateForm('institution', e.target.value)}
          />
        </label>
        <label>
          Challenge / Problem Statement
          <input value={form.challenge} onChange={(e) => updateForm('challenge', e.target.value)} />
        </label>
        <label>
          Description (optional)
          <textarea
            value={form.description}
            onChange={(e) => updateForm('description', e.target.value)}
          />
        </label>
        <Button onClick={createTeam}>Create team</Button>
      </Modal>
    </DashboardLayout>
  );
}
export function Proposals() {
  const [tab, setTab] = useState('Draft'),
    [saved, setSaved] = useState(false);
  return (
    <DashboardLayout title="Solution proposals">
      <div className="tabs">
        {['Draft', 'Submitted', 'Approved', 'Rejected'].map((x) => (
          <button className={tab === x ? 'active' : ''} onClick={() => setTab(x)} key={x}>
            {x}
          </button>
        ))}
      </div>
      <form
        className="form-panel"
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(true);
        }}
      >
        <h2>{tab} proposal</h2>
        <div className="form-grid">
          <label>
            Project title
            <input required />
          </label>
          <label>
            Estimated duration
            <input required placeholder="e.g. 6 months" />
          </label>
          <label className="wide">
            Proposed solution
            <textarea required />
          </label>
          <label className="wide">
            Expected impact
            <textarea required />
          </label>
        </div>
        <Button>Save draft</Button>{' '}
        <Button variant="secondary" type="button" onClick={() => setSaved(true)}>
          Submit proposal
        </Button>
        {saved && <p className="success">Proposal saved in this frontend demo.</p>}
      </form>
    </DashboardLayout>
  );
}
