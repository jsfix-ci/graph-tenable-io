import {
  EntityFromIntegration,
  EntityOperation,
  PersisterClient,
  RelationshipOperation,
} from "@jupiterone/jupiter-managed-integration-sdk";

import {
  createAccountContainerRelationships,
  createAccountEntity,
  createAccountUserRelationships,
  createAssetEntities,
  createAssetScanVulnerabilityRelationships,
  createContainerEntities,
  createContainerReportRelationships,
  createFindingEntities,
  createMalwareEntities,
  createReportEntities,
  createReportFindingRelationships,
  createReportMalwareRelationships,
  createReportUnwantedProgramRelationships,
  createScanAssetRelationships,
  createScanEntities,
  createScanVulnerabilityRelationships,
  createUnwantedProgramEntities,
  createUserEntities,
  createUserScanRelationships,
  createVulnerabilityEntities,
} from "../converters";
import {
  JupiterOneDataModel,
  JupiterOneEntitiesData,
  JupiterOneRelationshipsData,
} from "../jupiterone";
import { TenableDataModel } from "../tenable/types";
import { Account } from "../types";

type EntitiesKeys = keyof JupiterOneEntitiesData;
type RelationshipsKeys = keyof JupiterOneRelationshipsData;

export default async function publishChanges(
  persister: PersisterClient,
  oldData: JupiterOneDataModel,
  tenableDataModel: TenableDataModel,
  account: Account,
) {
  const newData = convert(tenableDataModel, account);

  const entities = createEntitiesOperations(
    oldData.entities,
    newData.entities,
    persister,
  );
  const relationships = createRelationshipsOperations(
    oldData.relationships,
    newData.relationships,
    persister,
  );

  return await persister.publishPersisterOperations([entities, relationships]);
}

function createEntitiesOperations(
  oldData: JupiterOneEntitiesData,
  newData: JupiterOneEntitiesData,
  persister: PersisterClient,
): EntityOperation[] {
  const defatultOperations: EntityOperation[] = [];
  const entities: EntitiesKeys[] = Object.keys(oldData) as EntitiesKeys[];

  return entities.reduce((operations, entityName) => {
    const oldEntities = oldData[entityName];
    const newEntities = newData[entityName];

    return [
      ...operations,
      ...persister.processEntities<EntityFromIntegration>(
        oldEntities,
        newEntities,
      ),
    ];
  }, defatultOperations);
}

function createRelationshipsOperations(
  oldData: JupiterOneRelationshipsData,
  newData: JupiterOneRelationshipsData,
  persister: PersisterClient,
): RelationshipOperation[] {
  const defatultOperations: RelationshipOperation[] = [];
  const relationships: RelationshipsKeys[] = Object.keys(
    oldData,
  ) as RelationshipsKeys[];

  return relationships.reduce((operations, relationshipName) => {
    const oldRelationhips = oldData[relationshipName];
    const newRelationhips = newData[relationshipName];

    return [
      ...operations,
      ...persister.processRelationships(oldRelationhips, newRelationhips),
    ];
  }, defatultOperations);
}

export function convert(
  tenableDataModel: TenableDataModel,
  account: Account,
): JupiterOneDataModel {
  return {
    entities: convertEntities(tenableDataModel, account),
    relationships: convertRelationships(tenableDataModel, account),
  };
}

export function convertEntities(
  tenableDataModel: TenableDataModel,
  account: Account,
): JupiterOneEntitiesData {
  return {
    accounts: [createAccountEntity(account)],
    users: createUserEntities(tenableDataModel.users),
    assets: createAssetEntities(tenableDataModel.assets),
    scans: createScanEntities(tenableDataModel.scans),
    scanVulnerabilities: createVulnerabilityEntities(
      tenableDataModel.scanVulnerabilities,
    ),
    containers: createContainerEntities(tenableDataModel.containers),
    reports: createReportEntities(tenableDataModel.containerReports),
    malwares: createMalwareEntities(tenableDataModel.containerMalwares),
    findings: createFindingEntities(tenableDataModel.containerFindings),
    unwantedPrograms: createUnwantedProgramEntities(
      tenableDataModel.containerUnwantedPrograms,
    ),
  };
}

export function convertRelationships(
  tenableDataModel: TenableDataModel,
  account: Account,
): JupiterOneRelationshipsData {
  return {
    accountUserRelationships: createAccountUserRelationships(
      account,
      tenableDataModel.users,
    ),
    userScanRelationships: createUserScanRelationships(
      tenableDataModel.scans,
      tenableDataModel.users,
    ),
    scanVulnerabilityRelationships: createScanVulnerabilityRelationships(
      tenableDataModel.scans,
      tenableDataModel.scanVulnerabilities,
    ),
    scanAssetRelationships: createScanAssetRelationships(
      tenableDataModel.scans,
      tenableDataModel.assets,
    ),
    assetScanVulnerabilityRelationships: createAssetScanVulnerabilityRelationships(
      tenableDataModel.assets,
      tenableDataModel.scanVulnerabilities,
    ),
    accountContainerRelationships: createAccountContainerRelationships(
      account,
      tenableDataModel.containers,
    ),
    containerReportRelationships: createContainerReportRelationships(
      tenableDataModel.containers,
      tenableDataModel.containerReports,
    ),
    reportMalwareRelationships: createReportMalwareRelationships(
      tenableDataModel.containerReports,
      tenableDataModel.containerMalwares,
    ),
    reportFindingRelationships: createReportFindingRelationships(
      tenableDataModel.containerReports,
      tenableDataModel.containerFindings,
    ),
    reportUnwantedProgramRelationships: createReportUnwantedProgramRelationships(
      tenableDataModel.containerReports,
      tenableDataModel.containerUnwantedPrograms,
    ),
  };
}
