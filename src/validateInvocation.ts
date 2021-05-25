import {
  IntegrationExecutionContext,
  IntegrationProviderAuthenticationError,
  IntegrationValidationError,
} from '@jupiterone/integration-sdk-core';
import { Client } from './tenable/client';
import { IntegrationConfig } from './types';

export async function validateInvocation(
  context: IntegrationExecutionContext<IntegrationConfig>,
) {
  const {
    logger,
    instance: { config },
  } = context;
  if (!config.accessKey || !config.secretKey) {
    throw new IntegrationValidationError(
      'config requires all of { accessKey, secretKey }',
    );
  }

  const provider = new Client(config, logger);

  try {
    await provider.fetchUserPermissions();
  } catch (err) {
    throw new IntegrationProviderAuthenticationError(err);
  }
}
