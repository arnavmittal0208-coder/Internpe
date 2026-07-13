import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { BookOpen, Play, CheckSquare, FileText, Settings, ChevronRight, Clock, ArrowLeft, Edit3, Trash2, Save, User } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { AuthContext } from '../context/AuthContext';

export default function StudentDashboard() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { 
    courses, 
    lectures, 
    quizzes, 
    studentProgress, 
    saveLectureNotes 
  } = useContext(AppContext);

  // Active tab state matching URL param
  const activeTab = tab || 'continue-watching';

  // Notes editing states
  const [editingNoteKey, setEditingNoteKey] = useState(null); // 'courseId-lectureId'
  const [editingContent, setEditingContent] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const formatTime = (secs) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const triggerMessage = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // --- CONTINUE WATCHING DATA ---
  const inProgressCourses = courses.filter(course => {
    const progress = studentProgress.courseProgressByCourse[course.id];
    return progress && progress.courseCompletionPercentage > 0;
  }).map(course => {
    const progress = studentProgress.courseProgressByCourse[course.id];
    const lastLecId = progress.lastWatchedLecture;
    const lastLec = lectures.find(l => l.id === lastLecId);
    
    // Find first lecture of course as fallback
    const courseLectures = lectures.filter(l => l.courseId === course.id).sort((a,b) => a.index - b.index);
    const resumeLecId = lastLecId || (courseLectures[0]?.id || '');
    const resumeLecTitle = lastLec ? lastLec.title : (courseLectures[0]?.title || 'Introduction');

    return {
      ...course,
      completionPercentage: progress.courseCompletionPercentage || 0,
      resumeLecId,
      resumeLecTitle
    };
  });

  // --- QUIZ RESULTS DATA ---
  const quizResultsList = Object.entries(studentProgress.quizScores || {}).map(([quizId, scoreObj]) => {
    const quizObj = quizzes.find(q => q.id === quizId);
    const courseObj = courses.find(c => c.id === quizObj?.courseId);
    return {
      quizId,
      title: quizObj?.title || 'Course Quiz',
      courseName: courseObj?.name || 'LMS Program',
      score: scoreObj.score,
      totalQuestions: scoreObj.totalQuestions,
      correctAnswers: scoreObj.correctAnswers,
      passed: scoreObj.passed,
      attemptDate: scoreObj.attemptDate ? new Date(scoreObj.attemptDate).toLocaleDateString() : 'Recent',
      completionStatus: scoreObj.completionStatus || 'completed'
    };
  });

  // --- NOTES DATA ---
  const [notesList, setNotesList] = useState([]);
  
  useEffect(() => {
    const list = [];
    Object.entries(studentProgress.courseProgressByCourse || {}).forEach(([courseId, record]) => {
      const courseObj = courses.find(c => c.id === courseId);
      (record.notes || []).forEach(note => {
        if (!note.content?.trim()) return;
        const lectureObj = lectures.find(l => l.id === note.lectureId);
        list.push({
          courseId,
          courseName: courseObj?.name || 'Unknown Course',
          lectureId: note.lectureId,
          lectureTitle: lectureObj?.title || 'Lecture Video',
          content: note.content,
          updatedAt: note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : 'Recent'
        });
      });
    });
    setNotesList(list);
  }, [studentProgress, courses, lectures]);

  const handleEditNoteStart = (note) => {
    setEditingNoteKey(`${note.courseId}-${note.lectureId}`);
    setEditingContent(note.content);
  };

  const handleSaveNote = async (courseId, lectureId) => {
    try {
      await saveLectureNotes(courseId, lectureId, editingContent);
      setEditingNoteKey(null);
      triggerMessage('Note updated successfully!');
    } catch (err) {
      alert('Failed to save note update');
    }
  };

  const handleDeleteNote = async (courseId, lectureId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await saveLectureNotes(courseId, lectureId, '');
        triggerMessage('Note deleted successfully.');
      } catch (err) {
        alert('Failed to delete note');
      }
    }
  };

  return (
    <div className="container student-dashboard-shell animate-fade-in" style={{ padding: '2rem 1rem', maxWidth: '1200px' }}>
      {/* Back button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button 
          onClick={() => navigate('/courses')} 
          className="btn-text" 
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Courses</span>
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>Student Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Track your in-progress courses, assessments, and learning notes.</p>
        </div>
        {successMsg && (
          <div className="badge badge-success animate-fade-in" style={{ padding: '8px 16px', fontSize: '13px' }}>
            {successMsg}
          </div>
        )}
      </div>

      <div className="student-dashboard-layout" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem' }}>
        {/* Navigation Sidebar */}
        <aside className="dashboard-sidebar card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignSelf: 'start' }}>
          <div className="sidebar-user-card" style={{ padding: '1rem 0.5rem 1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="avatar-circle" style={{ width: '40px', height: '40px', fontSize: '16px' }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>{user?.name || 'Student Account'}</h4>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{user?.email}</span>
            </div>
          </div>

          <button 
            type="button" 
            className={`admin-nav-link ${activeTab === 'continue-watching' ? 'active' : ''}`}
            onClick={() => navigate('/dashboard/continue-watching')}
            style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: 'none', background: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            <Play size={16} />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Continue Watching</span>
          </button>

          <button 
            type="button" 
            className={`admin-nav-link ${activeTab === 'quizzes' ? 'active' : ''}`}
            onClick={() => navigate('/dashboard/quizzes')}
            style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: 'none', background: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            <CheckSquare size={16} />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Quiz Results</span>
          </button>

          <button 
            type="button" 
            className={`admin-nav-link ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => navigate('/dashboard/notes')}
            style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: 'none', background: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            <FileText size={16} />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>My Notes</span>
          </button>

          <button 
            type="button" 
            className={`admin-nav-link ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => navigate('/dashboard/settings')}
            style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: 'none', background: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            <Settings size={16} />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Settings</span>
          </button>
        </aside>

        {/* Tab Workspace */}
        <main className="dashboard-content">
          
          {/* TAB 1: CONTINUE WATCHING */}
          {activeTab === 'continue-watching' && (
            <div className="continue-watching-panel">
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '1.25rem' }}>Continue Watching</h3>
              {inProgressCourses.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {inProgressCourses.map(course => (
                    <div className="card course-progress-card animate-fade-in" key={course.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem' }}>
                      <div>
                        {course.thumbnail && (
                          <img 
                            src={course.thumbnail} 
                            alt={course.name} 
                            style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }} 
                          />
                        )}
                        <span className="badge badge-secondary" style={{ marginBottom: '8px' }}>{course.category}</span>
                        <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>{course.name}</h4>
                        
                        {/* Progress Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                          <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${course.completionPercentage}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '4px' }}></div>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: '600' }}>{course.completionPercentage}%</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'start', gap: '8px', padding: '8px 12px', backgroundColor: 'var(--neutral-100)', borderRadius: '6px', marginBottom: '1rem' }}>
                          <Clock size={14} style={{ color: 'var(--primary)', marginTop: '2px' }} />
                          <div>
                            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>Resume Lecture:</span>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>{course.resumeLecTitle}</span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => navigate(`/courses/${course.id}/lessons/${course.resumeLecId}`)}
                        className="btn btn-primary w-100"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Play size={14} fill="#fff" />
                        <span>Resume Lesson</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                  <Play size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                  <h4>No active learning progress</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0.5rem auto 1.5rem' }}>
                    Select a course from our curriculum catalog to begin watching lessons and recording progress.
                  </p>
                  <button className="btn btn-primary" onClick={() => navigate('/courses')}>
                    Browse All Courses
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: QUIZ RESULTS */}
          {activeTab === 'quizzes' && (
            <div className="quizzes-panel animate-fade-in">
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '1.25rem' }}>Quiz Results</h3>
              {quizResultsList.length > 0 ? (
                <div className="card table-responsive" style={{ padding: '0' }}>
                  <table className="admin-table" style={{ margin: '0' }}>
                    <thead>
                      <tr>
                        <th>Quiz Title</th>
                        <th>Course</th>
                        <th>Attempt Date</th>
                        <th>Score Obtained</th>
                        <th>Evaluation Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quizResultsList.map((result, idx) => (
                        <tr key={`${result.quizId}-${idx}`}>
                          <td><strong>{result.title}</strong></td>
                          <td><span className="badge badge-secondary">{result.courseName}</span></td>
                          <td>{result.attemptDate}</td>
                          <td>
                            <strong>{result.score}</strong> / {result.totalQuestions} ({Math.round((result.score / result.totalQuestions) * 100)}%)
                          </td>
                          <td>
                            {result.passed ? (
                              <span className="badge badge-success">Passed</span>
                            ) : (
                              <span className="badge badge-danger">Failed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                  <CheckSquare size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                  <h4>No quiz records found</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0.5rem auto 1.5rem' }}>
                    You have not taken any quizzes yet. Attempt quizzes attached to course modules to view your assessments here.
                  </p>
                  <button className="btn btn-primary" onClick={() => navigate('/courses')}>
                    Go to Courses
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NOTES */}
          {activeTab === 'notes' && (
            <div className="notes-panel animate-fade-in">
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '1.25rem' }}>My Learning Notes</h3>
              {notesList.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {notesList.map((note) => {
                    const noteKey = `${note.courseId}-${note.lectureId}`;
                    const isEditing = editingNoteKey === noteKey;

                    return (
                      <div className="card note-card animate-fade-in" key={noteKey} style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                          <div>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase' }}>{note.courseName}</span>
                            <h4 style={{ fontSize: '15px', fontWeight: '700', margin: '2px 0 4px' }}>{note.lectureTitle}</h4>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Last updated: {note.updatedAt}</span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {!isEditing ? (
                              <>
                                <button 
                                  type="button" 
                                  className="btn btn-secondary btn-xs"
                                  style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  onClick={() => handleEditNoteStart(note)}
                                >
                                  <Edit3 size={12} />
                                  <span>Edit</span>
                                </button>
                                <button 
                                  type="button" 
                                  className="btn btn-danger btn-xs"
                                  style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  onClick={() => handleDeleteNote(note.courseId, note.lectureId)}
                                >
                                  <Trash2 size={12} />
                                  <span>Delete</span>
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  type="button" 
                                  className="btn btn-primary btn-xs"
                                  style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  onClick={() => handleSaveNote(note.courseId, note.lectureId)}
                                >
                                  <Save size={12} />
                                  <span>Save</span>
                                </button>
                                <button 
                                  type="button" 
                                  className="btn btn-secondary btn-xs"
                                  style={{ padding: '4px 8px' }}
                                  onClick={() => setEditingNoteKey(null)}
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div style={{ marginTop: '0.75rem' }}>
                          {isEditing ? (
                            <textarea 
                              className="form-control" 
                              style={{ width: '100%', minHeight: '100px', fontSize: '13.5px' }}
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                            />
                          ) : (
                            <p style={{ fontSize: '13.5px', color: 'var(--text-main)', whiteSpace: 'pre-line', lineHeight: '1.5', margin: '0', padding: '8px 12px', backgroundColor: 'var(--neutral-100)', borderRadius: '6px', borderLeft: '3px solid var(--primary)' }}>
                              {note.content}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                  <FileText size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                  <h4>No notes recorded</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0.5rem auto 1.5rem' }}>
                    You haven't written any lecture notes yet. Take notes inside the video player tab while watching course videos to review them here.
                  </p>
                  <button className="btn btn-primary" onClick={() => navigate('/courses')}>
                    Start Watching Lessons
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="settings-panel animate-fade-in">
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '1.25rem' }}>Account Settings</h3>
              
              <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={18} style={{ color: 'var(--primary)' }} />
                  <span>Profile Information</span>
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>Full Name</span>
                    <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>{user?.name || 'Student Account'}</strong>
                  </div>
                  
                  <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>Email Address</span>
                    <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>{user?.email || 'N/A'}</strong>
                  </div>

                  <div>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>Account Level</span>
                    <span className="badge badge-primary" style={{ marginTop: '4px', fontSize: '12px', display: 'inline-block' }}>Student Member</span>
                  </div>
                </div>
              </div>

              {/* Password change placeholder */}
              <div className="card" style={{ padding: '1.5rem', opacity: '0.8' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '0.5rem' }}>Update Password</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '0' }}>
                  Password reset and security settings are restricted for local university evaluations. Full credential update and self-service resets will be available in a future version.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
