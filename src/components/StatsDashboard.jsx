import React, { useState, useEffect } from 'react';
import { Tv, Film, Calendar, MessageSquare, Award, Clock, ArrowLeft, Heart, List, HelpCircle, Star, Sparkles, Smile, ArrowUpDown } from 'lucide-react';
import { getShowMetadata, getMovieMetadata } from '../utils/tmdbService';

export default function StatsDashboard({ stats, onBackToWrapped, tmdbApiKey }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [sortShowBy, setSortShowBy] = useState('count'); // 'count', 'name', 'addiction'
  const [sortMovieBy, setSortMovieBy] = useState('date'); // 'date', 'name'
  const [showMetadataMap, setShowMetadataMap] = useState({});
  const [movieMetadataMap, setMovieMetadataMap] = useState({});

  // 1. Asynchronously load show and movie posters
  useEffect(() => {
    async function loadPosters() {
      if (!tmdbApiKey) return;
      
      // Load top 15 show posters
      const showPromises = stats.shows.topShows.slice(0, 15).map(async (show) => {
        const tvdbId = show.showId;
        if (tvdbId) {
          const meta = await getShowMetadata(tvdbId, show.name, tmdbApiKey);
          return { id: tvdbId, meta };
        }
        return null;
      });
      
      // Load top 10 movie posters
      const moviePromises = stats.movies.watchedList.slice(0, 10).map(async (movie) => {
        const meta = await getMovieMetadata(movie.name, movie.releaseDate, tmdbApiKey);
        return { name: movie.name, meta };
      });

      const showResults = await Promise.all(showPromises);
      const movieResults = await Promise.all(moviePromises);

      const showMetas = {};
      showResults.forEach(res => {
        if (res) showMetas[res.id] = res.meta;
      });
      setShowMetadataMap(showMetas);

      const movieMetas = {};
      movieResults.forEach(res => {
        if (res) movieMetas[res.name.toLowerCase()] = res.meta;
      });
      setMovieMetadataMap(movieMetas);
    }
    loadPosters();
  }, [stats, tmdbApiKey]);

  // Sorting shows
  const sortedShows = [...stats.shows.topShows].sort((a, b) => {
    if (sortShowBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortShowBy === 'addiction') {
      const scoreA = stats.shows.addictionScores[a.name] || 0;
      const scoreB = stats.shows.addictionScores[b.name] || 0;
      return scoreB - scoreA;
    } else {
      return b.count - a.count;
    }
  });

  // Sorting movies
  const sortedMovies = [...stats.movies.watchedList].sort((a, b) => {
    if (sortMovieBy === 'name') {
      return a.name.localeCompare(b.name);
    } else {
      const dateA = a.watchDate ? new Date(a.watchDate) : new Date(0);
      const dateB = b.watchDate ? new Date(b.watchDate) : new Date(0);
      return dateB - dateA;
    }
  });

  const renderRoadmapTimeline = () => {
    const timeline = stats.habits.monthlyTimeline || [];
    
    // Chunk timeline into groups of 6
    const rows = [];
    const chunkSize = 6;
    for (let i = 0; i < timeline.length; i += chunkSize) {
      rows.push(timeline.slice(i, i + chunkSize));
    }
    
    return (
      <div className="glass-panel" style={{ padding: '24px', width: '100%', marginBottom: '24px' }}>
        <h3 style={{ ...styles.panelTitle, marginBottom: '15px' }}>
          🎬 Your TV Time Journey (Month-by-Month)
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
          Follow the snake roadmap from the day you joined in 2017 to the final days in 2026. The bubble shows the <strong>episodes watched</strong> in that month, and inside the bubble shows the unique <strong>shows</strong> you watched.
        </p>
        
        <div className="roadmap-container">
          <div className="roadmap-grid">
            {rows.map((rowItems, rIdx) => {
              const isReversed = rIdx % 2 === 1;
              return (
                <div 
                  key={rIdx} 
                  className={`roadmap-row ${isReversed ? 'roadmap-row-reversed' : 'roadmap-row-normal'}`}
                >
                  {rowItems.map((item, idx) => {
                    const isEmpty = item.count === 0;
                    return (
                      <div key={item.key} className="roadmap-bubble-container">
                        <div 
                          className={`roadmap-bubble ${isEmpty ? 'empty-month' : 'active-month'}`}
                          title={`${item.label}: ${item.count} episodes watched across ${item.showsCount} shows`}
                        >
                          <span style={styles.roadmapEps}>{item.count}</span>
                          {!isEmpty && (
                            <span style={styles.roadmapShows}>{item.showsCount} shows</span>
                          )}
                        </div>
                        <span style={styles.roadmapLabel}>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderOverview = () => {
    return (
      <div style={styles.tabContent} className="animate-slide-up">
        {/* Metric Cards Grid */}
        <div style={styles.metricsGrid}>
          <div className="glass-panel" style={styles.metricCard}>
            <Clock size={24} style={{ color: 'var(--color-primary)' }} />
            <div style={styles.metricDetails}>
              <span style={styles.metricVal}>{stats.globalStats.total_series_runtime_days} Days</span>
              <span style={styles.metricLbl}>Total Series Watch Time</span>
            </div>
          </div>

          <div className="glass-panel" style={styles.metricCard}>
            <Tv size={24} style={{ color: 'var(--color-secondary)' }} />
            <div style={styles.metricDetails}>
              <span style={styles.metricVal}>{stats.globalStats.ep_watch_count.toLocaleString()}</span>
              <span style={styles.metricLbl}>Episodes Watched</span>
            </div>
          </div>

          <div className="glass-panel" style={styles.metricCard}>
            <Film size={24} style={{ color: 'var(--color-accent)' }} />
            <div style={styles.metricDetails}>
              <span style={styles.metricVal}>{stats.globalStats.total_movies_watched}</span>
              <span style={styles.metricLbl}>Movies Watched</span>
            </div>
          </div>

          <div className="glass-panel" style={styles.metricCard}>
            <Calendar size={24} style={{ color: 'var(--color-success)' }} />
            <div style={styles.metricDetails}>
              <span style={styles.metricVal}>{stats.appActivity.totalSessions.toLocaleString()}</span>
              <span style={styles.metricLbl}>App Launches (Sessions)</span>
            </div>
          </div>
        </div>

        {/* Info Rows */}
        <div style={styles.overviewRowsGrid}>
          <div className="glass-panel" style={styles.infoPanel}>
            <h3 style={styles.panelTitle}>Nostalgia Profile</h3>
            <table style={styles.infoTable}>
              <tbody>
                <tr>
                  <td>Joined TV Time</td>
                  <td><strong>{new Date(stats.profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></td>
                </tr>
                <tr>
                  <td>Watch Frequency</td>
                  <td><strong>Once every {stats.appActivity.averageLaunchIntervalDays} days</strong></td>
                </tr>
                <tr>
                  <td>Curated Custom Lists</td>
                  <td><strong>{stats.collections.length} lists</strong></td>
                </tr>
                <tr>
                  <td>Comfort index show</td>
                  <td><strong>{stats.shows.topShows[0]?.name || 'N/A'}</strong></td>
                </tr>
                <tr>
                  <td>Addictive Shows (100%)</td>
                  <td><strong>{stats.shows.highAddictionShows.length} shows</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Custom collections list */}
          <div className="glass-panel" style={styles.infoPanel}>
            <h3 style={styles.panelTitle}>Your Curated Collections</h3>
            {stats.collections.length > 0 ? (
              <div style={styles.collectionsList}>
                {stats.collections.map((list, idx) => (
                  <div key={idx} style={styles.collectionItem}>
                    <List size={18} style={{ color: 'var(--color-primary)' }} />
                    <div style={styles.collectionMeta}>
                      <span style={styles.collectionName}>{list.name || 'Untitled List'}</span>
                      <span style={styles.collectionCount}>{list.count} items • Created: {new Date(list.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No custom lists found in your export data.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTVShows = () => {
    return (
      <div style={styles.tabContent} className="animate-slide-up">
        {/* Sort Controls */}
        <div style={styles.controlsRow}>
          <span style={styles.resultsCount}>{stats.shows.topShows.length} watched shows found</span>
          <div style={styles.sortGroup}>
            <button 
              style={{...styles.sortBtn, ...(sortShowBy === 'count' ? styles.sortBtnActive : {})}}
              onClick={() => setSortShowBy('count')}
            >
              Episodes Count
            </button>
            <button 
              style={{...styles.sortBtn, ...(sortShowBy === 'name' ? styles.sortBtnActive : {})}}
              onClick={() => setSortShowBy('name')}
            >
              Show Name
            </button>
            <button 
              style={{...styles.sortBtn, ...(sortShowBy === 'addiction' ? styles.sortBtnActive : {})}}
              onClick={() => setSortShowBy('addiction')}
            >
              Binge Addiction
            </button>
          </div>
        </div>

        {/* Shows Grid */}
        <div style={styles.showsGrid}>
          {sortedShows.map((show, idx) => {
            const meta = showMetadataMap[show.showId];
            const addictionScore = stats.shows.addictionScores[show.name] || 0;
            const rewatch = stats.shows.rewatches.topShows.find(rs => rs.name === show.name);
            
            return (
              <div key={idx} className="glass-panel glass-panel-hover" style={styles.showCard}>
                {meta?.poster ? (
                  <img src={meta.poster} alt={show.name} style={styles.showPoster} />
                ) : (
                  <div style={styles.showPosterPlaceholder}>
                    <Tv size={30} style={{ color: 'var(--color-primary)' }} />
                  </div>
                )}
                
                <div style={styles.showCardInfo}>
                  <h4 style={styles.showName} title={show.name}>{show.name}</h4>
                  <div style={styles.showMetaGrid}>
                    <div style={styles.showMetaItem}>
                      <Tv size={12} />
                      <span>{show.count} eps</span>
                    </div>

                    {rewatch && (
                      <div style={styles.showMetaItem} title="Rewatched episodes">
                        <RotateCcwIcon size={12} style={{ color: 'var(--color-accent)' }} />
                        <span style={{ color: 'var(--color-accent)' }}>{rewatch.count} rewatches</span>
                      </div>
                    )}

                    {addictionScore > 0 && (
                      <div style={{
                        ...styles.showMetaItem, 
                        color: addictionScore === 100 ? 'var(--color-secondary)' : 'var(--text-secondary)'
                      }} title="Addiction Score">
                        <span>⚡ {addictionScore}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMovies = () => {
    return (
      <div style={styles.tabContent} className="animate-slide-up">
        {/* Sort Controls */}
        <div style={styles.controlsRow}>
          <span style={styles.resultsCount}>{stats.movies.watchedList.length} watched movies found</span>
          <div style={styles.sortGroup}>
            <button 
              style={{...styles.sortBtn, ...(sortMovieBy === 'date' ? styles.sortBtnActive : {})}}
              onClick={() => setSortMovieBy('date')}
            >
              Watch Date
            </button>
            <button 
              style={{...styles.sortBtn, ...(sortMovieBy === 'name' ? styles.sortBtnActive : {})}}
              onClick={() => setSortMovieBy('name')}
            >
              Movie Name
            </button>
          </div>
        </div>

        {/* Movies Grid */}
        <div style={styles.showsGrid}>
          {sortedMovies.map((movie, idx) => {
            const meta = movieMetadataMap[movie.name.toLowerCase()];
            
            return (
              <div key={idx} className="glass-panel glass-panel-hover" style={styles.showCard}>
                {meta?.poster ? (
                  <img src={meta.poster} alt={movie.name} style={styles.showPoster} />
                ) : (
                  <div style={styles.showPosterPlaceholder}>
                    <Film size={30} style={{ color: 'var(--color-accent)' }} />
                  </div>
                )}
                
                <div style={styles.showCardInfo}>
                  <h4 style={styles.showName} title={movie.name}>{movie.name}</h4>
                  <div style={styles.showMetaGrid}>
                    <div style={styles.showMetaItem}>
                      <Calendar size={12} />
                      <span>{movie.watchDate ? new Date(movie.watchDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    {movie.releaseDate && (
                      <div style={styles.showMetaItem}>
                        <Clock size={12} />
                        <span>{movie.releaseDate.split('-')[0]}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderHabits = () => {
    // Generate simple SVG bar chart for Year analysis
    const yearData = Object.entries(stats.habits.byYear).sort((a, b) => a[0].localeCompare(b[0]));
    const maxYearVal = Math.max(...yearData.map(d => d[1]), 1);
    
    // Weekdays in order
    const weekdaysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weekdayData = weekdaysOrder.map(day => [day, stats.habits.byWeekday[day] || 0]);
    const maxWeekdayVal = Math.max(...weekdayData.map(d => d[1]), 1);

    // Hourly density
    const hourData = Array.from({ length: 24 }).map((_, h) => [h, stats.habits.byHour[h] || 0]);
    const maxHourVal = Math.max(...hourData.map(d => d[1]), 1);

    return (
      <div style={styles.tabContent} className="animate-slide-up">
        <div style={styles.chartsGrid}>
          {/* Year-by-Year SVG Chart */}
          <div className="glass-panel" style={styles.chartPanel}>
            <h3 style={styles.panelTitle}>Watches by Year</h3>
            <div style={styles.svgWrapper}>
              <svg viewBox="0 0 500 220" style={styles.svgContainer}>
                {yearData.map(([year, val], idx) => {
                  const x = 40 + idx * 45;
                  const barHeight = (val / maxYearVal) * 130;
                  const y = 160 - barHeight;
                  
                  return (
                    <g key={idx}>
                      {/* Bar */}
                      <rect 
                        x={x} 
                        y={y} 
                        width="26" 
                        height={barHeight} 
                        rx="4"
                        fill="url(#purpleGrad)" 
                      />
                      {/* Count label */}
                      <text x={x + 13} y={y - 8} textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="bold">
                        {val}
                      </text>
                      {/* Year label */}
                      <text x={x + 13} y="180" textAnchor="middle" fill="var(--text-secondary)" fontSize="10">
                        {year}
                      </text>
                    </g>
                  );
                })}
                <defs>
                  <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" />
                    <stop offset="100%" stopColor="var(--color-secondary)" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Weekday SVG Chart */}
          <div className="glass-panel" style={styles.chartPanel}>
            <h3 style={styles.panelTitle}>Watches by Weekday</h3>
            <div style={styles.svgWrapper}>
              <svg viewBox="0 0 500 220" style={styles.svgContainer}>
                {weekdayData.map(([day, val], idx) => {
                  const x = 30 + idx * 64;
                  const barHeight = (val / maxWeekdayVal) * 130;
                  const y = 160 - barHeight;
                  const shortDay = day.substring(0, 3);
                  
                  return (
                    <g key={idx}>
                      <rect 
                        x={x} 
                        y={y} 
                        width="34" 
                        height={barHeight} 
                        rx="4"
                        fill="url(#cyanGrad)" 
                      />
                      <text x={x + 17} y={y - 8} textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="bold">
                        {val}
                      </text>
                      <text x={x + 17} y="180" textAnchor="middle" fill="var(--text-secondary)" fontSize="10">
                        {shortDay}
                      </text>
                    </g>
                  );
                })}
                <defs>
                  <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent)" />
                    <stop offset="100%" stopColor="var(--color-secondary)" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Hourly Density SVG Chart (Radial Clock + Flat Bar Chart) */}
          <div className="glass-panel" style={{...styles.chartPanel, flex: '1 1 100%'}}>
            <h3 style={styles.panelTitle}>Hourly Watch Density</h3>
            
            {/* Top Row: Radial Clock & Stats Summary */}
            <div style={styles.watchFaceLayout}>
              {/* Left Side: SVG Clock Face */}
              <div style={styles.watchFaceSvgCol}>
                <svg viewBox="0 0 450 450" style={{ width: '100%', maxWidth: '340px', height: 'auto', overflow: 'visible' }}>
                  {/* Clock Gradients */}
                  <defs>
                    <radialGradient id="clockCenterGrad">
                      <stop offset="0%" stopColor="rgba(255, 208, 0, 0.15)" />
                      <stop offset="100%" stopColor="rgba(12, 12, 14, 0.95)" />
                    </radialGradient>
                  </defs>

                  {/* Outer Clock Ring */}
                  <circle cx="225" cy="225" r="215" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
                  <circle cx="225" cy="225" r="75" fill="url(#clockCenterGrad)" stroke="var(--color-primary)" strokeWidth="1.5" style={{ opacity: 0.8 }} />

                  {/* Clock Center Display Text */}
                  <text x="225" y="215" textAnchor="middle" fill="var(--color-primary)" fontSize="10" fontWeight="800" letterSpacing="0.08em">
                    PEAK TIME
                  </text>
                  <text x="225" y="235" textAnchor="middle" fill="var(--text-primary)" fontSize="16" fontWeight="900">
                    {stats.habits.byHour ? (() => {
                      const peakHour = Object.entries(stats.habits.byHour).sort((a,b) => b[1] - a[1])[0]?.[0] || '20';
                      return `${String(peakHour).padStart(2, '0')}:00`;
                    })() : '--'}
                  </text>

                  {/* Subtle 24-Hour Tick Marks behind the bars */}
                  {Array.from({ length: 24 }).map((_, h) => {
                    const angle = h * 15 - 90;
                    const rad = (angle * Math.PI) / 180;
                    const x1 = 225 + 75 * Math.cos(rad);
                    const y1 = 225 + 75 * Math.sin(rad);
                    const x2 = 225 + 175 * Math.cos(rad);
                    const y2 = 225 + 175 * Math.sin(rad);
                    return (
                      <line 
                        key={`tick-${h}`}
                        x1={x1} 
                        y1={y1} 
                        x2={x2} 
                        y2={y2} 
                        stroke="rgba(255,255,255,0.02)" 
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Radial Bars representing watches */}
                  {hourData.map(([hour, val], idx) => {
                    const angle = hour * 15 - 90; // 24 hours, so 15 degrees per hour. 0h is at the top (-90 degrees).
                    const rad = (angle * Math.PI) / 180;
                    
                    const barLength = val > 0 ? 10 + (val / maxHourVal) * 90 : 3; // base length of 10px if watched, scale up to 90px.
                    const r_inner = 75;
                    const r_outer = r_inner + barLength;
                    
                    const x1 = 225 + r_inner * Math.cos(rad);
                    const y1 = 225 + r_inner * Math.sin(rad);
                    const x2 = 225 + r_outer * Math.cos(rad);
                    const y2 = 225 + r_outer * Math.sin(rad);
                    
                    const lblRad = (angle * Math.PI) / 180;
                    const x_lbl = 225 + 195 * Math.cos(lblRad);
                    const y_lbl = 225 + 195 * Math.sin(lblRad) + 3;
                    
                    const labelText = hour === 0 ? '24' : `${hour}`;
                    
                    return (
                      <g key={hour} className="clock-bar-group" style={{ cursor: 'pointer' }}>
                        {/* Invisible thicker line for easier hover trigger */}
                        <line 
                          x1={x1} 
                          y1={y1} 
                          x2={x2} 
                          y2={y2} 
                          stroke="transparent" 
                          strokeWidth="20" 
                        />
                        {/* The visible radial bar (using solid stroke to fix SVG gradient render bug on vertical/horizontal lines) */}
                        <line 
                          x1={x1} 
                          y1={y1} 
                          x2={x2} 
                          y2={y2} 
                          stroke="var(--color-primary)" 
                          strokeWidth={val > 0 ? "6" : "2"} 
                          strokeLinecap="round"
                          style={{
                            transition: 'all 0.3s ease',
                            opacity: val > 0 ? 0.9 : 0.25
                          }}
                        />
                        {/* Dot on the outer tip if watched */}
                        {val > 0 && (
                          <circle 
                            cx={x2} 
                            cy={y2} 
                            r="4" 
                            fill="var(--color-secondary)" 
                            stroke="var(--color-primary)" 
                            strokeWidth="1.5"
                          />
                        )}
                        {/* Hour Label */}
                        <text 
                          x={x_lbl} 
                          y={y_lbl} 
                          textAnchor="middle" 
                          fill={val > 0 ? "var(--text-primary)" : "var(--text-muted)"}
                          fontSize="9"
                          fontWeight={val > 0 ? "800" : "400"}
                          style={{ opacity: val > 0 ? 1 : 0.4 }}
                        >
                          {labelText}
                        </text>
                        {/* Tooltip title on hover */}
                        <title>{`${hour}:00: ${val} episodes watched`}</title>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Right Side: Clock Stats Summary */}
              <div style={styles.watchFaceStatsCol}>
                {/* Day/Night Stats */}
                <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: 'none' }}>
                  <div style={styles.clockStatsTitle}>🌞 Day vs. Night breakdown</div>
                  {(() => {
                    let dayWatches = 0; // 06:00 - 18:00
                    let nightWatches = 0; // 18:00 - 06:00
                    hourData.forEach(([hour, val]) => {
                      if (hour >= 6 && hour < 18) {
                        dayWatches += val;
                      } else {
                        nightWatches += val;
                      }
                    });
                    const total = dayWatches + nightWatches || 1;
                    const dayPct = Math.round((dayWatches / total) * 100);
                    const nightPct = Math.round((nightWatches / total) * 100);
                    
                    return (
                      <div style={styles.clockBreakdownContainer}>
                        <div style={styles.clockStatRow}>
                          <span>🌅 Morning & Afternoon (06:00 - 18:00)</span>
                          <span style={{ color: 'var(--color-primary)', fontWeight: '800' }}>{dayPct}% ({dayWatches} eps)</span>
                        </div>
                        <div style={styles.clockStatRow}>
                          <span>🌌 Evening & Late Night (18:00 - 06:00)</span>
                          <span style={{ color: 'var(--color-accent)', fontWeight: '800' }}>{nightPct}% ({nightWatches} eps)</span>
                        </div>
                        {/* Simple horizontal bar ratio */}
                        <div style={styles.ratioBarContainer}>
                          <div style={{...styles.ratioBarFill, width: `${dayPct}%`, background: 'var(--color-primary)'}}></div>
                          <div style={{...styles.ratioBarFill, width: `${nightPct}%`, background: 'var(--color-accent)'}}></div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5', marginTop: '10px' }}>
                  Your viewing trends form a 24-hour radial blueprint. Hover on any watch spoke to inspect the exact episode count tracked for that hour.
                </p>
              </div>
            </div>

            {/* Bottom Row: Linear Timeline (Full Width) */}
            <div style={{ marginTop: '24px', width: '100%', borderTop: '1px solid var(--border-glass)', paddingTop: '24px' }}>
              <div style={{ ...styles.clockStatsTitle, marginBottom: '12px' }}>📊 Linear Hourly Watch Distribution</div>
              <div style={styles.svgWrapper}>
                <svg viewBox="0 0 1000 160" style={styles.svgContainer}>
                  <defs>
                    <linearGradient id="linearClockGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" />
                      <stop offset="100%" stopColor="var(--color-secondary)" />
                    </linearGradient>
                  </defs>
                  {hourData.map(([hour, val], idx) => {
                    const x = 30 + idx * 40;
                    const barHeight = (val / maxHourVal) * 90;
                    const y = 115 - barHeight;
                    
                    return (
                      <g key={idx}>
                        <rect 
                          x={x} 
                          y={y} 
                          width="16" 
                          height={barHeight} 
                          rx="3"
                          fill="url(#linearClockGrad)" 
                        />
                        {val > 0 && (
                          <text x={x + 8} y={y - 6} textAnchor="middle" fill="var(--text-primary)" fontSize="9" fontWeight="bold">
                            {val}
                          </text>
                        )}
                        <text x={x + 8} y="135" textAnchor="middle" fill="var(--text-secondary)" fontSize="9">
                          {hour === 0 ? '0h' : `${hour}h`}
                        </text>
                      </g>
                    );
                  })}
                </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Roadmap timeline snake chart */}
      {renderRoadmapTimeline()}
    </div>
    );
  };

  const renderCommunity = () => {
    return (
      <div style={styles.tabContent} className="animate-slide-up">
        {/* Achievements header */}
        <div style={styles.overviewRowsGrid}>
          {/* Quizzes & Polls */}
          <div className="glass-panel" style={styles.infoPanel}>
            <h3 style={styles.panelTitle}>Engagement Stats</h3>
            <table style={styles.infoTable}>
              <tbody>
                <tr>
                  <td>Polls Voted</td>
                  <td><strong>{stats.community.pollsCount} polls</strong></td>
                </tr>
                <tr>
                  <td>Quizzes Completed</td>
                  <td><strong>{stats.community.quizzes.length} quizzes</strong></td>
                </tr>
                <tr>
                  <td>Quiz High Score</td>
                  <td><strong style={{ color: 'var(--color-success)' }}>{stats.community.quizHighScore} points</strong></td>
                </tr>
                <tr>
                  <td>Total Comments Written</td>
                  <td><strong>{stats.community.totalComments} comments</strong></td>
                </tr>
                <tr>
                  <td>Comment Likes Given</td>
                  <td><strong>{stats.community.likesGiven} likes</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Badges Gallery */}
          <div className="glass-panel" style={styles.infoPanel}>
            <h3 style={styles.panelTitle}>Badges Gallery ({stats.badges.length})</h3>
            <div style={styles.badgesGrid}>
              {stats.badges.map((badge, idx) => (
                <div key={idx} className="glass-panel" style={styles.badgeMiniCard}>
                  <Award size={18} style={{ color: 'var(--color-primary)' }} />
                  <span style={styles.badgeMiniTitle}>{badge.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Written Reviews */}
        <div className="glass-panel" style={{...styles.infoPanel, marginTop: '20px'}}>
          <h3 style={styles.panelTitle}>Your Written Comments & Reviews</h3>
          {stats.community.allComments.length > 0 ? (
            <div style={styles.commentsListFull}>
              {stats.community.allComments.map((c, idx) => (
                <div key={idx} style={styles.commentItemFull}>
                  <div style={styles.commentItemHeader}>
                    <span style={styles.commentItemTarget}>{c.target}</span>
                    <div style={styles.commentItemMeta}>
                      <span style={styles.commentTypeLabel}>{c.type}</span>
                      <div style={styles.commentItemLikes}>
                        <Heart size={12} fill="var(--color-secondary)" style={{ color: 'var(--color-secondary)' }} />
                        <span>{c.likes}</span>
                      </div>
                    </div>
                  </div>
                  <p style={styles.commentItemText}>"{c.text}"</p>
                  <span style={styles.commentItemDate}>{new Date(c.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No written reviews or comments found in your export data.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.header}>
        <div style={styles.headerTitleRow}>
          <button style={styles.backBtn} className="back-btn" onClick={onBackToWrapped}>
            <ArrowLeft size={16} /> Replay Wrapped
          </button>
          <h1 style={styles.dashboardTitle}>Your TV Time Archives</h1>
        </div>
        <div style={styles.userBanner}>
          <div style={styles.userAvatar}>
            <Smile size={24} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <div style={styles.userName}>{stats.profile.username || 'User Profile'}</div>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div style={styles.tabsRow}>
        <button 
          style={{...styles.tabBtn, ...(activeTab === 'overview' ? styles.tabBtnActive : {})}}
          onClick={() => setActiveTab('overview')}
        >
          <Sparkles size={16} /> Overview
        </button>
        <button 
          style={{...styles.tabBtn, ...(activeTab === 'habits' ? styles.tabBtnActive : {})}}
          onClick={() => setActiveTab('habits')}
        >
          <Calendar size={16} /> Habits
        </button>
        <button 
          style={{...styles.tabBtn, ...(activeTab === 'community' ? styles.tabBtnActive : {})}}
          onClick={() => setActiveTab('community')}
        >
          <Award size={16} /> Community
        </button>
        <button 
          style={{...styles.tabBtn, ...(activeTab === 'shows' ? styles.tabBtnActive : {})}}
          onClick={() => setActiveTab('shows')}
        >
          <Tv size={16} /> TV Shows
        </button>
        <button 
          style={{...styles.tabBtn, ...(activeTab === 'movies' ? styles.tabBtnActive : {})}}
          onClick={() => setActiveTab('movies')}
        >
          <Film size={16} /> Movies
        </button>
      </div>

      {/* Tab Panels */}
      <div style={styles.panelBody}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'habits' && renderHabits()}
        {activeTab === 'community' && renderCommunity()}
        {activeTab === 'shows' && renderTVShows()}
        {activeTab === 'movies' && renderMovies()}
      </div>
    </div>
  );
}

// Simple internal icon for rewatches rotation
function RotateCcwIcon({ size, style }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      style={style}
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

const styles = {
  container: {
    width: '100%',
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '40px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '20px'
  },
  headerTitleRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    alignSelf: 'flex-start',
    transition: 'var(--transition-smooth)'
  },
  dashboardTitle: {
    fontSize: '2rem',
    fontWeight: '900',
    letterSpacing: '-0.03em'
  },
  userBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--border-glass)',
    padding: '12px 20px',
    borderRadius: '16px'
  },
  userAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'rgba(168, 85, 247, 0.1)',
    border: '1px solid rgba(168, 85, 247, 0.2)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  userName: {
    fontWeight: '700',
    fontSize: '1rem'
  },
  userMail: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '2px'
  },
  tabsRow: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '4px',
    borderBottom: '1px solid var(--border-glass)',
    width: '100%'
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    fontWeight: '600',
    fontSize: '0.9rem',
    padding: '10px 16px',
    borderRadius: '8px 8px 0 0',
    transition: 'var(--transition-smooth)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    whiteSpace: 'nowrap'
  },
  tabBtnActive: {
    color: 'var(--color-primary)',
    background: 'rgba(168, 85, 247, 0.08)',
    borderBottom: '2px solid var(--color-primary)'
  },
  panelBody: {
    width: '100%'
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    width: '100%'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    width: '100%'
  },
  metricCard: {
    padding: '24px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  metricDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  metricVal: {
    fontSize: '1.5rem',
    fontWeight: '800',
    fontFamily: 'var(--font-header)'
  },
  metricLbl: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)'
  },
  overviewRowsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    width: '100%'
  },
  infoPanel: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  panelTitle: {
    fontSize: '1.2rem',
    fontWeight: '800',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '10px'
  },
  infoTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem'
  },
  collectionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  collectionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'rgba(255,255,255,0.02)',
    padding: '10px 14px',
    borderRadius: '10px'
  },
  collectionMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  collectionName: {
    fontWeight: '600',
    fontSize: '0.85rem'
  },
  collectionCount: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)'
  },
  controlsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    width: '100%'
  },
  resultsCount: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)'
  },
  sortGroup: {
    display: 'flex',
    gap: '6px',
    background: 'rgba(255,255,255,0.03)',
    padding: '4px',
    borderRadius: '10px',
    border: '1px solid var(--border-glass)'
  },
  sortBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '600',
    padding: '6px 12px',
    borderRadius: '6px',
    color: 'var(--text-secondary)',
    transition: 'var(--transition-smooth)'
  },
  sortBtnActive: {
    color: 'var(--text-primary)',
    background: 'rgba(255,255,255,0.08)'
  },
  showsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
    gap: '20px',
    width: '100%'
  },
  showCard: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: '280px',
    borderRadius: '16px'
  },
  showPoster: {
    width: '100%',
    height: '190px',
    objectFit: 'cover',
    borderBottom: '1px solid var(--border-glass)'
  },
  showPosterPlaceholder: {
    width: '100%',
    height: '190px',
    background: 'rgba(255,255,255,0.03)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-glass)'
  },
  showCardInfo: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    flexGrow: 1
  },
  showName: {
    fontSize: '0.85rem',
    fontWeight: '700',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  showMetaGrid: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.7rem',
    color: 'var(--text-muted)'
  },
  showMetaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  chartsGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '20px',
    width: '100%'
  },
  chartPanel: {
    flex: '1 1 340px',
    minWidth: '280px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  svgWrapper: {
    width: '100%',
    overflow: 'hidden'
  },
  svgContainer: {
    width: '100%',
    height: 'auto',
    overflow: 'visible'
  },
  badgesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '10px',
    maxHeight: '260px',
    overflowY: 'auto',
    paddingRight: '6px'
  },
  badgeMiniCard: {
    padding: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255,255,255,0.02)'
  },
  badgeMiniTitle: {
    fontSize: '0.75rem',
    fontWeight: '600'
  },
  commentsListFull: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxHeight: '500px',
    overflowY: 'auto',
    paddingRight: '6px'
  },
  commentItemFull: {
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid var(--border-glass)',
    padding: '16px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  commentItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px'
  },
  commentItemTarget: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: 'var(--color-primary)'
  },
  commentItemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  commentTypeLabel: {
    fontSize: '0.7rem',
    background: 'rgba(255,255,255,0.05)',
    padding: '2px 8px',
    borderRadius: 'var(--radius-full)',
    color: 'var(--text-secondary)'
  },
  commentItemLikes: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)'
  },
  commentItemText: {
    fontSize: '0.9rem',
    fontStyle: 'italic',
    lineHeight: '1.4',
    color: 'var(--text-primary)'
  },
  commentItemDate: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    alignSelf: 'flex-end'
  },
  roadmapEps: {
    fontSize: '0.95rem',
    fontWeight: '900',
    color: 'var(--text-primary)',
    lineHeight: '1.1'
  },
  roadmapShows: {
    fontSize: '0.55rem',
    color: 'var(--color-primary)',
    fontWeight: '700',
    marginTop: '2px'
  },
  roadmapLabel: {
    marginTop: '8px',
    fontSize: '0.7rem',
    fontWeight: '700',
    color: 'var(--text-secondary)'
  },
  watchFaceLayout: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    flexWrap: 'wrap',
    width: '100%',
    margin: '10px 0'
  },
  watchFaceSvgCol: {
    flex: '1 1 350px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  watchFaceStatsCol: {
    flex: '1 1 300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  clockStatsTitle: {
    fontSize: '0.9rem',
    fontWeight: '800',
    color: 'var(--color-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '12px'
  },
  clockBreakdownContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  clockStatRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)'
  },
  ratioBarContainer: {
    width: '100%',
    height: '8px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '4px',
    overflow: 'hidden',
    display: 'flex',
    marginTop: '5px'
  },
  ratioBarFill: {
    height: '100%'
  }
};

// Injection helper to add custom hover pseudo class styling
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    .glass-panel-hover:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4), var(--shadow-glow);
    }
    .back-btn:hover {
      color: var(--color-primary) !important;
    }
    .roadmap-container {
      position: relative;
      width: 100%;
      overflow-x: auto;
      padding: 30px 10px;
      margin-top: 15px;
    }
    .roadmap-grid {
      display: flex;
      flex-direction: column;
      gap: 50px;
      min-width: 760px;
      padding: 0 20px;
    }
    .roadmap-row {
      display: flex;
      gap: 40px;
      justify-content: center;
      width: 100%;
      position: relative;
    }
    .roadmap-row-normal {
      flex-direction: row;
    }
    .roadmap-row-reversed {
      flex-direction: row-reverse;
    }
    .roadmap-bubble-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      width: 90px;
    }
    .roadmap-bubble {
      width: 66px;
      height: 66px;
      border-radius: 50%;
      background: rgba(26, 26, 31, 0.95);
      border: 2px solid var(--color-primary);
      box-shadow: var(--shadow-glow);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: var(--transition-smooth);
      z-index: 5;
    }
    .roadmap-bubble:hover {
      transform: scale(1.15);
      box-shadow: 0 0 25px rgba(255, 208, 0, 0.35);
      background: var(--bg-glass-bright);
    }
    .roadmap-bubble.active-month {
      border-color: var(--color-primary);
      background: rgba(255, 208, 0, 0.08);
    }
    .roadmap-bubble.empty-month {
      border-color: var(--text-muted);
      box-shadow: none;
      opacity: 0.5;
    }
    /* Horizontal lines */
    .roadmap-row-normal .roadmap-bubble-container:not(:last-child)::after {
      content: '';
      position: absolute;
      top: 33px;
      left: 45px;
      width: 130px;
      height: 2px;
      background: rgba(255, 255, 255, 0.08);
      z-index: 1;
    }
    .roadmap-row-reversed .roadmap-bubble-container:not(:last-child)::after {
      content: '';
      position: absolute;
      top: 33px;
      right: 45px;
      width: 130px;
      height: 2px;
      background: rgba(255, 255, 255, 0.08);
      z-index: 1;
    }
    /* Vertical lines drops from the last item of each row */
    .roadmap-row:not(:last-child) .roadmap-bubble-container:last-child::before {
      content: '';
      position: absolute;
      left: 44px;
      top: 33px;
      width: 2px;
      height: 140px;
      background: rgba(255, 255, 255, 0.08);
      z-index: 1;
    }
  `;
  document.head.appendChild(styleEl);
}

// Helper styling fallback for tables
styles.infoTable = {
  ...styles.infoTable,
  '& td': {
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)'
  },
  '& td:first-child': {
    color: 'var(--text-secondary)'
  },
  '& td:last-child': {
    textAlign: 'right'
  }
};
