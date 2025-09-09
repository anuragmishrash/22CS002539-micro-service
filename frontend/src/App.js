import React, { useState } from 'react';
import './App.css';
import UrlForm from './components/UrlForm';
import UrlResult from './components/UrlResult';
import UrlStats from './components/UrlStats';

function App() {
  const [shortUrl, setShortUrl] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('create');

  const handleUrlCreated = (data) => {
    setShortUrl(data);
    setStatsData(null);
    setError(null);
  };

  const handleStatsReceived = (data) => {
    setStatsData(data);
    setShortUrl(null);
    setError(null);
  };

  const handleError = (errorMsg) => {
    setError(errorMsg);
    setShortUrl(null);
    setStatsData(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>URL Shortener</h1>
      </header>
      <main>
        <div className="tabs">
          <button 
            className={activeTab === 'create' ? 'active' : ''}
            onClick={() => setActiveTab('create')}
          >
            Create Short URL
          </button>
          <button 
            className={activeTab === 'stats' ? 'active' : ''}
            onClick={() => setActiveTab('stats')}
          >
            View URL Stats
          </button>
        </div>

        {activeTab === 'create' ? (
          <UrlForm onUrlCreated={handleUrlCreated} onError={handleError} />
        ) : (
          <UrlStats onStatsReceived={handleStatsReceived} onError={handleError} />
        )}

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {shortUrl && <UrlResult shortUrl={shortUrl} />}

        {statsData && (
          <div className="stats-result">
            <h3>URL Statistics</h3>
            <p><strong>Original URL:</strong> {statsData.originalUrl}</p>
            <p><strong>Short Code:</strong> {statsData.shortCode}</p>
            <p><strong>Created:</strong> {new Date(statsData.createdAt).toLocaleString()}</p>
            <p><strong>Expires:</strong> {new Date(statsData.expiresAt).toLocaleString()}</p>
            <p><strong>Total Clicks:</strong> {statsData.totalClicks}</p>
            
            {statsData.totalClicks > 0 && (
              <div className="click-details">
                <h4>Click Details</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Referrer</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statsData.clickDetails.map((click, index) => (
                      <tr key={index}>
                        <td>{new Date(click.timestamp).toLocaleString()}</td>
                        <td>{click.referrer}</td>
                        <td>{click.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;