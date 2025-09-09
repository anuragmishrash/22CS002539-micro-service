import React, { useState } from 'react';
import './UrlForm.css';

const UrlForm = ({ onUrlCreated, onError }) => {
  const [url, setUrl] = useState('');
  const [validity, setValidity] = useState(30);
  const [shortcode, setShortcode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate URL
      if (!url) {
        throw new Error('URL is required');
      }

      // Create request body
      const requestBody = {
        url: url,
        validity: validity || 30
      };

      // Add shortcode if provided
      if (shortcode) {
        requestBody.shortcode = shortcode;
      }

      // Send request to API
      const response = await fetch('/shorturls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create short URL');
      }

      onUrlCreated(data);
    } catch (error) {
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="url-form-container">
      <h2>Create Short URL</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="url">URL to Shorten *</label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/long-url"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="validity">Validity (minutes)</label>
          <input
            type="number"
            id="validity"
            value={validity}
            onChange={(e) => setValidity(parseInt(e.target.value) || 30)}
            min="1"
            placeholder="30"
          />
          <small>Default: 30 minutes</small>
        </div>

        <div className="form-group">
          <label htmlFor="shortcode">Custom Shortcode (optional)</label>
          <input
            type="text"
            id="shortcode"
            value={shortcode}
            onChange={(e) => setShortcode(e.target.value)}
            placeholder="e.g., mylink"
          />
          <small>Leave empty for auto-generated code</small>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Short URL'}
        </button>
      </form>
    </div>
  );
};

export default UrlForm;