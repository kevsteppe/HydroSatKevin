import { ComprehendClient, DetectSentimentCommand } from '@aws-sdk/client-comprehend';

const comprehendClient = new ComprehendClient({ region: process.env.AWS_REGION || 'us-east-1' });

export interface SentimentAnalysisResult {
  sentiment: 'Good' | 'Bad' | 'Neutral';
  confidence: number;
}

export async function analyzeSentiment(text: string): Promise<SentimentAnalysisResult> {
  try {
    const command = new DetectSentimentCommand({
      Text: text,
      LanguageCode: 'en'
    });
    
    const response = await comprehendClient.send(command);
    
    // Map AWS Comprehend sentiments to our simplified format
    let sentiment: 'Good' | 'Bad' | 'Neutral';
    switch (response.Sentiment) {
      case 'POSITIVE':
        sentiment = 'Good';
        break;
      case 'NEGATIVE':
        sentiment = 'Bad';
        break;
      case 'NEUTRAL':
      case 'MIXED':
      default:
        sentiment = 'Neutral';
        break;
    }
    
    // Get confidence score for the detected sentiment
    const scores = response.SentimentScore;
    let confidence = 0;
    
    if (scores) {
      switch (response.Sentiment) {
        case 'POSITIVE':
          confidence = scores.Positive || 0;
          break;
        case 'NEGATIVE':
          confidence = scores.Negative || 0;
          break;
        case 'NEUTRAL':
          confidence = scores.Neutral || 0;
          break;
        case 'MIXED':
          confidence = scores.Mixed || 0;
          break;
      }
    }
    
    return { sentiment, confidence };
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    throw new Error('Failed to analyze sentiment');
  }
}