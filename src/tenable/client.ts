import fetch, { RequestInit } from 'node-fetch';

import {
  IntegrationError,
  IntegrationLogger,
} from '@jupiterone/integration-sdk-core';
import * as attempt from '@lifeomic/attempt';

import {
  AssetExport,
  AssetsExportStatusResponse,
  AssetsResponse,
  AssetSummary,
  AssetVulnerabilityInfo,
  AssetVulnerabilityResponse,
  Container,
  ContainerReport,
  ContainersResponse,
  ExportAssetsOptions,
  ExportAssetsResponse,
  ExportVulnerabilitiesOptions,
  ExportVulnerabilitiesResponse,
  Method,
  RecentScanDetail,
  RecentScanSummary,
  ReportResponse,
  ScanHostVulnerability,
  ScanResponse,
  ScansResponse,
  ScanVulnerabilitiesResponse,
  User,
  UserPermissionsResponse,
  UsersResponse,
  VulnerabilitiesExportStatusResponse,
  VulnerabilityExport,
} from './types';
import { IntegrationConfig } from '../types';

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

  public async fetchUsers(): Promise<User[]> {
    const usersResponse = await this.makeRequest<UsersResponse>(
      '/users',
      Method.GET,
    );
    this.logger.info(
      { users: usersResponse.users.length ?? 0 },
      'Fetched Tenable users',
    );
    return usersResponse.users;
  }

  public async fetchScans(): Promise<RecentScanSummary[]> {
    const scansResponse = await this.makeRequest<ScansResponse>(
      '/scans',
      Method.GET,
    );
    this.logger.info(
      { scans: scansResponse.scans.length ?? 0 },
      'Fetched Tenable scans',
    );
    return scansResponse.scans;
  }

  public async fetchScanDetail(
    scan: RecentScanSummary,
  ): Promise<RecentScanDetail | undefined> {
    try {
      const scanResponse = await this.makeRequest<ScanResponse>(
        `/scans/${scan.id}`,
        Method.GET,
      );

      const { info, hosts, vulnerabilities } = scanResponse;

      this.logger.info(
        {
          scan: { id: scan.id, uuid: scan.uuid },
          hosts: hosts?.length ?? 0,
          vulnerabilities: vulnerabilities.length ?? 0,
        },
        'Fetched Tenable scan details',
      );

      return {
        ...scan,
        hosts,
        info,
        vulnerabilities,
      };
    } catch (err) {
      // This seems to occur when a scan is listed but for whatever reason is no
      // longer accessible, even to an `Administrator`.
      if (/403/.test(err.code)) {
        this.logger.warn(
          { err, scan: { uuid: scan.uuid, id: scan.id } },
          'Scan details forbidden',
        );
      } else {
        throw err;
      }
    }
  }

  public async fetchAssetVulnerabilityInfo(
    assetUuid: string,
    vulnerability: ScanHostVulnerability,
  ): Promise<AssetVulnerabilityInfo | undefined> {
    const logData = {
      assetId: assetUuid,
      pluginId: vulnerability.plugin_id,
    };
    try {
      const vulnerabilitiesResponse = await this.makeRequest<
        AssetVulnerabilityResponse
      >(
        `/workbenches/assets/${assetUuid}/vulnerabilities/${vulnerability.plugin_id}/info`,
        Method.GET,
      );

      this.logger.info(logData, 'Fetched Tenable asset vulnerability info');

      return vulnerabilitiesResponse.info;
    } catch (err) {
      if (/404/.test(err.code)) {
        this.logger.info(
          { ...logData, err },
          'Vulnerabilities details not found for asset',
        );
      } else if (/500/.test(err.code)) {
        this.logger.warn(
          { ...logData, err },
          'Tenable API returned an internal service error for the asset vulnerabilities.',
        );
      } else {
        throw err;
      }
    }
  }

  public async exportVulnerabilities(
    options: ExportVulnerabilitiesOptions,
  ): Promise<ExportVulnerabilitiesResponse> {
    const exportResponse = await this.makeRequest<
      ExportVulnerabilitiesResponse
    >('/vulns/export', Method.POST, {}, options);

    this.logger.info(
      {
        options,
        exportResponse,
      },
      'Started Tenable vulnerabilities export',
    );

    return exportResponse;
  }

  public async fetchVulnerabilitiesExportStatus(
    exportUuid: string,
  ): Promise<VulnerabilitiesExportStatusResponse> {
    const exportStatusResponse = await this.makeRequest<
      VulnerabilitiesExportStatusResponse
    >(`/vulns/export/${exportUuid}/status`, Method.GET);

    this.logger.info(
      {
        exportUuid,
        exportStatusResponse,
      },
      'Fetched Tenable vulnerabilities export status',
    );

    return exportStatusResponse;
  }

  public async fetchVulnerabilitiesExportChunk(
    exportUuid: string,
    chunkId: number,
  ): Promise<VulnerabilityExport[]> {
    const vulnerabilitiesExportResponse = await this.makeRequest<
      VulnerabilityExport[]
    >(`/vulns/export/${exportUuid}/chunks/${chunkId}`, Method.GET);

    this.logger.info(
      {
        exportUuid,
        chunkId,
        vulnerabilitiesExportResponse: vulnerabilitiesExportResponse.length,
      },
      'Fetched Tenable vulnerabilities export chunk',
    );

    return vulnerabilitiesExportResponse;
  }

  public async exportAssets(
    options: ExportAssetsOptions,
  ): Promise<ExportAssetsResponse> {
    const exportResponse = await this.makeRequest<ExportAssetsResponse>(
      '/assets/export',
      Method.POST,
      {},
      options,
    );

    this.logger.info(
      {
        options,
        exportResponse,
      },
      'Started Tenable assets export',
    );

    return exportResponse;
  }

  public async fetchAssetsExportStatus(
    exportUuid: string,
  ): Promise<AssetsExportStatusResponse> {
    const exportStatusResponse = await this.makeRequest<
      AssetsExportStatusResponse
    >(`/assets/export/${exportUuid}/status`, Method.GET);

    this.logger.info(
      {
        exportUuid,
        exportStatusResponse,
      },
      'Fetched Tenable vulnerabilities export status',
    );

    return exportStatusResponse;
  }

  public async fetchAssetsExportChunk(
    exportUuid: string,
    chunkId: number,
  ): Promise<AssetExport[]> {
    const assetsExportResponse = await this.makeRequest<AssetExport[]>(
      `/assets/export/${exportUuid}/chunks/${chunkId}`,
      Method.GET,
    );

    this.logger.info(
      {
        exportUuid,
        chunkId,
        assetsExportResponse: assetsExportResponse.length,
      },
      'Fetched Tenable assets export chunk',
    );

    return assetsExportResponse;
  }

  public async fetchScanHostVulnerabilities(
    scanId: number,
    hostId: number,
  ): Promise<ScanHostVulnerability[]> {
    const logData = {
      scan: { id: scanId },
      host: { id: hostId },
    };
    try {
      const vulnerabilitiesResponse = await this.makeRequest<
        ScanVulnerabilitiesResponse
      >(`/scans/${scanId}/hosts/${hostId}`, Method.GET);

      this.logger.info(
        {
          ...logData,
          vulnerabilities: vulnerabilitiesResponse.vulnerabilities.length ?? 0,
        },
        'Fetched Tenable scan host vulnerabilities',
      );
      return vulnerabilitiesResponse.vulnerabilities;
    } catch (err) {
      if (/404/.test(err.code)) {
        this.logger.info(
          { ...logData, err },
          'Could not find information on host vulnerabilities',
        );
        return [];
      } else {
        throw err;
      }
    }
  }

  public async fetchAssets(): Promise<AssetSummary[]> {
    const assetsResponse = await this.makeRequest<AssetsResponse>(
      '/assets',
      Method.GET,
    );

    this.logger.info(
      { assets: assetsResponse.assets.length ?? 0 },
      'Fetched Tenable assets',
    );

    return assetsResponse.assets;
  }

  public async fetchContainers(): Promise<Container[]> {
    const containersResponse = await this.makeRequest<ContainersResponse>(
      '/container-security/api/v1/container/list',
      Method.GET,
    );

    this.logger.info(
      { containers: containersResponse.length ?? 0 },
      'Fetched Tenable assets',
    );

    return containersResponse;
  }

  public async fetchReportByImageDigest(
    digestId: string,
  ): Promise<ContainerReport> {
    const reportResponse = await this.makeRequest<ReportResponse>(
      `/container-security/api/v1/reports/by_image_digest?image_digest=${digestId}`,
      Method.GET,
    );

    this.logger.info(
      {
        digestId,
        malware: reportResponse.malware.length ?? 0,
        findings: reportResponse.findings.length ?? 0,
        unwantedPrograms:
          reportResponse.potentially_unwanted_programs.length ?? 0,
      },
      'Fetched Tenable container report',
    );

    return reportResponse;
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
