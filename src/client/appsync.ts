import { URL } from 'url';
import { Sha256 } from '@aws-crypto/sha256-js';
import * as credentials from '@aws-sdk/credential-providers';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import * as axios from 'axios';

export class AppSyncClient {

  protected readonly graphQlServerUri: URL;

  constructor(protected readonly graphQlServerUrl: string, protected readonly awsRegion: string) {
    this.graphQlServerUri = new URL(this.graphQlServerUrl);
    if (!this.graphQlServerUri.href) {
      throw new Error('Invalid GraphQL server URL');
    }
  }

  public async call(operationName: string, query: string, variables: any = {}): Promise<axios.AxiosResponse<any>> {
    const post_body = {
      operationName,
      query,
      variables,
    };

    const httpRequest = new HttpRequest({
      headers: {
        'host': this.graphQlServerUri.host!,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(post_body),
    });
    httpRequest.headers.host = this.graphQlServerUri.host!;
    httpRequest.headers['Content-Type'] = 'application/json';
    httpRequest.method = 'POST';
    httpRequest.body = JSON.stringify(post_body);

    // There's now an official signature library - yay!
    const signer = new SignatureV4({
      credentials: credentials.fromEnv(),
      service: 'appsync',
      region: this.awsRegion,
      sha256: Sha256,
    });

    const signedRequest = await signer.sign(httpRequest, { signingDate: new Date() });

    return axios.default.post(this.graphQlServerUri.href!, signedRequest.body, {
      headers: signedRequest.headers,
    });
  }

}