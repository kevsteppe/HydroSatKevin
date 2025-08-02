import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {ViewFeedbackResponse} from '../types/feedback';
import {getAllFeedback, getFilteredFeedback} from '../services/dynamodb';
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

export const getViewFilteredFeedback = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {

    if (!event.queryStringParameters || !event.queryStringParameters.sentiment) {
      return createResponse(400, {error: 'sentiment query param is required'})
    }

    const sentiment = event.queryStringParameters.sentiment;

    if (sentiment != 'Good' && sentiment != 'Bad' && sentiment != 'Neutral') {
      return createResponse(400, {error: 'sentiment must be one of {Good, Bad, Neutral}'});
    }

    // Get  feedback of selected sentiment from DynamoDB
    const feedbackRecords = await getFilteredFeedback(sentiment);

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
    console.error('Error retrieving filtered feedback:', error);
    return createResponse(500, {error: 'Internal server error'});
  }
}
