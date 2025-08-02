import { FeedbackRecord } from '../../types/feedback';

// Reusable DynamoDB mock approach - define everything in factory
const mockSend = jest.fn();

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(),
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: mockSend
    }))
  },
  PutCommand: jest.fn(),
  QueryCommand: jest.fn(),
  UpdateCommand: jest.fn(),
  ScanCommand: jest.fn(),
  GetCommand: jest.fn()
}));

describe('DynamoDB service', () => {
  // Import dynamodb module inside each test to ensure fresh mocks
  let dynamoService: typeof import('../../services/dynamodb');
  let SuccessFailure: typeof import('../../services/dynamodb').SuccessFailure;

  beforeEach(async () => {
    mockSend.mockClear();
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Fresh import of the module for each test
    const importedModule = await import('../../services/dynamodb');
    dynamoService = importedModule;
    SuccessFailure = importedModule.SuccessFailure;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('saveFeedback', () => {
    it('should throw error when DynamoDB connection fails', async () => {
      const mockFeedback: FeedbackRecord = {
        id: 'test-id',
        idempotencyKey: 'test-key',
        text: 'Test feedback',
        sentiment: 'Good',
        confidence: 0.95,
        timestamp: '2025-08-02T12:00:00.000Z'
      };

      // Mock DynamoDB error
      mockSend.mockRejectedValueOnce(new Error('DynamoDB connection failed'));

      await expect(dynamoService.saveFeedback(mockFeedback)).rejects.toThrow('Failed to save feedback');
    });

    it('should save feedback successfully when DynamoDB connection works', async () => {
      const mockFeedback: FeedbackRecord = {
        id: 'test-id',
        idempotencyKey: 'test-key',
        text: 'Test feedback',
        sentiment: 'Good',
        confidence: 0.95,
        timestamp: '2025-08-02T12:00:00.000Z'
      };

      // Mock successful DynamoDB response (PutCommand returns empty object on success)
      mockSend.mockResolvedValueOnce({});

      const result = await dynamoService.saveFeedback(mockFeedback);
      expect(result).toBe(SuccessFailure.Success);
    });
  });

  describe('checkIdempotency', () => {
    it('should throw error when DynamoDB query fails', async () => {
      // Mock DynamoDB error
      mockSend.mockRejectedValueOnce(new Error('ValidationException: Table not found'));

      await expect(dynamoService.checkIdempotency('test-key')).rejects.toThrow('Failed to check idempotency');
    });

    it('should return null when no duplicate found', async () => {
      // Mock empty query result (QueryCommand returns { Items: [] } when no matches)
      mockSend.mockResolvedValueOnce({ Items: [] });

      const result = await dynamoService.checkIdempotency('test-key');
      expect(result).toBeNull();
    });

    it('should return existing record when duplicate found', async () => {
      const existingRecord: FeedbackRecord = {
        id: 'existing-id',
        idempotencyKey: 'test-key',
        text: 'Existing feedback',
        sentiment: 'Bad',
        confidence: 0.85,
        timestamp: '2025-08-02T11:00:00.000Z'
      };

      // Mock query result with existing record
      mockSend.mockResolvedValueOnce({ Items: [existingRecord] });

      const result = await dynamoService.checkIdempotency('test-key');
      expect(result).toEqual(existingRecord);
    });
  });

  describe('updateStatistics', () => {
    it('should throw error when DynamoDB update fails', async () => {
      // Mock DynamoDB error
      mockSend.mockRejectedValueOnce(new Error('ResourceNotFoundException: Table not found'));

      const result = await dynamoService.updateStatistics('Good');
      expect(result).toBe(SuccessFailure.Failure);
    });

    it('should update statistics successfully when DynamoDB connection works', async () => {
      // Mock successful DynamoDB response (UpdateCommand returns empty object on success)
      mockSend.mockResolvedValueOnce({});

      const result = await dynamoService.updateStatistics('Good');
      expect(result).toBe(SuccessFailure.Success);
    });
  });

  describe('getAllFeedback', () => {
    it('should throw error when DynamoDB scan fails', async () => {
      // Mock DynamoDB error
      mockSend.mockRejectedValueOnce(new Error('AccessDeniedException: Access denied'));

      await expect(dynamoService.getAllFeedback()).rejects.toThrow('Failed to get feedback');
    });

    it('should return empty array when no feedback exists', async () => {
      // Mock empty scan result (ScanCommand returns { Items: [] } when no items)
      mockSend.mockResolvedValueOnce({ Items: [] });

      const result = await dynamoService.getAllFeedback();
      expect(result).toEqual([]);
    });

    //I don't really care about time order sorting.
    // it('should return sorted feedback when records exist', async () => {
    //   const mockFeedback = [
    //     {
    //       id: 'id1',
    //       text: 'Feedback 1',
    //       sentiment: 'Good',
    //       confidence: 0.9,
    //       timestamp: '2025-08-02T11:00:00.000Z'
    //     },
    //     {
    //       id: 'id2',
    //       text: 'Feedback 2',
    //       sentiment: 'Bad',
    //       confidence: 0.8,
    //       timestamp: '2025-08-02T12:00:00.000Z'
    //     }
    //   ];
    //
    //   // Mock scan result
    //   mockSend.mockResolvedValueOnce({ Items: mockFeedback });
    //
    //   const result = await dynamoService.getAllFeedback();
    //
    //   // Should be sorted by timestamp descending (newest first)
    //   expect(result).toHaveLength(2);
    //   expect(result[0].id).toBe('id2'); // Newer timestamp should be first
    //   expect(result[1].id).toBe('id1');
    // });
  });

  describe('getStatistics', () => {
    it('should throw error when DynamoDB get fails', async () => {
      // Mock DynamoDB error
      mockSend.mockRejectedValueOnce(new Error('ServiceUnavailableException: Service unavailable'));

      await expect(dynamoService.getStatistics()).rejects.toThrow('Failed to get statistics');
    });

    it('should return default statistics when no record exists', async () => {
      // Mock empty get result (GetCommand returns {} when no item found)
      mockSend.mockResolvedValueOnce({});

      const result = await dynamoService.getStatistics();
      
      expect(result).toEqual({
        id: 'global',
        totalCount: 0,
        goodCount: 0,
        badCount: 0,
        neutralCount: 0,
        lastUpdated: expect.any(String)
      });
    });

    it('should return existing statistics when record exists', async () => {
      const mockStats = {
        id: 'global',
        totalCount: 10,
        goodCount: 6,
        badCount: 2,
        neutralCount: 2,
        lastUpdated: '2025-08-02T12:00:00.000Z'
      };

      // Mock get result
      mockSend.mockResolvedValueOnce({ Item: mockStats });

      const result = await dynamoService.getStatistics();
      expect(result).toEqual(mockStats);
    });
  });
});