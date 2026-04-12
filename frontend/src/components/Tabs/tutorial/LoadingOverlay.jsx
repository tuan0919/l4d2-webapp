import React from 'react';

const LoadingOverlay = ({ active, title, description }) => {
  if (!active) return null;

  return (
    <div className="tut-loading-overlay" role="status" aria-live="polite">
      <div className="tut-loading-card">
        <span className="tut-loading-spinner"></span>
        <div>
          <div className="tut-loading-text">{title}</div>
          <div className="tut-loading-subtext">{description}</div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
