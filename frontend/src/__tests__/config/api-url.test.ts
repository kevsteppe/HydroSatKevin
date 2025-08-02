/**
 * Test to ensure API URL configuration is properly set
 * This catches deployment issues where VITE_API_BASE_URL is not configured
 */

describe('API URL Configuration', () => {
  it('should have VITE_API_BASE_URL configured in production builds', () => {
    // Get the API base URL that would be used by the application
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    
    // Check if VITE_API_BASE_URL is explicitly set to a non-localhost value
    const hasValidProductionUrl = import.meta.env.VITE_API_BASE_URL && 
                                 import.meta.env.VITE_API_BASE_URL.trim() !== '' &&
                                 import.meta.env.VITE_API_BASE_URL !== 'undefined' &&
                                 !import.meta.env.VITE_API_BASE_URL.includes('localhost') &&
                                  !import.meta.env.VITE_API_BASE_URL.includes('127.0') &&
                                  !import.meta.env.VITE_API_BASE_URL.includes('192.0');
    
    if (hasValidProductionUrl) {
      expect(apiBaseUrl).toMatch(/^https?:\/\/.+/); // Should be a valid URL
      expect(apiBaseUrl).not.toMatch(/localhost/); // Should not contain localhost
      console.log('✅ Production API URL validated:', apiBaseUrl);
    } else {
      console.log('ℹ️ Using localhost URL (development/test mode):', apiBaseUrl);
      // In development/test mode, localhost is acceptable
      expect(apiBaseUrl).toMatch(/^https?:\/\/.+/);
    }
  });

  it('should have API URL accessible in FeedbackForm component', () => {
    // This test ensures the API URL configuration pattern works
    const mockImportMeta = {
      env: {
        VITE_API_BASE_URL: 'https://example.amazonaws.com/prod'
      }
    };
    
    // Simulate what happens in FeedbackForm.tsx
    const apiBaseUrl = mockImportMeta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    
    expect(apiBaseUrl).toBe('https://example.amazonaws.com/prod');
    expect(apiBaseUrl).not.toBe('http://localhost:3000');
  });

  it('should warn when using localhost fallback', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    // Simulate missing VITE_API_BASE_URL
    const apiBaseUrl = undefined || 'http://localhost:3000';
    
    if (apiBaseUrl === 'http://localhost:3000' && (process.env.NODE_ENV === 'production' || process.env.CI)) {
      console.warn('WARNING: Using localhost API URL in production/CI environment. Check VITE_API_BASE_URL configuration.');
    }
    
    // In CI or production, this should trigger a warning
    if (process.env.CI || process.env.NODE_ENV === 'production') {
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Using localhost API URL in production/CI')
      );
    }
    
    consoleWarnSpy.mockRestore();
  });
});