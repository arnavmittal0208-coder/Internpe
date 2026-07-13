import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { getVideo } from '../utils/db';
import { Play, Pause, CheckCircle, Circle, ArrowLeft, ArrowRight, Settings, FileText, Code, CheckSquare, Award, Clock, RotateCcw, Search } from 'lucide-react';

export default function CourseDashboard({ activeTab }) {
  const navigate = useNavigate();
  const { courseId, lectureId } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  
  const { 
    courses, 
    lectures, 
    codingTasks, 
    quizzes, 
    studentProgress, 
    toggleLectureCompleted, 
    toggleTaskCompleted, 
    submitQuizScore, 
    setActiveLecture,
    saveLecturePlayback,
    saveLectureNotes
  } = useContext(AppContext);

  const course = courses.find(c => c.id === courseId);
  const courseLectures = lectures.filter(l => l.courseId === courseId).sort((a, b) => a.index - b.index);
  const courseTasks = codingTasks.filter(t => t.courseId === courseId);
  const courseQuizzes = quizzes.filter(q => q.courseId === courseId);

  // Active lecture resolved from URL parameter, falling back to student progress or first lecture
  const savedActiveLecId = studentProgress.activeLectureId[courseId];
  const activeLec = courseLectures.find(l => l.id === lectureId) || 
                    courseLectures.find(l => l.id === savedActiveLecId) || 
                    courseLectures[0];

  // Video player speed state
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const videoRef = useRef(null);
  const videoWrapperRef = useRef(null);
  const autoPlayNextRef = useRef(false);

  // Custom player overlay and playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);

  // YouTube-style centered play/pause overlay states
  const [showPlayPauseOverlay, setShowPlayPauseOverlay] = useState(false);
  const [overlayIconType, setOverlayIconType] = useState('play');
  const [overlayFadeOut, setOverlayFadeOut] = useState(false);
  const overlayTimeoutRef = useRef(null);
  const overlayTimeout2Ref = useRef(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
      if (overlayTimeout2Ref.current) clearTimeout(overlayTimeout2Ref.current);
    };
  }, []);

  // Notes state
  const [notes, setNotes] = useState('');
  const [isNotesSaved, setIsNotesSaved] = useState(false);

  // Resolve local IndexedDB files or fallback to network video URLs
  const [videoSrc, setVideoSrc] = useState('');

  const savedLectureProgress = activeLec ? studentProgress.lectureProgressByLecture[activeLec.id] : null;

  useEffect(() => {
    let objectUrl = null;
    let isMounted = true;

    const loadVideoSrc = async () => {
      if (activeLec) {
        const lecId = activeLec.id;
        let lecUrl = activeLec.url;

        // Defensive sanitization for preseeded mock URLs
        if (lecUrl && typeof lecUrl === 'string') {
          if (lecUrl.includes('whttps') || (lecUrl.includes('schools.com') && !lecUrl.startsWith('https://www.w3schools.com'))) {
            const isMovie = lecUrl.endsWith('movie.mp4');
            lecUrl = isMovie ? 'https://www.w3schools.com/html/movie.mp4' : 'https://www.w3schools.com/html/mov_bbb.mp4';
          }
        }

        if (lecUrl && lecUrl.startsWith('indexeddb://')) {
          try {
            const blob = await getVideo(lecId);
            if (isMounted) {
              if (blob) {
                objectUrl = URL.createObjectURL(blob);
                setVideoSrc(objectUrl);
              } else {
                setVideoSrc('https://www.w3schools.com/html/mov_bbb.mp4'); // fallback
              }
            }
          } catch (e) {
            console.error('Failed to load local video Blob:', e);
            if (isMounted) {
              setVideoSrc('https://www.w3schools.com/html/mov_bbb.mp4');
            }
          }
        } else {
          if (isMounted) {
            setVideoSrc(lecUrl || 'https://www.w3schools.com/html/mov_bbb.mp4');
          }
        }
      }
    };

    loadVideoSrc();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [activeLec?.id]);

  // Quiz player state
  const [activeQuiz, setActiveQuiz] = useState(courseQuizzes[0] || null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { questionIdx: answerIdx }
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  // Sync active lecture state to context for "continue watching"
  useEffect(() => {
    if (activeLec) {
      // Guard: prevent infinite render loop by checking if progress already matches activeLec.id
      if (studentProgress.activeLectureId[courseId] !== activeLec.id) {
        setActiveLecture(courseId, activeLec.id);
      }

      const savedNotes = studentProgress.notesByLecture[activeLec.id] || '';
      setNotes(savedNotes);
      setIsNotesSaved(false);
    }
  }, [activeLec?.id, courseId]);

  useEffect(() => {
    if (!activeLec) {
      return;
    }

    setNotes(studentProgress.notesByLecture[activeLec.id] || '');
  }, [activeLec?.id, studentProgress.notesByLecture[activeLec?.id]]);

  // Adjust video playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, activeLec?.id]);

  useEffect(() => {
    if (activeTab !== 'video' || !activeLec || !videoRef.current) {
      return;
    }

    const video = videoRef.current;
    const savedTime = Number(savedLectureProgress?.currentPlaybackTime) || 0;

    const restorePlaybackPosition = () => {
      if (savedTime > 0 && Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = Math.min(savedTime, Math.max(0, video.duration - 0.5));
      }
    };

    video.addEventListener('loadedmetadata', restorePlaybackPosition);
    if (video.readyState >= 1) {
      restorePlaybackPosition();
    }

    return () => {
      video.removeEventListener('loadedmetadata', restorePlaybackPosition);
    };
  }, [activeTab, activeLec?.id, savedLectureProgress?.currentPlaybackTime, videoSrc]);

  useEffect(() => {
    if (activeTab !== 'video' || !activeLec || !videoRef.current) {
      return;
    }

    const video = videoRef.current;

    const persistPlayback = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        return;
      }

      const currentTime = Math.max(0, Number(video.currentTime) || 0);
      const watchPercentage = Math.min(100, Math.max(0, (currentTime / video.duration) * 100));
      saveLecturePlayback(courseId, activeLec.id, currentTime, watchPercentage).catch((error) => {
        console.error('Failed to save playback progress:', error);
      });
    };

    const interval = window.setInterval(persistPlayback, 15000);
    video.addEventListener('pause', persistPlayback);
    video.addEventListener('seeked', persistPlayback);

    return () => {
      window.clearInterval(interval);
      video.removeEventListener('pause', persistPlayback);
      video.removeEventListener('seeked', persistPlayback);
    };
  }, [activeTab, activeLec?.id, courseId, saveLecturePlayback]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (activeTab !== 'video' || !activeLec || !videoRef.current) {
        return;
      }

      const target = event.target;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target?.isContentEditable) {
        return;
      }

      const video = videoRef.current;

      // 1. Spacebar to play/pause (prevent page scrolling)
      if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        
        if (!isPlaying && !showEndScreen) {
          handleStartPlayback();
        } else if (isPlaying && !showEndScreen) {
          if (video.paused) {
            const playPromise = video.play();
            if (playPromise && typeof playPromise.catch === 'function') {
              playPromise.catch(() => {});
            }
          } else {
            video.pause();
          }
        }
        return;
      }

      // 2. Left and Right Arrow keys to seek (5 seconds)
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        // Allow seeking once playback is active
        if (!isPlaying || showEndScreen) {
          return;
        }

        event.preventDefault();

        const skipSeconds = 5;
        const currentTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
        const duration = Number.isFinite(video.duration) ? video.duration : currentTime + skipSeconds;
        const nextTime = event.key === 'ArrowRight'
          ? Math.min(duration, currentTime + skipSeconds)
          : Math.max(0, currentTime - skipSeconds);

        video.currentTime = nextTime;

        if (video.paused) {
          const playPromise = video.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {});
          }
        }
        return;
      }

      // 3. 'f' or 'F' key to toggle fullscreen
      if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, activeLec?.id, isPlaying, showEndScreen]);

  // Quiz timer implementation
  useEffect(() => {
    if (quizStarted && timeLeft > 0 && !quizFinished) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleQuizSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [quizStarted, timeLeft, quizFinished]);

  if (!course) {
    return (
      <div className="container error-screen">
        <h3>Course not found.</h3>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/courses')}>Back to Catalog</button>
      </div>
    );
  }

  // Lecture controls
  const handleLectureSelect = (lec) => {
    navigate(`/courses/${courseId}/lessons/${lec.id}`);
  };

  const handleNextLec = () => {
    const currentIndex = courseLectures.findIndex(l => l.id === activeLec?.id);
    if (currentIndex >= 0 && currentIndex < courseLectures.length - 1) {
      navigate(`/courses/${courseId}/lessons/${courseLectures[currentIndex + 1].id}`);
    }
  };

  const handleNextLecClick = () => {
    autoPlayNextRef.current = true;
    handleNextLec();
  };

  const handlePrevLec = () => {
    const currentIndex = courseLectures.findIndex(l => l.id === activeLec?.id);
    if (currentIndex > 0) {
      navigate(`/courses/${courseId}/lessons/${courseLectures[currentIndex - 1].id}`);
    }
  };

  const handleSaveNotes = () => {
    if (activeLec) {
      saveLectureNotes(courseId, activeLec.id, notes)
        .then(() => {
          setIsNotesSaved(true);
          setTimeout(() => setIsNotesSaved(false), 2000);
        })
        .catch((error) => {
          console.error('Failed to save lecture notes:', error);
        });
    }
  };

  const handleStartPlayback = () => {
    setIsPlaying(true);
    setShowEndScreen(false);
    setTimeout(() => {
      if (videoRef.current) {
        const playPromise = videoRef.current.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch((e) => console.log('Playback promise caught:', e));
        }
      }
    }, 50);
  };

  const handlePlay = () => {
    if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    if (overlayTimeout2Ref.current) clearTimeout(overlayTimeout2Ref.current);
    
    // Only show play pop overlay if we were already playing (i.e. user toggled play/pause)
    if (isPlaying) {
      setOverlayIconType('play');
      setOverlayFadeOut(false);
      setShowPlayPauseOverlay(true);
      
      overlayTimeoutRef.current = setTimeout(() => {
        setOverlayFadeOut(true);
        overlayTimeout2Ref.current = setTimeout(() => {
          setShowPlayPauseOverlay(false);
          setOverlayFadeOut(false);
        }, 150);
      }, 400);
    }
  };

  const handlePause = () => {
    if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    if (overlayTimeout2Ref.current) clearTimeout(overlayTimeout2Ref.current);
    
    if (showEndScreen) {
      return;
    }
    
    setOverlayIconType('pause');
    setOverlayFadeOut(false);
    setShowPlayPauseOverlay(true);

    overlayTimeoutRef.current = setTimeout(() => {
      setOverlayFadeOut(true);
      overlayTimeout2Ref.current = setTimeout(() => {
        setShowPlayPauseOverlay(false);
        setOverlayFadeOut(false);
      }, 150);
    }, 800);
  };

  // Reset overlays and clear timers when active lecture changes
  useEffect(() => {
    setIsPlaying(false);
    setShowEndScreen(false);
    setShowPlayPauseOverlay(false);
    setOverlayFadeOut(false);
    if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    if (overlayTimeout2Ref.current) clearTimeout(overlayTimeout2Ref.current);

    // If Next Lesson was clicked from the end screen, immediately start playback on the new video
    if (autoPlayNextRef.current) {
      autoPlayNextRef.current = false;
      handleStartPlayback();
    }
  }, [activeLec?.id]);

  // Intercept native video fullscreen and redirect it to the parent wrapper
  useEffect(() => {
    const handleFullscreenChange = () => {
      const video = videoRef.current;
      const wrapper = videoWrapperRef.current;
      if (!video || !wrapper) return;

      const currentFullscreenEl = document.fullscreenElement || 
                                   document.webkitFullscreenElement || 
                                   document.mozFullScreenElement || 
                                   document.msFullscreenElement;
                                   
      if (currentFullscreenEl === video) {
        // Exit video fullscreen and immediately escalate to wrapper fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen().then(() => {
            if (wrapper.requestFullscreen) {
              wrapper.requestFullscreen();
            }
          }).catch((err) => console.log('Fullscreen redirect error:', err));
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
          if (wrapper.webkitRequestFullscreen) {
            wrapper.webkitRequestFullscreen();
          }
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  function toggleFullscreen() {
    const wrapper = videoWrapperRef.current;
    if (!wrapper) return;

    const isFullscreen = document.fullscreenElement ||
                        document.mozFullScreenElement ||
                        document.webkitFullscreenElement ||
                        document.msFullscreenElement;

    if (!isFullscreen) {
      if (wrapper.requestFullscreen) {
        wrapper.requestFullscreen();
      } else if (wrapper.mozRequestFullScreen) {
        wrapper.mozRequestFullScreen();
      } else if (wrapper.webkitRequestFullscreen) {
        wrapper.webkitRequestFullscreen();
      } else if (wrapper.msRequestFullscreen) {
        wrapper.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }

  const formatDurationTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const s = Math.floor(secs);
    const mins = Math.floor(s / 60);
    const remainder = s % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const handleVideoEnded = async () => {
    setShowEndScreen(true);
    if (activeLec && !studentProgress.completedLectures.includes(activeLec.id)) {
      const currentTime = Number(videoRef.current?.currentTime || videoRef.current?.duration || 0);
      await saveLecturePlayback(courseId, activeLec.id, currentTime, 100, true).catch((error) => {
        console.error('Failed to finalize playback progress:', error);
      });
      await toggleLectureCompleted(activeLec.id, courseId, { currentPlaybackTime: currentTime, watchPercentage: 100 });
    }
  };

  // Quiz controllers
  const startQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setSelectedAnswers({});
    setCurrentQuestionIdx(0);
    setTimeLeft(quiz.timeLimit);
    setQuizStarted(true);
    setQuizFinished(false);
  };

  const handleSelectOption = (qIdx, optIdx) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [qIdx]: optIdx
    }));
  };

  const handleQuizSubmit = () => {
    clearInterval(timerRef.current);
    setQuizFinished(true);

    // Calculate score
    let score = 0;
    let correctCount = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        score += q.marks || 10;
        correctCount++;
      }
    });

    const maxScore = activeQuiz.questions.reduce((sum, q) => sum + (q.marks || 10), 0);
    const passThreshold = maxScore * 0.5; // 50% passing
    const passed = score >= passThreshold;

    submitQuizScore(activeQuiz.id, score, activeQuiz.questions.length, passed, correctCount);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="container dashboard-container animate-fade-in">
      {/* Top Breadcrumb Header */}
      <div className="dashboard-breadcrumb">
        <button type="button" className="btn-text btn-back-courses" onClick={() => navigate('/courses')}>
          <ArrowLeft size={16} />
          <span>Back to Catalog</span>
        </button>
        <span className="breadcrumb-divider">/</span>
        <span className="breadcrumb-current">{course.name}</span>
      </div>

      {/* Main Workspace Layout */}
      <div className="dashboard-grid">
        {/* Left Workspace Panel */}
        <div className="dashboard-main-panel">
          {activeTab === 'video' && activeLec && (
            <div className="video-player-section">
              {/* HTML5 Video Player Container */}
              <div ref={videoWrapperRef} className="video-wrapper" style={{ position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: '#000000', overflow: 'hidden', borderRadius: '8px' }}>
                <style>{`
                  /* Fullscreen styles for the wrapper */
                  .video-wrapper:fullscreen {
                    width: 100vw !important;
                    height: 100vh !important;
                    max-width: 100vw !important;
                    max-height: 100vh !important;
                    aspect-ratio: auto !important;
                    border-radius: 0 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    background-color: #000000 !important;
                  }
                  .video-wrapper:fullscreen .main-video-player {
                    width: 100% !important;
                    height: 100% !important;
                    max-height: 100vh !important;
                    object-fit: contain !important;
                  }
                  .video-wrapper:fullscreen .video-thumbnail-overlay,
                  .video-wrapper:fullscreen .video-endscreen-overlay {
                    border-radius: 0 !important;
                    z-index: 20 !important;
                  }
                  @keyframes yt-overlay-pop {
                    0% {
                      transform: translate(-50%, -50%) scale(0.75);
                      opacity: 0;
                    }
                    100% {
                      transform: translate(-50%, -50%) scale(1);
                      opacity: 1;
                    }
                  }
                `}</style>
                
                {/* 1. Thumbnail Overlay Before Playback */}
                {!isPlaying && !showEndScreen && (
                  <div className="video-thumbnail-overlay animate-fade-in" style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: (activeLec.thumbnail || course.thumbnail) 
                      ? `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${activeLec.thumbnail || course.thumbnail}) center/cover no-repeat`
                      : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: '#ffffff',
                    padding: '2rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    zIndex: 10
                  }} onClick={handleStartPlayback}>
                    
                    {/* Centered Play Button or Continue Watching */}
                    {savedLectureProgress && Number(savedLectureProgress.currentPlaybackTime) > 0 && !studentProgress.completedLectures.includes(activeLec.id) ? (
                      <div className="continue-watching-box card animate-fade-in" style={{
                        padding: '1.5rem',
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '12px',
                        maxWidth: '360px',
                        width: '90%',
                        textAlign: 'center',
                        color: '#fff',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
                      }}>
                        <div style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 12px'
                        }}>
                          <Play size={26} fill="white" style={{ marginLeft: '4px' }} />
                        </div>
                        <h4 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px', color: '#fff' }}>Continue Watching</h4>
                        <p style={{ fontSize: '13px', opacity: 0.8, margin: '0 0 12px', color: '#cbd5e1' }}>
                          Resume Lesson {courseLectures.findIndex(l => l.id === activeLec.id) + 1} at {formatDurationTime(savedLectureProgress.currentPlaybackTime)}
                        </p>
                        {/* Progress Bar inside card */}
                        <div style={{
                          height: '4px',
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          borderRadius: '2px',
                          overflow: 'hidden',
                          width: '100%'
                        }}>
                          <div style={{
                            height: '100%',
                            backgroundColor: 'var(--primary)',
                            width: `${savedLectureProgress.watchPercentage}%`
                          }} />
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        width: '76px',
                        height: '76px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        border: '2px solid #ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(4px)',
                        marginBottom: '1.5rem',
                        transition: 'transform 0.2s'
                      }} className="play-button-glow">
                        <Play size={32} fill="white" style={{ marginLeft: '4px' }} />
                      </div>
                    )}

                    {(!savedLectureProgress || Number(savedLectureProgress.currentPlaybackTime) === 0 || studentProgress.completedLectures.includes(activeLec.id)) && (
                      <div className="thumbnail-title-meta">
                        <span style={{
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          letterSpacing: '1.5px',
                          fontWeight: 'bold',
                          opacity: 0.8,
                          display: 'block',
                          marginBottom: '6px'
                        }}>
                          Lesson {courseLectures.findIndex(l => l.id === activeLec.id) + 1} • {activeLec.duration}
                        </span>
                        <h3 style={{ fontSize: '24px', fontWeight: '700', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.5)', color: '#fff' }}>
                          {activeLec.title}
                        </h3>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. End Screen Overlay */}
                {showEndScreen && (
                  <div className="video-endscreen-overlay animate-fade-in" style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: '#ffffff',
                    padding: '2rem',
                    textAlign: 'center',
                    zIndex: 11
                  }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1rem'
                    }}>
                      <CheckCircle size={36} color="white" />
                    </div>

                    {courseLectures.findIndex(l => l.id === activeLec.id) === courseLectures.length - 1 ? (
                      // Last Lecture of Course
                      <>
                        <h3 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 8px', color: '#fff' }}>✓ Course Complete!</h3>
                        <p style={{ fontSize: '14px', opacity: 0.8, maxWidth: '400px', marginBottom: '2rem', color: '#cbd5e1' }}>
                          Congratulations! You have completed all the video lectures in <strong>{course.name}</strong>.
                        </p>
                        
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                            setShowEndScreen(false);
                            setIsPlaying(true);
                            setTimeout(() => {
                              if (videoRef.current) {
                                videoRef.current.currentTime = 0;
                                videoRef.current.play();
                              }
                            }, 50);
                          }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <RotateCcw size={14} />
                            <span>Rewatch</span>
                          </button>
                          
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/courses')}>
                            <span>Back to Course Catalog</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      // Next Lecture available
                      <>
                        <h3 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 8px', color: '#fff' }}>✓ Lesson Complete</h3>
                        <p style={{ fontSize: '14px', opacity: 0.8, maxWidth: '400px', marginBottom: '2rem', color: '#cbd5e1' }}>
                          Ready to proceed? Up next is Lesson {courseLectures.findIndex(l => l.id === activeLec.id) + 2}: <strong>
                            {courseLectures[courseLectures.findIndex(l => l.id === activeLec.id) + 1]?.title}
                          </strong>.
                        </p>

                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                            setShowEndScreen(false);
                            setIsPlaying(true);
                            setTimeout(() => {
                              if (videoRef.current) {
                                videoRef.current.currentTime = 0;
                                videoRef.current.play();
                              }
                            }, 50);
                          }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <RotateCcw size={14} />
                            <span>Rewatch</span>
                          </button>

                          <button type="button" className="btn btn-primary btn-sm" onClick={handleNextLecClick} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>Next Lesson</span>
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* 3. HTML5 Video Player */}
                <video 
                  ref={videoRef}
                  src={videoSrc} 
                  controls 
                  preload="auto"
                  playsInline
                  className="main-video-player"
                  style={{ display: isPlaying && !showEndScreen ? 'block' : 'none', width: '100%', height: '100%', objectFit: 'contain' }}
                  key={activeLec.id} /* force reload on change */
                  onEnded={handleVideoEnded}
                  onPlay={handlePlay}
                  onPause={handlePause}
                >
                  Your browser does not support HTML5 video player.
                </video>

                {/* Centered YouTube-style Play/Pause Animation Overlay */}
                {isPlaying && !showEndScreen && showPlayPauseOverlay && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 9,
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: overlayFadeOut ? 0 : 1,
                    transition: 'opacity 0.15s ease, transform 0.15s ease',
                    animation: overlayFadeOut ? 'none' : 'yt-overlay-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }}>
                    <style>{`
                      @keyframes yt-overlay-pop {
                        0% {
                          transform: translate(-50%, -50%) scale(0.75);
                          opacity: 0;
                        }
                        100% {
                          transform: translate(-50%, -50%) scale(1);
                          opacity: 1;
                        }
                      }
                    `}</style>
                    <div style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(4px)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      {overlayIconType === 'play' ? (
                        <Play size={30} fill="white" style={{ marginLeft: '3px' }} />
                      ) : (
                        <Pause size={30} fill="white" />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Player Action Bar */}
              <div className="player-custom-controls">
                <div className="playback-speed-selector">
                  <Settings size={16} />
                  <span>Speed:</span>
                  <select 
                    value={playbackSpeed} 
                    onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                    className="speed-dropdown"
                  >
                    <option value="0.5">0.5x</option>
                    <option value="1">1.0x</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2.0x</option>
                  </select>
                </div>

                <div className="player-navigation-buttons">
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={handlePrevLec}
                    disabled={courseLectures.findIndex(l => l.id === activeLec.id) === 0}
                  >
                    <ArrowLeft size={14} />
                    <span>Prev</span>
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={handleNextLec}
                    disabled={courseLectures.findIndex(l => l.id === activeLec.id) === courseLectures.length - 1}
                  >
                    <span>Next</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                <button 
                  className={`btn btn-sm ${studentProgress.completedLectures.includes(activeLec.id) ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => toggleLectureCompleted(activeLec.id, courseId, {
                    currentPlaybackTime: Number(videoRef.current?.currentTime) || 0,
                    watchPercentage: Number.isFinite(videoRef.current?.duration) && videoRef.current?.duration > 0
                      ? Math.min(100, Math.max(0, ((Number(videoRef.current?.currentTime) || 0) / videoRef.current.duration) * 100))
                      : 0
                  })}
                >
                  <CheckCircle size={14} />
                  <span>{studentProgress.completedLectures.includes(activeLec.id) ? 'Completed' : 'Mark Complete'}</span>
                </button>
              </div>

              {/* Lecture Details Title */}
              <div className="active-lecture-details">
                <h3>{activeLec.title}</h3>
                <p>{activeLec.description}</p>
              </div>

              {/* Notes Manager Tab */}
              <div className="notes-widget-box card">
                <div className="notes-header">
                  <div className="notes-title">
                    <FileText size={18} className="notes-icon" />
                    <h4>Personal Study Notes</h4>
                  </div>
                  <button className="btn btn-primary btn-sm btn-save-notes" onClick={handleSaveNotes}>
                    Save Notes
                  </button>
                </div>
                <textarea 
                  className="notes-textarea" 
                  placeholder="Jot down key takeaways from this lecture... (Saved per video)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
                {isNotesSaved && (
                  <div className="notes-toast animate-fade-in">
                    <span>Notes saved successfully!</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="coding-tasks-section">
              <div className="section-header-inline">
                <div className="sec-title">
                  <Code size={22} className="title-icon" />
                  <h3>Coding Challenges</h3>
                </div>
                <span className="badge badge-primary">{courseTasks.length} Problems Available</span>
              </div>
              
              <div className="tasks-list">
                {courseTasks.length > 0 ? (
                  courseTasks.map(task => {
                    const isCompleted = studentProgress.completedTasks.includes(task.id);
                    return (
                      <div className={`task-item-card card ${isCompleted ? 'task-completed-card' : ''}`} key={task.id}>
                        <div className="task-left-meta">
                          <button className="btn-toggle-task" onClick={() => toggleTaskCompleted(task.id)}>
                            {isCompleted ? <CheckSquare size={20} className="check-icon-active" /> : <Circle size={20} className="check-icon-empty" />}
                          </button>
                          <div className="task-title-group">
                            <h4>{task.title}</h4>
                            <p>{task.description}</p>
                            <div className="task-tags-group">
                              {task.tags.split(',').map((tag, i) => (
                                <span className="task-tag" key={i}>{tag.trim()}</span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="task-right-actions">
                          <span className={`badge ${task.difficulty === 'Easy' ? 'badge-success' : task.difficulty === 'Medium' ? 'badge-warning' : 'badge-primary'}`}>
                            {task.difficulty}
                          </span>
                          <a 
                            href={task.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-sm btn-leetcode"
                          >
                            Solve on LeetCode
                          </a>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="no-content-card">
                    <Code size={40} />
                    <h4>No Coding Challenges</h4>
                    <p>The administrator has not uploaded any coding problems for this course yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'quizzes' && (
            <div className="quizzes-section">
              {!quizStarted && (
                <div className="quizzes-list-view">
                  <div className="section-header-inline">
                    <div className="sec-title">
                      <Award size={22} className="title-icon" />
                      <h3>Course Assessments</h3>
                    </div>
                  </div>

                  <div className="quiz-cards-grid">
                    {courseQuizzes.length > 0 ? (
                      courseQuizzes.map(quiz => {
                        const prevResult = studentProgress.quizScores[quiz.id];
                        return (
                          <div className="card quiz-card" key={quiz.id}>
                            <div className="quiz-card-header">
                              <h4>{quiz.title}</h4>
                              <span className="badge badge-secondary">
                                <Clock size={12} />
                                <span style={{marginLeft:4}}>{formatTime(quiz.timeLimit)}</span>
                              </span>
                            </div>
                            <p className="quiz-card-desc">{quiz.description}</p>
                            
                            <div className="quiz-card-meta">
                              <span>Questions: {quiz.questions.length}</span>
                              <span>Max Marks: {quiz.marks || quiz.questions.length * 10}</span>
                            </div>

                            <div className="quiz-card-footer">
                              {prevResult ? (
                                <div className="quiz-prev-result">
                                  <span className={`result-label ${prevResult.passed ? 'text-success' : 'text-danger'}`}>
                                    {prevResult.passed ? 'Passed' : 'Failed'} ({prevResult.score} Marks)
                                  </span>
                                </div>
                              ) : (
                                <span className="quiz-not-attempted">Not Attempted Yet</span>
                              )}
                              
                              <button className="btn btn-primary btn-sm" onClick={() => startQuiz(quiz)}>
                                {prevResult ? 'Retry Assessment' : 'Start Assessment'}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="no-content-card w-100">
                        <Award size={40} />
                        <h4>No Quizzes Published</h4>
                        <p>The administrator has not built any assessments for this course yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {quizStarted && !quizFinished && activeQuiz && (
                <div className="quiz-play-view card animate-fade-in">
                  <div className="quiz-play-header">
                    <div>
                      <h3>{activeQuiz.title}</h3>
                      <div className="question-progress">
                        Question {currentQuestionIdx + 1} of {activeQuiz.questions.length}
                      </div>
                    </div>
                    
                    <div className="quiz-timer-box">
                      <Clock size={16} />
                      <span className={`timer-text ${timeLeft <= 30 ? 'timer-critical' : ''}`}>
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Indicator Line */}
                  <div className="quiz-play-progress-bar">
                    <div 
                      className="bar-fill" 
                      style={{ width: `${((currentQuestionIdx + 1) / activeQuiz.questions.length) * 100}%` }}
                    ></div>
                  </div>

                  <div className="quiz-question-body">
                    <h4 className="question-text">
                      {activeQuiz.questions[currentQuestionIdx].questionText}
                    </h4>

                    <div className="quiz-options-list">
                      {activeQuiz.questions[currentQuestionIdx].options.map((opt, optIdx) => {
                        const isSelected = selectedAnswers[currentQuestionIdx] === optIdx;
                        return (
                          <button 
                            className={`quiz-option-btn ${isSelected ? 'selected' : ''}`}
                            key={optIdx}
                            onClick={() => handleSelectOption(currentQuestionIdx, optIdx)}
                          >
                            <span className="option-letter">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="option-text-val">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="quiz-play-footer">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                      disabled={currentQuestionIdx === 0}
                    >
                      Previous
                    </button>

                    {currentQuestionIdx < activeQuiz.questions.length - 1 ? (
                      <button 
                        className="btn btn-primary"
                        onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                        disabled={selectedAnswers[currentQuestionIdx] === undefined}
                      >
                        Next Question
                      </button>
                    ) : (
                      <button 
                        className="btn btn-primary btn-submit-quiz"
                        onClick={handleQuizSubmit}
                        disabled={Object.keys(selectedAnswers).length < activeQuiz.questions.length}
                      >
                        Submit Assessment
                      </button>
                    )}
                  </div>
                </div>
              )}

              {quizFinished && activeQuiz && (
                <div className="quiz-result-view card animate-fade-in">
                  <div className="result-header">
                    <Award size={48} className="result-award-icon" />
                    <h3>Assessment Complete!</h3>
                    <p className="subtitle">Here is a review of your performance on {activeQuiz.title}</p>
                  </div>

                  {(() => {
                    let correctCount = 0;
                    activeQuiz.questions.forEach((q, idx) => {
                      if (selectedAnswers[idx] === q.correctIndex) correctCount++;
                    });
                    const maxMarks = activeQuiz.questions.reduce((sum, q) => sum + (q.marks || 10), 0);
                    let obtainedScore = 0;
                    activeQuiz.questions.forEach((q, idx) => {
                      if (selectedAnswers[idx] === q.correctIndex) obtainedScore += (q.marks || 10);
                    });
                    const passed = obtainedScore >= maxMarks * 0.5;

                    return (
                      <div className="result-score-summary">
                        <div className="score-badge-circle">
                          <span className="score-num">{obtainedScore}</span>
                          <span className="score-total">/ {maxMarks} Marks</span>
                        </div>

                        <div className={`status-banner ${passed ? 'pass' : 'fail'}`}>
                          {passed ? 'Congratulations! You passed this assessment.' : 'You did not meet the passing grade of 50%. Keep studying.'}
                        </div>

                        <div className="stats-breakdown">
                          <div className="breakdown-box">
                            <strong>{correctCount}</strong>
                            <span>Correct Answers</span>
                          </div>
                          <div className="breakdown-box">
                            <strong>{activeQuiz.questions.length - correctCount}</strong>
                            <span>Incorrect Answers</span>
                          </div>
                        </div>

                        {/* Detailed question review panel */}
                        <div className="quiz-detailed-review">
                          <h4>Question Review</h4>
                          <div className="review-list">
                            {activeQuiz.questions.map((q, idx) => {
                              const studentAnsIdx = selectedAnswers[idx];
                              const correctAnsIdx = q.correctIndex;
                              const isCorrect = studentAnsIdx === correctAnsIdx;

                              return (
                                <div className={`review-item ${isCorrect ? 'correct' : 'incorrect'}`} key={idx}>
                                  <div className="review-question-header">
                                    <span className="review-num">Question {idx + 1}</span>
                                    <span className={`review-badge-status ${isCorrect ? 'bg-success' : 'bg-error'}`}>
                                      {isCorrect ? 'Correct' : 'Incorrect'}
                                    </span>
                                  </div>
                                  <p className="review-q-text">{q.questionText}</p>
                                  <div className="review-answers-box">
                                    <div className="ans-row">
                                      <strong>Your Answer:</strong> 
                                      <span className={isCorrect ? 'text-success' : 'text-danger'}>
                                        {studentAnsIdx !== undefined ? q.options[studentAnsIdx] : 'No Answer'}
                                      </span>
                                    </div>
                                    {!isCorrect && (
                                      <div className="ans-row">
                                        <strong>Correct Answer:</strong> 
                                        <span className="text-success">{q.options[correctAnsIdx]}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="result-footer-actions">
                          <button className="btn btn-secondary" onClick={() => setQuizStarted(false)}>
                            Back to Assessments
                          </button>
                          <button className="btn btn-primary" onClick={() => startQuiz(activeQuiz)}>
                            <RotateCcw size={16} />
                            <span>Retry Assessment</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Playlist / Module Navigation Sidebar */}
        <div className="dashboard-sidebar-panel">
          {/* Tabs bar */}
          <div className="sidebar-tabs">
            <button 
              type="button"
              className={`sidebar-tab-btn ${activeTab === 'video' ? 'active' : ''}`}
              onClick={() => navigate(`/courses/${courseId}/lessons/${activeLec?.id || (courseLectures[0] && courseLectures[0].id) || ''}`)}
            >
              Playlist
            </button>
            <button 
              type="button"
              className={`sidebar-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => navigate(`/courses/${courseId}/tasks`)}
            >
              Coding Tasks
            </button>
            <button 
              type="button"
              className={`sidebar-tab-btn ${activeTab === 'quizzes' ? 'active' : ''}`}
              onClick={() => navigate(`/courses/${courseId}/quizzes`)}
            >
              Quizzes
            </button>
          </div>

          {/* Tab lists */}
          {activeTab === 'video' && (
            <div className="sidebar-playlist-wrapper">
              <div className="playlist-header">
                <h4>Course Lessons</h4>
                <span className="lessons-total-count">{courseLectures.length} Videos</span>
              </div>

              <div className="playlist-items-list">
                {(() => {
                  const filteredLecs = courseLectures.filter(l => {
                    const title = l.title || '';
                    const desc = l.description || '';
                    return title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           desc.toLowerCase().includes(searchQuery.toLowerCase());
                  });

                  if (filteredLecs.length === 0) {
                    return (
                      <div style={{
                        padding: '2.5rem 1.25rem',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '13px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Search size={24} style={{ color: 'var(--neutral-400)' }} />
                        <span>No lessons match "{searchQuery}"</span>
                      </div>
                    );
                  }

                  return filteredLecs.map((lec) => {
                    const originalIdx = courseLectures.findIndex(l => l.id === lec.id);
                    const isPlaying = activeLec?.id === lec.id;
                    const isCompleted = studentProgress.completedLectures.includes(lec.id);

                    return (
                      <div 
                        key={lec.id}
                        className={`playlist-item ${isPlaying ? 'playing' : ''} ${isCompleted ? 'completed' : ''}`}
                        onClick={() => handleLectureSelect(lec)}
                      >
                        <div className="playlist-item-meta" style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                          <button 
                            className="playlist-item-check" 
                            onClick={(e) => {
                              e.stopPropagation(); // prevent playing change
                              toggleLectureCompleted(lec.id);
                            }}
                          >
                            {isCompleted ? (
                              <CheckCircle size={18} className="check-completed" />
                            ) : (
                              <Circle size={18} className="check-incomplete" />
                            )}
                          </button>

                          {/* Playlist Item Thumbnail */}
                          <div className="playlist-item-thumbnail-box" style={{
                            position: 'relative',
                            width: '60px',
                            height: '36px',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            backgroundColor: '#1e293b',
                            flexShrink: 0
                          }}>
                            <img 
                              src={lec.thumbnail || course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=120&auto=format&fit=crop'} 
                              alt="" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />

                            {/* Completed checkmark badge overlay on thumbnail */}
                            {isCompleted && (
                              <div style={{
                                position: 'absolute',
                                top: '2px',
                                right: '2px',
                                backgroundColor: 'var(--success)',
                                borderRadius: '50%',
                                width: '14px',
                                height: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                              }}>
                                <CheckCircle size={10} color="white" />
                              </div>
                            )}

                            {/* Bottom progress bar */}
                            <div style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              width: '100%',
                              height: '3px',
                              backgroundColor: 'rgba(255, 255, 255, 0.2)'
                            }}>
                              <div style={{
                                height: '100%',
                                backgroundColor: isCompleted ? 'var(--success)' : 'var(--primary)',
                                width: `${isCompleted ? 100 : (studentProgress.lectureProgressByLecture[lec.id]?.watchPercentage || 0)}%`
                              }} />
                            </div>
                          </div>
                          
                          <div className="playlist-item-details" style={{ flexGrow: 1, minWidth: 0 }}>
                            <span className="playlist-item-index" style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                              Lesson {originalIdx + 1}
                            </span>
                            <h5 className="playlist-item-title" style={{
                              margin: '1px 0 2px',
                              fontSize: '13px',
                              fontWeight: '600',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              color: 'var(--text)'
                            }}>
                              {lec.title}
                            </h5>
                            <span className="playlist-item-duration" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                              <Clock size={10} />
                              <span>{lec.duration}</span>
                              {studentProgress.lectureProgressByLecture[lec.id]?.watchPercentage > 0 && !isCompleted && (
                                <span style={{ color: 'var(--primary)', fontWeight: 'bold', marginLeft: 'auto' }}>
                                  {Math.round(studentProgress.lectureProgressByLecture[lec.id].watchPercentage)}%
                                </span>
                              )}
                            </span>
                          </div>
                        </div>

                        {isPlaying && (
                          <div className="playing-pulse-indicator">
                            <Play size={12} fill="var(--primary)" />
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="sidebar-checklist-wrapper">
              <div className="playlist-header">
                <h4>Coding Progress</h4>
              </div>
              <div className="checklist-items">
                {courseTasks.map(task => {
                  const isCompleted = studentProgress.completedTasks.includes(task.id);
                  return (
                    <div className="checklist-item-row" key={task.id} onClick={() => toggleTaskCompleted(task.id)}>
                      {isCompleted ? <CheckCircle size={16} className="item-checked" /> : <Circle size={16} className="item-unchecked" />}
                      <span className={`checklist-item-title ${isCompleted ? 'struck' : ''}`}>{task.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'quizzes' && (
            <div className="sidebar-checklist-wrapper">
              <div className="playlist-header">
                <h4>Quiz Completion</h4>
              </div>
              <div className="checklist-items">
                {courseQuizzes.map(quiz => {
                  const scoreObj = studentProgress.quizScores[quiz.id];
                  const passed = scoreObj?.passed;
                  return (
                    <div className="checklist-item-row" key={quiz.id} onClick={() => { if (!quizStarted) startQuiz(quiz); }}>
                      {passed ? <CheckCircle size={16} className="item-checked" /> : <Circle size={16} className="item-unchecked" />}
                      <div className="checklist-col-details">
                        <span className={`checklist-item-title ${passed ? 'struck' : ''}`}>{quiz.title}</span>
                        {scoreObj && (
                          <span className="checklist-score-sub">{scoreObj.score} Marks ({passed ? 'Pass' : 'Fail'})</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
