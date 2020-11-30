const { TypeScriptProject } = require('projen');

const project = new TypeScriptProject({
  authorName: 'Taimos GmbH',
  authorEmail: 'info@taimos.de',
  authorOrganization: true,
  authorUrl: 'https://taimos.de',
  name: "@taimos/lambda-toolbox",
  copyrightOwner: 'Taimos GmbH',
  copyrightPeriod: '2020',
  defaultReleaseBranch: 'main',
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
  ],
  keywords: [
    'aws',
    'lambda',
    'dynamodb',
  ],
  releaseBranches: [
    'main',
  ],
  license: 'Apache-2.0',
  licensed: true,
  repository: 'https://github.com/taimos/lambda-toolbox',
  stability: 'experimental',
  docgen: true,
  typescriptVersion: "^4.1.0",
  tsconfig: {
    compilerOptions: {
      esModuleInterop: true,
    }
  }

// LATER WHEN PUBLIC
  // codeCov: true,
  // releaseToNpm: true,

});

project.synth();
