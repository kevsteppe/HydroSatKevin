import { getViewFeedback, getViewFilteredFeedback } from '../../handlers/viewFeedback';
import { APIGatewayProxyEvent } from 'aws-lambda';
import * as dynamoService from '../../services/dynamodb';

// Mock the services
jest.mock('../../services/dynamodb');

const mockDynamoService = dynamoService as jest.Mocked<typeof dynamoService>;

describe('viewFeedback handlers', () => {
  // Mock feedback data for reuse across tests
  const mockGoodFeedback = [
    {
      id: 'feedback-1',
      idempotencyKey: 'key-1',
      text: 'Great product!',
      sentiment: 'Good' as const,
      confidence: 0.95,
      sessionId: 'session-1',
      timestamp: '2025-08-02T12:00:00.000Z'
    },
    {
      id: 'feedback-3',
      idempotencyKey: 'key-3',
      text: 'Love it!',
      sentiment: 'Good' as const,
      confidence: 0.92,
      sessionId: 'session-3',
      timestamp: '2025-08-02T10:00:00.000Z'
    }
  ];

  const mockBadFeedback = [
    {
      id: 'feedback-2',
      idempotencyKey: 'key-2',
      text: 'Not good',
      sentiment: 'Bad' as const,
      confidence: 0.87,
      sessionId: 'session-2',
      timestamp: '2025-08-02T11:00:00.000Z'
    }
  ];

  const mockAllFeedback = [...mockGoodFeedback, ...mockBadFeedback];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createMockEvent = (queryStringParameters: { [key: string]: string } | null = null): APIGatewayProxyEvent => ({
    body: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '/viewFeedback',
    pathParameters: null,
    queryStringParameters,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: 'test-account',
      apiId: 'test-api',
      httpMethod: 'GET',
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: '127.0.0.1',
        user: null,
        userAgent: 'test-agent',
        userArn: null,
      },
      path: '/viewFeedback',
      stage: 'test',
      requestId: 'test-request-id',
      requestTime: '01/Jan/2025:00:00:00 +0000',
      requestTimeEpoch: 1609459200,
      resourceId: 'test-resource',
      resourcePath: '/viewFeedback',
      protocol: 'HTTP/1.1',
      authorizer: null,
    },
    resource: '/viewFeedback',
  });

  describe('getViewFeedback', () => {
    it('should return all feedback successfully', async () => {
      mockDynamoService.getAllFeedback.mockResolvedValueOnce(mockAllFeedback);

      const mockEvent = createMockEvent();
      const result = await getViewFeedback(mockEvent);

      expect(result.statusCode).toBe(200);
      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST',
      });

      const responseBody = JSON.parse(result.body);
      expect(responseBody).toHaveLength(3);
      expect(responseBody[0]).toEqual({
        id: 'feedback-1',
        text: 'Great product!',
        sentiment: 'Good',
        confidence: 0.95,
        timestamp: '2025-08-02T12:00:00.000Z'
      });
      // Should exclude sessionId and idempotencyKey
      expect(responseBody[0]).not.toHaveProperty('sessionId');
      expect(responseBody[0]).not.toHaveProperty('idempotencyKey');
    });
  });

  describe('getViewFilteredFeedback', () => {
    it('should filter for Good sentiment successfully', async () => {
      mockDynamoService.getFilteredFeedback.mockResolvedValueOnce(mockGoodFeedback);

      const mockEvent = createMockEvent({ sentiment: 'Good' });
      const result = await getViewFilteredFeedback(mockEvent);

      expect(result.statusCode).toBe(200);
      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST',
      });

      const responseBody = JSON.parse(result.body);
      expect(responseBody).toHaveLength(2);
      expect(responseBody[0]).toEqual({
        id: 'feedback-1',
        text: 'Great product!',
        sentiment: 'Good',
        confidence: 0.95,
        timestamp: '2025-08-02T12:00:00.000Z'
      });
      expect(responseBody[1]).toEqual({
        id: 'feedback-3',
        text: 'Love it!',
        sentiment: 'Good',
        confidence: 0.92,
        timestamp: '2025-08-02T10:00:00.000Z'
      });

      expect(mockDynamoService.getFilteredFeedback).toHaveBeenCalledWith('Good');
      expect(mockDynamoService.getFilteredFeedback).toHaveBeenCalledTimes(1);
    });

    it('should filter for Bad sentiment with 0 records returned', async () => {
      // Mock service to return empty array for Bad sentiment
      mockDynamoService.getFilteredFeedback.mockResolvedValueOnce([]);

      const mockEvent = createMockEvent({ sentiment: 'Bad' });
      const result = await getViewFilteredFeedback(mockEvent);

      expect(result.statusCode).toBe(200);
      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST',
      });

      const responseBody = JSON.parse(result.body);
      expect(responseBody).toEqual([]);
      expect(responseBody).toHaveLength(0);

      expect(mockDynamoService.getFilteredFeedback).toHaveBeenCalledWith('Bad');
      expect(mockDynamoService.getFilteredFeedback).toHaveBeenCalledTimes(1);
    });

    it('should return 400 when query parameter is invalid (Purple)', async () => {
      const mockEvent = createMockEvent({ sentiment: 'Purple' });
      const result = await getViewFilteredFeedback(mockEvent);

      expect(result.statusCode).toBe(400);
      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST',
      });

      const responseBody = JSON.parse(result.body);
      expect(responseBody).toEqual({
        error: 'sentiment must be one of {Good, Bad, Neutral}'
      });

      // Should not call the service function when validation fails
      expect(mockDynamoService.getFilteredFeedback).not.toHaveBeenCalled();
    });

    it('should return 400 when sentiment query parameter is missing', async () => {
      const mockEvent = createMockEvent(null);
      const result = await getViewFilteredFeedback(mockEvent);

      expect(result.statusCode).toBe(400);
      const responseBody = JSON.parse(result.body);
      expect(responseBody).toEqual({
        error: 'sentiment query param is required'
      });

      expect(mockDynamoService.getFilteredFeedback).not.toHaveBeenCalled();
    });

    it('should return 400 when queryStringParameters exists but sentiment is missing', async () => {
      const mockEvent = createMockEvent({ otherParam: 'value' });
      const result = await getViewFilteredFeedback(mockEvent);

      expect(result.statusCode).toBe(400);
      const responseBody = JSON.parse(result.body);
      expect(responseBody).toEqual({
        error: 'sentiment query param is required'
      });

      expect(mockDynamoService.getFilteredFeedback).not.toHaveBeenCalled();
    });

    it('should return 500 when DynamoDB service throws error', async () => {
      mockDynamoService.getFilteredFeedback.mockRejectedValueOnce(new Error('DynamoDB error'));

      const mockEvent = createMockEvent({ sentiment: 'Good' });
      const result = await getViewFilteredFeedback(mockEvent);

      expect(result.statusCode).toBe(500);
      const responseBody = JSON.parse(result.body);
      expect(responseBody).toEqual({
        error: 'Internal server error'
      });

      expect(console.error).toHaveBeenCalledWith('Error retrieving filtered feedback:', expect.any(Error));
    });
  });
});