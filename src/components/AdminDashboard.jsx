import React, { useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { AuthContext } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Video, Award, Code, BookOpen, UploadCloud, CheckCircle, HelpCircle, Save, Layers, LogOut, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminDashboard({ activeTab }) {
  const navigate = useNavigate();
  const { logout, user } = useContext(AuthContext);
  const { 
    courses, 
    lectures, 
    codingTasks, 
    quizzes,
    addCourse, 
    updateCourse, 
    deleteCourse,
    addLecture,
    updateLecture,
    deleteLecture,
    addCodingTask,
    updateCodingTask,
    deleteCodingTask,
    addQuiz,
    updateQuiz,
    deleteQuiz,
    resetToSeeds
  } = useContext(AppContext);

  // Selected course context for content tabs
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');

  // --- COURSE FORM STATE ---
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [courseFormId, setCourseFormId] = useState('');
  const [courseForm, setCourseForm] = useState({ name: '', code: '', description: '', instructor: '', duration: '', thumbnail: '', thumbnailPublicId: '', category: 'Development' });

  // --- VIDEO UPLOAD STATE ---
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [videoForm, setVideoForm] = useState({ 
    title: '', 
    description: '', 
    duration: '15:00', 
    tags: '', 
    index: 1, 
    url: '', 
    videoPublicId: '', 
    thumbnail: '', 
    thumbnailPublicId: '' 
  });
  const [editingLectureId, setEditingLectureId] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [thumbnailMethod, setThumbnailMethod] = useState('upload');
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [timelinePosition, setTimelinePosition] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const previewVideoRef = useRef(null);

  // --- QUIZ BUILDER STATE ---
  const [quizForm, setQuizForm] = useState({ title: '', description: '', timeLimit: 120, marks: 30, questions: [] });
  const [currentQuestion, setCurrentQuestion] = useState({ questionText: '', options: ['', '', '', ''], correctIndex: 0, marks: 10, explanation: '' });
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [expandedQuestionIds, setExpandedQuestionIds] = useState([]);

  // --- CODING TASKS STATE ---
  const [taskForm, setTaskForm] = useState({ title: '', description: '', link: '', difficulty: 'Easy', tags: '' });
  const [editingTaskId, setEditingTaskId] = useState(null);

  // --- INLINE DELETE CONFIRM STATES ---
  const [deletingCourseId, setDeletingCourseId] = useState(null);
  const [deletingLecId, setDeletingLecId] = useState(null);
  const [deletingQuizId, setDeletingQuizId] = useState(null);
  const [deletingTaskId, setDeletingTaskId] = useState(null);

  // --- COURSE THUMBNAIL UPLOAD STATE ---
  const [useUploadThumbnail, setUseUploadThumbnail] = useState(false);

  // Success banners
  const [successToast, setSuccessToast] = useState('');

  const createQuestionId = () => `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const getEmptyQuestion = () => ({
    questionText: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    marks: 10,
    explanation: ''
  });

  const normalizeQuestion = (question) => ({
    id: question.id || createQuestionId(),
    questionText: question.questionText || '',
    options: Array.isArray(question.options)
      ? [...question.options, '', '', '', ''].slice(0, 4)
      : ['', '', '', ''],
    correctIndex: Number.isInteger(question.correctIndex) ? question.correctIndex : 0,
    marks: Number(question.marks) || 10,
    explanation: question.explanation || ''
  });

  const recalculateQuizTotals = (questions) => ({
    questions: questions.map(normalizeQuestion),
    marks: questions.reduce((sum, question) => sum + (Number(question.marks) || 0), 0)
  });

  const triggerToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  useEffect(() => {
    if (!selectedCourseId && courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  const uploadFileToBackend = (file, endpoint, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}${endpoint}`);
      xhr.responseType = 'json';
      const token = sessionStorage.getItem('internpe_auth_token');

      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && typeof onProgress === 'function') {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
          return;
        }

        const errorMessage = xhr.response?.message || xhr.response?.error || 'Upload failed';
        reject(new Error(errorMessage));
      };

      xhr.onerror = () => reject(new Error('Network error while uploading media'));

      const formData = new FormData();
      formData.append('file', file);
      xhr.send(formData);
    });
  };

  // Course handlers
  const handleOpenAddCourse = () => {
    setCourseForm({ name: '', code: '', description: '', instructor: '', duration: '', thumbnail: '', thumbnailPublicId: '', category: 'Development' });
    setIsEditingCourse(false);
    setUseUploadThumbnail(false);
    setShowCourseModal(true);
  };

  const handleOpenEditCourse = (c) => {
    setCourseForm(c);
    setCourseFormId(c.id);
    setIsEditingCourse(true);
    setUseUploadThumbnail(Boolean(c.thumbnailPublicId));
    setShowCourseModal(true);
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditingCourse) {
        await updateCourse(courseFormId, courseForm);
        triggerToast('Course updated successfully.');
      } else {
        const createdCourse = await addCourse({ ...courseForm, lessonsCount: 0 });
        triggerToast('Course created successfully.');
        if (!selectedCourseId && createdCourse?.id) setSelectedCourseId(createdCourse.id);
      }
      setShowCourseModal(false);
    } catch (error) {
      alert(error.message || 'Failed to save course.');
      console.error(error);
    }
  };

  const handleThumbnailUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      try {
        setIsUploading(true);
        setUploadProgress(0);
        const response = await uploadFileToBackend(e.target.files[0], '/uploads/image', setUploadProgress);
        setCourseForm(prev => ({
          ...prev,
          thumbnail: response.media.secureUrl,
          thumbnailPublicId: response.media.publicId
        }));
        triggerToast('Image uploaded and optimized.');
      } catch (err) {
        alert('Failed to process image. Please make sure it is a valid image file.');
        console.error(err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Video drop/upload handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    console.log(`[FRONTEND UPLOAD] File selected for upload: Name=${file.name}, Size=${file.size} bytes, Type=${file.type}`);
    setSelectedFile(file);
    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(0);
    
    console.log('[FRONTEND UPLOAD] Constructing FormData and sending request to backend /api/uploads/video...');
    try {
      const response = await uploadFileToBackend(file, '/uploads/video', setUploadProgress);
      console.log('[FRONTEND UPLOAD] Upload request finished successfully.');
      console.log('[FRONTEND UPLOAD] Backend Response Object:', response);

      if (response && response.media) {
        console.log(`[FRONTEND UPLOAD] Cloudinary media response: SecureURL=${response.media.secureUrl}, PublicID=${response.media.publicId}, Duration=${response.media.duration}`);
        
        setVideoForm(prevForm => ({
          ...prevForm,
          title: prevForm.title || file.name.replace(/\.[^/.]+$/, ''),
          url: response.media.secureUrl,
          videoPublicId: response.media.publicId,
          duration: response.media.duration || prevForm.duration || ''
        }));
        triggerToast('Video uploaded to Cloudinary successfully.');
      } else {
        throw new Error('Invalid backend media response structure.');
      }
    } catch (error) {
      console.error('[FRONTEND UPLOAD] Exception occurred during upload pipeline:', error);
      setUploadError(error.message || 'Failed to upload video.');
      alert(error.message || 'Failed to upload video.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLectureThumbnailUpload = async (file) => {
    if (!file) return;
    setIsUploadingThumbnail(true);
    setThumbnailProgress(0);
    try {
      const response = await uploadFileToBackend(file, '/uploads/image', setThumbnailProgress);
      setVideoForm(prev => ({
        ...prev,
        thumbnail: response.media.secureUrl,
        thumbnailPublicId: response.media.publicId
      }));
      triggerToast('Thumbnail uploaded to Cloudinary successfully.');
    } catch (error) {
      alert(error.message || 'Failed to upload thumbnail.');
      console.error(error);
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const handleGenerateThumbnail = () => {
    const video = previewVideoRef.current;
    if (!video) {
      alert('Video player not ready or no video source loaded.');
      return;
    }

    // Create canvas matching video dimension
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext('2d');
    
    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('Failed to capture video frame.');
          return;
        }

        const file = new File([blob], `generated-thumb-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setIsUploadingThumbnail(true);
        setThumbnailProgress(0);
        
        try {
          const response = await uploadFileToBackend(file, '/uploads/image', setThumbnailProgress);
          setVideoForm(prev => ({
            ...prev,
            thumbnail: response.media.secureUrl,
            thumbnailPublicId: response.media.publicId
          }));
          triggerToast('Thumbnail generated from frame & uploaded to Cloudinary.');
        } catch (err) {
          alert(err.message || 'Failed to upload generated thumbnail.');
          console.error(err);
        } finally {
          setIsUploadingThumbnail(false);
        }
      }, 'image/jpeg', 0.95);
    } catch (err) {
      alert('Failed to capture frame from video canvas. This might be due to CORS issues if the video is loaded from external domains. Ensure you are testing with local files or properly configured Cloudinary sources.');
      console.error(err);
    }
  };

  const handleVideoSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) {
      alert('Please select or create a course first.');
      return;
    }

    const nextIndex = activeCourseLectures.length > 0 
      ? Math.max(...activeCourseLectures.map(l => l.index)) + 1 
      : 1;

    try {
      if (editingLectureId) {
        await updateLecture(editingLectureId, {
          ...videoForm,
          url: videoForm.url
        });
        triggerToast('Lecture video details updated.');
        setEditingLectureId(null);
      } else {
        const newLec = {
          id: `lec-${Date.now()}`,
          courseId: selectedCourseId,
          title: videoForm.title || 'Untitled Lecture',
          description: videoForm.description || 'No description provided.',
          duration: videoForm.duration || '10:00',
          url: videoForm.url,
          videoPublicId: videoForm.videoPublicId || '',
          index: nextIndex,
          thumbnail: videoForm.thumbnail || '',
          thumbnailPublicId: videoForm.thumbnailPublicId || ''
        };
        await addLecture(newLec);
        triggerToast('New video lecture published.');
      }

      setVideoForm({ 
        title: '', 
        description: '', 
        duration: '15:00', 
        tags: '', 
        index: 1, 
        url: '', 
        videoPublicId: '', 
        thumbnail: '', 
        thumbnailPublicId: '' 
      });
      setSelectedFile(null);
      setUploadError(null);
    } catch (error) {
      alert(error.message || 'Failed to save lecture.');
      console.error(error);
    }
  };

  const handleEditLecture = (l) => {
    setVideoForm(l);
    setEditingLectureId(l.id);
    setSelectedFile(null);
    setUploadError(null);
  };

  // Quiz Builder handlers
  const handleAddQuestion = () => {
    if (!currentQuestion.questionText.trim() || currentQuestion.options.some((option) => !option.trim())) {
      alert('Please fill out the question text and all four MCQ options.');
      return;
    }

    const newQuestion = normalizeQuestion({
      ...currentQuestion,
      id: createQuestionId()
    });

    setQuizForm(prev => ({
      ...prev,
      ...recalculateQuizTotals([...prev.questions, newQuestion])
    }));

    setExpandedQuestionIds((prev) => [...prev, newQuestion.id]);
    setCurrentQuestion(getEmptyQuestion());
  };

  const handleQuestionFieldChange = (questionId, field, value) => {
    setQuizForm((prev) => {
      const nextQuestions = prev.questions.map((question) => (
        question.id === questionId ? normalizeQuestion({ ...question, [field]: value }) : normalizeQuestion(question)
      ));

      return { ...prev, ...recalculateQuizTotals(nextQuestions) };
    });
  };

  const handleQuestionOptionChange = (questionId, optionIndex, value) => {
    setQuizForm((prev) => {
      const nextQuestions = prev.questions.map((question) => {
        const normalizedQuestion = normalizeQuestion(question);

        if (normalizedQuestion.id !== questionId) {
          return normalizedQuestion;
        }

        const options = [...normalizedQuestion.options];
        options[optionIndex] = value;
        return normalizeQuestion({ ...normalizedQuestion, options });
      });

      return { ...prev, ...recalculateQuizTotals(nextQuestions) };
    });
  };

  const handleQuestionDelete = (questionId) => {
    setQuizForm((prev) => {
      const nextQuestions = prev.questions.filter((question) => question.id !== questionId);
      return { ...prev, ...recalculateQuizTotals(nextQuestions) };
    });
    setExpandedQuestionIds((prev) => prev.filter((id) => id !== questionId));
  };

  const handleQuestionDuplicate = (questionId) => {
    const duplicatedQuestionId = createQuestionId();

    setQuizForm((prev) => {
      const index = prev.questions.findIndex((question) => question.id === questionId);
      if (index === -1) {
        return prev;
      }

      const clonedQuestion = normalizeQuestion({
        ...prev.questions[index],
        id: duplicatedQuestionId,
        questionText: `${prev.questions[index].questionText} (Copy)`
      });

      const nextQuestions = [
        ...prev.questions.slice(0, index + 1),
        clonedQuestion,
        ...prev.questions.slice(index + 1)
      ];

      return { ...prev, ...recalculateQuizTotals(nextQuestions) };
    });

    setExpandedQuestionIds((prev) => [...prev, duplicatedQuestionId]);
  };

  const handleQuestionMove = (questionId, direction) => {
    setQuizForm((prev) => {
      const index = prev.questions.findIndex((question) => question.id === questionId);
      const targetIndex = index + direction;

      if (index < 0 || targetIndex < 0 || targetIndex >= prev.questions.length) {
        return prev;
      }

      const nextQuestions = [...prev.questions];
      [nextQuestions[index], nextQuestions[targetIndex]] = [nextQuestions[targetIndex], nextQuestions[index]];

      return { ...prev, ...recalculateQuizTotals(nextQuestions) };
    });
  };

  const handleQuizSubmit = (e) => {
    e.preventDefault();
    if (!selectedCourseId) {
      alert('Select a course first.');
      return;
    }
    if (quizForm.questions.length === 0) {
      alert('Add at least one question to the quiz.');
      return;
    }

    const normalizedQuestions = quizForm.questions.map(normalizeQuestion);
    const quizPayload = {
      ...quizForm,
      questions: normalizedQuestions,
      marks: normalizedQuestions.reduce((sum, question) => sum + (Number(question.marks) || 0), 0)
    };

    if (editingQuizId) {
      updateQuiz(editingQuizId, quizPayload);
      triggerToast('Quiz successfully updated.');
      setEditingQuizId(null);
    } else {
      const newQuiz = {
        ...quizPayload,
        id: `quiz-${Date.now()}`,
        courseId: selectedCourseId
      };
      addQuiz(newQuiz);
      triggerToast('Quiz successfully created & published.');
    }

    setQuizForm({ title: '', description: '', timeLimit: 120, marks: 0, questions: [] });
    setCurrentQuestion(getEmptyQuestion());
    setExpandedQuestionIds([]);
  };

  const handleEditQuiz = (q) => {
    const normalizedQuestions = (q.questions || []).map(normalizeQuestion);
    setQuizForm({
      ...q,
      questions: normalizedQuestions,
      marks: normalizedQuestions.reduce((sum, question) => sum + (Number(question.marks) || 0), 0)
    });
    setEditingQuizId(q.id);
    setCurrentQuestion(getEmptyQuestion());
    setExpandedQuestionIds([]);
  };

  // Coding Tasks handlers
  const handleTaskSubmit = (e) => {
    e.preventDefault();
    if (!selectedCourseId) {
      alert('Select a course first.');
      return;
    }

    if (editingTaskId) {
      updateCodingTask(editingTaskId, taskForm);
      triggerToast('Coding task updated.');
      setEditingTaskId(null);
    } else {
      const newTask = {
        ...taskForm,
        id: `task-${Date.now()}`,
        courseId: selectedCourseId
      };
      addCodingTask(newTask);
      triggerToast('Coding task published.');
    }

    setTaskForm({ title: '', description: '', link: '', difficulty: 'Easy', tags: '' });
  };

  const handleEditTask = (t) => {
    setTaskForm(t);
    setEditingTaskId(t.id);
  };

  const activeCourseLectures = lectures.filter(l => l.courseId === selectedCourseId);
  const activeCourseTasks = codingTasks.filter(t => t.courseId === selectedCourseId);
  const activeCourseQuizzes = quizzes.filter(q => q.courseId === selectedCourseId);
  const quizQuestionTotals = quizForm.questions.reduce((sum, question) => sum + (Number(question.marks) || 0), 0);

  return (
    <div className="container admin-container animate-fade-in" style={{ maxWidth: '1400px' }}>
      {/* Standalone Admin Header Bar */}
      <header className="admin-header-bar card" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 1.5rem',
        marginBottom: '2rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="logo-icon" style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'var(--primary-gradient)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            fontWeight: '700',
            fontSize: '15px'
          }}>Ip</div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Admin Portal Dashboard</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Logged in as: <strong>{user?.name || 'Administrator'}</strong></span>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '6px 12px' }}
            onClick={async () => {
              await logout();
              navigate('/admin/login');
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {successToast && (
        <div className="admin-toast animate-fade-in">
          <CheckCircle size={16} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Admin Content Layout */}
      <div className="admin-layout-grid">
        {/* Admin Sidebar Navigation */}
        <aside className="admin-sidebar">
          <div className="sidebar-brand-meta">
            <span className="badge badge-primary">Admin Control</span>
          </div>

          <nav className="admin-sidebar-nav">
            <button 
              type="button"
              className={`admin-nav-link ${activeTab === 'courses' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate('/admin/courses'); }}
            >
              <Layers size={18} />
              <span>Courses Management</span>
            </button>
            
            <button 
              type="button"
              className={`admin-nav-link ${activeTab === 'videos' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate('/admin/videos'); }}
            >
              <Video size={18} />
              <span>Video Studio Upload</span>
            </button>

            <button 
              type="button"
              className={`admin-nav-link ${activeTab === 'quizzes' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate('/admin/quizzes'); }}
            >
              <Award size={18} />
              <span>Quiz Builder</span>
            </button>

            <button 
              type="button"
              className={`admin-nav-link ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); navigate('/admin/tasks'); }}
            >
              <Code size={18} />
              <span>Coding Task Manager</span>
            </button>
          </nav>

          {/* Seed reset option at bottom */}
          <div className="sidebar-footer-actions">
            <button type="button" className="btn btn-secondary btn-sm w-100" onClick={(e) => { e.preventDefault(); if(confirm('Reset all databases back to default mock data?')) { resetToSeeds(); triggerToast('Databases restored to seeds.'); }}}>
              Reset to Defaults
            </button>
          </div>
        </aside>

        {/* Admin Main workspace */}
        <main className="admin-workspace-content">
          {/* Active Course Selector Header for content-linking tabs */}
          {activeTab !== 'courses' && (
            <div className="admin-course-selector-bar card">
              <label className="form-label">Managing Content For Course:</label>
              <select 
                value={selectedCourseId} 
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="form-control"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* TAB 1: COURSES MANAGEMENT */}
          {activeTab === 'courses' && (
            <div className="courses-mgmt-pane">
              <div className="pane-header">
                <div>
                  <h3>Platform Courses</h3>
                  <p>Create, update, and manage course categories and instructors.</p>
                </div>
                <button type="button" className="btn btn-primary" onClick={(e) => { e.preventDefault(); handleOpenAddCourse(); }}>
                  <Plus size={16} />
                  <span>Create Course</span>
                </button>
              </div>

              <div className="table-responsive card">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Domain Code</th>
                      <th>Course Name</th>
                      <th>Category</th>
                      <th>Instructor</th>
                      <th>Duration</th>
                      <th>Lessons</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.code}</strong></td>
                        <td>{c.name}</td>
                        <td><span className="badge badge-secondary">{c.category}</span></td>
                        <td>{c.instructor}</td>
                        <td>{c.duration}</td>
                        <td>{lectures.filter(l => l.courseId === c.id).length} Videos</td>
                        <td className="row-actions">
                          {deletingCourseId === c.id ? (
                            <div className="inline-confirm-actions">
                              <button type="button" className="btn btn-danger btn-xs" onClick={(e) => { e.preventDefault(); deleteCourse(c.id); setDeletingCourseId(null); }}>Delete</button>
                              <button type="button" className="btn btn-secondary btn-xs" onClick={(e) => { e.preventDefault(); setDeletingCourseId(null); }}>Cancel</button>
                            </div>
                          ) : (
                            <>
                              <button type="button" className="btn-icon" title="Edit course information" onClick={(e) => { e.preventDefault(); handleOpenEditCourse(c); }}>
                                <Edit2 size={14} />
                              </button>
                              <button type="button" className="btn-icon text-danger" title="Delete course" onClick={(e) => { e.preventDefault(); setDeletingCourseId(c.id); }}>
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: VIDEO STUDIO UPLOAD */}
          {activeTab === 'videos' && (
            <div className="video-mgmt-pane">
              <div className="pane-header">
                <div>
                  <h3>YouTube Studio Video Upload</h3>
                  <p>Organize video lectures for the selected course domain.</p>
                </div>
              </div>

              <div className="upload-layout-grid">
                {/* Upload Form */}
                <form className="card upload-form-card" onSubmit={handleVideoSubmit}>
                  <h4>{editingLectureId ? 'Edit Lecture Details' : 'Upload New Lesson'}</h4>
                  
                  {/* YouTube Studio styled Drag/Drop simulated zone */}
                  {uploadError ? (
                    <div className="upload-error-zone card animate-fade-in" style={{
                      padding: '1.5rem',
                      textAlign: 'center',
                      border: '2px dashed var(--danger)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#fef2f2',
                      marginBottom: '1rem',
                      position: 'relative'
                    }}>
                      <AlertCircle size={36} style={{ color: 'var(--danger)', marginBottom: '0.75rem', marginLeft: 'auto', marginRight: 'auto' }} />
                      <h5 style={{ color: 'var(--danger-dark)', fontWeight: '700', margin: '0 0 4px' }}>Upload Failed!</h5>
                      <p style={{ fontSize: '13px', color: 'var(--danger-dark)', marginBottom: '4px' }}>
                        Selected File: <strong>{selectedFile?.name}</strong> ({selectedFile ? Math.round(selectedFile.size / 1024 / 1024 * 100) / 100 : 0} MB)
                      </p>
                      <p style={{ fontSize: '13px', color: 'var(--danger-dark)', marginBottom: '1rem', fontWeight: 'bold' }}>
                        Reason: {uploadError}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        <button 
                          type="button" 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleFileUpload(selectedFile)}
                          disabled={isUploading}
                        >
                          {isUploading ? 'Retrying...' : 'Retry Upload'}
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setUploadError(null);
                            setSelectedFile(null);
                          }}
                          disabled={isUploading}
                        >
                          Choose Different File
                        </button>
                      </div>
                    </div>
                  ) : videoForm.url && videoForm.url.trim() !== '' ? (
                    <div className="upload-completed-zone card animate-fade-in" style={{
                      padding: '1.5rem',
                      textAlign: 'center',
                      border: '2px dashed var(--success)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#f0fdf4',
                      marginBottom: '1rem',
                      position: 'relative'
                    }}>
                      <CheckCircle size={36} style={{ color: 'var(--success)', marginBottom: '0.75rem', marginLeft: 'auto', marginRight: 'auto' }} />
                      <h5 style={{ color: 'var(--success-dark)', fontWeight: '700', margin: '0 0 4px' }}>Video File Ready!</h5>
                      <p style={{ fontSize: '13px', color: 'var(--success-dark)', marginBottom: '4px', wordBreak: 'break-all' }}>
                        File URL: <strong>{videoForm.url}</strong>
                      </p>
                      {videoForm.duration && (
                        <p style={{ fontSize: '13px', color: 'var(--success-dark)', marginBottom: '1rem' }}>
                          Auto-Detected Duration: <strong>{videoForm.duration}</strong>
                        </p>
                      )}
                      
                      {/* Video Preview */}
                      <div style={{ maxWidth: '320px', margin: '0 auto 1rem', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <video 
                          ref={previewVideoRef}
                          src={videoForm.url} 
                          controls 
                          crossOrigin="anonymous"
                          style={{ width: '100%', maxHeight: '160px', display: 'block' }}
                          onLoadedMetadata={(e) => setVideoDuration(e.target.duration)}
                          onTimeUpdate={(e) => setTimelinePosition(e.target.currentTime)}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        <button 
                          type="button" 
                          className="btn btn-secondary btn-xs"
                          onClick={() => {
                            // Reset the url and publicId back to defaults to let them select another file
                            setVideoForm(prev => ({
                              ...prev,
                              url: '',
                              videoPublicId: '',
                              duration: ''
                            }));
                            setSelectedFile(null);
                            setUploadError(null);
                          }}
                        >
                          Replace Video
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className={`drag-upload-zone ${dragActive ? 'active' : ''}`}
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                    >
                      <UploadCloud size={36} className="cloud-icon" />
                      <h5>Drag & drop video file to upload</h5>
                      <p>or select file from local directory</p>
                      
                      <input 
                        type="file" 
                        id="video-file-picker" 
                        accept="video/*" 
                        className="file-picker-hidden" 
                        onChange={handleFileChange}
                      />
                      <label htmlFor="video-file-picker" className="btn btn-secondary btn-sm">
                        Select File
                      </label>

                      {isUploading && (
                        <div className="upload-progress-box">
                          <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                          </div>
                          <span className="progress-text">Uploading: {uploadProgress}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Lesson Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Introduction to Variables" 
                        className="form-control" 
                        value={videoForm.title}
                        onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Lesson Number</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={editingLectureId ? `Lesson ${videoForm.index}` : `Lesson ${activeCourseLectures.length + 1} (Auto)`}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea 
                      placeholder="Write brief description of lessons covered in this video..." 
                      className="form-control h-80" 
                      value={videoForm.description}
                      onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                      required
                    ></textarea>
                  </div>

                  {/* Thumbnail Section */}
                  <div className="form-group" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <label className="form-label" style={{ fontWeight: '600' }}>Lecture Thumbnail</label>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      Choose a cover image that will be displayed in the playlist and player before playback.
                    </p>

                    {/* Thumbnail Option Tabs */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                      <button
                        type="button"
                        className={`btn btn-xs ${thumbnailMethod === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setThumbnailMethod('upload')}
                      >
                        Upload Image file (Method 1)
                      </button>
                      <button
                        type="button"
                        className={`btn btn-xs ${thumbnailMethod === 'generate' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setThumbnailMethod('generate')}
                        disabled={!videoForm.url}
                        title={!videoForm.url ? 'Upload a video file first to enable frame generation' : ''}
                      >
                        Generate from Video (Method 2)
                      </button>
                    </div>

                    {/* Method 1: Upload File picker */}
                    {thumbnailMethod === 'upload' && (
                      <div className="thumbnail-upload-picker" style={{ marginBottom: '1rem' }}>
                        <input
                          type="file"
                          id="thumbnail-file-picker"
                          accept="image/jpeg,image/png,image/webp"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleLectureThumbnailUpload(e.target.files[0]);
                            }
                          }}
                        />
                        <label htmlFor="thumbnail-file-picker" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                          Select JPG/PNG/WEBP Image
                        </label>
                        {isUploadingThumbnail && thumbnailMethod === 'upload' && (
                          <div style={{ marginTop: '8px', fontSize: '12px' }}>
                            Uploading Thumbnail: {thumbnailProgress}%
                          </div>
                        )}
                      </div>
                    )}

                    {/* Method 2: Generate from Timeline */}
                    {thumbnailMethod === 'generate' && videoForm.url && (
                      <div className="thumbnail-timeline-selector" style={{ marginBottom: '1rem' }}>
                        <p style={{ fontSize: '12px', marginBottom: '8px' }}>
                          Drag the timeline slider to find a suitable frame from the video preview player, then capture it.
                        </p>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>0:00</span>
                          <input
                            type="range"
                            min={0}
                            max={videoDuration || 100}
                            step={0.1}
                            value={timelinePosition}
                            onChange={(e) => {
                              const pos = parseFloat(e.target.value);
                              setTimelinePosition(pos);
                              if (previewVideoRef.current) {
                                previewVideoRef.current.currentTime = pos;
                              }
                            }}
                            style={{ flexGrow: 1, height: '6px', borderRadius: '3px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {videoDuration ? `${Math.floor(videoDuration / 60)}:${('0' + Math.floor(videoDuration % 60)).slice(-2)}` : '0:00'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={handleGenerateThumbnail}
                            disabled={isUploadingThumbnail}
                          >
                            {isUploadingThumbnail ? 'Generating...' : 'Use Current Frame as Thumbnail'}
                          </button>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Current Position: <strong>{Math.floor(timelinePosition / 60)}:{('0' + Math.floor(timelinePosition % 60)).slice(-2)}</strong>
                          </span>
                        </div>

                        {isUploadingThumbnail && thumbnailMethod === 'generate' && (
                          <div style={{ marginTop: '8px', fontSize: '12px' }}>
                            Uploading Generated Frame: {thumbnailProgress}%
                          </div>
                        )}
                      </div>
                    )}

                    {/* Current Thumbnail Preview Card */}
                    {videoForm.thumbnail && (
                      <div className="card thumbnail-preview-card" style={{
                        padding: '10px',
                        maxWidth: '240px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        marginTop: '1rem',
                        backgroundColor: 'var(--background)'
                      }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '6px', color: 'var(--text)' }}>
                          Thumbnail Preview:
                        </span>
                        <div style={{ width: '100%', height: '120px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#e2e8f0' }}>
                          <img
                            src={videoForm.thumbnail}
                            alt="Lecture Thumbnail Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn-text"
                          style={{ color: 'var(--danger)', fontSize: '11px', marginTop: '6px', cursor: 'pointer', padding: 0 }}
                          onClick={() => setVideoForm(prev => ({ ...prev, thumbnail: '', thumbnailPublicId: '' }))}
                        >
                          Remove Thumbnail
                        </button>
                      </div>
                    )}
                  </div>

                  <input type="hidden" name="videoUrl" value={videoForm.url} required />

                  <div className="form-actions-row">
                    {editingLectureId && (
                      <button type="button" className="btn btn-secondary" onClick={() => { setEditingLectureId(null); setVideoForm({ title: '', description: '', duration: '15:00', tags: '', index: 1, url: '', videoPublicId: '', thumbnail: '', thumbnailPublicId: '' }); setSelectedFile(null); setUploadError(null); }}>
                        Cancel Edit
                      </button>
                    )}
                    <button type="submit" className="btn btn-primary">
                      {editingLectureId ? 'Update Lesson' : 'Publish Lesson'}
                    </button>
                  </div>
                </form>

                {/* Published lectures checklist */}
                <div className="card list-view-card">
                  <h4>Published Course Videos</h4>
                  <div className="scrollable-admin-list">
                    {activeCourseLectures.length > 0 ? (
                      activeCourseLectures.sort((a,b)=>a.index-b.index).map(lec => (
                        <div className="published-item-row" key={lec.id}>
                          <div className="item-meta">
                            <span className="index-indicator">L{lec.index}</span>
                            <div>
                              <h5>{lec.title}</h5>
                              <span>{lec.duration} | {lec.description.substring(0, 45)}...</span>
                            </div>
                          </div>
                          <div className="item-actions">
                            {deletingLecId === lec.id ? (
                              <div className="inline-confirm-actions">
                                <button type="button" className="btn btn-danger btn-xs" onClick={(e) => { e.preventDefault(); deleteLecture(lec.id); setDeletingLecId(null); }}>Delete</button>
                                <button type="button" className="btn btn-secondary btn-xs" onClick={(e) => { e.preventDefault(); setDeletingLecId(null); }}>Cancel</button>
                              </div>
                            ) : (
                              <>
                                <button type="button" className="btn-icon" onClick={(e) => { e.preventDefault(); handleEditLecture(lec); }}>
                                  <Edit2 size={13} />
                                </button>
                                <button type="button" className="btn-icon text-danger" onClick={(e) => { e.preventDefault(); setDeletingLecId(lec.id); }}>
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-content-fallback-sm">
                        <BookOpen size={24} />
                        <p>No video lectures published yet for this course.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QUIZ BUILDER */}
          {activeTab === 'quizzes' && (
            <div className="quiz-mgmt-pane">
              <div className="pane-header">
                <div>
                  <h3>Assessment Quiz Builder</h3>
                  <p>Construct comprehensive assessments with unlimited MCQs, scoring limits, and countdown timers.</p>
                </div>
              </div>

              <div className="upload-layout-grid">
                {/* Builder Form */}
                <form className="card upload-form-card" onSubmit={handleQuizSubmit}>
                  <h4>{editingQuizId ? 'Edit Quiz Meta' : 'Create New Assessment'}</h4>

                  <div className="form-group">
                    <label className="form-label">Quiz Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Variables & Types Assessment" 
                      className="form-control" 
                      value={quizForm.title}
                      onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description / Instructions</label>
                    <textarea 
                      placeholder="Enter quiz instructions..." 
                      className="form-control h-80" 
                      value={quizForm.description}
                      onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                      required
                    ></textarea>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Time Limit (seconds)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 180" 
                        className="form-control" 
                        value={quizForm.timeLimit}
                        onChange={(e) => setQuizForm({ ...quizForm, timeLimit: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Current Max Marks</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={quizQuestionTotals}
                        readOnly
                      />
                    </div>
                  </div>

                  {/* MCQ Question Builder Block */}
                  <div className="nested-builder-block card">
                    <h5>Add MCQ Question</h5>
                    
                    <div className="form-group">
                      <label className="form-label">Question Text</label>
                      <input 
                        type="text" 
                        placeholder="What is the answer to...?" 
                        className="form-control" 
                        value={currentQuestion.questionText}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionText: e.target.value })}
                      />
                    </div>

                    <div className="mcq-options-grid">
                      {currentQuestion.options.map((opt, optIdx) => (
                        <div className="form-group" key={optIdx}>
                          <label className="form-label">Option {String.fromCharCode(65 + optIdx)}</label>
                          <input 
                            type="text" 
                            placeholder={`Choice ${optIdx + 1}`} 
                            className="form-control"
                            value={opt}
                            onChange={(e) => {
                              const updatedOpts = [...currentQuestion.options];
                              updatedOpts[optIdx] = e.target.value;
                              setCurrentQuestion({ ...currentQuestion, options: updatedOpts });
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">Correct Answer</label>
                        <select 
                          value={currentQuestion.correctIndex} 
                          onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctIndex: parseInt(e.target.value) })}
                          className="form-control"
                        >
                          <option value="0">Option A</option>
                          <option value="1">Option B</option>
                          <option value="2">Option C</option>
                          <option value="3">Option D</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Question Marks</label>
                        <input 
                          type="number" 
                          placeholder="10" 
                          className="form-control"
                          value={currentQuestion.marks}
                          onChange={(e) => setCurrentQuestion({ ...currentQuestion, marks: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Explanation (optional)</label>
                      <textarea
                        className="form-control h-80"
                        placeholder="Add a short explanation for the answer..."
                        value={currentQuestion.explanation || ''}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })}
                      />
                    </div>

                    <button type="button" className="btn btn-secondary btn-sm w-100" onClick={handleAddQuestion}>
                      <Plus size={14} />
                      <span>Add Question to Quiz List</span>
                    </button>
                  </div>

                  <div className="quiz-question-list">
                    {quizForm.questions.length > 0 ? (
                      quizForm.questions.map((question, index) => {
                        const isExpanded = expandedQuestionIds.includes(question.id);
                        const correctOption = question.options[question.correctIndex] || 'Not set';

                        return (
                          <div className="card quiz-question-card" key={question.id}>
                            <button
                              type="button"
                              className="quiz-question-summary"
                              onClick={() => {
                                setExpandedQuestionIds((prev) => (
                                  prev.includes(question.id)
                                    ? prev.filter((id) => id !== question.id)
                                    : [...prev, question.id]
                                ));
                              }}
                            >
                              <div className="quiz-question-summary-main">
                                <span className="quiz-question-number">Question {index + 1}</span>
                                <strong>{question.questionText || 'Untitled question'}</strong>
                                <div className="quiz-question-options">
                                  {question.options.map((option, optIdx) => (
                                    <span className="quiz-option-chip" key={`${question.id}-chip-${optIdx}`}>
                                      {String.fromCharCode(65 + optIdx)}. {option || 'Empty option'}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="quiz-question-summary-meta">
                                <span>Correct: {String.fromCharCode(65 + question.correctIndex)}. {correctOption}</span>
                                <span>Marks: {question.marks}</span>
                                <span>{isExpanded ? 'Click to collapse' : 'Click to edit'}</span>
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="quiz-question-editor">
                                <div className="form-group">
                                  <label className="form-label">Question Text</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    value={question.questionText}
                                    onChange={(e) => handleQuestionFieldChange(question.id, 'questionText', e.target.value)}
                                  />
                                </div>

                                <div className="mcq-options-grid">
                                  {question.options.map((option, optIdx) => (
                                    <div className="form-group" key={`${question.id}-option-${optIdx}`}>
                                      <label className="form-label">Option {String.fromCharCode(65 + optIdx)}</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        value={option}
                                        onChange={(e) => handleQuestionOptionChange(question.id, optIdx, e.target.value)}
                                      />
                                    </div>
                                  ))}
                                </div>

                                <div className="form-grid-2">
                                  <div className="form-group">
                                    <label className="form-label">Correct Answer</label>
                                    <select
                                      className="form-control"
                                      value={question.correctIndex}
                                      onChange={(e) => handleQuestionFieldChange(question.id, 'correctIndex', Number(e.target.value))}
                                    >
                                      <option value="0">Option A</option>
                                      <option value="1">Option B</option>
                                      <option value="2">Option C</option>
                                      <option value="3">Option D</option>
                                    </select>
                                  </div>

                                  <div className="form-group">
                                    <label className="form-label">Question Marks</label>
                                    <input
                                      type="number"
                                      className="form-control"
                                      value={question.marks}
                                      onChange={(e) => handleQuestionFieldChange(question.id, 'marks', Number(e.target.value) || 0)}
                                    />
                                  </div>
                                </div>

                                <div className="form-group">
                                  <label className="form-label">Explanation (optional)</label>
                                  <textarea
                                    className="form-control h-80"
                                    value={question.explanation || ''}
                                    onChange={(e) => handleQuestionFieldChange(question.id, 'explanation', e.target.value)}
                                  />
                                </div>

                                <div className="quiz-question-actions">
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleQuestionMove(question.id, -1)}
                                    disabled={index === 0}
                                  >
                                    Move Up
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleQuestionMove(question.id, 1)}
                                    disabled={index === quizForm.questions.length - 1}
                                  >
                                    Move Down
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleQuestionDuplicate(question.id)}
                                  >
                                    Duplicate
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleQuestionDelete(question.id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="no-content-fallback-sm">
                        <HelpCircle size={24} />
                        <p>No questions added yet. Add the first question above to begin building the quiz.</p>
                      </div>
                    )}
                  </div>

                  {/* Form Submission */}
                  <div className="quiz-questions-preview-badge">
                    <span>Questions added: {quizForm.questions.length}</span>
                    <span>Total marks: {quizQuestionTotals}</span>
                  </div>

                  <div className="form-actions-row">
                    {editingQuizId && (
                      <button type="button" className="btn btn-secondary" onClick={() => { setEditingQuizId(null); setQuizForm({ title: '', description: '', timeLimit: 120, marks: 0, questions: [] }); setCurrentQuestion(getEmptyQuestion()); setExpandedQuestionIds([]); }}>
                        Cancel Edit
                      </button>
                    )}
                    <button type="submit" className="btn btn-primary" disabled={quizForm.questions.length === 0}>
                      <Save size={16} />
                      <span>{editingQuizId ? 'Update Quiz' : 'Publish Quiz'}</span>
                    </button>
                  </div>
                </form>

                {/* Published quizzes checklist */}
                <div className="card list-view-card">
                  <h4>Published Course Quizzes</h4>
                  <div className="scrollable-admin-list">
                    {activeCourseQuizzes.length > 0 ? (
                      activeCourseQuizzes.map(qz => (
                        <div className="published-item-row" key={qz.id}>
                          <div className="item-meta">
                            <span className="index-indicator">QZ</span>
                            <div>
                              <h5>{qz.title}</h5>
                              <span>{qz.questions.length} Questions | Max Marks: {qz.marks}</span>
                            </div>
                          </div>
                          <div className="item-actions">
                            {deletingQuizId === qz.id ? (
                              <div className="inline-confirm-actions">
                                <button type="button" className="btn btn-danger btn-xs" onClick={(e) => { e.preventDefault(); deleteQuiz(qz.id); setDeletingQuizId(null); }}>Delete</button>
                                <button type="button" className="btn btn-secondary btn-xs" onClick={(e) => { e.preventDefault(); setDeletingQuizId(null); }}>Cancel</button>
                              </div>
                            ) : (
                              <>
                                <button type="button" className="btn-icon" onClick={(e) => { e.preventDefault(); handleEditQuiz(qz); }}>
                                  <Edit2 size={13} />
                                </button>
                                <button type="button" className="btn-icon text-danger" onClick={(e) => { e.preventDefault(); setDeletingQuizId(qz.id); }}>
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-content-fallback-sm">
                        <Award size={24} />
                        <p>No quizzes built yet for this course.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CODING TASKS MANAGEMENT */}
          {activeTab === 'tasks' && (
            <div className="coding-tasks-mgmt-pane">
              <div className="pane-header">
                <div>
                  <h3>Coding Challenges Management</h3>
                  <p>Attach programming problems (e.g. LeetCode links) to match the learning curriculum.</p>
                </div>
              </div>

              <div className="upload-layout-grid">
                {/* Task Form */}
                <form className="card upload-form-card" onSubmit={handleTaskSubmit}>
                  <h4>{editingTaskId ? 'Edit Coding Task' : 'Add LeetCode Challenge'}</h4>

                  <div className="form-group">
                    <label className="form-label">Problem Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Two Sum" 
                      className="form-control" 
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">LeetCode Problem URL Link</label>
                    <input 
                      type="url" 
                      placeholder="https://leetcode.com/problems/two-sum/" 
                      className="form-control" 
                      value={taskForm.link}
                      onChange={(e) => setTaskForm({ ...taskForm, link: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Difficulty Level</label>
                      <select 
                        value={taskForm.difficulty} 
                        onChange={(e) => setTaskForm({ ...taskForm, difficulty: e.target.value })}
                        className="form-control"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tags (Comma separated)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Arrays, Hash Table" 
                        className="form-control" 
                        value={taskForm.tags}
                        onChange={(e) => setTaskForm({ ...taskForm, tags: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Short Problem Description</label>
                    <textarea 
                      placeholder="Find indices of two numbers that add up to target..." 
                      className="form-control h-80" 
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                      required
                    ></textarea>
                  </div>

                  <div className="form-actions-row">
                    {editingTaskId && (
                      <button type="button" className="btn btn-secondary" onClick={() => { setEditingTaskId(null); setTaskForm({ title: '', description: '', link: '', difficulty: 'Easy', tags: '' }); }}>
                        Cancel Edit
                      </button>
                    )}
                    <button type="submit" className="btn btn-primary">
                      {editingTaskId ? 'Update Coding Task' : 'Publish Coding Task'}
                    </button>
                  </div>
                </form>

                {/* Published tasks checklist */}
                <div className="card list-view-card">
                  <h4>Published Coding Challenges</h4>
                  <div className="scrollable-admin-list">
                    {activeCourseTasks.length > 0 ? (
                      activeCourseTasks.map(task => (
                        <div className="published-item-row" key={task.id}>
                          <div className="item-meta">
                            <span className="index-indicator">LC</span>
                            <div>
                              <h5>{task.title}</h5>
                              <span>{task.difficulty} | {task.tags}</span>
                            </div>
                          </div>
                          <div className="item-actions">
                            {deletingTaskId === task.id ? (
                              <div className="inline-confirm-actions">
                                <button type="button" className="btn btn-danger btn-xs" onClick={(e) => { e.preventDefault(); deleteCodingTask(task.id); setDeletingTaskId(null); }}>Delete</button>
                                <button type="button" className="btn btn-secondary btn-xs" onClick={(e) => { e.preventDefault(); setDeletingTaskId(null); }}>Cancel</button>
                              </div>
                            ) : (
                              <>
                                <button type="button" className="btn-icon" onClick={(e) => { e.preventDefault(); handleEditTask(task); }}>
                                  <Edit2 size={13} />
                                </button>
                                <button type="button" className="btn-icon text-danger" onClick={(e) => { e.preventDefault(); setDeletingTaskId(task.id); }}>
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-content-fallback-sm">
                        <Code size={24} />
                        <p>No coding tasks published yet for this course.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Course Modal Form */}
      {showCourseModal && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{isEditingCourse ? 'Edit Course Info' : 'Create New Course'}</h3>
              <button type="button" className="close-btn" onClick={(e) => { e.preventDefault(); setShowCourseModal(false); }}>&times;</button>
            </div>
            <form onSubmit={handleCourseSubmit} className="modal-body">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Domain Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. PY-101" 
                    className="form-control" 
                    value={courseForm.code}
                    onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    value={courseForm.category} 
                    onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                    className="form-control"
                  >
                    <option value="Development">Development</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Design">Design</option>
                    <option value="IT & Cloud">IT & Cloud</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Course Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Python Programming Masterclass" 
                  className="form-control" 
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  placeholder="Provide brief outline summary of what the course covers..." 
                  className="form-control h-80" 
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  required
                ></textarea>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Instructor Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Dr. Sarah Jenkins" 
                    className="form-control" 
                    value={courseForm.instructor}
                    onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (e.g. 14h 30m)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 12h 45m" 
                    className="form-control" 
                    value={courseForm.duration}
                    onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Course Thumbnail</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <button 
                    type="button" 
                    className={`btn btn-xs ${!useUploadThumbnail ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '4px 10px' }}
                    onClick={() => setUseUploadThumbnail(false)}
                  >
                    Image URL Link
                  </button>
                  <button 
                    type="button" 
                    className={`btn btn-xs ${useUploadThumbnail ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '4px 10px' }}
                    onClick={() => setUseUploadThumbnail(true)}
                  >
                    Upload Image File
                  </button>
                </div>

                {!useUploadThumbnail ? (
                  <input 
                    type="text" 
                    placeholder="e.g. https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5" 
                    className="form-control" 
                    value={courseForm.thumbnail}
                    onChange={(e) => setCourseForm({ ...courseForm, thumbnail: e.target.value })}
                    required
                  />
                ) : (
                  <input 
                    type="file" 
                    accept="image/*"
                    className="form-control"
                    onChange={handleThumbnailUpload}
                    required={!courseForm.thumbnail}
                  />
                )}

                {courseForm.thumbnail && (
                  <div className="thumbnail-preview-box" style={{ marginTop: '8px' }}>
                    <span className="form-label-sub" style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>Thumbnail Preview:</span>
                    <img 
                      src={courseForm.thumbnail} 
                      alt="Thumbnail Preview" 
                      style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} 
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCourseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditingCourse ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
