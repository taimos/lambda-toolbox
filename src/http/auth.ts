import { env } from 'process';
/* eslint-disable */
import { APIGatewayProxyEventV2 } from 'aws-lambda';
/* eslint-enable */
import Axios from 'axios';
import { verify, JwtHeader, SigningKeyCallback } from 'jsonwebtoken';
// import jwkToPem = require('jwk-to-pem');
import jwkToPem from 'jwk-to-pem';
import { ForbiddenError, UnauthenticatedError } from '../types/errors';

const cognitoPoolId = env.USER_POOL_ID ?? '';
const cognitoPoolRegion = env.USER_POOL_REGION ?? env.AWS_REGION ?? 'eu-central-1';
const cognitoIssuer = `https://cognito-idp.${cognitoPoolRegion}.amazonaws.com/${cognitoPoolId}`;

interface PublicKey {
  alg: string;
  e: string;
  kid: string;
  kty: string;
  n: string;
  use: string;
}

interface PublicKeyMeta {
  instance: PublicKey;
  pem: string;
}

interface PublicKeys {
  keys: PublicKey[];
}

interface MapOfKidToPublicKey {
  [key: string]: PublicKeyMeta;
}

let cacheKeys: MapOfKidToPublicKey | undefined;
const getPublicKeys = async (): Promise<MapOfKidToPublicKey> => {
  if (!cacheKeys) {
    const url = `${cognitoIssuer}/.well-known/jwks.json`;

    const publicKeys: PublicKeys = (await Axios.get(url)).data;
    cacheKeys = publicKeys.keys.reduce((agg, current) => {
      const pem = jwkToPem(current as jwkToPem.JWK);
      agg[current.kid] = { instance: current, pem };
      return agg;
    }, {} as MapOfKidToPublicKey);
    return cacheKeys;
  } else {
    return cacheKeys;
  }
};

const promisedVerify = (token: string): Promise<{ [name: string]: string }> => {
  return new Promise((resolve, reject) => {
    verify(token, (header: JwtHeader, cb: SigningKeyCallback) => {
      if (!header.kid) {
        cb('no key id found');
      }
      getPublicKeys().then((keys) => {
        cb(undefined, keys[header.kid!].pem);
      }, cb);
    }, { issuer: cognitoIssuer }, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded as { [name: string]: string });
      }
    });
  });
};

export class CognitoAuthorizer {

  constructor(protected event: APIGatewayProxyEventV2) {
    //
  }

  public async authenticate(): Promise<void> {
    if (!cognitoPoolId || (this.event.requestContext.authorizer && this.event.requestContext.authorizer.jwt)) {
      return;
    }
    const authHeader = this.event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return;
    }
    const token = authHeader.substr('Bearer '.length);
    try {
      const claims: { [name: string]: string } = await promisedVerify(token);
      console.log(claims);

      this.event.requestContext.authorizer = {
        jwt: {
          claims,
          scopes: ['openid', 'email'],
        },
      };
    } catch (err) {
      console.log(err);
    }
  }

  public isAuthenticated(): boolean {
    return this.event.requestContext.authorizer !== undefined && this.event.requestContext.authorizer.jwt !== undefined;
  }

  public assertAuthenticated(): void {
    if (!this.isAuthenticated()) {
      throw new UnauthenticatedError();
    }
  }

  public isAdmin(): boolean {
    // 'cognito:groups': [ 'admin' ],
    return this.isAuthenticated()
      && this.event.requestContext.authorizer!.jwt!.claims.hasOwnProperty('cognito:groups')
      && (this.event.requestContext.authorizer!.jwt!.claims['cognito:groups'] as unknown as string[]).includes('admin');
  }

  public assertAdmin(): void {
    this.assertAuthenticated();
    if (!this.isAdmin()) {
      throw new ForbiddenError();
    }
  }

  public getEMail(): string {
    this.assertAuthenticated();
    return this.event.requestContext.authorizer!.jwt!.claims.email as string;
  }

}

