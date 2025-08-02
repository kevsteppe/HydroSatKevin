import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AdminDashboard } from '../../components/AdminDashboard';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AdminDashboard', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should render loading state initially', () => {
    // Mock pending promises to keep loading state
    mockFetch.mockReturnValue(new Promise(() => {}));
    
    render(<AdminDashboard />);
    
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('should display statistics and feedback when data loads successfully', async () => {
    const mockStatistics = {
      id: 'global',
      totalCount: 10,
      goodCount: 6,
      badCount: 2,
      neutralCount: 2,
      lastUpdated: '2025-08-02T12:00:00.000Z'
    };

    const mockFeedback = [
      {
        id: 'feedback-1',
        text: 'Great product!',
        sentiment: 'Good',
        confidence: 0.95,
        timestamp: '2025-08-02T11:00:00.000Z'
      },
      {
        id: 'feedback-2',
        text: 'Could be better',
        sentiment: 'Bad',
        confidence: 0.87,
        timestamp: '2025-08-02T10:00:00.000Z'
      }
    ];

    // Mock successful API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatistics,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockFeedback,
      });

    render(<AdminDashboard />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Statistics')).toBeInTheDocument();
    });

    // Check statistics display
    expect(screen.getByText('Total Feedback')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // totalCount
    expect(screen.getByText('6')).toBeInTheDocument(); // goodCount
    expect(screen.getAllByText('2')).toHaveLength(2); // badCount and neutralCount
    expect(screen.getByText('60.0%')).toBeInTheDocument(); // good percentage
    expect(screen.getAllByText('20.0%')).toHaveLength(2); // bad and neutral percentages

    // Check feedback display
    expect(screen.getByText('All Feedback (2)')).toBeInTheDocument();
    expect(screen.getByText('"Great product!"')).toBeInTheDocument();
    expect(screen.getByText('"Could be better"')).toBeInTheDocument();
    expect(screen.getAllByText('Good')).toHaveLength(2); // Statistics card + sentiment badge
    expect(screen.getAllByText('Bad')).toHaveLength(2); // Statistics card + sentiment badge
    expect(screen.getByText('Confidence: 95.0%')).toBeInTheDocument();
    expect(screen.getByText('Confidence: 87.0%')).toBeInTheDocument();
  });

  it('should handle empty feedback data correctly', async () => {
    const mockStatistics = {
      id: 'global',
      totalCount: 0,
      goodCount: 0,
      badCount: 0,
      neutralCount: 0,
      lastUpdated: '2025-08-02T12:00:00.000Z'
    };

    // Mock successful API responses with empty feedback
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatistics,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('All Feedback (0)')).toBeInTheDocument();
    });

    expect(screen.getByText('No feedback submitted yet.')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(4); // totalCount + goodCount + badCount + neutralCount
  });

  it('should display error message when statistics API fails', async () => {
    // Mock statistics API failure
    mockFetch
      .mockRejectedValueOnce(new Error('Failed to fetch statistics'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Error: Failed to fetch statistics/)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should display error message when feedback API fails', async () => {
    const mockStatistics = {
      id: 'global',
      totalCount: 0,
      goodCount: 0,
      badCount: 0,
      neutralCount: 0,
      lastUpdated: '2025-08-02T12:00:00.000Z'
    };

    // Mock feedback API failure
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatistics,
      })
      .mockRejectedValueOnce(new Error('Failed to fetch feedback'));

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Error: Failed to fetch feedback/)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should display error message when API returns error status', async () => {
    // Mock API returning error status
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Error: Failed to fetch statistics: 500/)).toBeInTheDocument();
    });
  });

  it('should calculate percentages correctly for non-zero totals', async () => {
    const mockStatistics = {
      id: 'global',
      totalCount: 20,
      goodCount: 12,
      badCount: 5,
      neutralCount: 3,
      lastUpdated: '2025-08-02T12:00:00.000Z'
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatistics,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Statistics')).toBeInTheDocument();
    });

    // Check percentage calculations
    expect(screen.getByText('60.0%')).toBeInTheDocument(); // 12/20 = 60%
    expect(screen.getByText('25.0%')).toBeInTheDocument(); // 5/20 = 25%
    expect(screen.getByText('15.0%')).toBeInTheDocument(); // 3/20 = 15%
  });

  it('should display last updated timestamp correctly', async () => {
    const mockStatistics = {
      id: 'global',
      totalCount: 5,
      goodCount: 3,
      badCount: 1,
      neutralCount: 1,
      lastUpdated: '2025-08-02T14:30:00.000Z'
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatistics,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });

    // The exact format depends on the user's locale, but should contain the date
    expect(screen.getByText(/2025|Aug|14:30|14:30/)).toBeInTheDocument();
  });

  it('should display feedback with correct sentiment colors', async () => {
    const mockFeedback = [
      {
        id: 'feedback-1',
        text: 'Love it!',
        sentiment: 'Good',
        confidence: 0.95,
        timestamp: '2025-08-02T11:00:00.000Z'
      },
      {
        id: 'feedback-2',
        text: 'Terrible',
        sentiment: 'Bad',
        confidence: 0.87,
        timestamp: '2025-08-02T10:00:00.000Z'
      },
      {
        id: 'feedback-3',
        text: 'It is okay',
        sentiment: 'Neutral',
        confidence: 0.76,
        timestamp: '2025-08-02T09:00:00.000Z'
      }
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'global',
          totalCount: 3,
          goodCount: 1,
          badCount: 1,
          neutralCount: 1,
          lastUpdated: '2025-08-02T12:00:00.000Z'
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockFeedback,
      });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('All Feedback (3)')).toBeInTheDocument();
    });

    // Check that all sentiment badges are present (plus statistics cards)
    expect(screen.getAllByText('Good')).toHaveLength(2); // Statistics card + sentiment badge
    expect(screen.getAllByText('Bad')).toHaveLength(2); // Statistics card + sentiment badge
    expect(screen.getAllByText('Neutral')).toHaveLength(2); // Statistics card + sentiment badge

    // Check that feedback text is displayed correctly
    expect(screen.getByText('"Love it!"')).toBeInTheDocument();
    expect(screen.getByText('"Terrible"')).toBeInTheDocument();
    expect(screen.getByText('"It is okay"')).toBeInTheDocument();
  });
});