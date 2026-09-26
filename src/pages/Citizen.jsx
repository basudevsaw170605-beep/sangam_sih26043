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
  Empty,
} from '../components/common/UI';
import { challengeService, citizenService } from '../services/api';
import { useAuth } from '../context/AuthContext';
const ChallengeCard = ({ x }) => (
  <article className="challenge-card">
    <div>
      <Badge>{x.status}</Badge>
      <Badge>{x.priority}</Badge>
    </div>
    <h3>{x.title}</h3>
    <p>
      {x.category} · {x.district} · {x.date}
    </p>
    <Progress value={x.progress} />
    <small>
      {x.progress}% complete {x.university && ` · ${x.university}`}
    </small>
    <Link className="text-link" to={`/citizen/challenges/${x.id}`}>
      View details →
    </Link>
  </article>
);
export function CitizenDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState([]),
    [stats, setStats] = useState(),
    [err, setErr] = useState('');
  useEffect(() => {
    citizenService
      .getDashboard()
      .then((r) => {
        setData(r.challenges);
        setStats(r.stats);
      })
      .catch((e) => setErr(e.message));
  }, []);
  const districts = new Set(data.map((x) => x.district).filter(Boolean)).size;
  return (
    <DashboardLayout title="Citizen dashboard">
      <section className="welcome">
        <div>
          <p className="eyebrow">GOOD MORNING, {user.name.split(' ')[0].toUpperCase()}</p>
          <h2>Help turn local challenges into real solutions.</h2>
        </div>
        <Link className="btn" to="/citizen/submit">
          + Submit new challenge
        </Link>
      </section>
      {err && <div className="error">{err}</div>}
      <div className="stats">
        <StatCard
          label="Total submitted"
          value={stats ? stats.totalSubmitted : '–'}
          note={
            districts
              ? `Across ${districts} district${districts === 1 ? '' : 's'}`
              : 'No districts yet'
          }
        />
        <StatCard
          label="Under review"
          value={stats ? stats.underReview : '–'}
          note="Awaiting validation"
        />
        <StatCard
          label="In progress"
          value={stats ? stats.inProgress : '–'}
          note="With university teams"
        />
        <StatCard
          label="Solved"
          value={stats ? stats.solved : '–'}
          note="Community impact delivered"
        />
      </div>
      <section className="grid two">
        <div className="panel">
          <div className="section-title">
            <h2>Recent challenges</h2>
            <Link to="/citizen/challenges">View all</Link>
          </div>
          {data.length ? (
            data.slice(0, 3).map((x) => <ChallengeCard key={x.id} x={x} />)
          ) : (
            <Empty text="No challenges submitted yet" />
          )}
        </div>
        <div className="panel">
          <h2>Recent activity</h2>
          {data.length ? (
            <div className="activity">
              {data.slice(0, 4).map((x) => (
                <p key={x.id}>
                  <b>{x.title}</b>
                  <br />
                  <small>
                    {x.status} · {x.category} · {x.date}
                  </small>
                </p>
              ))}
            </div>
          ) : (
            <Empty text="Your submissions and their progress will appear here." />
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}
export function ChallengeList() {
  const [data, setData] = useState([]),
    [q, setQ] = useState(''),
    [err, setErr] = useState(''),
    [status, setStatus] = useState('ALL');
  useEffect(() => {
    citizenService
      .getDashboard()
      .then((r) => setData(r.challenges))
      .catch((e) => setErr(e.message));
  }, []);
  const shown = data.filter(
    (x) =>
      (status === 'ALL' || x.status === status) &&
      JSON.stringify(x).toLowerCase().includes(q.toLowerCase())
  );
  return (
    <DashboardLayout title="My challenges">
      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <Link className="btn" to="/citizen/submit">
          Submit challenge
        </Link>
      </div>
      <div className="cards">
        {err && <div className="error">{err}</div>}
        {shown.length ? (
          shown.map((x) => <ChallengeCard key={x.id} x={x} />)
        ) : (
          <Empty
            text={
              data.length ? 'No challenges match those filters.' : 'No challenges submitted yet'
            }
          />
        )}
      </div>
    </DashboardLayout>
  );
}
export function SubmitChallenge() {
  const nav = useNavigate(),
    [f, setF] = useState({
      title: '',
      description: '',
      category: 'Water Resources',
      district: 'Ranchi',
      block: '',
      affected: '',
      urgency: 'medium',
    }),
    [file, setFile] = useState(),
    [result, setResult] = useState(),
    [loading, setLoading] = useState(false),
    [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    if (f.description.length < 30)
      return setErr('Please describe the challenge in at least 30 characters.');
    setErr('');
    setLoading(true);
    try {
      setResult(
        await challengeService.create(
          {
            ...f,
            affected: Number(f.affected) || 0,
          },
          file
        )
      );
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <DashboardLayout title="Submit a challenge">
      <form className="form-panel" onSubmit={submit}>
        <p className="eyebrow">STEP 1 OF 1 · COMMUNITY CHALLENGE</p>
        <h2>Tell us what needs to change</h2>
        {err && <div className="error">{err}</div>}
        <div className="form-grid">
          <label>
            Challenge title
            <input
              required
              value={f.title}
              onChange={(e) => setF({ ...f, title: e.target.value })}
            />
          </label>
          <label>
            Category
            <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
              {[
                'Water Resources',
                'Agriculture',
                'Education',
                'Healthcare',
                'Environment',
                'Accessibility',
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="wide">
            Describe the problem
            <textarea
              required
              maxLength="1200"
              value={f.description}
              onChange={(e) => setF({ ...f, description: e.target.value })}
            />
            <small>{f.description.length}/1200 characters</small>
          </label>
          <label>
            District
            <select value={f.district} onChange={(e) => setF({ ...f, district: e.target.value })}>
              {['Ranchi', 'Dhanbad', 'Bokaro', 'Hazaribagh', 'Deoghar', 'Palamu'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Block / locality
            <input
              required
              value={f.block}
              onChange={(e) => setF({ ...f, block: e.target.value })}
            />
          </label>
          <label>
            Affected people
            <input
              type="number"
              className="affected-people-input"
              min="1"
              step="1"
              placeholder="Enter number of affected people"
              value={f.affected}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^[1-9]\d*$/.test(value)) setF({ ...f, affected: value });
              }}
              onKeyDown={(e) => {
                if (['-', '+', '.', 'e', 'E'].includes(e.key)) e.preventDefault();
              }}
            />
          </label>
          <label>
            Urgency
            <select value={f.urgency} onChange={(e) => setF({ ...f, urgency: e.target.value })}>
              <option>low</option>
              <option>medium</option>
              <option>high</option>
            </select>
          </label>
          <label className="wide">
            Evidence (image, video, PDF)
            <input
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files[0])}
            />
            {file && <small>Selected: {file.name}</small>}
          </label>
        </div>
        <button className="btn" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit for validation'}
        </button>
      </form>
      <Modal open={!!result} title="Challenge submitted" onClose={() => nav('/citizen/challenges')}>
        <p>
          <b>{result?.id}</b>
        </p>
        <Badge>SUBMITTED</Badge>
        <p>Your challenge has been submitted successfully and will go through validation.</p>
        <Button onClick={() => nav('/citizen/challenges')}>View my challenges</Button>
      </Modal>
    </DashboardLayout>
  );
}
export function ChallengeDetails() {
  const { id } = useParams(),
    [x, setX] = useState(),
    [err, setErr] = useState('');
  useEffect(() => {
    setX(undefined);
    setErr('');
    challengeService
      .getById(id)
      .then(setX)
      .catch((e) => setErr(e.message));
  }, [id]);
  if (err)
    return (
      <DashboardLayout title="Challenge details">
        <div className="panel">
          <div className="error">{err}</div>
        </div>
      </DashboardLayout>
    );
  if (!x)
    return (
      <DashboardLayout title="Challenge details">
        <div className="panel">Loading challenge…</div>
      </DashboardLayout>
    );
  const steps = [
    'Submitted',
    'Under Review',
    'AI Classification',
    'Validation',
    'University Assigned',
    'Project Started',
    'Solution Development',
    'Prototype',
    'Testing',
    'Pilot',
    'Solved',
  ];
  return (
    <DashboardLayout title="Challenge details">
      <article className="detail-head">
        <div>
          <Badge>{x.status}</Badge>
          <h2>{x.title}</h2>
          <p>{x.description}</p>
          <p>
            {x.category} · {x.district} · Submitted {x.date}
          </p>
        </div>
        <div>
          <strong>{x.progress}%</strong>
          <Progress value={x.progress} />
          <small>Current progress</small>
        </div>
      </article>
      <section className="grid two">
        <div className="panel">
          <h2>Journey to solution</h2>
          <ol className="timeline">
            {steps.map((s, i) => (
              <li className={i < 6 ? 'done' : ''} key={s}>
                {s}
              </li>
            ))}
          </ol>
        </div>
        <div className="panel">
          <h2>Assignment & impact</h2>
          <p>
            <b>Assigned university:</b> {x.university || 'Awaiting routing'}
          </p>
          <p>
            <b>Priority:</b> {x.priority}
          </p>
          <p>
            <b>Potential beneficiaries:</b> {x.affected?.toLocaleString()}
          </p>
          <p>
            <b>Demo AI confidence:</b> {x.aiConfidence}%
          </p>
        </div>
      </section>
    </DashboardLayout>
  );
}
