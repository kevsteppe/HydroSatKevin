import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FeedbackForm } from './components/FeedbackForm';
import './styles/giveFeedback.css';

const GiveFeedbackApp: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSuccess = () => {
    setSuccess(true);
    setError(null);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setSuccess(false);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Hydro Satellites Customer Feedback</h1>
        <p>Help us improve Hydro Satellites with your valuable feedback</p>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {success && (
          <div className="success-message">
            <p>Feedback submitted successfully!</p>
          </div>
        )}

        <FeedbackForm 
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </main>

      <footer className="app-footer">
        <p>
          <a href="viewFeedback.html">View All Feedback (Admin)</a>
        </p>
      </footer>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<GiveFeedbackApp />);
}