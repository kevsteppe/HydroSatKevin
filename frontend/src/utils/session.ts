export function generateSessionKey(): string {
  if (typeof window !== 'undefined') {
    let sessionKey = sessionStorage.getItem('feedbackSessionKey');
    if (!sessionKey) {
      sessionKey = crypto.randomUUID();
      sessionStorage.setItem('feedbackSessionKey', sessionKey);
    }
    return sessionKey;
  }
  return crypto.randomUUID();
}