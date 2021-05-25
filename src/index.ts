import { IntegrationInvocationConfig } from '@jupiterone/integration-sdk-core';
import { integrationSteps } from './steps';
import { instanceConfigFields } from './instanceConfigFields';
import { validateInvocation } from './validateInvocation';
import { IntegrationConfig } from './types';

export const invocationConfig: IntegrationInvocationConfig<IntegrationConfig> = {
  instanceConfigFields,
  validateInvocation,
  integrationSteps,
};
