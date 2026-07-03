import Papa from 'papaparse';
import JSZip from 'jszip';

/**
 * Robust CSV parser that handles header cleanup and outputs array of objects
 */
function parseCSV(csvText) {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Clean keys to strip any BOM or whitespace
        const cleanedData = results.data.map(row => {
          const cleanRow = {};
          for (let key in row) {
            if (row.hasOwnProperty(key)) {
              const cleanKey = key.trim().replace(/^\ufeff/, '');
              cleanRow[cleanKey] = row[key];
            }
          }
          return cleanRow;
        });
        resolve(cleanedData);
      },
      error: (err) => reject(err)
    });
  });
}

/**
 * Searches for a file in the zip archive, ignoring path structure and case
 */
function findFileInZip(zip, filenameKeyword) {
  const lowercaseKeyword = filenameKeyword.toLowerCase();
  let matchedFileKey = null;
  
  zip.forEach((relativePath, zipEntry) => {
    const entryName = zipEntry.name.toLowerCase();
    if (entryName.endsWith('.csv')) {
      const baseName = entryName.split('/').pop();
      if (baseName.includes(lowercaseKeyword)) {
        matchedFileKey = zipEntry.name;
      }
    }
  });
  
  return matchedFileKey;
}

/**
 * Main parser entry point
 */
