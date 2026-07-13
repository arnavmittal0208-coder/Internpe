import React, { useContext } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { AppContext } from './context/AppContext';
import { AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import CoursesPage from './components/CoursesPage';
import CourseDashboard from './components/CourseDashboard';
import AdminDashboard from './components/AdminDashboard';
import AuthPage from './components/AuthPage';
import StudentDashboard from './components/StudentDashboard';
import { Shield, Heart } from 'lucide-react';

function CourseDashboardRedirect() {
  const { courseId } = useParams();
  const { lectures } = useContext(AppContext);
  const courseLectures = lectures.filter(l => l.courseId === courseId).sort((a, b) => a.index - b.index);
  if (courseLectures.length > 0) {
    return <Navigate to={`/courses/${courseId}/lessons/${courseLectures[0].id}`} replace />;
  }
  return <Navigate to={`/courses/${courseId}/tasks`} replace />;
}

function AdminProtectedRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="container" style={{ padding: '3rem 1rem' }}>Loading...</div>;
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

function StudentProtectedRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="container" style={{ padding: '3rem 1rem' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth?view=login" replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin/courses" replace />;
  }

  return children;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="app-layout">
      {/* Universal Sticky Navbar (Hidden for Admin Portal isolation) */}
      {!isAdminRoute && <Navbar />}

      {/* Main View Router */}
      <main className="main-content-flow" style={isAdminRoute ? { paddingTop: '2rem', paddingBottom: '2rem' } : {}}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          
          <Route path="/courses/:courseId" element={<StudentProtectedRoute><CourseDashboardRedirect /></StudentProtectedRoute>} />
          <Route path="/courses/:courseId/lessons/:lectureId" element={<StudentProtectedRoute><CourseDashboard activeTab="video" /></StudentProtectedRoute>} />
          <Route path="/courses/:courseId/tasks" element={<StudentProtectedRoute><CourseDashboard activeTab="tasks" /></StudentProtectedRoute>} />
          <Route path="/courses/:courseId/quizzes" element={<StudentProtectedRoute><CourseDashboard activeTab="quizzes" /></StudentProtectedRoute>} />
          
          <Route path="/dashboard" element={<Navigate to="/dashboard/continue-watching" replace />} />
          <Route path="/dashboard/:tab" element={<StudentProtectedRoute><StudentDashboard /></StudentProtectedRoute>} />

          <Route path="/admin" element={<Navigate to="/admin/courses" replace />} />
          <Route path="/auth" element={<AuthPage mode="student" />} />
          <Route path="/admin/login" element={<AuthPage mode="admin" />} />
          <Route path="/admin/courses" element={<AdminProtectedRoute><AdminDashboard activeTab="courses" /></AdminProtectedRoute>} />
          <Route path="/admin/videos" element={<AdminProtectedRoute><AdminDashboard activeTab="videos" /></AdminProtectedRoute>} />
          <Route path="/admin/quizzes" element={<AdminProtectedRoute><AdminDashboard activeTab="quizzes" /></AdminProtectedRoute>} />
          <Route path="/admin/tasks" element={<AdminProtectedRoute><AdminDashboard activeTab="tasks" /></AdminProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Premium Platform Footer (Hidden for Admin Portal isolation) */}
      {!isAdminRoute && (
        <footer className="footer-section">
          <div className="container footer-grid-layout">
            {/* Brand block */}
            <div className="footer-brand-block">
              <div className="logo-brand" onClick={() => navigate('/')}>
                <div className="logo-icon">
                  <span className="logo-text-gradient">Ip</span>
                </div>
                <span className="brand-name">Internpe</span>
              </div>
              <p className="footer-brand-desc">
                ISO Certified online educational academy bringing professional training and verified internships to your screens. Learn. Build. Grow. Get Hired.
              </p>
            </div>

            {/* Sitemap blocks */}
            <div className="footer-links-column">
              <h4>Quick Links</h4>
              <button className="footer-link-btn" onClick={() => navigate('/')}>Home</button>
              <button className="footer-link-btn" onClick={() => navigate('/courses')}>Courses</button>
              <button className="footer-link-btn disabled-nav-item" title="Coming soon in Phase 2">Internships</button>
              <button className="footer-link-btn disabled-nav-item" title="Coming soon in Phase 2">Explore</button>
            </div>

            {/* Legal column */}
            <div className="footer-links-column">
              <h4>Legal & Trust</h4>
              <a href="#" className="footer-link-btn">Terms of Service</a>
              <a href="#" className="footer-link-btn">Privacy Policy</a>
              <a href="#" className="footer-link-btn">Refund Guidelines</a>
              <span className="badge badge-success iso-badge">ISO 9001:2015</span>
            </div>

            {/* Support column */}
            <div className="footer-links-column">
              <h4>Support Hub</h4>
              <a href="mailto:support@internpe.co" className="footer-link-btn">support@internpe.co</a>
              <p className="support-phone">Helpline: +91 78785 35701</p>
              <div className="footer-admin-login-link">
                <button 
                  className="btn-text btn-footer-admin"
                  onClick={() => {
                    navigate('/admin/courses');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <Shield size={13} style={{marginRight:4}} />
                  <span>Config Portal</span>
                </button>
              </div>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <div className="container bottom-bar-container">
              <p>&copy; {new Date().getFullYear()} Internpe Academy. All rights reserved.</p>
              <p className="author-tag">
                <span>Made with</span>
                <Heart size={12} className="heart-icon" />
                <span>for coding candidates.</span>
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
