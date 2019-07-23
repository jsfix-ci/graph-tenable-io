import { RelationshipFromIntegration } from "@jupiterone/jupiter-managed-integration-sdk";

export * from "./AccountContainerRelationship";
export * from "./AccountEntity";
export * from "./AccountUserRelationship";
export * from "./AssetEntity";
export * from "./AssetScanVulnerabilityRelationship";
export * from "./ContainerEntity";
export * from "./ContainerReportRelationship";
export * from "./FindingEntity";
export * from "./MalwareEntity";
export * from "./ContainerReportEntity";
export * from "./ReportFindingRelationship";
export * from "./ReportMalwareRelationship";
export * from "./ReportUnwantedProgramRelationship";
export * from "./ScanAssetRelationship";
export * from "./ScanEntity";
export * from "./TenableVulnerabilityEntity";
export * from "./ScanVulnerabilityRelationship";
export * from "./UnwantedProgramEntity";
export * from "./UserEntity";
export * from "./UserScanRelationship";

export const VULNERABILITY_FINDING_RELATIONSHIP_TYPE =
  "tenable_finding_is_vulnerability";
export const VULNERABILITY_FINDING_RELATIONSHIP_CLASS = "IS";

export type VulnerabilityFindingRelationship = RelationshipFromIntegration;

export const SCAN_FINDING_RELATIONSHIP_TYPE = "tenable_scan_identified_finding";
export const SCAN_FINDING_RELATIONSHIP_CLASS = "IDENTIFIED";

export type ScanFindingRelationship = RelationshipFromIntegration;
