import React, { useState } from 'react';
import UploadZone from './components/UploadZone';
import WrappedStory from './components/WrappedStory';
import StatsDashboard from './components/StatsDashboard';

export default function App() {
  const [view, setView] = useState('upload'); // 'upload', 'wrapped', 'stats'
  const [stats, setStats] = useState(null);
  const tmdbApiKey = import.meta.env.VITE_TMDB_API_KEY || '';

  const handleDataParsed = (parsedStats) => {
    setStats(parsedStats);
    setView('wrapped');
  };

  const handleWrappedFinish = () => {
    setView('stats');
  };

  const handleBackToWrapped = () => {
    setView('wrapped');
  };

  return (
    <div>
      {view === 'upload' && (
        <UploadZone onDataParsed={handleDataParsed} />
      )}
      
      {view === 'wrapped' && stats && (
        <WrappedStory 
          stats={stats} 
          onFinish={handleWrappedFinish} 
          tmdbApiKey={tmdbApiKey}
        />
      )}
      
      {view === 'stats' && stats && (
        <StatsDashboard 
          stats={stats} 
          onBackToWrapped={handleBackToWrapped}
          tmdbApiKey={tmdbApiKey}
        />
      )}
    </div>
  );
}
