import * as https from 'https';
import { env } from 'process';
import { DynamoDB } from 'aws-sdk';
import { PrimaryEntity } from './model';

const agent = new https.Agent({
  keepAlive: true,
});
export const dynamoClient: DynamoDB.DocumentClient = new DynamoDB.DocumentClient({ httpOptions: { agent } });

export const TABLE_NAME: string = env.TABLE!;

export async function getItem<E extends PrimaryEntity<any, any>>(pk: any, sk: any, options?: Omit<DynamoDB.DocumentClient.GetItemInput, 'TableName' | 'Key'>): Promise<E | undefined> {
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

export async function deleteItem(pk: any, sk: any, options?: Omit<DynamoDB.DocumentClient.DeleteItemInput, 'TableName' | 'Key'>): Promise<void> {
  await dynamoClient.delete({
    TableName: TABLE_NAME,
    Key: {
      PK: pk,
      SK: sk,
    },
    ...options,
  }).promise();
}

export async function putNewItem<E extends PrimaryEntity<any, any>>(pk: any, sk: any, item: Omit<E, 'PK' | 'SK'>): Promise<E> {
  const Item = {
    PK: pk,
    SK: sk,
    ...item,
  };
  await dynamoClient.put({
    TableName: TABLE_NAME,
    Item,
    ConditionExpression: 'attribute_not_exists(PK) and attribute_not_exists(SK)',
  }).promise();
  return Item as E;
}

export async function updateExistingItem<E extends PrimaryEntity<any, any>>(pk: any, sk: any, item: Partial<E>): Promise<E | undefined> {
  const res = await dynamoClient.update(createUpdate<E>({
    Key: {
      PK: pk,
      SK: sk,
    },
    ConditionExpression: 'attribute_exists(PK) and attribute_exists(SK)',
    ReturnValues: 'ALL_NEW',
  }, item)).promise();
  return res.Attributes ? res.Attributes as E : undefined;
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
