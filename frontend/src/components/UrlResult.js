import React, { useState } from 'react';
import './UrlResult.css';

const UrlResult = ({ shortUrl }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl.shortLink)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  return (
    <div className="url-result">
      <h3>Your Short URL is Ready!</h3>
      <div className="result-container">
        <a href={shortUrl.shortLink} target="_blank" rel="noopener noreferrer">
          {shortUrl.shortLink}
        </a>
        <button onClick={copyToClipboard}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="expiry-info">
        Expires at: {new Date(shortUrl.expiry).toLocaleString()}
      </p>
    </div>
  );
};

export default UrlResult;