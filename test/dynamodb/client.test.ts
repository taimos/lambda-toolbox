import * as commands from '@aws-sdk/lib-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import * as dynamo from '../../src/dynamodb';
import { PrimaryEntity } from '../../src/dynamodb';


interface TestEntry extends PrimaryEntity<`Partition#${string}`, `Sort#${string}`> {
  content: string;
}
describe('A dynamodb client', () => {
  const testTableName = process.env.TABLE;

  const client = mockClient(DynamoDBDocumentClient);

  describe('should create the correct requests for', () => {

    beforeEach(() => {
      client.reset();
    });

    test('PutItem', async () => {
      client.on(commands.PutCommand).resolves({
        Attributes: { PK: 'Partition#foo', SK: 'Sort#bar', content: 'something' },
      });

      await dynamo.putNewItem<TestEntry>('Partition#foo', 'Sort#bar', { content: 'something' });

      expect(client).toHaveReceivedCommandWith(commands.PutCommand, {
        TableName: testTableName,
        Item: {
          PK: 'Partition#foo',
          SK: 'Sort#bar',
          content: 'something',
        },
        ConditionExpression: 'attribute_not_exists(PK) and attribute_not_exists(SK)',
      });
    });

    test('GetItem', async () => {
      client.on(commands.GetCommand).resolves({ Item: { PK: 'Partition#foo', SK: 'Sort#bar', content: 'something' } });

      const result = await dynamo.getItem<TestEntry>('Partition#foo', 'Sort#bar');

      expect(result).toBeDefined();
      expect(result!.content).toEqual('something');

      expect(client).toHaveReceivedCommandWith(commands.GetCommand, {
        TableName: testTableName,
        Key: {
          PK: 'Partition#foo',
          SK: 'Sort#bar',
        },
      });
    });

    test('DeleteItem', async () => {
      client.on(commands.UpdateCommand).resolves({ Attributes: { content: 'oldthing' } });

      await dynamo.deleteItem<TestEntry>('Partition#foo', 'Sort#bar');

      expect(client).toHaveReceivedCommandWith(commands.DeleteCommand, {
        TableName: testTableName,
        Key: {
          PK: 'Partition#foo',
          SK: 'Sort#bar',
        },
      });
    });

    //TODO Test Query Paging
    test('Query', async () => {
      client.on(commands.QueryCommand).resolves({
        Items: [
          { PK: 'Partition#foo', SK: 'Sort#first', content: 'firstthing' },
          { PK: 'Partition#foo', SK: 'Sort#second', content: 'secondthing' },
        ],
      });

      const result = await dynamo.pagedQuery<TestEntry>({
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': 'Partition#foo',
        },
      });

      expect(result).toBeDefined();
      expect(result.length).toEqual(2);

      expect(client).toHaveReceivedCommandWith(commands.QueryCommand, {
        TableName: testTableName,
        KeyConditionExpression: 'PK = :pk',
        ExclusiveStartKey: undefined,
        ExpressionAttributeValues: {
          ':pk': 'Partition#foo',
        },
      });
    });

    //TODO Test Scan Paging
    test('Scan', async () => {
      client.on(commands.ScanCommand).resolves({
        Items: [
          { PK: 'Partition#foo', SK: 'Sort#foo', content: 'something' },
        ],
      });

      const result = await dynamo.pagedScan<TestEntry>({
        FilterExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': 'Partition#foo',
        },
      });

      expect(result).toBeDefined();
      expect(result.length).toEqual(1);

      expect(client).toHaveReceivedCommandWith(commands.ScanCommand, {
        TableName: testTableName,
        FilterExpression: 'PK = :pk',
        ExclusiveStartKey: undefined,
        ExpressionAttributeValues: {
          ':pk': 'Partition#foo',
        },
      });
    });

    //TODO Test item updates
  });
});