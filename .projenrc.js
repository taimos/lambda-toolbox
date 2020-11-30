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

  ],
  devDeps: [

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

// LATER WHEN PUBLIC
  // codeCov: true,
  // releaseToNpm: true,

});

project.synth();
