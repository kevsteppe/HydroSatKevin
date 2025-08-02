import { getViewStatistics } from '../../handlers/statistics';
import { APIGatewayProxyEvent } from 'aws-lambda';
import * as dynamoService from '../../services/dynamodb';

// Mock the services
jest.mock('../../services/dynamodb');

const mockDynamoService = dynamoService as jest.Mocked<typeof dynamoService>;

describe('getViewStatistics handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createMockEvent = (): APIGatewayProxyEvent => ({
    body: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '/statistics',
    pathParameters: null,
    queryStringParameters: null,
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
      path: '/statistics',
      stage: 'test',
      requestId: 'test-request-id',
      requestTime: '01/Jan/2025:00:00:00 +0000',
      requestTimeEpoch: 1609459200,
      resourceId: 'test-resource',
      resourcePath: '/statistics',
      protocol: 'HTTP/1.1',
      authorizer: null,
    },
    resource: '/statistics',
  });

  describe('successful responses', () => {
    it('should return 200 when no statistics records exist (default statistics)', async () => {
      const mockEvent = createMockEvent();
      
      // Mock getStatistics to return default statistics
      const defaultStats = {
        id: 'global',
        totalCount: 0,
        goodCount: 0,
        badCount: 0,
        neutralCount: 0,
        lastUpdated: '2025-08-02T12:00:00.000Z'
      };
      
      mockDynamoService.getStatistics.mockResolvedValueOnce(defaultStats);

      const result = await getViewStatistics(mockEvent);

      expect(result.statusCode).toBe(200);
      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST',
      });
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody).toEqual(defaultStats);
      expect(mockDynamoService.getStatistics).toHaveBeenCalledTimes(1);
    });

    it('should return 200 when statistics record exists with data', async () => {
      const mockEvent = createMockEvent();
      
      // Mock getStatistics to return existing statistics with feedback data
      const existingStats = {
        id: 'global',
        totalCount: 15,
        goodCount: 8,
        badCount: 4,
        neutralCount: 3,
        lastUpdated: '2025-08-02T14:30:00.000Z'
      };
      
      mockDynamoService.getStatistics.mockResolvedValueOnce(existingStats);

      const result = await getViewStatistics(mockEvent);

      expect(result.statusCode).toBe(200);
      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST',
      });
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody).toEqual(existingStats);
      expect(responseBody.totalCount).toBe(15);
      expect(responseBody.goodCount + responseBody.badCount + responseBody.neutralCount).toBe(15);
      expect(mockDynamoService.getStatistics).toHaveBeenCalledTimes(1);
    });

    it('should return 200 with single feedback entry statistics', async () => {
      const mockEvent = createMockEvent();
      
      // Mock getStatistics to return statistics for exactly one feedback entry
      const singleFeedbackStats = {
        id: 'global',
        totalCount: 1,
        goodCount: 1,
        badCount: 0,
        neutralCount: 0,
        lastUpdated: '2025-08-02T15:00:00.000Z'
      };
      
      mockDynamoService.getStatistics.mockResolvedValueOnce(singleFeedbackStats);

      const result = await getViewStatistics(mockEvent);

      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody).toEqual(singleFeedbackStats);
      expect(responseBody.totalCount).toBe(1);
      expect(responseBody.goodCount).toBe(1);
      expect(responseBody.badCount).toBe(0);
      expect(responseBody.neutralCount).toBe(0);
      expect(mockDynamoService.getStatistics).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should return 500 when DynamoDB connection fails', async () => {
      const mockEvent = createMockEvent();
      
      // Mock getStatistics to throw a DynamoDB error
      mockDynamoService.getStatistics.mockRejectedValueOnce(new Error('Failed to get statistics'));

      const result = await getViewStatistics(mockEvent);

      expect(result.statusCode).toBe(500);
      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST',
      });
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody).toEqual({
        error: 'Internal server error'
      });
      expect(mockDynamoService.getStatistics).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith('Error retrieving statistics:', expect.any(Error));
    });

    it('should return 500 when DynamoDB throws validation exception', async () => {
      const mockEvent = createMockEvent();
      
      // Mock getStatistics to throw a DynamoDB validation error
      mockDynamoService.getStatistics.mockRejectedValueOnce(
        new Error('ValidationException: Table not found')
      );

      const result = await getViewStatistics(mockEvent);

      expect(result.statusCode).toBe(500);
      const responseBody = JSON.parse(result.body);
      expect(responseBody).toEqual({
        error: 'Internal server error'
      });
      expect(mockDynamoService.getStatistics).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        'Error retrieving statistics:', 
        expect.objectContaining({
          message: 'ValidationException: Table not found'
        })
      );
    });

    it('should return 500 when DynamoDB throws access denied exception', async () => {
      const mockEvent = createMockEvent();
      
      // Mock getStatistics to throw a DynamoDB access denied error
      mockDynamoService.getStatistics.mockRejectedValueOnce(
        new Error('AccessDeniedException: User is not authorized to perform: dynamodb:GetItem')
      );

      const result = await getViewStatistics(mockEvent);

      expect(result.statusCode).toBe(500);
      const responseBody = JSON.parse(result.body);
      expect(responseBody).toEqual({
        error: 'Internal server error'
      });
      expect(mockDynamoService.getStatistics).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        'Error retrieving statistics:', 
        expect.objectContaining({
          message: expect.stringContaining('AccessDeniedException')
        })
      );
    });
  });

  describe('response format validation', () => {
    it('should return properly formatted JSON response', async () => {
      const mockEvent = createMockEvent();
      
      const mockStats = {
        id: 'global',
        totalCount: 5,
        goodCount: 3,
        badCount: 1,
        neutralCount: 1,
        lastUpdated: '2025-08-02T16:00:00.000Z'
      };
      
      mockDynamoService.getStatistics.mockResolvedValueOnce(mockStats);

      const result = await getViewStatistics(mockEvent);

      expect(result.statusCode).toBe(200);
      expect(result.headers).toBeDefined();
      expect(result.headers!['Content-Type']).toBe('application/json');
      expect(() => JSON.parse(result.body)).not.toThrow();
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody).toHaveProperty('id');
      expect(responseBody).toHaveProperty('totalCount');
      expect(responseBody).toHaveProperty('goodCount');
      expect(responseBody).toHaveProperty('badCount');
      expect(responseBody).toHaveProperty('neutralCount');
      expect(responseBody).toHaveProperty('lastUpdated');
    });

    it('should include CORS headers in all responses', async () => {
      const mockEvent = createMockEvent();
      
      mockDynamoService.getStatistics.mockRejectedValueOnce(new Error('Test error'));

      const result = await getViewStatistics(mockEvent);

      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST',
      });
    });
  });
});