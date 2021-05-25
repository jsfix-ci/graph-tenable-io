import {
  IntegrationStepExecutionContext,
  Step,
} from '@jupiterone/integration-sdk-core';
import { IntegrationConfig, IntegrationStepContext } from '../../types';
import { ScanClient } from './client';
import { entities, steps } from './constants';
import { createScanEntity } from './converters';

export async function fetchScans(
  executionContext: IntegrationStepContext,
): Promise<void> {
  const { instance, logger, jobState } = executionContext;
  const client = new ScanClient(instance.config, logger);

  const scans = await client.fetchScans();
  for (const scan of scans) {
    await jobState.addEntity(createScanEntity(scan));
  }
}

export const scanSteps: Step<
  IntegrationStepExecutionContext<IntegrationConfig>
>[] = [
  {
    id: steps.SCANS,
    name: 'Scans',
    entities: [
      {
        resourceName: entities.SCAN.resourceName,
        _type: entities.SCAN._type,
        _class: entities.SCAN._class,
      },
    ],
    relationships: [],
    executionHandler: fetchScans,
  },
];
