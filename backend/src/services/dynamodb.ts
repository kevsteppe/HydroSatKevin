import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { FeedbackRecord, Statistics } from '../types/feedback';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const FEEDBACK_TABLE = process.env.FEEDBACK_TABLE || 'HydroSatKevin-FeedbackTable';
const STATISTICS_TABLE = process.env.STATISTICS_TABLE || 'HydroSatKevin-StatisticsTable';

export async function checkIdempotency(idempotencyKey: string): Promise<FeedbackRecord | null> {
  try {
    const command = new QueryCommand({
      TableName: FEEDBACK_TABLE,
      IndexName: 'IdempotencyKeyIndex',
      KeyConditionExpression: 'idempotencyKey = :key',
      ExpressionAttributeValues: {
        ':key': idempotencyKey,
      },
      Limit: 1,
    });
    
    const response = await docClient.send(command);
    
    if (response.Items && response.Items.length > 0) {
      return response.Items[0] as FeedbackRecord;
    }
    
    return null;
  } catch (error) {
    console.error('Error checking idempotency:', error);
    throw new Error('Failed to check idempotency');
  }
}

export async function saveFeedback(feedback: FeedbackRecord): Promise<void> {
  try {
    const command = new PutCommand({
      TableName: FEEDBACK_TABLE,
      Item: feedback,
    });
    
    await docClient.send(command);
  } catch (error) {
    console.error('Error saving feedback:', error);
    throw new Error('Failed to save feedback');
  }
}

export async function updateStatistics(sentiment: 'Good' | 'Bad' | 'Neutral'): Promise<void> {
  try {
    // Increment total count and specific sentiment count
    const updateExpression = 'ADD totalCount :one, #sentimentCount :one SET lastUpdated = :timestamp';
    const expressionAttributeNames: { [key: string]: string } = {};
    
    switch (sentiment) {
      case 'Good':
        expressionAttributeNames['#sentimentCount'] = 'goodCount';
        break;
      case 'Bad':
        expressionAttributeNames['#sentimentCount'] = 'badCount';
        break;
      case 'Neutral':
        expressionAttributeNames['#sentimentCount'] = 'neutralCount';
        break;
    }
    
    const command = new UpdateCommand({
      TableName: STATISTICS_TABLE,
      Key: { id: 'global' },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: {
        ':one': 1,
        ':timestamp': new Date().toISOString(),
      },
    });
    
    await docClient.send(command);
  } catch (error) {
    console.error('Error updating statistics:', error);
    throw new Error('Failed to update statistics');
  }
}

export async function getAllFeedback(): Promise<FeedbackRecord[]> {
  try {
    const command = new ScanCommand({
      TableName: FEEDBACK_TABLE,
    });
    
    const response = await docClient.send(command);
    
    if (response.Items) {
      // Sort by timestamp descending (newest first)
      const items = response.Items as FeedbackRecord[];
      return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    
    return [];
  } catch (error) {
    console.error('Error getting all feedback:', error);
    throw new Error('Failed to get feedback');
  }
}

export async function getStatistics(): Promise<Statistics> {
  try {
    const command = new GetCommand({
      TableName: STATISTICS_TABLE,
      Key: { id: 'global' },
    });
    
    const response = await docClient.send(command);
    
    if (response.Item) {
      return response.Item as Statistics;
    }
    
    // Return default statistics if none exist
    return {
      id: 'global',
      totalCount: 0,
      goodCount: 0,
      badCount: 0,
      neutralCount: 0,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting statistics:', error);
    throw new Error('Failed to get statistics');
  }
}