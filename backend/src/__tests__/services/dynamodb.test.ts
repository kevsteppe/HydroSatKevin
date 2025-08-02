import { 
  saveFeedback, 
  getAllFeedback, 
  checkIdempotency, 
  updateStatistics, 
  getStatistics 
} from '../../services/dynamodb';
import { FeedbackRecord } from '../../types/feedback';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({})),
}));

const mockSendForTests = jest.fn();

jest.mock('@aws-sdk/lib-dynamodb', () => {
  const mockSendForTests = jest.fn();
  return {
    DynamoDBDocumentClient: {
      from: jest.fn(() => ({
        send: mockSendForTests,
      })),
    },
    PutCommand: jest.fn(),
    GetCommand: jest.fn(),
    QueryCommand: jest.fn(),
    UpdateCommand: jest.fn(),
    ScanCommand: jest.fn(),
  };
});

// Get reference to the mock function for test control
const { DynamoDBDocumentClient } = jest.requireMock('@aws-sdk/lib-dynamodb');
const mockDocClient = DynamoDBDocumentClient.from();
const mockSendForTestsForTests = mockDocClient.send;

describe('DynamoDB service', () => {
  beforeEach(() => {
    mockSendForTestsForTests.mockClear();
    jest.clearAllMocks();
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
      mockSendForTestsForTests.mockRejectedValueOnce(new Error('DynamoDB connection failed'));

      await expect(saveFeedback(mockFeedback)).rejects.toThrow('Failed to save feedback');
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
      mockSendForTests.mockResolvedValueOnce({});

      await expect(saveFeedback(mockFeedback)).resolves.toBeUndefined();
    });
  });

  describe('checkIdempotency', () => {
    it('should throw error when DynamoDB query fails', async () => {
      // Mock DynamoDB error
      mockSendForTests.mockRejectedValueOnce(new Error('ValidationException: Table not found'));

      await expect(checkIdempotency('test-key')).rejects.toThrow('Failed to check idempotency');
    });

    it('should return null when no duplicate found', async () => {
      // Mock empty query result
      mockSendForTests.mockResolvedValueOnce({ Items: [] });

      const result = await checkIdempotency('test-key');
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
      mockSendForTests.mockResolvedValueOnce({ Items: [existingRecord] });

      const result = await checkIdempotency('test-key');
      expect(result).toEqual(existingRecord);
    });
  });

  describe('updateStatistics', () => {
    it('should throw error when DynamoDB update fails', async () => {
      // Mock DynamoDB error
      mockSendForTests.mockRejectedValueOnce(new Error('ResourceNotFoundException: Table not found'));

      await expect(updateStatistics('Good')).rejects.toThrow('Failed to update statistics');
    });

    it('should update statistics successfully when DynamoDB connection works', async () => {
      // Mock successful DynamoDB response (UpdateCommand returns empty object on success)
      mockSendForTests.mockResolvedValueOnce({});

      await expect(updateStatistics('Good')).resolves.toBeUndefined();
    });
  });

  describe('getAllFeedback', () => {
    it('should throw error when DynamoDB scan fails', async () => {
      // Mock DynamoDB error
      mockSendForTests.mockRejectedValueOnce(new Error('AccessDeniedException: Access denied'));

      await expect(getAllFeedback()).rejects.toThrow('Failed to get feedback');
    });

    it('should return empty array when no feedback exists', async () => {
      // Mock empty scan result
      mockSendForTests.mockResolvedValueOnce({ Items: [] });

      const result = await getAllFeedback();
      expect(result).toEqual([]);
    });

    it('should return sorted feedback when records exist', async () => {
      const mockFeedback = [
        {
          id: 'id1',
          text: 'Feedback 1',
          sentiment: 'Good',
          confidence: 0.9,
          timestamp: '2025-08-02T11:00:00.000Z'
        },
        {
          id: 'id2',
          text: 'Feedback 2',
          sentiment: 'Bad',
          confidence: 0.8,
          timestamp: '2025-08-02T12:00:00.000Z'
        }
      ];

      // Mock scan result
      mockSendForTests.mockResolvedValueOnce({ Items: mockFeedback });

      const result = await getAllFeedback();
      
      // Should be sorted by timestamp descending (newest first)
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('id2'); // Newer timestamp should be first
      expect(result[1].id).toBe('id1');
    });
  });

  describe('getStatistics', () => {
    it('should throw error when DynamoDB get fails', async () => {
      // Mock DynamoDB error
      mockSendForTests.mockRejectedValueOnce(new Error('ServiceUnavailableException: Service unavailable'));

      await expect(getStatistics()).rejects.toThrow('Failed to get statistics');
    });

    it('should return default statistics when no record exists', async () => {
      // Mock empty get result (GetCommand returns { Item: undefined } when no item found)
      mockSendForTests.mockResolvedValueOnce({});

      const result = await getStatistics();
      
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
      mockSendForTests.mockResolvedValueOnce({ Item: mockStats });

      const result = await getStatistics();
      expect(result).toEqual(mockStats);
    });
  });
});