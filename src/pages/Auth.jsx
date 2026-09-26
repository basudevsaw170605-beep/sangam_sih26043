import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Droplets,
  GraduationCap,
  HeartPulse,
  MapPin,
  Menu,
  Network,
  Search,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  dashboardProblems,
  getCategoryBreakdown,
  getDashboardMetrics,
} from '../data/dashboardMockData';
import JharkhandDistrictMap from '../components/JharkhandDistrictMap';
import { challengeService } from '../services/api';
const nav = [
  ['Home', '#home'],
  ['Problems', '#map'],
  ['Innovation', '#how-it-works'],
  ['Institutions', '#metrics'],
  ['Dashboard', '#metrics'],
  ['About', '#about'],
  ['Contact', '#contact'],
];

export function Landing() {
  const [category, setCategory] = useState('All categories'),
    [district, setDistrict] = useState('Ranchi'),
    [menuOpen, setMenuOpen] = useState(false),
    [problems, setProblems] = useState(dashboardProblems);
  useEffect(() => {
    challengeService
      .getChallenges('limit=100')
      .then((data) => data.length && setProblems(data))
      .catch(() => {});
  }, []);
  const metrics = getDashboardMetrics(problems),
    categories = getCategoryBreakdown(problems);
  return (
    <div className="landing">
      <nav className="landing-nav">
        <a className="landing-brand" href="#home">
          <span className="landing-logo">
            <Network size={20} />
          </span>
          <span>
            <b>SangamSetu</b>
            <small>People · Knowledge · Impact</small>
          </span>
        </a>
        <button className="landing-menu" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X /> : <Menu />}
        </button>
        <div className={`landing-nav-links ${menuOpen ? 'open' : ''}`}>
          {nav.map(([label, target]) => (
            <a key={label} href={target} onClick={() => setMenuOpen(false)}>
              {label}
            </a>
          ))}
        </div>
        <div className="landing-actions">
          <label className="landing-search">
            <Search size={16} />
            <input placeholder="Search" />
          </label>
          <Link className="login-link" to="/login">
            Login
          </Link>
          <Link className="landing-signup" to="/register">
            Sign Up
          </Link>
        </div>
      </nav>
      <main id="home">
        <section className="hero-dashboard">
          <div className="hero-copy">
            <div className="hero-orb orb-one" />
            <div className="hero-orb orb-two" />
            <p className="landing-eyebrow">JHARKHAND · COLLABORATIVE INNOVATION</p>
            <h1>
              From societal challenges to <em>real-world solutions.</em>
            </h1>
            <p>
              One trusted platform connecting citizens, universities and government to solve what
              matters locally.
            </p>
            <div className="hero-buttons">
              <Link className="hero-primary" to="/register">
                Submit a challenge <ArrowRight size={17} />
              </Link>
              <a className="hero-secondary" href="#map">
                Explore innovation
              </a>
            </div>
            <div className="stakeholders">
              {[
                [UsersRound, 'Citizens', 'Raise Issues'],
                [Building2, 'Government', 'Validates & Routes'],
                [GraduationCap, 'Universities', 'Innovate Solutions'],
                [Sparkles, 'Industry/CSR', 'Supports Implementation'],
              ].map(([Icon, title, text]) => (
                <div key={title}>
                  <Icon size={18} />
                  <span>
                    <b>{title}</b>
                    <small>{text}</small>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <section id="metrics" className="metrics-card">
            <div className="card-heading">
              <div>
                <span>PLATFORM OVERVIEW</span>
                <h2>Key Metrics</h2>
              </div>
              <span className="live-dot">Live prototype</span>
            </div>
            <div className="metrics-grid">
              {[
                [metrics.total, 'Total Problems', 'teal'],
                [metrics.active, 'Active Problems', 'blue'],
                [metrics.resolved, 'Resolved Problems', 'green'],
                [metrics.critical, 'Critical Problems', 'orange'],
                [metrics.districts, 'Districts Covered', 'purple'],
                [metrics.institutions, 'Institutions Involved', 'navy'],
                [metrics.people.toLocaleString(), 'People Impacted', 'gold'],
              ].map(([value, label, tone]) => (
                <article className={`metric ${tone}`} key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </article>
              ))}
            </div>
          </section>
        </section>
        <section className="dashboard-content">
          <div className="map-column">
            <JharkhandDistrictMap
              problems={problems}
              category={category}
              onCategoryChange={setCategory}
              selectedDistrict={district}
              onDistrictChange={setDistrict}
              categories={categories}
            />
            {/* Legacy decorative map removed: this card now renders real district GeoJSON above. */}
            {false && (
              <article id="map" className="dashboard-card map-card">
                <div className="card-heading">
                  <div>
                    <span>STATEWIDE VIEW</span>
                    <h2>
                      Problem Hotspot Map <small>(Jharkhand)</small>
                    </h2>
                  </div>
                  <div className="map-filters">
                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                      {['All categories', ...categories.map((x) => x.category)].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                    <select defaultValue="All time">
                      <option>All time</option>
                      <option>Last 90 days</option>
                      <option>Last 30 days</option>
                    </select>
                  </div>
                </div>
                <div className="map-viewport">
                  <div className="map-legend">
                    <b>HOTSPOT DENSITY</b>
                    <span>
                      <i className="very-high" />
                      Very High
                    </span>
                    <span>
                      <i className="high" />
                      High
                    </span>
                    <span>
                      <i className="medium" />
                      Medium
                    </span>
                    <span>
                      <i className="low" />
                      Low
                    </span>
                  </div>
                  <div className="map-canvas" style={{ transform: `scale(${scale})` }}>
                    {places.map(([name, x, y]) => {
                      const s = getDistrictStats(name, mapProblems);
                      return (
                        <button
                          className={`district-shape ${district === name ? 'selected' : ''}`}
                          key={name}
                          style={{ left: `${x}%`, top: `${y}%` }}
                          onClick={() => setDistrict(name)}
                        >
                          <span>{name.replace(' Singhbhum', '').replace(' Kharsawan', '')}</span>
                          {s.problems > 0 && (
                            <i
                              className={`hotspot ${s.critical ? 'very-high' : 'high'}`}
                              style={{ '--size': `${14 + s.problems * 4}px` }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="map-zoom">
                    <button onClick={() => setScale(Math.min(1.2, scale + 0.1))}>
                      <Plus size={17} />
                    </button>
                    <button onClick={() => setScale(Math.max(0.8, scale - 0.1))}>
                      <Minus size={17} />
                    </button>
                  </div>
                  <aside className="district-detail">
                    <b>{district}</b>
                    <span>{detail.problems} reported problems</span>
                    <div>
                      <strong>{detail.critical}</strong>
                      <small>Very high</small>
                      <strong>{detail.resolved}</strong>
                      <small>Resolved</small>
                    </div>
                    <small>{detail.people.toLocaleString()} people potentially impacted</small>
                  </aside>
                </div>
              </article>
            )}
          </div>
          <aside className="insight-column">
            <article className="dashboard-card category-card">
              <div className="card-heading">
                <div>
                  <span>DISTRIBUTION</span>
                  <h2>Top Problem Categories</h2>
                </div>
                <Droplets size={20} />
              </div>
              {categories.map((item, index) => (
                <div className="category-row" key={item.category}>
                  <div>
                    <i className={`category-${index}`} />
                    {item.category}
                  </div>
                  <b>{item.percentage}%</b>
                  <span>
                    <i className={`category-${index}`} style={{ width: `${item.percentage}%` }} />
                  </span>
                </div>
              ))}
            </article>
            <article className="dashboard-card impact-card">
              <div className="card-heading">
                <div>
                  <span>OUTCOMES</span>
                  <h2>Impact &amp; Performance</h2>
                </div>
                <HeartPulse size={20} />
              </div>
              <div className="impact-rate">
                <div
                  className="rate-ring"
                  style={{ '--rate': `${metrics.resolutionRate * 3.6}deg` }}
                >
                  <b>{metrics.resolutionRate}%</b>
                </div>
                <div>
                  <b>Resolution Rate</b>
                  <small>Problems marked solved</small>
                </div>
              </div>
              <div className="impact-stats">
                <div>
                  <Clock3 />
                  <span>
                    <b>{metrics.avgResolutionDays} days</b>
                    <small>Avg. resolution time</small>
                  </span>
                </div>
                <div>
                  <UsersRound />
                  <span>
                    <b>{metrics.people.toLocaleString()}</b>
                    <small>People impacted</small>
                  </span>
                </div>
              </div>
            </article>
          </aside>
        </section>
        <section id="how-it-works" className="how-new">
          <div className="how-title">
            <span>COLLABORATION MADE SIMPLE</span>
            <h2>How It Works</h2>
            <p>A clear route from a local issue to a measured, community-led outcome.</p>
          </div>
          <div className="how-steps">
            {[
              [
                MapPin,
                '01',
                'Raise a challenge',
                'Citizens share evidence-backed challenges from their communities.',
              ],
              [
                CheckCircle2,
                '02',
                'Validate & match',
                'Government validates needs and routes them to capable institutions.',
              ],
              [
                Sparkles,
                '03',
                'Build impact',
                'University teams develop, pilot and measure lasting solutions.',
              ],
            ].map(([Icon, num, title, text], index) => (
              <article key={num}>
                <div className="step-icon">
                  <Icon size={24} />
                </div>
                {index < 2 && <ArrowRight className="step-arrow" />}
                <b>{num}</b>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer id="contact" className="landing-footer">
        <div id="about">
          <div className="landing-brand">
            <span className="landing-logo">
              <Network size={20} />
            </span>
            <b>SangamSetu</b>
          </div>
          <p>Digital Platform for a Better Jharkhand</p>
        </div>
        <div className="footer-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
        </div>
        <div className="footer-social">
          <span>Connect with impact</span>
          <div>
            <a href="#linkedin">in</a>
            <a href="#twitter">𝕏</a>
            <a href="#instagram">◎</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function Login() {
  const { login } = useAuth(),
    nav = useNavigate();
  const [form, setForm] = useState({ email: 'citizen@demo.com', password: 'password123' }),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(form.email, form.password);
      nav(`/${u.role}/dashboard`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="auth">
      <form onSubmit={submit}>
        <div className="brand">
          <b>SangamSetu</b>
        </div>
        <h1>Welcome back</h1>
        <p>Sign in to continue your innovation journey.</p>
        {error && <div className="error">{error}</div>}
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </label>
        <button className="btn" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <Link to="/forgot-password">Forgot password?</Link>
        <hr />
        <small>
          Demo accounts: citizen@demo.com · university@demo.com · admin@demo.com
          <br />
          Password: password123
        </small>
        <p>
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
export function Register() {
  const { register } = useAuth(),
    nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', organization: '' }),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await register(f);
      nav(`/${u.role}/dashboard`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="auth">
      <form onSubmit={submit}>
        <h1>Create your account</h1>
        <p>Start collaborating on local impact.</p>
        {error && <div className="error">{error}</div>}
        {[
          ['name', 'Full name'],
          ['email', 'Email'],
          ['organization', 'Organization / community'],
          ['password', 'Password'],
        ].map(([k, l]) => (
          <label key={k}>
            {l}
            <input
              type={k === 'password' ? 'password' : k === 'email' ? 'email' : 'text'}
              required
              minLength={k === 'password' ? 8 : undefined}
              value={f[k]}
              onChange={(e) => setF({ ...f, [k]: e.target.value })}
            />
          </label>
        ))}
        <button className="btn" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
        <p>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
export function ForgotPassword({ reset }) {
  return (
    <div className="auth">
      <form>
        <h1>{reset ? 'Set a new password' : 'Reset your password'}</h1>
        <p>
          {reset
            ? 'Choose a secure password for your account.'
            : 'Enter your email and we’ll send reset instructions in the connected backend.'}
        </p>
        <label>
          {reset ? 'New password' : 'Email'}
          <input type={reset ? 'password' : 'email'} required />
        </label>
        <button className="btn">{reset ? 'Update password' : 'Send instructions'}</button>
        <Link to="/login">Back to sign in</Link>
      </form>
    </div>
  );
}
