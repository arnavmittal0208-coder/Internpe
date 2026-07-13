import React, { useContext, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { BookOpen, Clock, User, Compass, CheckCircle } from 'lucide-react';

export default function CoursesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const { courses, lectures, codingTasks, quizzes, studentProgress } = useContext(AppContext);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Development', 'Computer Science', 'Data Science', 'Design', 'IT & Cloud'];

  // Helper to calculate course progress percentage
  const getCourseProgress = (courseId) => {
    const courseLectures = lectures.filter(l => l.courseId === courseId);
    const courseTasks = codingTasks.filter(t => t.courseId === courseId);
    const courseQuizzes = quizzes.filter(q => q.courseId === courseId);

    const totalItems = courseLectures.length + courseTasks.length + courseQuizzes.length;
    if (totalItems === 0) return 0;

    const completedLecturesCount = courseLectures.filter(l => studentProgress.completedLectures.includes(l.id)).length;
    const completedTasksCount = courseTasks.filter(t => studentProgress.completedTasks.includes(t.id)).length;
    const completedQuizzesCount = courseQuizzes.filter(q => studentProgress.quizScores[q.id]?.passed).length;

    const completedItems = completedLecturesCount + completedTasksCount + completedQuizzesCount;
    return Math.round((completedItems / totalItems) * 100);
  };

  // Filter courses based on category AND search query from Navbar
  const filteredCourses = courses.filter(course => {
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    const matchesSearch = searchQuery
      ? course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.code.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  const handleCourseClick = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  return (
    <div className="container courses-page-container animate-fade-in">
      {/* Page Header */}
      <div className="courses-header-section">
        <div className="header-badge-sm">Learning Catalog</div>
        <h2>Explore Professional Courses</h2>
        <p>Enhance your skills with self-paced classes and real-life coding tasks.</p>
      </div>

      {/* Category Tabs */}
      <div className="category-tabs-wrapper">
        {categories.map((cat, idx) => (
          <button
            key={idx}
            className={`category-tab-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Recently Watched / Continue Learning Section (if student has progress) */}
      {(() => {
        const startedCourses = courses.filter(c => getCourseProgress(c.id) > 0 && getCourseProgress(c.id) < 100);
        if (startedCourses.length > 0 && !searchQuery && selectedCategory === 'All') {
          return (
            <div className="continue-learning-section">
              <h3 className="section-subtitle">Continue Learning</h3>
              <div className="continue-grid">
                {startedCourses.slice(0, 2).map(course => {
                  const progress = getCourseProgress(course.id);
                  return (
                    <div className="continue-card" key={course.id} onClick={() => handleCourseClick(course.id)}>
                      <img src={course.thumbnail} alt={course.name} className="continue-thumb" />
                      <div className="continue-info">
                        <span className="continue-code">{course.code}</span>
                        <h4>{course.name}</h4>
                        <div className="continue-progress-wrapper">
                          <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                          </div>
                          <span className="progress-percentage">{progress}% Complete</span>
                        </div>
                      </div>
                      <button className="btn btn-primary btn-sm btn-resume">Resume</button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Course Cards Grid */}
      <div className="courses-grid-section">
        {filteredCourses.length > 0 ? (
          <div className="courses-catalog-grid">
            {filteredCourses.map(course => {
              const progress = getCourseProgress(course.id);
              const courseLectures = lectures.filter(l => l.courseId === course.id);
              return (
                <div 
                  className="card course-catalog-card animate-fade-in" 
                  key={course.id}
                  onClick={() => handleCourseClick(course.id)}
                >
                  {/* Thumbnail wrapper with fixed aspect ratio */}
                  <div className="course-card-thumb-wrapper">
                    <img 
                      src={course.thumbnail} 
                      alt={course.name} 
                      className="course-card-thumb"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div className="course-card-category-badge">
                      {course.category}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="course-card-body">
                    <div className="course-card-meta-top">
                      <span className="course-domain-code">{course.code}</span>
                      <span className="course-lessons-badge">
                        <BookOpen size={13} />
                        <span>{courseLectures.length} Lessons</span>
                      </span>
                    </div>

                    <h3 className="course-card-title">{course.name}</h3>
                    <p className="course-card-desc">{course.description}</p>

                    <div className="course-card-footer">
                      <div className="instructor-info">
                        <div className="instructor-avatar">
                          <User size={14} />
                        </div>
                        <span>{course.instructor}</span>
                      </div>
                      
                      <div className="course-duration">
                        <Clock size={14} />
                        <span>{course.duration}</span>
                      </div>
                    </div>

                    {/* Progress indicator */}
                    {progress > 0 && (
                      <div className="course-card-progress">
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="progress-stats">
                          <span className="percent-text">{progress}% complete</span>
                          {progress === 100 && (
                            <span className="completed-badge">
                              <CheckCircle size={12} />
                              <span>Done</span>
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-courses-fallback">
            <Compass size={48} className="fallback-icon animate-bounce-slow" />
            <h3>No Courses Found</h3>
            <p>We couldn't find any courses matching your search criteria. Try a different query or tab.</p>
            <button className="btn btn-secondary" onClick={() => setSelectedCategory('All')}>Reset Filters</button>
          </div>
        )}
      </div>
    </div>
  );
}
