import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface Statistics {
  id: string;
  totalCount: number;
  goodCount: number;
  badCount: number;
  neutralCount: number;
  lastUpdated: string;
}

interface FeedbackRecord {
  id: string;
  text: string;
  sentiment: 'Good' | 'Bad' | 'Neutral';
  confidence: number;
  timestamp: string;
}

export const AdminDashboard: React.FC = () => {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch statistics and feedback in parallel
        const [statsResponse, feedbackResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/statistics`),
          fetch(`${API_BASE_URL}/viewFeedback`)
        ]);

        if (!statsResponse.ok) {
          throw new Error(`Failed to fetch statistics: ${statsResponse.status}`);
        }

        if (!feedbackResponse.ok) {
          throw new Error(`Failed to fetch feedback: ${feedbackResponse.status}`);
        }

        const statsData = await statsResponse.json();
        const feedbackData = await feedbackResponse.json();

        setStatistics(statsData);
        setFeedback(feedbackData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Error fetching admin data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Good': return '#22c55e'; // green
      case 'Bad': return '#ef4444';  // red
      case 'Neutral': return '#6b7280'; // gray
      default: return '#6b7280';
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  const formatConfidence = (confidence: number) => {
    return `${(confidence * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Admin Dashboard</h1>
        <p>Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Admin Dashboard</h1>
        <p style={{ color: '#ef4444' }}>Error: {error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Admin Dashboard</h1>
      
      {/* Statistics Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px' }}>Statistics</h2>
        {statistics && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div style={{
              padding: '20px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              textAlign: 'center',
              backgroundColor: '#f9fafb'
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Total Feedback</h3>
              <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
                {statistics.totalCount}
              </p>
            </div>
            
            <div style={{
              padding: '20px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              textAlign: 'center',
              backgroundColor: '#f0fdf4'
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Good</h3>
              <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#22c55e' }}>
                {statistics.goodCount}
              </p>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                {statistics.totalCount > 0 ? ((statistics.goodCount / statistics.totalCount) * 100).toFixed(1) : 0}%
              </p>
            </div>
            
            <div style={{
              padding: '20px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              textAlign: 'center',
              backgroundColor: '#fef2f2'
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Bad</h3>
              <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>
                {statistics.badCount}
              </p>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                {statistics.totalCount > 0 ? ((statistics.badCount / statistics.totalCount) * 100).toFixed(1) : 0}%
              </p>
            </div>
            
            <div style={{
              padding: '20px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              textAlign: 'center',
              backgroundColor: '#f9fafb'
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Neutral</h3>
              <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#6b7280' }}>
                {statistics.neutralCount}
              </p>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                {statistics.totalCount > 0 ? ((statistics.neutralCount / statistics.totalCount) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        )}
        
        {statistics && (
          <p style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
            Last updated: {formatDate(statistics.lastUpdated)}
          </p>
        )}
      </section>

      {/* Feedback Section */}
      <section>
        <h2 style={{ marginBottom: '20px' }}>All Feedback ({feedback.length})</h2>
        
        {feedback.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: '#f9fafb'
          }}>
            <p style={{ color: '#6b7280', margin: '0' }}>No feedback submitted yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {feedback.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '20px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: 'white',
                        backgroundColor: getSentimentColor(item.sentiment)
                      }}
                    >
                      {item.sentiment}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      Confidence: {formatConfidence(item.confidence)}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    {formatDate(item.timestamp)}
                  </span>
                </div>
                
                <p style={{ 
                  margin: '0', 
                  lineHeight: '1.5',
                  fontSize: '16px',
                  color: '#1f2937'
                }}>
                  "{item.text}"
                </p>
                
                <div style={{ 
                  marginTop: '10px', 
                  fontSize: '12px', 
                  color: '#9ca3af',
                  fontFamily: 'monospace'
                }}>
                  ID: {item.id}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};