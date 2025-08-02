import { postFeedback } from '../../handlers/feedback';
import { APIGatewayProxyEvent } from 'aws-lambda';
import * as dynamoService from '../../services/dynamodb';
import * as comprehendService from '../../services/comprehend';
import {SuccessFailure} from "../../services/dynamodb";

// Mock the services
jest.mock('../../services/dynamodb');
jest.mock('../../services/comprehend');

const mockDynamoService = dynamoService as jest.Mocked<typeof dynamoService>;
const mockComprehendService = comprehendService as jest.Mocked<typeof comprehendService>;

describe('postFeedback handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    // need to wait for the stats to finish
    // Wait for any pending async operations to complete
    await new Promise(resolve => setImmediate(resolve));

    // Give a small additional wait for any DynamoDB operations
    await new Promise(resolve => setTimeout(resolve, 10));

      jest.restoreAllMocks();
  });

  const createMockEvent = (body: string): APIGatewayProxyEvent => ({
    body,
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/feedback',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
  });

  it('should return 500 when DynamoDB idempotency check fails', async () => {
    const mockEvent = createMockEvent(JSON.stringify({
      text: 'Test feedback',
      sessionId: 'test-session'
    }));

    // Mock idempotency check failure
    mockDynamoService.checkIdempotency.mockRejectedValueOnce(new Error('Failed to check idempotency'));

    const result = await postFeedback(mockEvent);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({ error: 'Internal server error' });
  });

  it('should return 500 when DynamoDB save fails', async () => {
    const mockEvent = createMockEvent(JSON.stringify({
      text: 'Test feedback',
      sessionId: 'test-session'
    }));

    // Mock successful idempotency check and sentiment analysis
    mockDynamoService.checkIdempotency.mockResolvedValueOnce(null);
    mockComprehendService.analyzeSentiment.mockResolvedValueOnce({
      sentiment: 'Good',
      confidence: 0.95
    });

    // Mock save failure
    mockDynamoService.saveFeedback.mockRejectedValueOnce(new Error('Failed to save feedback'));

    const result = await postFeedback(mockEvent);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({ error: 'Internal server error' });
  });

  it('should return 201 when statistics update fails but feedback succeeds', async () => {
    const mockEvent = createMockEvent(JSON.stringify({
      text: 'Test feedback',
      sessionId: 'test-session'
    }));

    // Mock successful idempotency check, sentiment analysis, and save
    mockDynamoService.checkIdempotency.mockResolvedValueOnce(null);
    mockComprehendService.analyzeSentiment.mockResolvedValueOnce({
      sentiment: 'Good',
      confidence: 0.95
    });
    mockDynamoService.saveFeedback.mockResolvedValueOnce(SuccessFailure.Success);

    // Mock statistics update failure (should only log warning, not fail request)
    mockDynamoService.updateStatistics.mockResolvedValueOnce(SuccessFailure.Failure);

    const result = await postFeedback(mockEvent);

    expect(result.statusCode).toBe(201);
    const responseBody = JSON.parse(result.body);
    expect(responseBody).toEqual({
      id: expect.any(String),
      text: 'Test feedback',
      sentiment: 'Good',
      confidence: 0.95,
      timestamp: expect.any(String)
    });
  });

  it('should return existing feedback when idempotent request detected', async () => {
    const existingFeedback = {
      id: 'existing-id',
      idempotencyKey: 'test-key',
      text: 'Existing feedback',
      sentiment: 'Bad' as const,
      confidence: 0.85,
      timestamp: '2025-08-02T11:00:00.000Z'
    };

    const mockEvent = createMockEvent(JSON.stringify({
      text: 'Test feedback',
      sessionId: 'test-session'
    }));

    // Mock idempotency check returning existing record
    mockDynamoService.checkIdempotency.mockResolvedValueOnce(existingFeedback);

    const result = await postFeedback(mockEvent);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({
      id: existingFeedback.id,
      text: existingFeedback.text,
      sentiment: existingFeedback.sentiment,
      confidence: existingFeedback.confidence,
      timestamp: existingFeedback.timestamp
    });
  });

  it('should return 201 when feedback is successfully processed', async () => {
    const mockEvent = createMockEvent(JSON.stringify({
      text: 'Test feedback',
      sessionId: 'test-session'
    }));

    // Mock all successful operations
    mockDynamoService.checkIdempotency.mockResolvedValueOnce(null);
    mockComprehendService.analyzeSentiment.mockResolvedValueOnce({
      sentiment: 'Good',
      confidence: 0.95
    });
    mockDynamoService.saveFeedback.mockResolvedValueOnce(SuccessFailure.Success);
    mockDynamoService.updateStatistics.mockResolvedValueOnce(SuccessFailure.Success);

    const result = await postFeedback(mockEvent);

    expect(result.statusCode).toBe(201);
    const responseBody = JSON.parse(result.body);
    expect(responseBody).toEqual({
      id: expect.any(String),
      text: 'Test feedback',
      sentiment: 'Good',
      confidence: 0.95,
      timestamp: expect.any(String)
    });

    // Verify all services were called
    expect(mockDynamoService.checkIdempotency).toHaveBeenCalledWith(expect.any(String));
    expect(mockComprehendService.analyzeSentiment).toHaveBeenCalledWith('Test feedback');
    expect(mockDynamoService.saveFeedback).toHaveBeenCalledWith(expect.any(Object));
    expect(mockDynamoService.updateStatistics).toHaveBeenCalledWith('Good');
  });

  it('should return 500 for invalid JSON body', async () => {
    const mockEvent = createMockEvent('invalid json');

    const result = await postFeedback(mockEvent);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({ error: 'Internal server error' });
  });

  it('should return 400 for missing required fields', async () => {
    const mockEvent = createMockEvent(JSON.stringify({
      text: 'Test feedback'
      // missing sessionId
    }));

    const result = await postFeedback(mockEvent);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({ error: 'Text and sessionId are required' });
  });

  it('should return 400 for feedback that is too long', async () => {
    const longText = 'a'.repeat(1001); // 1001 characters
    const mockEvent = createMockEvent(JSON.stringify({
      text: longText,
      sessionId: 'test-session'
    }));

    const result = await postFeedback(mockEvent);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({ error: 'Text must be 1000 characters or less' });
  });
});