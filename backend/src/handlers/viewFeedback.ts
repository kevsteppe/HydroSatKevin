import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ViewFeedbackResponse } from '../types/feedback';
import { getAllFeedback } from '../services/dynamodb';
import {createResponse} from "./feedback";

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

    return createResponse(200, response);
  } catch (error) {
    console.error('Error retrieving feedback:', error);
    return createResponse(500, {error: 'Internal server error'});
  }
};