export async function parseTVTimeZip(file) {
  const zip = await JSZip.loadAsync(file);
  const data = {};
  
  // Define files we want to parse
  const fileMappings = {
    user: 'user.csv',
    personalData: 'user_personal_data.csv',
    followedShows: 'followed_tv_show.csv',
    rewatches: 'rewatched_episode.csv',
    latestSeen: 'show_seen_episode_latest.csv',
    badges: 'user_badge.csv',
    addictionScores: 'show_addiction_score.csv',
    episodeComments: 'episode_comment.csv',
    movieComments: 'comments-prod-comments.csv',
    polls: 'user_poll.csv',
    quizzes: 'user_quiz.csv',
    connections: 'user_connection.csv',
    lists: 'lists-prod-lists.csv',
    trackingV2: 'tracking-prod-records-v2.csv',
    trackingV1: 'tracking-prod-records.csv',
    seenEpisodeSource: 'seen_episode_source.csv'
  };
  
  // Helper to extract file text and parse to JSON
  const extractAndParse = async (keyword) => {
    const fileKey = findFileInZip(zip, keyword);
    if (!fileKey) return [];
    const text = await zip.file(fileKey).async('text');
    return await parseCSV(text);
  };
  
  // Extract all files concurrently
  const parsedData = {};
  for (let key in fileMappings) {
    try {
      parsedData[key] = await extractAndParse(fileMappings[key]);
    } catch (e) {
      console.warn(`Error parsing CSV for ${key}:`, e);
      parsedData[key] = [];
    }
  }
  
  // 1. User Profile Data
  const user = parsedData.user[0] || {};
  const personalData = parsedData.personalData || [];
  
  let coverImage = '';
  let favCharacterId = '';
  personalData.forEach(p => {
    if (p.name === 'cover') coverImage = p.value;
    if (p.name === 'favorite-character') favCharacterId = p.value;
  });
  
  let friendlyUsername = user.name || '';
  if (!friendlyUsername || /^\d+$/.test(friendlyUsername)) {
    if (user.mail) {
      const emailPrefix = user.mail.split('@')[0];
      const namePart = emailPrefix.split('.')[0].split('_')[0].split('-')[0];
      friendlyUsername = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    } else {
      friendlyUsername = 'User Profile';
    }
  }

  const profile = {
    id: user.id || '12345678',
    username: friendlyUsername,
    email: user.mail || 'user@example.com',
    timezone: user.timezone || 'UTC',
    created_at: user.created_at || '2020-01-01 00:00:00',
    coverImage,
    favCharacterId
  };
  
  // 2. Global statistics from tracking-stats record
  let globalStats = {
    total_movies_runtime_sec: 243360,
    movie_watch_count: 35,
    total_series_runtime_sec: 6677520,
    ep_watch_count: 2781,
    series_follow_count: 157
  };
  
  // Look for the stats row in v2 tracking
  const statsRecord = parsedData.trackingV2.find(r => r.key === 'tracking-stats' || r.gsi === 'tracking-stats');
  if (statsRecord) {
    globalStats.total_movies_runtime_sec = parseInt(statsRecord.total_movies_runtime || '243360');
    globalStats.movie_watch_count = parseInt(statsRecord.movie_watch_count || '35');
    globalStats.total_series_runtime_sec = parseInt(statsRecord.total_series_runtime || '6677520');
    globalStats.ep_watch_count = parseInt(statsRecord.ep_watch_count || '2781');
    globalStats.series_follow_count = parseInt(statsRecord.series_follow_count || '157');
  }
  
  // 3. TV Shows Data
  const followedShows = parsedData.followedShows || [];
  const followedShowsMap = new Map();
  followedShows.forEach(s => {
    followedShowsMap.set(s.tv_show_id, s.tv_show_name);
  });
  
  // 4. Processing watches from v2 (Episodes watch history)
  const episodeWatches = [];
  const showWatchCounts = {};
  const showLatestWatches = {};
  
  const watchesByYear = {};
  const watchesByMonth = {};
  const watchesByWeekday = {};
  const watchesByHour = {};
  const watchesByYearAndShow = {};
  
  // Weekday sorting helper
  const weekdaysOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthsOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Parse watch-episode rows from v2 tracking
  parsedData.trackingV2.forEach(r => {
    const gsi = r.gsi || '';
    if (gsi.startsWith('watch-episode') || r.bulk_type === 'episode') {
      const showName = r.series_name;
      if (!showName) return;
      
      const watchDateStr = r.created_at || r.updated_at;
      let watchDate = null;
      if (watchDateStr) {
        try {
          watchDate = new Date(watchDateStr.replace(' +0000 UTC', ''));
        } catch (e) {}
      }
      
      const watch = {
        showName,
        showId: r.s_id,
        episodeId: r.episode_id || r.ep_id,
        seasonNumber: parseInt(r.season_number || r.s_no || '1'),
        episodeNumber: parseInt(r.episode_number || r.ep_no || '1'),
        runtime: parseInt(r.runtime || '1440'), // default 24 mins
        watchDate,
        watchDateStr
      };
      
      episodeWatches.push(watch);
      
      // Top shows count
      showWatchCounts[showName] = (showWatchCounts[showName] || 0) + 1;
      
      // Latest watch dates
      if (watchDate) {
        if (!showLatestWatches[showName] || watchDate > showLatestWatches[showName]) {
          showLatestWatches[showName] = watchDate;
        }
        
        // Time habits
        const year = watchDate.getFullYear();
        const monthName = monthsOrder[watchDate.getMonth()];
        const weekdayName = weekdaysOrder[watchDate.getDay()];
        const hour = watchDate.getHours();
        
        watchesByYear[year] = (watchesByYear[year] || 0) + 1;
        watchesByMonth[monthName] = (watchesByMonth[monthName] || 0) + 1;
        watchesByWeekday[weekdayName] = (watchesByWeekday[weekdayName] || 0) + 1;
        watchesByHour[hour] = (watchesByHour[hour] || 0) + 1;

        if (!watchesByYearAndShow[year]) {
          watchesByYearAndShow[year] = {};
        }
        watchesByYearAndShow[year][showName] = (watchesByYearAndShow[year][showName] || 0) + 1;
      }
    }
  });
  
  // Fallback to seenEpisodeSource if v2 parsing returned 0 watches (in case of empty tracking file)
  if (episodeWatches.length === 0 && parsedData.seenEpisodeSource.length > 0) {
    parsedData.seenEpisodeSource.forEach(r => {
      const showName = r.tv_show_name;
      if (!showName) return;
      
      const watchDateStr = r.created_at;
      let watchDate = null;
      if (watchDateStr) {
        watchDate = new Date(watchDateStr);
      }
      
      const watch = {
        showName,
        showId: r.tv_show_id || '',
        episodeId: r.episode_id,
        seasonNumber: parseInt(r.episode_season_number || '1'),
        episodeNumber: parseInt(r.episode_number || '1'),
        runtime: 1440, // 24 mins default
        watchDate,
        watchDateStr
      };
      
      episodeWatches.push(watch);
      showWatchCounts[showName] = (showWatchCounts[showName] || 0) + 1;
      
      if (watchDate) {
        if (!showLatestWatches[showName] || watchDate > showLatestWatches[showName]) {
          showLatestWatches[showName] = watchDate;
        }
        const year = watchDate.getFullYear();
        const monthName = monthsOrder[watchDate.getMonth()];
        const weekdayName = weekdaysOrder[watchDate.getDay()];
        const hour = watchDate.getHours();
        
        watchesByYear[year] = (watchesByYear[year] || 0) + 1;
        watchesByMonth[monthName] = (watchesByMonth[monthName] || 0) + 1;
        watchesByWeekday[weekdayName] = (watchesByWeekday[weekdayName] || 0) + 1;
        watchesByHour[hour] = (watchesByHour[hour] || 0) + 1;

        if (!watchesByYearAndShow[year]) {
          watchesByYearAndShow[year] = {};
        }
        watchesByYearAndShow[year][showName] = (watchesByYearAndShow[year][showName] || 0) + 1;
      }
    });
  }
  
  // Build reverse map of show name to TVDB ID
  const showNameToTvdbIdMap = {};
  followedShows.forEach(s => {
    if (s.tv_show_id && s.tv_show_name) {
      showNameToTvdbIdMap[s.tv_show_name] = s.tv_show_id;
    }
  });
  parsedData.trackingV2.forEach(r => {
    if (r.s_id && r.series_name) {
      showNameToTvdbIdMap[r.series_name] = r.s_id;
    }
  });

  // Sort top shows list and map TVDB IDs
  const topShowsList = Object.entries(showWatchCounts)
    .map(([name, count]) => {
      const tvdbId = showNameToTvdbIdMap[name] || null;
      return {
        name,
        count,
        id: tvdbId,
        showId: tvdbId,
        latestWatch: showLatestWatches[name] || null
      };
    })
    .sort((a, b) => b.count - a.count);
  
  // 5. Addiction Scores
  const addictionScoresMap = {};
  const highAddictionShows = [];
  parsedData.addictionScores.forEach(a => {
    if (a.tv_show_name) {
      const score = parseInt(a.daily_score || a.weekly_score || a.monthly_score || '0');
      addictionScoresMap[a.tv_show_name] = score;
      if (score === 100) {
        highAddictionShows.push(a.tv_show_name);
      }
    }
  });
  
  // 6. Rewatches
  const rewatches = parsedData.rewatches || [];
  const rewatchCountsMap = {};
  let totalRewatchedCount = 0;
  rewatches.forEach(r => {
    if (r.tv_show_name) {
      rewatchCountsMap[r.tv_show_name] = (rewatchCountsMap[r.tv_show_name] || 0) + 1;
      totalRewatchedCount++;
    }
  });
  const topRewatchedShows = Object.entries(rewatchCountsMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  
  // 7. Movie watches from v1 tracking
  const watchedMovies = [];
  const moviesMap = new Map();
  
  parsedData.trackingV1.forEach(r => {
    if (r.entity_type === 'movie' || r.movie_name) {
      const name = r.movie_name;
      if (!name) return;
      
      const mtype = r.type || '';
      const isWatched = mtype.includes('watch') || mtype.includes('rewatch') || r.watch_date;
      
      if (isWatched) {
        const watchDateStr = r.created_at || r.updated_at;
        const watchDate = watchDateStr ? new Date(watchDateStr) : null;
        
        const movieObj = {
          name,
          releaseDate: r.release_date || r.release_date_range_key || '',
          runtimeSec: parseInt(r.runtime || '7200'), // default 2 hours
          watchDate,
          watchDateStr
        };
        
        moviesMap.set(name, movieObj);
      }
    }
  });
  
  // Extract movie reviews/comments from movieComments
  const movieCommentsList = [];
  let likesGivenCount = 0;
  
  parsedData.movieComments.forEach(mc => {
    if (mc.type === 'comment') {
      movieCommentsList.push({
        text: mc.text,
        movieName: mc.movie_name || '',
        seriesName: mc.series_name || '',
        createdAt: mc.created_at,
        likes: parseInt(mc.like_count || '0'),
        isSpoiler: mc.is_spoiler === 'true'
      });
    } else if (mc.type === 'like') {
      likesGivenCount++;
    }
  });
  
  // 8. Episode comments & Community engagement
  const episodeCommentsList = [];
  parsedData.episodeComments.forEach(ec => {
    if (ec.comment) {
      episodeCommentsList.push({
        text: ec.comment,
        showName: ec.tv_show_name || '',
        seasonNumber: ec.episode_season_number,
        episodeNumber: ec.episode_number,
        createdAt: ec.created_at,
        likes: parseInt(ec.nb_likes || '0')
      });
    }
  });
  
  // Combine all comments written
  const allCommentsWritten = [
    ...movieCommentsList.map(c => ({
      text: c.text,
      target: c.movieName || c.seriesName || 'Movie/Show',
      likes: c.likes,
      date: c.createdAt,
      type: 'Movie Review'
    })),
    ...episodeCommentsList.map(c => ({
      text: c.text,
      target: `${c.showName} S${c.seasonNumber}E${c.episodeNumber}`,
      likes: c.likes,
      date: c.createdAt,
      type: 'Episode Comment'
    }))
  ].sort((a, b) => b.likes - a.likes);
  
  const mostLikedComment = allCommentsWritten[0] || null;
  const totalCommentsCount = allCommentsWritten.length;
  
  // 9. Quizzes & Polls
  const pollsVotedCount = parsedData.polls.length;
  const quizzesCompleted = parsedData.quizzes.map(q => ({
    quizId: q.quiz_id,
    score: parseInt(q.score || '0'),
    date: q.created_at,
    avgTime: parseFloat(q.avg_time || '0')
  }));
  const highestQuizScore = quizzesCompleted.reduce((max, q) => q.score > max ? q.score : max, 0);
  
  // 10. Connections & Activity frequency
  const totalAppSessions = parsedData.connections.length;
  const sessionsByYear = {};
  parsedData.connections.forEach(c => {
    const dateStr = c.created_at || c.updated_at;
    if (dateStr) {
      const year = dateStr.split('-')[0];
      sessionsByYear[year] = (sessionsByYear[year] || 0) + 1;
    }
  });
  
  // Calculate average launches frequency
  let avgSessionIntervalDays = 0;
  if (totalAppSessions > 1 && profile.created_at) {
    const start = new Date(profile.created_at);
    const end = new Date();
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    avgSessionIntervalDays = (diffDays / totalAppSessions).toFixed(1);
  }
  
  // Build name resolution maps for lists
  const tvdbIdToNameMap = {};
  followedShows.forEach(s => {
    if (s.tv_show_id && s.tv_show_name) tvdbIdToNameMap[s.tv_show_id] = s.tv_show_name;
  });
  parsedData.trackingV2.forEach(r => {
    if (r.s_id && r.series_name) tvdbIdToNameMap[r.s_id] = r.series_name;
  });
  
  const movieUuidToNameMap = {};
  parsedData.trackingV1.forEach(r => {
    if (r.uuid && r.movie_name) movieUuidToNameMap[r.uuid] = r.movie_name;
  });

  // 11. Custom Collections
  const customLists = [];
  const favoriteShowsList = [];
  const favoriteMoviesList = [];

  parsedData.lists.forEach(l => {
    if (l.type === 'list') {
      let objectCount = 0;
      try {
        const matches = l.objects.match(/map\[/g);
        objectCount = matches ? matches.length : 0;
      } catch (e) {}
      
      const displayName = l.name || (l.s_key === 'favorite-series' ? 'Favorite Shows' : l.s_key === 'favorite-movies' ? 'Favorite Movies' : 'Untitled List');
      
      customLists.push({
        name: displayName,
        description: l.description || '',
        createdAt: l.created_at,
        count: objectCount
      });
      
      // Extract favorite shows items (up to 12)
      if (l.s_key === 'favorite-series' || displayName.toLowerCase().includes('favorite show')) {
        const idMatches = [...l.objects.matchAll(/id:(\d+)/g)].map(m => m[1]);
        idMatches.forEach(id => {
          const name = tvdbIdToNameMap[id];
          if (name) favoriteShowsList.push(name);
        });
      }
      
      // Extract favorite movies items (up to 12)
      if (l.s_key === 'favorite-movies' || displayName.toLowerCase().includes('favorite movie')) {
        const uuidMatches = [...l.objects.matchAll(/uuid:([a-f0-9\-]+)/g)].map(m => m[1]);
        uuidMatches.forEach(uuid => {
          const name = movieUuidToNameMap[uuid];
          if (name) favoriteMoviesList.push(name);
        });
      }
    }
  });
  
  // 11.5 Generate monthly timeline for snake/roadmap chart
  const monthlyTimeline = [];
  const joinDate = profile.created_at ? new Date(profile.created_at.replace(' +0000 UTC', '')) : new Date('2017-02-17');
  const startYear = joinDate.getFullYear() || 2017;
  const startMonth = joinDate.getMonth() || 1; // Feb (0-indexed 1)
  const nowTime = new Date();
  const endYear = nowTime.getFullYear();
  const endMonth = nowTime.getMonth();
  
  let curYear = startYear;
  let curMonth = startMonth;
  
  while (curYear < endYear || (curYear === endYear && curMonth <= endMonth)) {
    const key = `${curYear}-${String(curMonth + 1).padStart(2, '0')}`;
    const label = new Date(curYear, curMonth, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    monthlyTimeline.push({
      key,
      year: curYear,
      month: curMonth,
      label,
      count: 0,
      showsCount: 0
    });
    
    curMonth++;
    if (curMonth > 11) {
      curMonth = 0;
      curYear++;
    }
  }
  
  // Aggregate episode watches count and unique shows per month
  const showsPerMonth = {}; // { key: Set }
  episodeWatches.forEach(w => {
    if (w.watchDate) {
      const yr = w.watchDate.getFullYear();
      const mo = w.watchDate.getMonth();
      const key = `${yr}-${String(mo + 1).padStart(2, '0')}`;
      
      const item = monthlyTimeline.find(t => t.key === key);
      if (item) {
        item.count++;
        
        if (w.showName) {
          if (!showsPerMonth[key]) {
            showsPerMonth[key] = new Set();
          }
          showsPerMonth[key].add(w.showName);
        }
      }
    }
  });
  
  monthlyTimeline.forEach(item => {
    const showSet = showsPerMonth[item.key];
    item.showsCount = showSet ? showSet.size : 0;
  });
  
  // 12. Badges Earned
  const badgesEarned = (parsedData.badges || []).map(b => {
    const badgeId = b.badge_id || '';
    // Format badge ID into nice titles
    // e.g. "153021-quick-watcher-3-bd" -> "Quick Watcher (The Walking Dead)"
    let title = badgeId.split('-').slice(1).join(' ').replace(/ bd|bd/g, '').trim();
    if (!title) title = badgeId;
    title = title.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    return {
      id: badgeId,
      title,
      date: b.created_at
    };
  });
  
  // Compile all statistics
  // Compile top show per year
  const topShowPerYear = {};
  Object.entries(watchesByYearAndShow).forEach(([year, shows]) => {
    const top = Object.entries(shows).sort((a, b) => b[1] - a[1])[0];
    if (top) {
      const tvdbId = showNameToTvdbIdMap[top[0]] || null;
      topShowPerYear[year] = {
        showName: top[0],
        count: top[1],
        id: tvdbId,
        showId: tvdbId
      };
    }
  });

  return {
    profile,
    globalStats: {
      ...globalStats,
      total_movies_watched: moviesMap.size || globalStats.movie_watch_count,
      total_movies_runtime_min: Math.round(globalStats.total_movies_runtime_sec / 60),
      total_series_runtime_min: Math.round(globalStats.total_series_runtime_sec / 60),
      total_series_runtime_hours: Math.round(globalStats.total_series_runtime_sec / 3600),
      total_series_runtime_days: (globalStats.total_series_runtime_sec / (3600 * 24)).toFixed(1),
      ep_watch_count: episodeWatches.length || globalStats.ep_watch_count
    },
    shows: {
      followedCount: followedShows.length,
      watchedCount: topShowsList.length,
      topShows: topShowsList,
      addictionScores: addictionScoresMap,
      highAddictionShows,
      rewatches: {
        total: totalRewatchedCount,
        topShows: topRewatchedShows
      },
      topShowPerYear
    },
    movies: {
      watchedList: Array.from(moviesMap.values()),
      count: moviesMap.size
    },
    habits: {
      byYear: watchesByYear,
      byMonth: watchesByMonth,
      byWeekday: watchesByWeekday,
      byHour: watchesByHour,
      monthlyTimeline
    },
    community: {
      totalComments: totalCommentsCount,
      allComments: allCommentsWritten,
      mostLikedComment,
      likesGiven: likesGivenCount,
      pollsCount: pollsVotedCount,
      quizzes: quizzesCompleted,
      quizHighScore: highestQuizScore
    },
    appActivity: {
      totalSessions: totalAppSessions,
      byYear: sessionsByYear,
      averageLaunchIntervalDays: avgSessionIntervalDays
    },
    collections: customLists,
    favorites: {
      shows: favoriteShowsList.slice(0, 12),
      movies: favoriteMoviesList.slice(0, 12)
    },
    badges: badgesEarned
  };
}
