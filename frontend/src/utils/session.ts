function generateUUID(): string {
  // Check if crypto.randomUUID is available (requires HTTPS)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fall through to alternative methods
    }
  }
  
  // Fallback for HTTP contexts (S3 static hosting)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function generateSessionKey(): string {
  if (typeof window !== 'undefined') {
    let sessionKey = sessionStorage.getItem('feedbackSessionKey');
    if (!sessionKey) {
      sessionKey = generateUUID();
      sessionStorage.setItem('feedbackSessionKey', sessionKey);
    }
    return sessionKey;
  }
  return generateUUID();
}