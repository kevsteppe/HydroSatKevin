import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getStatistics } from '../services/dynamodb';
import { createResponse } from "./feedback";

export const getViewStatistics
    = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    try {
        // Get all statistics from DynamoDB
        // There should be exactly one record
        const statisticsRecords = await getStatistics();

        return createResponse(200, statisticsRecords);
    } catch (error) {
        console.error('Error retrieving statistics:', error);
        return createResponse(500, {error: 'Internal server error'});
    }
}
