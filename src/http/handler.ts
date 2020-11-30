/* eslint-disable */
import * as lambda from 'aws-lambda';
/* eslint-enable */
import * as errors from '../types';
import { CognitoAuthorizer } from './auth';

export interface HttpResponseContext {
  statusCode?: number;
  headers: { [name: string]: string };
}

export interface HttpHandlerContext {
  event: lambda.APIGatewayProxyEventV2;
  lambdaContext: lambda.Context;
  response: HttpResponseContext;
  cognitoAuth: CognitoAuthorizer;
}

export type HttpHandler<T, R> = (
  context: HttpHandlerContext,
  body: T,
) => Promise<R>;

export interface Operation {
  responses: {
    [statusCode: number]: {
      'application/json': any;
    };
  };
}

export interface OperationWithRequestBody extends Operation {
  requestBody: { 'application/json': any };
}

export const createOpenApiHandlerWithBody = <OP extends OperationWithRequestBody, SC extends number>(handler: HttpHandler<OP['requestBody']['application/json'], OP['responses'][SC]['application/json']>): lambda.Handler<lambda.APIGatewayProxyEventV2, lambda.APIGatewayProxyStructuredResultV2 | undefined> => {
  return createHttpHandler(handler);
};

export const createOpenApiHandler = <OP extends Operation, SC extends number>(handler: HttpHandler<any, OP['responses'][SC]['application/json']>): lambda.Handler<lambda.APIGatewayProxyEventV2, lambda.APIGatewayProxyStructuredResultV2 | undefined> => {
  return createHttpHandler(handler);
};

export const createHttpHandler =
  <T, R>(handler: HttpHandler<T, R>): lambda.Handler<lambda.APIGatewayProxyEventV2, lambda.APIGatewayProxyStructuredResultV2 | undefined> => {
    return async (event, context) => {
      const ctx: HttpHandlerContext = {
        event,
        lambdaContext: context,
        response: { headers: {} },
        cognitoAuth: new CognitoAuthorizer(event),
      };

      try {
        await ctx.cognitoAuth.authenticate();

        const res = await handler(ctx, parseBody(event));
        return {
          statusCode: ctx.response.statusCode ?? (res ? 200 : 204),
          headers: {
            'Content-Type': 'application/json',
            ...corsHeader(event),
            ...ctx.response.headers,
          },
          body: res ? JSON.stringify(res) : '',
        };
      } catch (error) {
        if (error instanceof errors.HttpError) {
          return {
            statusCode: error.statusCode,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeader(event),
              ...ctx.response.headers,
            },
            body: error.message,
          };
        }
        return {
          statusCode: ctx.response.statusCode ?? 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeader(event),
            ...ctx.response.headers,
          },
          body: error.toString(),
        };
      }
    };
  };

function parseBody<T>(event: lambda.APIGatewayProxyEventV2): T {
  if (!event.body || !event.isBase64Encoded) {
    return JSON.parse(event.body ?? '{}');
  }
  const buff = Buffer.from(event.body, 'base64');
  return JSON.parse(buff.toString('utf8'));
}

function corsHeader(event: lambda.APIGatewayProxyEventV2): { [name: string]: string } {
  return {
    'Access-Control-Allow-Origin': event?.headers?.origin ?? '*',
    'Access-Control-Allow-Credentials': event?.headers?.origin ? 'true' : 'false',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': 'Authorization, *',
  };
}