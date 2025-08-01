import React from 'react';
import ReactDOM from 'react-dom/client';

function ViewFeedback() {
  return (
    <div>
      <h1>View Feedback - Coming Soon</h1>
      <p>Admin dashboard to view all feedback will be implemented here.</p>
      <a href="/giveFeedback.html">Back to Feedback Form</a>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ViewFeedback />
  </React.StrictMode>
);