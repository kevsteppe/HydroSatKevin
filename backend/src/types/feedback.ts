export interface FeedbackRequest {
  text: string;
  sessionId: string;
}

export interface FeedbackResponse {
  id: string;
  text: string;
  sentiment: 'Good' | 'Bad' | 'Neutral';
  confidence: number;
  timestamp: string;
}

export interface FeedbackRecord {
  id: string;
  idempotencyKey: string;
  text: string;
  sentiment: 'Good' | 'Bad' | 'Neutral';
  confidence: number;
  timestamp: string;
}

export interface Statistics {
  id: string;
  totalCount: number;
  goodCount: number;
  badCount: number;
  neutralCount: number;
  lastUpdated: string;
}

export interface ViewFeedbackResponse {
  id: string;
  text: string;
  sentiment: 'Good' | 'Bad' | 'Neutral';
  confidence: number;
  timestamp: string;
}

export interface ViewFilteredFeedbackRequest {
  sentiment: 'Good' | 'Bad' | 'Neutral';
}