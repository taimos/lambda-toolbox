const { TaimosTypescriptLibrary } = require('@taimos/projen');

const project = new TaimosTypescriptLibrary({
  name: '@taimos/lambda-toolbox',
  deps: [
    'jsonwebtoken',
    'jwk-to-pem',
    'axios',
    'uuid',
    'lambda-log',
    '@aws-crypto/sha256-js',
    '@aws-sdk/client-appsync',
    '@aws-sdk/client-dynamodb',
    '@aws-sdk/credential-providers',
    '@aws-sdk/lib-dynamodb',
    '@aws-sdk/node-http-handler',
    '@aws-sdk/protocol-http',
    '@aws-sdk/signature-v4',
  ],
  docgen: false,
  defaultReleaseBranch: 'main',
  devDeps: [
    '@types/aws-lambda',
    '@types/lambda-log',
    'openapi-typescript',
    '@types/jsonwebtoken',
    '@types/jwk-to-pem',
    '@types/uuid',
    '@taimos/projen',
    '@hapi/boom',
    'aws-sdk-client-mock',
    'aws-sdk-client-mock-jest',
  ],
  keywords: [
    'aws',
    'lambda',
    'dynamodb',
  ],
  tsconfig: {
    compilerOptions: {
      skipLibCheck: true,
    },
  },
  tsconfigDev: {
    compilerOptions: {
      skipLibCheck: true,
    },
  },
  repository: 'https://github.com/taimos/lambda-toolbox',
});

project.synth();
