import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ViewFeedbackResponse } from '../types/feedback';
import { getAllFeedback } from '../services/dynamodb';

export const getViewFeedback = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Get all feedback from DynamoDB
    const feedbackRecords = await getAllFeedback();

    // Transform to response format (exclude sensitive fields like sessionId and idempotencyKey)
    const response: ViewFeedbackResponse[] = feedbackRecords.map(record => ({
      id: record.id,
      text: record.text,
      sentiment: record.sentiment,
      confidence: record.confidence,
      timestamp: record.timestamp,
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET',
      },
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error('Error retrieving feedback:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};