import * as https from 'https';
import { env } from 'process';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import * as dynamodb from '@aws-sdk/lib-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import { PrimaryEntity } from './model';

const agent = new https.Agent({
  keepAlive: true,
});
export const dynamoClient: DynamoDBDocumentClient = DynamoDBDocumentClient.from(new DynamoDBClient({
  requestHandler: new NodeHttpHandler({ httpsAgent: agent }),
}));

export const TABLE_NAME: string = env.TABLE!;

export async function getItem<E extends PrimaryEntity<any, any>>(pk: E['PK'], sk: E['SK'], options?: Omit<dynamodb.GetCommandInput, 'TableName' | 'Key'>): Promise<E | undefined> {
  const res = await dynamoClient.send(new dynamodb.GetCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: pk,
      SK: sk,
    },
    ...options,
  }));
  return res.Item ? res.Item as E : undefined;
}

export async function deleteItem<E extends PrimaryEntity<any, any>>(pk: E['PK'], sk: E['SK'], options?: Omit<dynamodb.DeleteCommandInput, 'TableName' | 'Key'>): Promise<void> {
  await dynamoClient.send(new dynamodb.DeleteCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: pk,
      SK: sk,
    },
    ...options,
  }));
}

export async function putNewItem<E extends PrimaryEntity<any, any>>(pk: E['PK'], sk: E['SK'], item: Omit<E, 'PK' | 'SK'>): Promise<E> {
  const Item = {
    PK: pk,
    SK: sk,
    ...item,
  };
  await dynamoClient.send(new dynamodb.PutCommand({
    TableName: TABLE_NAME,
    Item,
    ConditionExpression: 'attribute_not_exists(PK) and attribute_not_exists(SK)',
  }));
  return Item as E;
}

export async function updateExistingItem<E extends PrimaryEntity<any, any>>(pk: E['PK'], sk: E['SK'], item: Partial<E>): Promise<E | undefined> {
  const res = await dynamoClient.send(createUpdate<E>({
    Key: {
      PK: pk,
      SK: sk,
    },
    ConditionExpression: 'attribute_exists(PK) and attribute_exists(SK)',
    ReturnValues: 'ALL_NEW',
  }, item));
  return res.Attributes ? res.Attributes as E : undefined;
}

export async function pagedQuery<T>(query: Omit<dynamodb.QueryCommandInput, 'TableName'>): Promise<T[]> {
  let startKey;
  const result: T[] = [];
  do {
    const res: dynamodb.QueryCommandOutput = await dynamoClient.send(new dynamodb.QueryCommand({
      ...query,
      TableName: TABLE_NAME,
      ExclusiveStartKey: startKey,
    }));
    if (res.Items) {
      result.push(...res.Items as T[]);
    }
    startKey = res.LastEvaluatedKey;
  } while (startKey);
  return result;
}

export async function pagedScan<T>(query: Omit<dynamodb.ScanCommandInput, 'TableName'>): Promise<T[]> {
  let startKey;
  const result: T[] = [];
  do {
    const res: dynamodb.ScanCommandOutput = await dynamoClient.send(new dynamodb.ScanCommand({
      ...query,
      TableName: TABLE_NAME,
      ExclusiveStartKey: startKey,
    }));
    if (res.Items) {
      result.push(...res.Items as T[]);
    }
    startKey = res.LastEvaluatedKey;
  } while (startKey);
  return result;
}

/**
 * @deprecated
 * @param val -
 */
export function padLeftZeros(val: number | string | undefined) {
  return ('00' + val).slice(-2);
}

export function createUpdate<T>(request: Omit<dynamodb.UpdateCommandInput, 'TableName'>, data: Partial<T>): dynamodb.UpdateCommand {
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
  return new dynamodb.UpdateCommand({
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
  });
}
