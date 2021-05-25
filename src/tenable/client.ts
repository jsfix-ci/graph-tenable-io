import fetch, { RequestInit } from 'node-fetch';

import {
  IntegrationError,
  IntegrationLogger,
} from '@jupiterone/integration-sdk-core';
import * as attempt from '@lifeomic/attempt';
import { IntegrationConfig } from '../types';

export enum Method {
  GET = 'get',
  POST = 'post',
}

export interface UserPermissionsResponse {
  type: string;
  permissions: number;
  enabled: boolean;
}

export class Client {
  private readonly host: string = 'https://cloud.tenable.com';
  private readonly defaultRetryMaxAttempts = 10;

  constructor(
    readonly config: IntegrationConfig,
    readonly logger: IntegrationLogger,
  ) {}

  public async fetchUserPermissions() {
    const response = await this.makeRequest<UserPermissionsResponse>(
      '/session',
      Method.GET,
    );
    this.logger.info(
      { permissions: response.permissions },
      "Fetched Tenable user's permissions",
    );
    return response;
  }

  private async makeRequest<T>(
    url: string,
    method: Method,
    headers: {} = {},
    body?: {},
  ): Promise<T> {
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-type': 'application/json',
        Accept: 'application/json',
        'Accept-encoding': 'identity',
        'X-ApiKeys': `accessKey=${this.config.accessKey}; secretKey=${this.config.secretKey};`,
        ...headers,
      },
    };
    if (body) {
      requestOptions.body = JSON.stringify(body);
    }

    this.logger.debug({ method, url }, 'Fetching Tenable data...');

    let retryDelay = 0;

    return attempt.retry(
      async () => {
        retryDelay = 0;
        const response = await fetch(this.host + url, requestOptions);

        if (response.status === 429) {
          const serverRetryDelay = response.headers.get('retry-after');
          this.logger.info(
            { serverRetryDelay, url },
            'Received 429 response from endpoint; waiting to retry.',
          );
          if (serverRetryDelay) {
            retryDelay = Number.parseInt(serverRetryDelay, 10) * 1000;
          }
        }

        if (response.status >= 400) {
          throw new IntegrationError({
            code: `TENABLE_CLIENT_API_${response.status}_ERROR`,
            message: `${response.statusText}: ${response.status} ${method} ${url}`,
          });
        } else {
          return response.json();
        }
      },
      {
        maxAttempts:
          this.config.retryMaxAttempts || this.defaultRetryMaxAttempts,
        calculateDelay: () => {
          return retryDelay;
        },
        handleError: (err, context) => {
          if (!/429|500|504/.test(err.code)) {
            context.abort();
          }
          if (/500/.test(err.code) && context.attemptsRemaining > 2) {
            context.attemptsRemaining = 2;
          }
          this.logger.info(
            {
              url,
              err,
              retryDelay,
              attemptNum: context.attemptNum,
              attemptsRemaining: context.attemptsRemaining,
            },
            'Encountered retryable API response. Retrying.',
          );
        },
      },
    );
  }
}
