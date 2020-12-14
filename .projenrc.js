const { TaimosTypescriptLibrary } = require('@taimos/projen');

const project = new TaimosTypescriptLibrary({
  name: "@taimos/lambda-toolbox",
  deps: [
    'aws-sdk',
    'jsonwebtoken',
    'jwk-to-pem',
    'axios',
    'uuid',
  ],
  devDeps: [
    '@types/aws-lambda',
    'openapi-typescript',
    '@types/jsonwebtoken',
    '@types/jwk-to-pem',
    '@types/uuid',
    '@taimos/projen',
  ],
  keywords: [
    'aws',
    'lambda',
    'dynamodb',
  ],
  repository: 'https://github.com/taimos/lambda-toolbox',
});

project.synth();
