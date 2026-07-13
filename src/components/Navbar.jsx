import React, { useContext, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { BookOpen, Award, Compass, Search, Shield, LogOut, ChevronDown, User, Play, CheckSquare, FileText, Settings } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { logout, user, isAuthenticated } = useContext(AuthContext);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const searchQuery = searchParams.get('search') || '';
  const isCoursesActive = location.pathname.startsWith('/courses');
  const isInsideCourse = /^\/courses\/[^\/]+\/(lessons|tasks|quizzes)/.test(location.pathname);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    if (isInsideCourse) {
      if (query) {
        navigate(`${location.pathname}?search=${encodeURIComponent(query)}`);
      } else {
        navigate(location.pathname);
      }
    } else {
      if (query) {
        navigate(`/courses?search=${encodeURIComponent(query)}`);
      } else {
        navigate(`/courses`);
      }
    }
  };

  return (
    <header className="navbar-header">
      <div className="container navbar-container">
        {/* Logo and Brand */}
        <div className="logo-brand" onClick={() => navigate('/')}>
          <div className="logo-icon">
            <span className="logo-text-gradient">Ip</span>
          </div>
          <span className="brand-name">Internpe</span>
        </div>

        {/* Navigation Links */}
        <nav className="navbar-links">
          <button 
            type="button"
            className={`nav-item ${isCoursesActive ? 'active' : ''}`}
            onClick={() => navigate('/courses')}
          >
            <BookOpen size={18} />
            <span>Courses</span>
          </button>
          
          <div className="nav-item disabled-nav-item" title="Coming soon in Phase 2">
            <Award size={18} />
            <span>Internship + Training</span>
            <span className="coming-soon-tag">Soon</span>
          </div>

          <div className="nav-item disabled-nav-item" title="Coming soon in Phase 2">
            <Compass size={18} />
            <span>Explore</span>
            <span className="coming-soon-tag">Soon</span>
          </div>
        </nav>

        {/* Action Controls */}
        <div className="navbar-actions">
          {/* Search bar */}
          <div className="search-bar-wrapper">
            <Search className="search-icon" size={16} />
            <input 
              type="text" 
              placeholder={isInsideCourse ? "Search lessons..." : "Search courses, skills..."} 
              className="search-input"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          {/* User Auth controls */}
          {isAuthenticated && user ? (
            <div className="profile-dropdown-wrapper">
              <button 
                type="button" 
                className="profile-trigger-btn"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div className="avatar-circle">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <span className="user-name-label hide-mobile">{user.name}</span>
                <ChevronDown size={14} />
              </button>

              {showDropdown && (
                <div className="profile-dropdown-menu card animate-fade-in">
                  <div className="dropdown-user-header">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                  
                  <hr className="dropdown-divider" />
                  
                  <button type="button" className="dropdown-item" onClick={() => { setShowDropdown(false); navigate('/dashboard'); }}>
                    <User size={16} />
                    <span>My Dashboard</span>
                  </button>

                  <button type="button" className="dropdown-item" onClick={() => { setShowDropdown(false); navigate('/courses'); }}>
                    <BookOpen size={16} />
                    <span>My Courses</span>
                  </button>
                  
                  <button type="button" className="dropdown-item" onClick={() => { setShowDropdown(false); navigate('/dashboard/continue-watching'); }}>
                    <Play size={16} />
                    <span>Continue Watching</span>
                  </button>
                  
                  <button type="button" className="dropdown-item" onClick={() => { setShowDropdown(false); navigate('/dashboard/quizzes'); }}>
                    <CheckSquare size={16} />
                    <span>Quiz Results</span>
                  </button>
                  
                  <button type="button" className="dropdown-item" onClick={() => { setShowDropdown(false); navigate('/dashboard/notes'); }}>
                    <FileText size={16} />
                    <span>Notes</span>
                  </button>
                  
                  <button type="button" className="dropdown-item" onClick={() => { setShowDropdown(false); navigate('/dashboard/settings'); }}>
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>
                  
                  <hr className="dropdown-divider" />
                  
                  <button 
                    type="button" 
                    className="dropdown-item text-danger"
                    onClick={async () => {
                      setShowDropdown(false);
                      await logout();
                      navigate('/');
                    }}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-nav-buttons" style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => navigate('/auth?view=login')}
              >
                Login
              </button>
              <button 
                type="button" 
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/auth?view=register')}
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
