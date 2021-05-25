import { Client, Method } from '../../tenable/client';
import {
  ScansResponse,
  RecentScanSummary,
  RecentScanDetail,
  ScanResponse,
} from '../../tenable/types';

export class ScanClient extends Client {
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
}
