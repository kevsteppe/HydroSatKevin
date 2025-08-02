import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeedbackForm } from '../../components/FeedbackForm';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock the session utility
jest.mock('../../utils/session', () => ({
  generateSessionKey: () => 'test-session-key'
}));

describe('FeedbackForm', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should render the feedback form correctly', () => {
    render(<FeedbackForm />);
    
    expect(screen.getByLabelText(/share your feedback/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/tell us what you think/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit feedback/i })).toBeInTheDocument();
  });

  it('should show error when API connection fails', async () => {
    const mockOnError = jest.fn();
    
    // Mock fetch to simulate network failure
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    render(<FeedbackForm onError={mockOnError} />);
    
    const textarea = screen.getByLabelText(/share your feedback/i);
    const submitButton = screen.getByRole('button', { name: /submit feedback/i });
    
    // Fill in the form
    fireEvent.change(textarea, { target: { value: 'Test feedback' } });
    fireEvent.click(submitButton);
    
    // Wait for the error to be called - the actual error message is passed through
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Network error');
    });
  });

  it('should show error when connecting to wrong API URL (production scenario)', async () => {
    const mockOnError = jest.fn();
    
    // Mock fetch to simulate connection refused error (like trying to connect to localhost from production)
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    
    render(<FeedbackForm onError={mockOnError} />);
    
    const textarea = screen.getByLabelText(/share your feedback/i);
    const submitButton = screen.getByRole('button', { name: /submit feedback/i });
    
    // Fill in the form
    fireEvent.change(textarea, { target: { value: 'Test feedback' } });
    fireEvent.click(submitButton);
    
    // Wait for the error to be called - should get TypeError message
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Failed to fetch');
    });
  });

  it('should show error when API returns error status', async () => {
    const mockOnError = jest.fn();
    
    // Mock fetch to simulate HTTP error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });
    
    render(<FeedbackForm onError={mockOnError} />);
    
    const textarea = screen.getByLabelText(/share your feedback/i);
    const submitButton = screen.getByRole('button', { name: /submit feedback/i });
    
    // Fill in the form
    fireEvent.change(textarea, { target: { value: 'Test feedback' } });
    fireEvent.click(submitButton);
    
    // Wait for the error to be called
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Failed to submit feedback: 500');
    });
  });

  it('should call onSuccess when API request succeeds', async () => {
    const mockOnSuccess = jest.fn();
    
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'test-id',
        text: 'Test feedback',
        sentiment: 'Good',
        confidence: 0.95,
        timestamp: '2025-08-02T12:00:00.000Z'
      }),
    });
    
    render(<FeedbackForm onSuccess={mockOnSuccess} />);
    
    const textarea = screen.getByLabelText(/share your feedback/i);
    const submitButton = screen.getByRole('button', { name: /submit feedback/i });
    
    // Fill in the form
    fireEvent.change(textarea, { target: { value: 'Test feedback' } });
    fireEvent.click(submitButton);
    
    // Wait for success to be called
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
    
    // Should show success message
    expect(screen.getByText(/thank you for your feedback/i)).toBeInTheDocument();
  });

  it('should validate feedback length', async () => {
    const mockOnError = jest.fn();
    
    render(<FeedbackForm onError={mockOnError} />);
    
    const textarea = screen.getByLabelText(/share your feedback/i);
    const submitButton = screen.getByRole('button', { name: /submit feedback/i });
    
    // Submit button should be disabled when there's no text
    expect(submitButton).toBeDisabled();
    
    // Test with text that's too long (over 1000 characters)
    const longText = 'a'.repeat(1001);
    fireEvent.change(textarea, { target: { value: longText } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Please enter valid feedback (1-1000 characters)');
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });
});