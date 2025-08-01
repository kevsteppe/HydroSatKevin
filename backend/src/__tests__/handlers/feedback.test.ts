import { postFeedback } from '../../handlers/feedback';

describe('postFeedback', () => {
  it('should be defined', () => {
    expect(postFeedback).toBeDefined();
    expect(typeof postFeedback).toBe('function');
  });
});