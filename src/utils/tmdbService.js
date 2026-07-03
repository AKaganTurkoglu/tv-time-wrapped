const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// In-memory cache to save API calls during the current session
const showCache = {};
const movieCache = {};

/**
 * Loads cache from LocalStorage
 */
function loadCache() {
  try {
    const showData = localStorage.getItem('tvt_wrapped_show_cache');
    const movieData = localStorage.getItem('tvt_wrapped_movie_cache');
    if (showData) Object.assign(showCache, JSON.parse(showData));
    if (movieData) Object.assign(movieCache, JSON.parse(movieData));
  } catch (e) {
    console.error('Error loading cache from localStorage:', e);
  }
}

/**
 * Saves cache to LocalStorage
 */
function saveCache() {
  try {
    localStorage.setItem('tvt_wrapped_show_cache', JSON.stringify(showCache));
    localStorage.setItem('tvt_wrapped_movie_cache', JSON.stringify(movieCache));
  } catch (e) {
    console.error('Error saving cache to localStorage:', e);
  }
}

loadCache();

/**
 * Helper to determine request headers and query parameters based on TMDB key type.
 * Automatically handles v3 API Key (32-character string) or v4 Read Access Token (JWT starting with eyJ).
 */
function getRequestConfig(path, apiKey, queryParams = '') {
  const isV4 = apiKey && apiKey.startsWith('eyJ');
  
  if (isV4) {
    return {
      url: `${BASE_URL}${path}${queryParams ? '?' + queryParams : ''}`,
      options: {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          accept: 'application/json'
        }
      }
    };
  } else {
    const prefix = queryParams ? `${queryParams}&` : '';
    return {
      url: `${BASE_URL}${path}?${prefix}api_key=${apiKey}`,
      options: {}
    };
  }
}

/**
 * Fetches TV show poster, backdrop, and network details from TMDB using its TVDB ID
 * Falls back to search by name if TVDB ID is missing or lookup fails
 */
export async function getShowMetadata(tvdbId, showName, apiKey) {
  if (!apiKey) return { name: showName, poster: null, backdrop: null };
  if (!tvdbId && !showName) return { name: showName, poster: null, backdrop: null };
  
  const cacheKey = tvdbId || `name_${showName.toLowerCase().trim()}`;
  if (showCache[cacheKey]) {
    return showCache[cacheKey];
  }
  
  // 1. Try TVDB ID lookup first if we have it
  if (tvdbId) {
    try {
      const { url, options } = getRequestConfig(`/find/${tvdbId}`, apiKey, 'external_source=tvdb_id');
      const response = await fetch(url, options);
      if (response.ok) {
        const data = await response.json();
        const show = data.tv_results && data.tv_results[0];
        
        if (show) {
          const metadata = {
            name: show.name || showName,
            poster: show.poster_path ? `${IMAGE_BASE_URL}${show.poster_path}` : null,
            backdrop: show.backdrop_path ? `https://image.tmdb.org/t/p/original${show.backdrop_path}` : null,
            overview: show.overview,
            rating: show.vote_average,
            firstAirDate: show.first_air_date
          };
          showCache[cacheKey] = metadata;
          saveCache();
          return metadata;
        }
      }
    } catch (e) {
      console.warn(`TVDB ID lookup failed for TV show ${showName} (${tvdbId}):`, e);
    }
  }
  
  // 2. Fallback: Search by name using TMDB TV Search API
  if (showName) {
    try {
      const { url, options } = getRequestConfig('/search/tv', apiKey, `query=${encodeURIComponent(showName)}`);
      const response = await fetch(url, options);
      if (response.ok) {
        const data = await response.json();
        const show = data.results && data.results[0];
        
        if (show) {
          const metadata = {
            name: show.name || showName,
            poster: show.poster_path ? `${IMAGE_BASE_URL}${show.poster_path}` : null,
            backdrop: show.backdrop_path ? `https://image.tmdb.org/t/p/original${show.backdrop_path}` : null,
            overview: show.overview,
            rating: show.vote_average,
            firstAirDate: show.first_air_date
          };
          showCache[cacheKey] = metadata;
          saveCache();
          return metadata;
        }
      }
    } catch (e) {
      console.error(`Error searching TMDB by name for TV show ${showName}:`, e);
    }
  }
  
  return { name: showName, poster: null, backdrop: null };
}

/**
 * Fetches movie poster, backdrop, and rating from TMDB using its name and optionally release date
 */
export async function getMovieMetadata(movieName, releaseDateStr, apiKey) {
  if (!apiKey) return { name: movieName, poster: null, backdrop: null };
  
  const cacheKey = movieName.toLowerCase().trim();
  if (movieCache[cacheKey]) {
    return movieCache[cacheKey];
  }
  
  try {
    let year = '';
    if (releaseDateStr) {
      const match = releaseDateStr.match(/\d{4}/);
      if (match) year = match[0];
    }
    
    let queryParams = `query=${encodeURIComponent(movieName)}`;
    if (year) {
      queryParams += `&year=${year}`;
    }
    
    const { url, options } = getRequestConfig('/search/movie', apiKey, queryParams);
    const response = await fetch(url, options);
    if (!response.ok) throw new Error('Network response not ok');
    
    const data = await response.json();
    const movie = data.results && data.results[0];
    
    if (movie) {
      const metadata = {
        name: movie.title || movieName,
        poster: movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : null,
        backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
        overview: movie.overview,
        rating: movie.vote_average,
        releaseDate: movie.release_date
      };
      movieCache[cacheKey] = metadata;
      saveCache();
      return metadata;
    }
  } catch (e) {
    console.error(`Error searching TMDB metadata for movie ${movieName}:`, e);
  }
  
  return { name: movieName, poster: null, backdrop: null };
}
