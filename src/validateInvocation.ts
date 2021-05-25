import {
  IntegrationExecutionContext,
  IntegrationValidationError,
} from '@jupiterone/integration-sdk-core';
import { IntegrationConfig } from './types';

export async function validateInvocation(
  context: IntegrationExecutionContext<IntegrationConfig>,
) {
  const {
    instance: { config },
  } = context;
  if (!config.accessKey || !config.secretKey) {
    throw new IntegrationValidationError(
      'config requires all of { accessKey, secretKey }',
    );
  }
}
