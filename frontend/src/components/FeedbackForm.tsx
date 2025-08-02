import React, { useState } from 'react';
import { generateSessionKey } from '../utils/session';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Warn if using localhost in production
if (API_BASE_URL === 'http://localhost:3000' && (import.meta.env.PROD || import.meta.env.MODE === 'production')) {
  console.warn('WARNING: Using localhost API URL in production. Check VITE_API_BASE_URL configuration.');
}

interface FeedbackFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSuccess, onError }) => {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim() || feedback.length > 1000) {
      onError?.('Please enter valid feedback (1-1000 characters)');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const sessionKey = generateSessionKey();
      
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: feedback.trim(),
          sessionId: sessionKey
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit feedback: ${response.status}`);
      }

      setSubmitted(true);
      setFeedback('');
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="feedback-success">
        <h2>Thank you for your feedback!</h2>
        <p>Your feedback has been submitted successfully.</p>
        <button 
          onClick={() => setSubmitted(false)}
          className="submit-another-btn"
        >
          Submit Another Feedback
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="feedback-form">
      <div className="form-group">
        <label htmlFor="feedback">Share your feedback about Hydro Satellites:</label>
        <textarea
          id="feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Tell us what you think about Hydro Satellites..."
          maxLength={1000}
          rows={6}
          disabled={isSubmitting}
          required
        />
        <div className="character-count">
          {feedback.length}/1000 characters
        </div>
      </div>
      
      <button 
        type="submit" 
        disabled={isSubmitting || !feedback.trim()}
        className="submit-btn"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </form>
  );
};