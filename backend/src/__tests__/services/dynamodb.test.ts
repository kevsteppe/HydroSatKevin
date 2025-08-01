import { saveFeedback, getAllFeedback } from '../../services/dynamodb';

describe('DynamoDB service', () => {
  it('should export required functions', () => {
    expect(saveFeedback).toBeDefined();
    expect(getAllFeedback).toBeDefined();
    expect(typeof saveFeedback).toBe('function');
    expect(typeof getAllFeedback).toBe('function');
  });
});