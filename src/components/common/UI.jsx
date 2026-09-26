import {
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  ClipboardList,
  FileText,
  Flag,
  FolderKanban,
  Home,
  Lightbulb,
  LogOut,
  Menu,
  Network,
  Search,
  Send,
  UsersRound,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
export const Badge = ({ children }) => (
  <span className={`badge ${String(children).toLowerCase().replaceAll(' ', '-')}`}>
    {String(children).replaceAll('_', ' ')}
  </span>
);
export const Button = ({ children, variant = '', ...p }) => (
  <button className={`btn ${variant}`} {...p}>
    {children}
  </button>
);
export const StatCard = ({ label, value, note }) => (
  <article className="stat">
    <span>{label}</span>
    <strong>{value}</strong>
    <small>{note}</small>
  </article>
);
export const Progress = ({ value }) => (
  <div className="progress" aria-label={`${value}% complete`}>
    <i style={{ width: `${value}%` }} />
  </div>
);
export const SearchInput = ({ value, onChange, placeholder = 'Search' }) => (
  <label className="search">
    <Search size={17} />
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  </label>
);
export const Modal = ({ open, onClose, title, children }) =>
  open ? (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className="icon close" onClick={onClose}>
          <X />
        </button>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  ) : null;
const menus = {
  citizen: [
    ['Dashboard', '/citizen/dashboard'],
    ['My Challenges', '/citizen/challenges'],
    ['Submit Challenge', '/citizen/submit'],
  ],
  university: [
    ['Dashboard', '/university/dashboard'],
    ['Assigned Challenges', '/university/challenges'],
    ['My Projects', '/university/projects'],
    ['Teams', '/university/teams'],
    ['Proposals', '/university/proposals'],
  ],
  admin: [
    ['Dashboard', '/admin/dashboard'],
    ['Challenges', '/admin/challenges'],
    ['Universities', '/admin/universities'],
    ['Projects', '/admin/projects'],
    ['Users', '/admin/users'],
    ['Analytics', '/admin/analytics'],
  ],
};
const menuIcons = {
  Dashboard: Home,
  'My Challenges': Flag,
  'Submit Challenge': Send,
  'Assigned Challenges': ClipboardList,
  'My Projects': FolderKanban,
  Teams: UsersRound,
  Proposals: FileText,
  Challenges: Flag,
  Universities: Building2,
  Projects: FolderKanban,
  Users: UsersRound,
  Analytics: BarChart3,
};
export function DashboardLayout({ children, title }) {
  const [mobile, setMobile] = useState(false);
  const { user, logout } = useAuth();
  const { items, markRead } = useNotifications();
  const [showNotes, setShowNotes] = useState(false);
  const nav = useNavigate();
  return (
    <div className="shell">
      <aside className={mobile ? 'sidebar open' : 'sidebar'}>
        <button className="mobile-close" onClick={() => setMobile(false)}>
          <X />
        </button>
        <div className="brand sidebar-brand">
          <span className="brand-mark" aria-hidden="true">
            <Network size={21} />
          </span>
          <b>SangamSetu</b>
        </div>
        <p className="role-label">{user.role} workspace</p>
        <nav>
          {menus[user.role].map(([n, to]) => {
            const Icon = menuIcons[n] || Lightbulb;
            return (
              <NavLink key={to} to={to} onClick={() => setMobile(false)}>
                <Icon size={20} aria-hidden="true" />
                <span>{n}</span>
              </NavLink>
            );
          })}
        </nav>
        <button
          className="logout"
          onClick={() => {
            logout();
            nav('/login');
          }}
        >
          <LogOut size={20} aria-hidden="true" /> Logout
        </button>
      </aside>
      <main>
        <header>
          <button className="icon hamburger" onClick={() => setMobile(true)}>
            <Menu />
          </button>
          <div>
            <p className="eyebrow">SangamSetu</p>
            <h1>{title}</h1>
          </div>
          <div className="header-actions">
            <div className="notification">
              <button
                className="icon"
                onClick={() => setShowNotes(!showNotes)}
                aria-label="Notifications"
              >
                <Bell />
                {items.filter((x) => !x.read).length > 0 && (
                  <em>{items.filter((x) => !x.read).length}</em>
                )}
              </button>
              {showNotes && (
                <div className="note-pop">
                  <b>Notifications</b>
                  {items.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={n.read ? 'read' : ''}
                    >
                      {n.text}
                      <small>{n.time}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="profile">
              <div>
                {user.name
                  .split(' ')
                  .map((x) => x[0])
                  .slice(0, 2)}
              </div>
              <span>
                {user.name}
                <small>{user.organization}</small>
              </span>
              <ChevronDown size={16} />
            </div>
          </div>
        </header>
        <div className="page">{children}</div>
      </main>
    </div>
  );
}
export const Empty = ({ text = 'No records found.' }) => <div className="empty">{text}</div>;
