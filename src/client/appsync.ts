import { parse, UrlWithStringQuery } from 'url';
import * as AWS from 'aws-sdk';
import * as axios from 'axios';

export class AppSyncClient {

  protected readonly graphQlServerUri: UrlWithStringQuery;

  constructor(protected readonly graphQlServerUrl: string, protected readonly awsRegion: string) {
    this.graphQlServerUri = parse(this.graphQlServerUrl);
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

    const httpRequest = new AWS.HttpRequest(new AWS.Endpoint(this.graphQlServerUri.href!), this.awsRegion);
    httpRequest.headers.host = this.graphQlServerUri.host!;
    httpRequest.headers['Content-Type'] = 'application/json';
    httpRequest.method = 'POST';
    httpRequest.body = JSON.stringify(post_body);

    await ((AWS.config.credentials as AWS.Credentials)?.getPromise());

    // Signers is an internal API
    const signer = new (AWS as any).Signers.V4(httpRequest, 'appsync', true);
    signer.addAuthorization(AWS.config.credentials, (AWS as any).util.date.getDate());

    const res = await axios.default.post(this.graphQlServerUri.href!, httpRequest.body, {
      headers: httpRequest.headers,
    });
    return res;
  }

}