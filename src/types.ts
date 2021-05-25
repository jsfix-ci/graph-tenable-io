import {
  IntegrationInstanceConfig,
  IntegrationStepExecutionContext,
} from '@jupiterone/integration-sdk-core';

export type IntegrationStepContext = IntegrationStepExecutionContext<
  IntegrationConfig
>;

export interface IntegrationConfig extends IntegrationInstanceConfig {
  accessKey: string;
  secretKey: string;
  retryMaxAttempts?: number;
}
