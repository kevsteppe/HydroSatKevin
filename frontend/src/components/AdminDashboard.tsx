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
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Good' | 'Bad' | 'Neutral'>('All');

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoadingStats(true);
        const statsResponse = await fetch(`${API_BASE_URL}/statistics`);
        if (!statsResponse.ok) {
          throw new Error(`Failed to fetch statistics: ${statsResponse.status}`);
        }
        const statsData = await statsResponse.json();
        setStatistics(statsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
        console.error('Error fetching statistics:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStatistics();
  }, []);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoadingFeedback(true);

        let feedbackResponse;
        if (selectedFilter === 'All') {
          feedbackResponse = await fetch(`${API_BASE_URL}/viewFeedback`);
        } else {
          feedbackResponse = await fetch(`${API_BASE_URL}/viewFilteredFeedback?sentiment=${selectedFilter}`);
        }

        if (!feedbackResponse.ok) {
          throw new Error(`Failed to fetch feedback: ${feedbackResponse.status}`);
        }

        const feedbackData = await feedbackResponse.json();
        setFeedback(feedbackData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load feedback');
        console.error('Error fetching feedback:', err);
      } finally {
        setLoadingFeedback(false);
      }
    };

    fetchFeedback();
  }, [selectedFilter]);

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

  const handleFilterChange = (filter: 'All' | 'Good' | 'Bad' | 'Neutral') => {
    setSelectedFilter(filter);
  };

  const getCardStyle = (cardType: 'Total' | 'Good' | 'Bad' | 'Neutral', isSelected: boolean) => {
    let backgroundColor = '#f9fafb';
    
    if (cardType === 'Good') backgroundColor = '#f0fdf4';
    else if (cardType === 'Bad') backgroundColor = '#fef2f2';
    
    return {
      padding: '20px',
      border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
      borderRadius: '8px',
      textAlign: 'center' as const,
      backgroundColor,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
      transform: isSelected ? 'translateY(-2px)' : 'none'
    };
  };

  if (loadingStats) {
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
            <div 
              style={getCardStyle('Total', selectedFilter === 'All')}
              onClick={() => handleFilterChange('All')}
            >
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Total Feedback</h3>
              <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
                {statistics.totalCount}
              </p>
            </div>
            
            <div 
              style={getCardStyle('Good', selectedFilter === 'Good')}
              onClick={() => handleFilterChange('Good')}
            >
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Good</h3>
              <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#22c55e' }}>
                {statistics.goodCount}
              </p>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                {statistics.totalCount > 0 ? ((statistics.goodCount / statistics.totalCount) * 100).toFixed(1) : 0}%
              </p>
            </div>
            
            <div 
              style={getCardStyle('Bad', selectedFilter === 'Bad')}
              onClick={() => handleFilterChange('Bad')}
            >
              <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Bad</h3>
              <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>
                {statistics.badCount}
              </p>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                {statistics.totalCount > 0 ? ((statistics.badCount / statistics.totalCount) * 100).toFixed(1) : 0}%
              </p>
            </div>
            
            <div 
              style={getCardStyle('Neutral', selectedFilter === 'Neutral')}
              onClick={() => handleFilterChange('Neutral')}
            >
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
        <h2 style={{ marginBottom: '20px' }}>
          {selectedFilter === 'All' ? 'All Feedback' : `${selectedFilter} Feedback`} ({feedback.length})
        </h2>
        
        {loadingFeedback ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: '#f9fafb'
          }}>
            <p style={{ color: '#6b7280', margin: '0' }}>Loading feedback...</p>
          </div>
        ) : feedback.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: '#f9fafb'
          }}>
            <p style={{ color: '#6b7280', margin: '0' }}>
              {selectedFilter === 'All' 
                ? 'No feedback submitted yet.' 
                : `No ${selectedFilter.toLowerCase()} feedback found.`}
            </p>
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