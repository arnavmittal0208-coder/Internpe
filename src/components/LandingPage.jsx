import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Award, ShieldCheck, ArrowRight, Star, Sparkles, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const stats = [
    { id: 1, count: '3,200+', label: 'Online Courses', icon: <BookOpen className="stat-icon" size={24} /> },
    { id: 2, count: 'Top Rated', label: 'Industry Experts', icon: <Users className="stat-icon" size={24} /> },
    { id: 3, count: 'Verified', label: 'Certifications', icon: <Award className="stat-icon" size={24} /> },
    { id: 4, count: '6,000+', label: 'Active Students', icon: <ShieldCheck className="stat-icon" size={24} /> }
  ];

  const categories = [
    { name: 'Web Development', count: '1,200+ Students', color: 'cat-teal' },
    { name: 'Python Programming', count: '850+ Students', color: 'cat-purple' },
    { name: 'Computer Science & DSA', count: '950+ Students', color: 'cat-blue' },
    { name: 'Machine Learning & AI', count: '740+ Students', color: 'cat-orange' },
    { name: 'UI/UX Design', count: '500+ Students', color: 'cat-pink' },
    { name: 'Cloud & Security', count: '620+ Students', color: 'cat-green' }
  ];

  return (
    <div className="landing-container animate-fade-in">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-grid">
          {/* Hero Left Content */}
          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={14} className="sparkle-icon" />
              <span>Shape Your Future with Industry-Ready Skills</span>
            </div>
            
            <h1 className="hero-title">
              Quality Learning, <br />
              <span className="text-highlight">Professional Training,</span> <br />
              & Real-World Internships.
            </h1>
            
            <p className="hero-subtitle">
              Gain hands-on experience by working on real-life projects. Build a portfolio that stands out to top-tier employers. Learn. Build. Grow. Get Hired.
            </p>
            
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => navigate('/courses')}>
                <span>Browse Courses</span>
                <ArrowRight size={16} />
              </button>
              <button className="btn btn-secondary disabled-nav-item" title="Coming soon in Phase 2">
                <span>View Internships</span>
              </button>
            </div>

            {/* Testimonials snippet */}
            <div className="hero-social-proof">
              <div className="avatar-group">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Student" />
                <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&q=80" alt="Student" />
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" alt="Student" />
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="Student" />
                <div className="avatar-more">+6k</div>
              </div>
              <div className="stars-rating">
                <div className="stars">
                  {[...Array(5)].map((_, i) => <Star key={i} size={16} className="star-filled" />)}
                </div>
                <span>Trusted by over 6,000+ students nationwide</span>
              </div>
            </div>
          </div>

          {/* Hero Right Visuals */}
          <div className="hero-visual">
            <div className="image-card-container">
              {/* Abstract decorative backgrounds */}
              <div className="dots-pattern dots-1"></div>
              <div className="dots-pattern dots-2"></div>
              <div className="shape-circle shape-1"></div>
              <div className="shape-circle shape-2"></div>
              
              <div className="hero-main-image-wrapper">
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80" 
                  alt="Students studying together"
                  className="hero-image"
                />
              </div>

              {/* Floating Widgets */}
              <div className="floating-card card-widget-1 animate-bounce-slow">
                <div className="widget-icon bg-primary">
                  <Star size={16} className="text-white" />
                </div>
                <div className="widget-details">
                  <h4>4.9/5 Rating</h4>
                  <p>From 2k+ reviews</p>
                </div>
              </div>

              <div className="floating-card card-widget-2 animate-bounce-slower">
                <div className="widget-icon bg-secondary">
                  <Award size={16} className="text-white" />
                </div>
                <div className="widget-details">
                  <h4>100% Verified</h4>
                  <p>ISO Certified Academy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container stats-grid">
          {stats.map(stat => (
            <div className="stat-card" key={stat.id}>
              <div className="stat-icon-wrapper">
                {stat.icon}
              </div>
              <div className="stat-info">
                <h3>{stat.count}</h3>
                <p>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <h2>Top Categories</h2>
            <p>Explore our most popular domains and start masterclass learning</p>
          </div>
          
          <div className="categories-grid">
            {categories.map((cat, idx) => (
              <div className={`category-card ${cat.color}`} key={idx} onClick={() => navigate('/courses')}>
                <div className="category-details">
                  <h4>{cat.name}</h4>
                  <p>{cat.count}</p>
                </div>
                <span className="category-action-link">Browse &rarr;</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Internpe Section */}
      <section className="about-section">
        <div className="container about-grid">
          <div className="about-visual">
            <div className="about-image-wrapper">
              <img 
                src="/about.jpg" 
                alt="Students studying together around laptop"
                className="about-image"
              />
              <div className="badge-experience">
                <h4>5+ Years</h4>
                <p>Industry Training</p>
              </div>
            </div>
          </div>
          
          <div className="about-content">
            <span className="section-tag">About Us</span>
            <h2>Learn & Grow Your Skills From Anywhere</h2>
            <p className="about-desc">
              Internpe is a modern online educational platform bridging the gap between theoretical academic studies and actual industry requirements. We host professional courses crafted and delivered by active industry developers, designers, and managers.
            </p>
            
            <ul className="about-points">
              <li>
                <CheckCircle className="point-icon" size={20} />
                <div>
                  <h4>Expert Trainers</h4>
                  <p>Learn directly from engineers working in top companies.</p>
                </div>
              </li>
              <li>
                <CheckCircle className="point-icon" size={20} />
                <div>
                  <h4>Online Remote Learning</h4>
                  <p>Flexible video tutorials and coding tasks, completely self-paced.</p>
                </div>
              </li>
              <li>
                <CheckCircle className="point-icon" size={20} />
                <div>
                  <h4>Lifetime Access</h4>
                  <p>Enroll once and gain forever access to updated course materials.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
