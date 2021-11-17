const { TaimosTypescriptLibrary } = require('@taimos/projen');

const project = new TaimosTypescriptLibrary({
  name: '@taimos/lambda-toolbox',
  deps: [
    'aws-sdk',
    'jsonwebtoken',
    'jwk-to-pem',
    'axios',
    'uuid',
    'lambda-log',
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
