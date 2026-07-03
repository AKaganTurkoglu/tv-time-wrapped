import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, BarChart3, ChevronLeft, ChevronRight, MessageCircle, Heart, Star, Sparkles, Award, Vote, Tv, Film } from 'lucide-react';
import { getShowMetadata } from '../utils/tmdbService';

const SLIDE_DURATION = 8000; // 8 seconds per slide

export default function WrappedStory({ stats, onFinish, tmdbApiKey }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showMetadata, setShowMetadata] = useState(null);
  const progressInterval = useRef(null);
  const lastTick = useRef(Date.now());

  const totalSlides = 13;

  // 1. Fetch Top Show Poster from TMDB
  useEffect(() => {
    async function fetchTopShowPoster() {
      if (stats.shows.topShows && stats.shows.topShows[0]) {
        const topShow = stats.shows.topShows[0];
        // The Office (US) TVDB ID is 73244
        const tvdbId = topShow.showId || '73244'; 
        const metadata = await getShowMetadata(tvdbId, topShow.name, tmdbApiKey);
        setShowMetadata(metadata);
      }
    }
    fetchTopShowPoster();
  }, [stats, tmdbApiKey]);

  // 2. Manage Slide Progression Timer
  useEffect(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    setProgress(0);
    
    if (!isPlaying) return;

    lastTick.current = Date.now();
    progressInterval.current = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTick.current;
      lastTick.current = now;
      
      setProgress(prev => {
        const step = (delta / SLIDE_DURATION) * 100;
        const nextProgress = prev + step;
        
        if (nextProgress >= 100) {
          handleNextSlide();
          return 0;
        }
        return nextProgress;
      });
    }, 100);

    return () => clearInterval(progressInterval.current);
  }, [currentSlide, isPlaying]);

  const handleNextSlide = () => {
    setCurrentSlide(prev => {
      if (prev < totalSlides - 1) {
        return prev + 1;
      } else {
        setIsPlaying(false);
        return prev;
      }
    });
  };

  const handlePrevSlide = () => {
    setCurrentSlide(prev => {
      if (prev > 0) {
        return prev - 1;
      }
      return prev;
    });
  };

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleScreenClick = (e) => {
    const screenWidth = window.innerWidth;
    const clickX = e.clientX;
    
    // Ignore clicks on buttons
    if (e.target.closest('button') || e.target.closest('a')) return;

    if (clickX < screenWidth * 0.3) {
      handlePrevSlide();
    } else {
      handleNextSlide();
    }
  };

  // Setup formatted values
  const joinDate = stats.profile.created_at ? new Date(stats.profile.created_at) : new Date('2017-02-17');
  const formattedJoinDate = joinDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const yearsAgo = Math.round((new Date() - joinDate) / (1000 * 60 * 60 * 24 * 365.25));
  const topShowName = stats.shows.topShows[0]?.name || 'The Office (US)';
  const topShowCount = stats.shows.topShows[0]?.count || 0;
  
  const peakYear = Object.entries(stats.habits.byYear).sort((a, b) => b[1] - a[1])[0]?.[0] || '2025';
  const peakYearCount = Object.entries(stats.habits.byYear).sort((a, b) => b[1] - a[1])[0]?.[1] || 0;

  const favDay = Object.entries(stats.habits.byWeekday).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Friday';
  const favHour = Object.entries(stats.habits.byHour).sort((a, b) => b[1] - a[1])[0]?.[0] || '20';
  
  const maxYearVal = Math.max(...Object.values(stats.habits.byYear), 1);
  const maxWeekdayVal = Math.max(...Object.values(stats.habits.byWeekday), 1);

  const formatHour = (h) => {
    const hr = parseInt(h);
    if (hr === 0) return '12 AM';
    if (hr === 12) return '12 PM';
    return hr > 12 ? `${hr - 12} PM` : `${hr} AM`;
  };

  const addictionList = stats.shows.highAddictionShows.slice(0, 3);
  const displayAddiction = addictionList.length > 0 ? addictionList : ['Prison Break', 'Breaking Bad', 'Phineas and Ferb'];

  const quizCount = stats.community.quizzes.length;
  const pollCount = stats.community.pollsCount;
  const highestQuizScore = stats.community.quizHighScore || 0;
  
  const renderSlideContent = () => {
    switch (currentSlide) {
      case 0: // Welcome Slide
        return (
          <div style={styles.slideContent} className="animate-slide-up">
            <div style={styles.wrappedBadge}>Wrapped Journey</div>
            <div style={styles.welcomeIllustration}>
              <Sparkles size={80} style={styles.sparkleIcon} />
              <div style={styles.circleBg}></div>
            </div>
            <div>
              <h2 style={styles.welcomeTitle}>Relive Your TV Time Journey</h2>
              <p style={styles.welcomeText}>
                As TV Time shuts down, let's take a look back at your stats, binge habits, and community memories since the very beginning.
              </p>
            </div>
            <div style={styles.hintContainer}>
              <Play size={16} /> Tap right to start your story
            </div>
          </div>
        );

      case 1: // Registration
        return (
          <div style={styles.slideContent} className="animate-slide-up">
            <div style={styles.wrappedLabel}>THE BEGINNING</div>
            <h2 style={styles.slideTitle}>It all started on...</h2>
            <div style={styles.bigDateContainer}>
              <span style={styles.bigDate}>{formattedJoinDate}</span>
            </div>
            <p style={styles.slideBodyText}>
              That was <strong>{yearsAgo} years ago</strong>! You created your account and officially started tracking your entertainment history.
            </p>
            <div style={styles.floatingBadgesContainer}>
              <Award size={36} style={{ color: 'var(--color-primary)' }} />
              <div style={styles.statMiniCard}>
                <span style={styles.statMiniVal}>1,995</span>
                <span style={styles.statMiniLbl}>Launches</span>
              </div>
            </div>
          </div>
        );

      case 2: // Big Numbers
        return (
          <div style={styles.slideContent} className="animate-slide-up">
            <div style={styles.wrappedLabel}>YOUR MILESTONES</div>
            <h2 style={styles.slideTitle}>You lived a thousand lives...</h2>
            
            <div style={styles.gridStats}>
              <div className="glass-panel" style={styles.statCard}>
                <span style={styles.statNum} className="text-gradient-purple-pink">
                  {stats.globalStats.ep_watch_count.toLocaleString()}
                </span>
                <span style={styles.statLabel}>Episodes Watched</span>
              </div>
              
              <div className="glass-panel" style={styles.statCard}>
                <span style={styles.statNum} className="text-gradient-cyan-blue">
                  {stats.globalStats.total_series_runtime_days}
                </span>
                <span style={styles.statLabel}>Days of Watching</span>
              </div>
            </div>

            <p style={styles.slideBodyText}>
              You also completed <strong>{stats.globalStats.total_movies_watched} movies</strong>.
              In total, you launched the TV Time app <strong>{stats.appActivity.totalSessions.toLocaleString()} times</strong>.
              That's an average of once every <strong>{stats.appActivity.averageLaunchIntervalDays} days</strong>!
            </p>
          </div>
        );

      case 3: { // Yearly Top Shows - Part 1
        const years = ['2017', '2018', '2019', '2020', '2021'];
        return (
          <div style={styles.slideContent} className="animate-slide-up">
            <div style={styles.wrappedLabel}>YEARLY RECAP • PART 1</div>
            <h2 style={styles.slideTitle}>Your top shows: 2017 – 2021</h2>
            
            <div style={styles.yearlyList}>
              {years.map(yr => {
                const data = stats.shows.topShowPerYear[yr];
                return (
                  <div key={yr} className="glass-panel" style={styles.yearlyRow}>
                    <div style={styles.yearPill}>{yr}</div>
                    <div style={styles.yearlyRowContent}>
                      {data ? (
                        <>
                          <span style={styles.yearlyShowName}>{data.showName}</span>
                          <span style={styles.yearlyShowCount}>{data.count} episodes</span>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No data tracked</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <p style={styles.slideBodyText}>
              A lot can change in five years, but your taste in shows remained stellar!
            </p>
          </div>
        );
      }

      case 4: { // Yearly Top Shows - Part 2
        const years = ['2022', '2023', '2024', '2025', '2026'];
        return (
          <div style={styles.slideContent} className="animate-slide-up">
            <div style={styles.wrappedLabel}>YEARLY RECAP • PART 2</div>
            <h2 style={styles.slideTitle}>Your top shows: 2022 – 2026</h2>
            
            <div style={styles.yearlyList}>
              {years.map(yr => {
                const data = stats.shows.topShowPerYear[yr];
                return (
                  <div key={yr} className="glass-panel" style={styles.yearlyRow}>
                    <div style={styles.yearPill}>{yr}</div>
                    <div style={styles.yearlyRowContent}>
                      {data ? (
                        <>
                          <span style={styles.yearlyShowName}>{data.showName}</span>
                          <span style={styles.yearlyShowCount}>{data.count} episodes</span>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No data tracked</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <p style={styles.slideBodyText}>
              Leading up to the final days of the app, these were the shows that kept you company.
            </p>
          </div>
        );
      }

      case 5: // Top Show & Addiction (formerly 3)
        return (
          <div style={styles.slideContent} className="animate-slide-up">
            <div style={styles.wrappedLabel}>YOUR ALL-TIME FAVORITE</div>
            <h2 style={styles.slideTitle}>Your ultimate comfort show</h2>
            
            <div style={styles.posterContainer}>
              {showMetadata?.poster ? (
                <img src={showMetadata.poster} alt={topShowName} style={styles.posterImg} />
              ) : (
                <div style={styles.posterPlaceholder}>
                  <Tv size={50} style={{ color: 'var(--color-primary)' }} />
                  <span>{topShowName}</span>
                </div>
              )}
              <div style={styles.posterGlow}></div>
            </div>

            <div>
              <h3 style={styles.topShowTitle}>{topShowName}</h3>
              <p style={styles.topShowSub}>{topShowCount} episodes tracked</p>
            </div>

            <div className="glass-panel" style={styles.addictionBox}>
              <span style={styles.addictionLabel}>⚡ 100% Binge Addiction Shows:</span>
              <div style={styles.addictionTags}>
                {displayAddiction.map((s, idx) => (
                  <span key={idx} style={styles.addictionTag}>{s}</span>
                ))}
              </div>
            </div>
          </div>
        );

      case 6: { // Temporal Habits (formerly 4)
        const yearsData = Object.entries(stats.habits.byYear).sort((a,b) => b[0] - a[0]).slice(0, 5);
        const weekdaysData = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return (
          <div style={styles.slideContent} className="animate-slide-up">
            <div style={styles.wrappedLabel}>YOUR WATCH RHYTHMS</div>
            <h2 style={styles.slideTitle}>Your entertainment habits</h2>

            <div style={styles.storyHabitsGrid}>
              {/* Years breakdown */}
              <div style={styles.storyHabitsCol}>
                <div style={styles.storyHabitsColTitle}>By Year</div>
                {yearsData.map(([yr, val]) => (
                  <div key={yr} style={styles.miniBarRow}>
                    <span style={styles.miniBarLabel}>{yr}</span>
                    <div style={styles.miniBarContainer}>
                      <div style={{...styles.miniBarFill, width: `${(val / maxYearVal) * 100}%`}}></div>
                    </div>
                    <span style={styles.miniBarVal}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Weekdays breakdown */}
              <div style={styles.storyHabitsCol}>
                <div style={styles.storyHabitsColTitle}>By Day</div>
                {weekdaysData.map(day => {
                  const val = stats.habits.byWeekday[day] || 0;
                  return (
                    <div key={day} style={styles.miniBarRow}>
                      <span style={styles.miniBarLabel}>{day.substring(0, 3)}</span>
                      <div style={styles.miniBarContainer}>
                        <div style={{...styles.miniBarFill, width: `${(val / maxWeekdayVal) * 100}%`, background: 'var(--color-accent)'}}></div>
                      </div>
                      <span style={styles.miniBarVal}>{val}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-panel" style={{...styles.habitFullCard, padding: '12px 16px', marginBottom: '0'}}>
              <span style={styles.habitEmoji}>⏰</span>
              <div style={{ textAlign: 'left' }}>
                <span style={{...styles.habitVal, fontSize: '1.1rem'}}>{formatHour(favHour)}</span>
                <span style={{...styles.habitLbl, marginTop: '1px'}}>Peak Hour</span>
              </div>
            </div>

            <p style={{ ...styles.slideBodyText, fontSize: '0.85rem' }}>
              Your peak year was <strong>{peakYear}</strong>, and you loved watching shows on <strong>{favDay}s</strong>!
            </p>
          </div>
        );
      }

      case 7: // Community Buzz (formerly 5)
        return (
          <div style={styles.slideContent} className="animate-slide-up">
            <div style={styles.wrappedLabel}>COMMUNITY BUZZ</div>
            <h2 style={styles.slideTitle}>You made your voice heard</h2>

            <div style={styles.commentCounts}>
              <div style={styles.commentCountItem}>
                <MessageCircle size={22} style={{ color: 'var(--color-primary)' }} />
                <span><strong>{stats.community.totalComments}</strong> Comments Written</span>
              </div>
              <div style={styles.commentCountItem}>
                <Heart size={22} style={{ color: 'var(--color-secondary)' }} />
                <span><strong>{stats.community.likesGiven}</strong> Comment Likes Given</span>
              </div>
            </div>

            {stats.community.mostLikedComment && (
              <div className="glass-panel" style={styles.commentBox}>
                <div style={styles.commentHeader}>
                  <span style={styles.commentTarget}>{stats.community.mostLikedComment.target}</span>
                  <div style={styles.commentLikes}>
                    <Heart size={14} fill="var(--color-secondary)" style={{ color: 'var(--color-secondary)' }} />
                    <span>{stats.community.mostLikedComment.likes} likes</span>
                  </div>
                </div>
                <p style={styles.commentText}>
                  "{stats.community.mostLikedComment.text}"
                </p>
                <div style={styles.commentTypeBadge}>YOUR VIRAL COMMENT</div>
              </div>
            )}

            <p style={styles.slideBodyText}>
              Your comments sparked engagement! You truly loved discussing plot points with fellow watchers.
            </p>
          </div>
        );

      case 8: // Quizzes & Polls (formerly 6)
        return (
          <div style={styles.slideContent} className="animate-slide-up">
            <div style={styles.wrappedLabel}>POLLER & QUIZZER</div>
            <h2 style={styles.slideTitle}>Part of the community</h2>
            
            <div style={styles.pollQuizGrid}>
              <div className="glass-panel" style={styles.pqCard}>
                <Vote size={32} style={{ color: 'var(--color-accent)' }} />
                <span style={styles.pqNum}>{pollCount}</span>
                <span style={styles.pqLbl}>Polls Voted</span>
              </div>

              <div className="glass-panel" style={styles.pqCard}>
                <Sparkles size={32} style={{ color: 'var(--color-primary)' }} />
                <span style={styles.pqNum}>{quizCount}</span>
                <span style={styles.pqLbl}>Quizzes Taken</span>
              </div>
            </div>

            {quizCount > 0 && (
              <div className="glass-panel" style={styles.highScoreBox}>
                <span style={styles.highScoreLabel}>🏆 Quiz High Score:</span>
                <span style={styles.highScoreVal}>{highestQuizScore} points</span>
              </div>
            )}

            <p style={styles.slideBodyText}>
              You regularly tested your knowledge of shows and voiced your opinions on theories!
            </p>
          </div>
        );

      case 9: // Badges (formerly 7)
        return (
          <div style={styles.slideContent} className="animate-slide-up">
            <div style={styles.wrappedLabel}>ACHIEVEMENTS</div>
            <h2 style={styles.slideTitle}>Badges of honor</h2>
            
            <p style={styles.slideBodyText}>
              You unlocked a total of <strong>{stats.badges.length} badges</strong> on TV Time! Here are some of your achievements:
            </p>

            <div style={styles.badgesShowcase}>
              {stats.badges.slice(0, 3).map((badge, idx) => (
                <div key={idx} className="glass-panel" style={styles.badgeItem}>
                  <Award size={24} style={styles.badgeIcon} />
                  <div style={styles.badgeInfo}>
                    <span style={styles.badgeTitle}>{badge.title}</span>
                    <span style={styles.badgeDate}>{new Date(badge.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <p style={{ ...styles.slideBodyText, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Achievements include Marathoner, Serial Emotioner, Quick Watcher, and many more.
            </p>
          </div>
        );

      case 10: { // Favorite Shows (New)
        const favShows = stats.favorites?.shows || [];
        const displayShows = favShows.length > 0 ? favShows : ['The Walking Dead', 'Game of Thrones', 'The Falcon and The Winter Soldier', 'Sex Education', 'INVINCIBLE', 'Locke & Key', 'Ted Lasso'];
        return (
          <div style={styles.slideContent} className="animate-slide-up">
            <div style={styles.wrappedLabel}>YOUR CURATED FAVORITES</div>
            <h2 style={styles.slideTitle}>Your absolute favorite shows</h2>
            
            <div style={styles.favoritesGrid}>
              {displayShows.slice(0, 12).map((s, idx) => (
                <div key={idx} className="glass-panel" style={styles.favoriteItemCard}>
                  <Tv size={14} style={{ color: 'var(--color-primary)' }} />
                  <span style={styles.favoriteItemText}>{s}</span>
                </div>
              ))}
            </div>
            
            <p style={styles.slideBodyText}>
              These are the series you handpicked and marked as your absolute favorites.
            </p>
          </div>
        );
      }

      case 11: { // Favorite Movies (New)
        const favMovies = stats.favorites?.movies || [];
        const displayMovies = favMovies.length > 0 ? favMovies : ['Avengers: Endgame', 'The Shining', 'Scott Pilgrim vs. the World', 'Coherence', 'Heretic'];
        return (
          <div style={styles.slideContent} className="animate-slide-up">
            <div style={styles.wrappedLabel}>YOUR CURATED FAVORITES</div>
            <h2 style={styles.slideTitle}>Your absolute favorite movies</h2>
            
            <div style={styles.favoritesGrid}>
              {displayMovies.slice(0, 12).map((m, idx) => (
                <div key={idx} className="glass-panel" style={styles.favoriteItemCard}>
                  <Film size={14} style={{ color: 'var(--color-accent)' }} />
                  <span style={styles.favoriteItemText}>{m}</span>
                </div>
              ))}
            </div>
            
            <p style={styles.slideBodyText}>
              A curated collection of cinematic masterpieces that resonated with you the most.
            </p>
          </div>
        );
      }

      case 12: // Outro (formerly 10)
        return (
          <div style={{ ...styles.slideContent, justifyContent: 'center' }} className="animate-slide-up">
            <div style={{ ...styles.wrappedBadge, marginBottom: '20px' }}>Wrapped Journey</div>
            <h2 style={styles.outroTitle}>That's your TV Time story.</h2>
            <p style={styles.outroText}>
              The Android app is shutting down, but your memories are yours to keep. You can export this wrapped or dive deeper into your full statistics dashboard.
            </p>

            <div style={styles.outroActions}>
              <button className="btn-primary" onClick={onFinish} style={styles.outroBtn}>
                <BarChart3 size={18} /> Deep Stats Dashboard
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => {
                  setCurrentSlide(0);
                  setIsPlaying(true);
                }} 
                style={styles.outroBtn}
              >
                <RotateCcw size={18} /> Watch Again
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={styles.container} onClick={handleScreenClick}>
      {/* Background Poster Cover Backdrop (Glassmorphic Blur) */}
      <div 
        style={{
          ...styles.backdropBg,
          backgroundImage: showMetadata?.backdrop ? `url(${showMetadata.backdrop})` : 'none'
        }}
      ></div>
      <div style={styles.backdropOverlay}></div>

      {/* Main Wrapped Shell */}
      <div className="glass-panel" style={styles.storyCard}>
        {/* Progress Bars */}
        <div className="progress-bar-container">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <div key={idx} className="progress-bar-bg">
              <div 
                className={`progress-bar-fill ${
                  idx < currentSlide ? 'completed' : idx === currentSlide ? 'active' : ''
                }`}
                style={{
                  width: idx < currentSlide ? '100%' : idx === currentSlide ? `${progress}%` : '0%'
                }}
              ></div>
            </div>
          ))}
        </div>

        {/* Top Controls */}
        <div style={styles.controls}>
          <button style={styles.controlBtn} onClick={handlePrevSlide} disabled={currentSlide === 0}>
            <ChevronLeft size={20} />
          </button>
          
          <button style={styles.controlBtn} onClick={togglePlay}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>

          <button style={styles.controlBtn} onClick={handleNextSlide} disabled={currentSlide === totalSlides - 1}>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Story Body */}
        <div style={styles.storyBody}>
          {renderSlideContent()}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#030307',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer'
  },
  backdropBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(30px) brightness(0.3)',
    transform: 'scale(1.1)',
    zIndex: 1,
    transition: 'background-image 0.8s ease-in-out'
  },
  backdropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle, transparent 20%, rgba(3, 3, 7, 0.9) 80%)',
    zIndex: 2
  },
  storyCard: {
    width: '100%',
    maxWidth: '460px',
    height: '100vh',
    maxHeight: '820px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '40px 24px 30px 24px',
    zIndex: 5,
    borderWidth: '1px',
    borderColor: 'var(--border-glass)',
    backgroundColor: 'rgba(18, 18, 24, 0.85)'
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: '10px',
    zIndex: 10
  },
  controlBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: '8px',
    transition: 'var(--transition-smooth)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  storyBody: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginTop: '30px'
  },
  slideContent: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
    padding: '10px 0'
  },
  wrappedBadge: {
    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
    padding: '6px 14px',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.75rem',
    fontWeight: '800',
    alignSelf: 'center',
    boxShadow: '0 0 15px rgba(255, 208, 0, 0.25)',
    color: '#0c0c0e'
  },
  wrappedLabel: {
    color: 'var(--color-primary)',
    fontSize: '0.8rem',
    fontWeight: '800',
    letterSpacing: '0.15em',
    marginBottom: '8px'
  },
  welcomeIllustration: {
    position: 'relative',
    height: '200px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '30px 0'
  },
  sparkleIcon: {
    color: 'var(--color-primary)',
    zIndex: 5,
    animation: 'float 3s ease-in-out infinite'
  },
  circleBg: {
    position: 'absolute',
    width: '130px',
    height: '130px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(255, 208, 0, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
    filter: 'blur(20px)',
    zIndex: 1
  },
  welcomeTitle: {
    fontSize: '2rem',
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: '1.2',
    marginBottom: '16px'
  },
  welcomeText: {
    color: 'var(--text-secondary)',
    textAlign: 'center',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    padding: '0 10px'
  },
  hintContainer: {
    alignSelf: 'center',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  slideTitle: {
    fontSize: '1.75rem',
    fontWeight: '900',
    lineHeight: '1.3'
  },
  bigDateContainer: {
    height: '120px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px dashed var(--border-glass-hover)',
    borderRadius: '16px',
    margin: '24px 0'
  },
  bigDate: {
    fontFamily: 'var(--font-header)',
    fontSize: '2rem',
    fontWeight: '900',
    textAlign: 'center',
    background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  slideBodyText: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    lineHeight: '1.6'
  },
  floatingBadgesContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px',
    background: 'rgba(255,255,255,0.02)',
    padding: '12px 16px',
    borderRadius: '12px'
  },
  statMiniCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  statMiniVal: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: 'var(--color-secondary)'
  },
  statMiniLbl: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase'
  },
  gridStats: {
    display: 'flex',
    gap: '12px',
    width: '100%',
    margin: '24px 0'
  },
  statCard: {
    flex: 1,
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '8px'
  },
  statNum: {
    fontSize: '2rem',
    fontWeight: '900'
  },
  statLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    fontWeight: '500'
  },
  posterContainer: {
    position: 'relative',
    height: '240px',
    width: '160px',
    alignSelf: 'center',
    margin: '20px 0',
    zIndex: 5
  },
  posterImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '16px',
    boxShadow: '0 12px 24px rgba(0,0,0,0.5)',
    border: '1px solid var(--border-glass)'
  },
  posterPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.05)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    textAlign: 'center',
    padding: '12px',
    border: '1px solid var(--border-glass)'
  },
  posterGlow: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    right: '10px',
    bottom: '-10px',
    background: 'var(--color-primary)',
    borderRadius: '16px',
    filter: 'blur(20px)',
    opacity: 0.35,
    zIndex: -1
  },
  topShowTitle: {
    fontSize: '1.4rem',
    fontWeight: '800',
    textAlign: 'center'
  },
  topShowSub: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    marginTop: '4px'
  },
  addictionBox: {
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '10px'
  },
  addictionLabel: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--text-secondary)'
  },
  addictionTags: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap'
  },
  addictionTag: {
    fontSize: '0.75rem',
    fontWeight: '600',
    background: 'rgba(255, 208, 0, 0.08)',
    border: '1px solid rgba(255, 208, 0, 0.2)',
    color: 'var(--color-primary)',
    padding: '4px 10px',
    borderRadius: '8px'
  },
  habitRow: {
    display: 'flex',
    gap: '12px',
    width: '100%',
    margin: '20px 0'
  },
  habitCard: {
    flex: 1,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  },
  habitEmoji: {
    fontSize: '1.5rem',
    marginBottom: '8px'
  },
  habitVal: {
    fontSize: '1.25rem',
    fontWeight: '800'
  },
  habitLbl: {
    fontSize: '0.7rem',
    color: 'var(--text-secondary)',
    marginTop: '4px'
  },
  habitFullCard: {
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    width: '100%',
    marginBottom: '15px'
  },
  commentCounts: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    margin: '20px 0'
  },
  commentCountItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '0.9rem'
  },
  commentBox: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    position: 'relative',
    borderLeft: '3px solid var(--color-primary)',
    margin: '10px 0'
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  commentTarget: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: 'var(--color-primary)'
  },
  commentLikes: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)'
  },
  commentText: {
    fontSize: '0.85rem',
    fontStyle: 'italic',
    lineHeight: '1.4',
    color: 'var(--text-primary)'
  },
  commentTypeBadge: {
    alignSelf: 'flex-start',
    fontSize: '0.65rem',
    fontWeight: '800',
    background: 'rgba(255,255,255,0.05)',
    padding: '2px 6px',
    borderRadius: '4px',
    color: 'var(--text-muted)'
  },
  pollQuizGrid: {
    display: 'flex',
    gap: '12px',
    width: '100%',
    margin: '20px 0'
  },
  pqCard: {
    flex: 1,
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  pqNum: {
    fontSize: '1.75rem',
    fontWeight: '900'
  },
  pqLbl: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)'
  },
  highScoreBox: {
    padding: '14px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: '15px'
  },
  highScoreLabel: {
    fontSize: '0.85rem',
    fontWeight: '700'
  },
  highScoreVal: {
    fontSize: '1rem',
    fontWeight: '800',
    color: 'var(--color-success)'
  },
  badgeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 16px',
    width: '100%'
  },
  badgeIcon: {
    color: 'var(--color-primary)',
    flexShrink: 0
  },
  badgeInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  badgeTitle: {
    fontSize: '0.85rem',
    fontWeight: '700'
  },
  badgeDate: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)'
  },
  badgesShowcase: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
    margin: '20px 0'
  },
  outroTitle: {
    fontSize: '2rem',
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: '1.2',
    marginBottom: '16px'
  },
  outroText: {
    color: 'var(--text-secondary)',
    textAlign: 'center',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    marginBottom: '32px',
    padding: '0 10px'
  },
  outroActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%'
  },
  outroBtn: {
    width: '100%'
  },
  yearlyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    margin: '15px 0',
    width: '100%'
  },
  yearlyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    width: '100%',
    background: 'rgba(255, 255, 255, 0.02)'
  },
  yearPill: {
    background: 'var(--color-primary)',
    color: '#0c0c0e',
    fontWeight: '800',
    fontSize: '0.75rem',
    padding: '3px 8px',
    borderRadius: '6px',
    minWidth: '50px',
    textAlign: 'center'
  },
  yearlyRowContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    overflow: 'hidden',
    textAlign: 'left',
    flexGrow: 1
  },
  yearlyShowName: {
    fontWeight: '700',
    fontSize: '0.8rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  yearlyShowCount: {
    fontSize: '0.65rem',
    color: 'var(--text-secondary)'
  },
  favoritesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    margin: '15px 0',
    width: '100%'
  },
  favoriteItemCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    background: 'rgba(255, 255, 255, 0.02)',
    overflow: 'hidden'
  },
  favoriteItemText: {
    fontWeight: '600',
    fontSize: '0.7rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textAlign: 'left'
  },
  miniBarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.75rem',
    width: '100%',
    margin: '4px 0'
  },
  miniBarLabel: {
    width: '32px',
    textAlign: 'left',
    color: 'var(--text-secondary)',
    fontWeight: '700'
  },
  miniBarContainer: {
    flexGrow: 1,
    height: '6px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  miniBarFill: {
    height: '100%',
    background: 'var(--color-primary)',
    borderRadius: '3px'
  },
  miniBarVal: {
    width: '30px',
    textAlign: 'right',
    color: 'var(--text-muted)',
    fontSize: '0.65rem'
  },
  storyHabitsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    width: '100%',
    margin: '15px 0'
  },
  storyHabitsCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  storyHabitsColTitle: {
    fontSize: '0.8rem',
    fontWeight: '800',
    color: 'var(--color-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '4px',
    marginBottom: '4px',
    textAlign: 'left'
  }
};
