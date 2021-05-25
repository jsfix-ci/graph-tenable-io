import { Client, Method } from '../../tenable/client';
import {
  Container,
  ContainersResponse,
  ContainerReport,
  ReportResponse,
} from '../../tenable/types';

export class ContainerClient extends Client {
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
}
