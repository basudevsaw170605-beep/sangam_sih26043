import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Landing, Login, Register, ForgotPassword } from '../pages/Auth';
import {
  CitizenDashboard,
  SubmitChallenge,
  ChallengeList,
  ChallengeDetails,
} from '../pages/Citizen';
import {
  UniversityDashboard,
  UniversityChallenges,
  UniversityProjects,
  ProjectDetails,
  Teams,
  Proposals,
} from '../pages/University';
import { AdminDashboard, AdminTable, Analytics } from '../pages/Admin';
const Guard = ({ role, children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === role ? children : <Navigate to={`/${user.role}/dashboard`} replace />;
};
const DASHBOARD_ROLES = ['citizen', 'university', 'admin'];
const Fallback = () => {
  const { user } = useAuth();
  if (user && !DASHBOARD_ROLES.includes(user.role))
    return (
      <div className="auth">
        <form>
          <h1>{user.role.charAt(0).toUpperCase() + user.role.slice(1)} workspace</h1>
          <p>
            You are signed in as {user.email}. A dedicated dashboard for your role is not part of
            this prototype yet.
          </p>
          <Link className="btn" to="/">
            Back to home
          </Link>
        </form>
      </div>
    );
  return <Navigate to={user ? `/${user.role}/dashboard` : '/'} replace />;
};
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ForgotPassword reset />} />
      <Route
        path="/citizen/dashboard"
        element={
          <Guard role="citizen">
            <CitizenDashboard />
          </Guard>
        }
      />
      <Route
        path="/citizen/submit"
        element={
          <Guard role="citizen">
            <SubmitChallenge />
          </Guard>
        }
      />
      <Route
        path="/citizen/challenges"
        element={
          <Guard role="citizen">
            <ChallengeList />
          </Guard>
        }
      />
      <Route
        path="/citizen/challenges/:id"
        element={
          <Guard role="citizen">
            <ChallengeDetails />
          </Guard>
        }
      />
      <Route
        path="/university/dashboard"
        element={
          <Guard role="university">
            <UniversityDashboard />
          </Guard>
        }
      />
      <Route
        path="/university/challenges"
        element={
          <Guard role="university">
            <UniversityChallenges />
          </Guard>
        }
      />
      <Route
        path="/university/challenges/:id"
        element={
          <Guard role="university">
            <UniversityChallenges review />
          </Guard>
        }
      />
      <Route
        path="/university/projects"
        element={
          <Guard role="university">
            <UniversityProjects />
          </Guard>
        }
      />
      <Route
        path="/university/projects/:id"
        element={
          <Guard role="university">
            <ProjectDetails />
          </Guard>
        }
      />
      <Route
        path="/university/teams"
        element={
          <Guard role="university">
            <Teams />
          </Guard>
        }
      />
      <Route
        path="/university/proposals"
        element={
          <Guard role="university">
            <Proposals />
          </Guard>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <Guard role="admin">
            <AdminDashboard />
          </Guard>
        }
      />
      {['challenges', 'universities', 'projects', 'users'].map((x) => (
        <Route
          key={x}
          path={`/admin/${x}`}
          element={
            <Guard role="admin">
              <AdminTable kind={x} />
            </Guard>
          }
        />
      ))}
      <Route
        path="/admin/analytics"
        element={
          <Guard role="admin">
            <Analytics />
          </Guard>
        }
      />
      <Route path="*" element={<Fallback />} />
    </Routes>
  );
}
