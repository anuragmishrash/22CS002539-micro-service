import React, { useState } from 'react';
import './UrlStats.css';

const UrlStats = ({ onStatsReceived, onError }) => {
  const [shortcode, setShortcode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!shortcode) {
        throw new Error('Shortcode is required');
      }

      const response = await fetch(`http://localhost:3000/shorturls/${shortcode}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to retrieve URL statistics');
      }

      onStatsReceived(data);
    } catch (error) {
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="url-stats-container">
      <h2>View URL Statistics</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="shortcode">Enter Shortcode</label>
          <input
            type="text"
            id="shortcode"
            value={shortcode}
            onChange={(e) => setShortcode(e.target.value)}
            placeholder="e.g., abcd1"
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Get Statistics'}
        </button>
      </form>
    </div>
  );
};

export default UrlStats;