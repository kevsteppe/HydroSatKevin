import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { FeedbackRequest, FeedbackResponse, FeedbackRecord } from '../types/feedback';
import { analyzeSentiment } from '../services/comprehend';
import {checkIdempotency, reverseStatistics, saveFeedback, updateStatistics} from '../services/dynamodb';


function failResponse(statusCode: number, message : string) {
  return {
    statusCode: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST',
    },
    body: JSON.stringify({error: message}),
  };
}

//This should be refactored to make it easier to read
export const postFeedback = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Parse request body
    if (!event.body) {
      return failResponse(400, 'Request body is required');
    }

    const request: FeedbackRequest = JSON.parse(event.body);

    // Trim request text
    request.text = request.text?.trim() || '';

    // Validate input
    if (!request.text || !request.sessionId) {
      return failResponse(400, 'Text and sessionId are required');
    }

    if (request.text.length > 1000) {
      return failResponse(400, 'Text must be 1000 characters or less');
    }

    // Create idempotency key from session + text
    const idempotencyKey = createHash('sha256')
      .update(`${request.sessionId}:${request.text}`)
      .digest('hex');

    // Check for existing feedback with same idempotency key
    const existingFeedback = await checkIdempotency(idempotencyKey);
    if (existingFeedback) {
      // Return existing feedback instead of creating duplicate
      const response: FeedbackResponse = {
        id: existingFeedback.id,
        text: existingFeedback.text,
        sentiment: existingFeedback.sentiment,
        confidence: existingFeedback.confidence,
        timestamp: existingFeedback.timestamp,
      };

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST',
        },
        body: JSON.stringify(response),
      };
    }

    // Analyze sentiment with AWS Comprehend
    const sentimentResult = await analyzeSentiment(request.text);

    // Create feedback record
    const feedbackRecord: FeedbackRecord = {
      id: uuidv4(),
      idempotencyKey,
      text: request.text,
      sentiment: sentimentResult.sentiment,
      confidence: sentimentResult.confidence,
      timestamp: new Date().toISOString(),
    };

    // Update running statistics (failures are logged within the function)
    // No need to await
    updateStatistics(sentimentResult.sentiment);

    // Save feedback to DynamoDB
    await saveFeedback(feedbackRecord);

    // Prepare response
    const response: FeedbackResponse = {
      id: feedbackRecord.id,
      text: feedbackRecord.text,
      sentiment: feedbackRecord.sentiment,
      confidence: feedbackRecord.confidence,
      timestamp: feedbackRecord.timestamp,
    };

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST',
      },
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error('Error processing feedback:', error);
    //Undo statistics; this is not really atomic.  It will usually work, but not guarenteed.
    //It's mostly to do a little code myself and illustrate the idea.
    // reverseStatistics(sentimentResult.sentiment)

    return failResponse(500, 'Internal server error');
  }
};