import { IntegrationLogger } from '@jupiterone/integration-sdk-core';
import { IntegrationConfig } from '../types';

export class Client {
  constructor(
    readonly config: IntegrationConfig,
    readonly logger: IntegrationLogger,
  ) {}
}
