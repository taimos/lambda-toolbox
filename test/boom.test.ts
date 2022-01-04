import * as Boom from '@hapi/boom';
import { createHttpHandler } from '../src/http/handler';

test('Boom error support for createHttpHandler', async () => {
  const boomErr = Boom.notImplemented();
  const handler = createHttpHandler(async () => {
    throw boomErr;
  });
  const event = {
    headers: {},
    requestContext: {},
    version: '1',
    routeKey: 'routeKey',
    rawPath: '/raw/path',
    rawQueryString: '',
    isBase64Encoded: false,
  } as AWSLambda.APIGatewayProxyEventV2WithJWTAuthorizer;
  const context = {} as AWSLambda.Context;
  const result = await handler(event, context, () => { });

  if (!result) {
    throw new Error('handler is expected to return a result!');
  }

  expect(result.statusCode).toBe(501);
  expect(result.headers).not.toBeUndefined();

  if (!result.body) {
    throw new Error('result.body is expected to be defined!');
  }

  expect(JSON.parse(result.body)).toEqual(boomErr.output.payload);
});