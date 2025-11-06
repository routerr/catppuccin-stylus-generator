import React from 'react';

const UrlInput = ({ url, setUrl }) => {
  return (
    <div className="input-section">
      <h2>Enter URL</h2>
      <input
        type="text"
        placeholder="https://example.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
    </div>
  );
};

export default UrlInput;
