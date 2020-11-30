import * as https from 'https';
import { env } from 'process';
import { DynamoDB } from 'aws-sdk';
import { PrimaryEntity } from './model';

const agent = new https.Agent({
  keepAlive: true,
});
export const dynamoClient: DynamoDB.DocumentClient = new DynamoDB.DocumentClient({ httpOptions: { agent } });

export const TABLE_NAME: string = env.TABLE!;

export async function get<E extends PrimaryEntity>(pk: string, sk: string, options?: Omit<DynamoDB.DocumentClient.GetItemInput, 'TableName' | 'Key'>): Promise<E | undefined> {
  const res = await dynamoClient.get({
    TableName: TABLE_NAME,
    Key: {
      PK: pk,
      SK: sk,
    },
    ...options,
  }).promise();
  return res.Item ? res.Item as E : undefined;
}

export async function pagedQuery<T>(query: Omit<DynamoDB.DocumentClient.QueryInput, 'TableName'>): Promise<T[]> {
  let startKey;
  const result: T[] = [];
  do {
    const res: DynamoDB.DocumentClient.QueryOutput = await dynamoClient.query({
      ...query,
      TableName: TABLE_NAME,
      ExclusiveStartKey: startKey,
    }).promise();
    if (res.Items) {
      result.push(...res.Items as T[]);
    }
    startKey = res.LastEvaluatedKey;
  } while (startKey);
  return result;
}

export async function pagedScan<T>(query: Omit<DynamoDB.DocumentClient.ScanInput, 'TableName'>): Promise<T[]> {
  let startKey;
  const result: T[] = [];
  do {
    const res: DynamoDB.DocumentClient.ScanOutput = await dynamoClient.scan({
      ...query,
      TableName: TABLE_NAME,
      ExclusiveStartKey: startKey,
    }).promise();
    if (res.Items) {
      result.push(...res.Items as T[]);
    }
    startKey = res.LastEvaluatedKey;
  } while (startKey);
  return result;
}

export function padLeftZeros(val: number | string | undefined) {
  return ('00' + val).slice(-2);
}

export function createUpdate<T>(request: Omit<DynamoDB.DocumentClient.UpdateItemInput, 'TableName'>, data: Partial<T>): DynamoDB.DocumentClient.UpdateItemInput {
  const fieldsToSet = [];
  const fieldsToRemove = [];
  const expressionNames: any = {};
  const expressionValues: any = {};

  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      if (data[key] !== undefined) {
        fieldsToSet.push(`#${key} = :${key}`);
        expressionNames[`#${key}`] = key;
        expressionValues[`:${key}`] = data[key];
      } else {
        fieldsToRemove.push(`#${key}`);
        expressionNames[`#${key}`] = key;
      }
    }
  }
  let update = '';
  if (fieldsToSet.length > 0) {
    update += `SET ${fieldsToSet.join(', ')} `;
  }
  if (fieldsToRemove.length > 0) {
    update += `REMOVE ${fieldsToRemove.join(', ')} `;
  }
  if (request.UpdateExpression) {
    update += request.UpdateExpression;
  }
  return {
    ...request,
    TableName: TABLE_NAME,
    UpdateExpression: update,
    ...((request.ExpressionAttributeNames && Object.keys(request.ExpressionAttributeNames).length > 0)
      || Object.keys(expressionNames).length > 0) && {
      ExpressionAttributeNames: {
        ...request.ExpressionAttributeNames,
        ...expressionNames,
      },
    },
    ...((request.ExpressionAttributeValues && Object.keys(request.ExpressionAttributeValues).length > 0)
      || Object.keys(expressionValues).length > 0) && {
      ExpressionAttributeValues: {
        ...request.ExpressionAttributeValues,
        ...expressionValues,
      },
    },
  };
}
