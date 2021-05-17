import { Client } from './client';
import { fetchTenableData } from './fetchTenableData';
import { integrationConfig } from '../../test/config';
import { createMockIntegrationLogger } from '@jupiterone/integration-sdk-testing';
import { setupProjectRecording, Recording } from '../../test/recording';
import {
  ExportAssetsOptions,
  ExportVulnerabilitiesOptions,
  RecentScanSummary,
  ScanHostVulnerability,
  VulnerabilityState,
} from './types';

const TENABLE_COM = 'https://cloud.tenable.com';
let recording: Recording;
afterEach(async () => {
  if (recording) {
    await recording.stop();
  }
});

describe('#Client', () => {
  test('should throw error on 404 errors', async () => {
    recording = setupProjectRecording({
      directory: __dirname,
      name: 'clientThrowErrorOn404',
      options: {
        recordFailedRequests: true,
      },
    });

    const client = new Client(integrationConfig, createMockIntegrationLogger());
    await expect(
      client.fetchScanDetail({ id: -1 } as RecentScanSummary),
    ).rejects.toThrow(/404/);
  });

  test('fetch 429 waits Retry-After time max times', async () => {
    recording = setupProjectRecording({
      directory: __dirname,
      name: 'clientThrowErrorOnMax429',
      options: {
        recordFailedRequests: true,
      },
    });
    let retryCount = 0;
    recording.server
      .get(`${TENABLE_COM}/users`)
      .intercept((_, res) => {
        retryCount += 1;
        res.setHeaders({
          'Content-Type': 'text/html',
          'Retry-After': '1',
        });
        res.sendStatus(429);
      })
      .times(integrationConfig.retryMaxAttempts);
    const client = new Client(integrationConfig, createMockIntegrationLogger());
    await expect(client.fetchUsers()).rejects.toThrow(/429/);
    expect(retryCount).toEqual(3);
  });

  test('immediately retry 500 but short circuit to only 3 attempts', async () => {
    recording = setupProjectRecording({
      directory: __dirname,
      name: 'clientRetry500ShortCircuitMax',
      options: {
        recordFailedRequests: true,
      },
    });
    let retryCount = 0;
    let retryMaxAttempts = 10;
    recording.server
      .get(
        `${TENABLE_COM}/workbenches/assets/2aa49a6b-f17b-4b43-8953-58e2012f2fb3/vulnerabilities/10386/info`,
      )
      .intercept((_, res) => {
        retryCount += 1;
        res.sendStatus(500);
      })
      .times(retryMaxAttempts);
    const client = new Client(
      { retryMaxAttempts, ...integrationConfig },
      createMockIntegrationLogger(),
    );
    const info = await client.fetchAssetVulnerabilityInfo(
      '2aa49a6b-f17b-4b43-8953-58e2012f2fb3',
      { plugin_id: 10386 } as ScanHostVulnerability,
    );
    await expect(info).toBeUndefined();
    expect(retryCount).toEqual(3);
  });

  test('should fetch 429 without Retry-After', async () => {
    recording = setupProjectRecording({
      directory: __dirname,
      name: 'clientFetch429WithoutRetryAfter',
      options: {
        recordFailedRequests: true,
      },
    });
    let retryCount = 0;
    recording.server
      .get(`${TENABLE_COM}/users`)
      .intercept((_, res) => {
        retryCount += 1;
        res.sendStatus(429);
      })
      .times(1);
    recording.server
      .get(`${TENABLE_COM}/users`)
      .intercept((_, res) => {
        retryCount += 1;
        res.sendStatus(404);
      })
      .times(1);

    const client = new Client(integrationConfig, createMockIntegrationLogger());
    await expect(client.fetchUsers()).rejects.toThrow(/404/);
    expect(retryCount).toEqual(2);
  });
});

describe('#fetchUserPermissions', () => {
  test("should return user's permissions", async () => {
    recording = setupProjectRecording({
      directory: __dirname,
      name: 'fetchUserPermissionsValid',
    });

    const client = new Client(integrationConfig, createMockIntegrationLogger());
    const response = await client.fetchUserPermissions();
    expect(response).toEqual(
      expect.objectContaining({
        uuid: expect.any(String),
        id: expect.any(Number),
        username: expect.any(String),
        email: expect.any(String),
        name: expect.any(String),
        permissions: expect.any(Number),
      }),
    );
    expect(response).not.toEqual({});
  });
});

describe('#fetchUsers', () => {
  test('should return a list of users', async () => {
    recording = setupProjectRecording({
      directory: __dirname,
      name: 'fetchUsersValid',
    });

    const client = new Client(integrationConfig, createMockIntegrationLogger());
    const response = await client.fetchUsers();
    expect(response).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          uuid: expect.any(String),
          id: expect.any(Number),
          username: expect.any(String),
          email: expect.any(String),
          name: expect.any(String),
          type: expect.any(String),
        }),
      ]),
    );
  });
});

describe('#fetchScans', () => {
  test('should return a list of scans', async () => {
    recording = setupProjectRecording({
      directory: __dirname,
      name: 'fetchScansValid',
    });

    const client = new Client(integrationConfig, createMockIntegrationLogger());
    const response = await client.fetchScans();
    expect(response).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          uuid: expect.any(String),
          template_uuid: expect.any(String),
          schedule_uuid: expect.any(String),
          wizard_uuid: expect.any(String),
          status: expect.any(String),
          type: expect.any(String),
        }),
      ]),
    );
  });
});

describe('#fetchAssets', () => {
  test('should return a list of scans', async () => {
    recording = setupProjectRecording({
      directory: __dirname,
      name: 'fetchAssetsValid',
    });

    const client = new Client(integrationConfig, createMockIntegrationLogger());
    const response = await client.fetchAssets();
    expect(response).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          has_agent: expect.any(Boolean),
          last_seen: expect.any(String),
          last_scan_target: expect.any(String),
        }),
      ]),
    );
  });
});

describe('#fetchScanDetail', () => {
  test('should return a list of scans', async () => {
    recording = setupProjectRecording({
      directory: __dirname,
      name: 'fetchScanDetailValid',
    });

    const client = new Client(integrationConfig, createMockIntegrationLogger());
    const response = await client.fetchScanDetail({
      id: 17,
    } as RecentScanSummary);
    expect(response).toMatchObject({
      info: expect.any(Object),
      hosts: expect.any(Array),
      vulnerabilities: expect.any(Array),
    });
  });

  test('should throw on an unknown error', async () => {
    recording = setupProjectRecording({
      directory: __dirname,
      name: 'fetchScanDetailUnknownError',
      options: {
        recordFailedRequests: true,
      },
    });
    recording.server
      .get(`${TENABLE_COM}/scans/199`)
      .intercept((_, res) => {
        res.sendStatus(401);
      })
      .times(1);
    const client = new Client(integrationConfig, createMockIntegrationLogger());
    await expect(
      client.fetchScanDetail({ id: 199 } as RecentScanSummary),
    ).rejects.toThrow(/401/);
  });
});

describe('#fetchScanHostVulnerabilities', () => {
  test('should return a list of scan host vulnerabilities', async () => {
    recording = setupProjectRecording({
      directory: __dirname,
      name: 'fetchScanHostVulnerabilitiesValid',
    });

    const client = new Client(integrationConfig, createMockIntegrationLogger());
    const response = await client.fetchScanHostVulnerabilities(17, 1);
    expect(response).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          host_id: expect.any(Number),
          hostname: expect.any(String),
          plugin_family: expect.any(String),
          plugin_id: expect.any(Number),
          plugin_name: expect.any(String),
        }),
      ]),
    );
  });

  test('fetchScanHostVulnerabilities unknown error', async () => {
    recording = setupProjectRecording({
      directory: __dirname,
      name: 'fetchScanHostVulnerabilitiesUnknownError',
      options: {
        recordFailedRequests: true,
      },
    });
    recording.server
      .get(`${TENABLE_COM}/scans/6/hosts/2`)
      .intercept((_, res) => {
        res.sendStatus(500);
      })
      .times(integrationConfig.retryMaxAttempts as number);
    const client = new Client(integrationConfig, createMockIntegrationLogger());
    await expect(client.fetchScanHostVulnerabilities(6, 2)).rejects.toThrow(
      /500/,
    );
  });
});

describe('#fetchAssetVulnerabilityInfo', () => {
  test('should return info on an asset vulnerability', async () => {
    recording = setupProjectRecording({
      directory: __dirname,
      name: 'fetchAssetVulnerabilityInfoValid',
    });

    const client = new Client(integrationConfig, createMockIntegrationLogger());
    const response = await client.fetchAssetVulnerabilityInfo(
      '48cabb0b-f0fe-4db8-9a96-4fec60e4d4f4',
      { plugin_id: 10386 } as ScanHostVulnerability,
    );
    expect(response).toEqual(
      expect.objectContaining({
        description: expect.any(String),
        plugin_details: expect.any(Object),
        discovery: expect.any(Object),
        risk_information: expect.any(Object),
      }),
    );
  });
});

describe('#fetchContainers', () => {
  test('should return info on containers', async () => {
    recording = setupProjectRecording({
      directory: __dirname,
      name: 'fetchContainersValid',
    });

    const client = new Client(integrationConfig, createMockIntegrationLogger());
    const response = await client.fetchContainers();
    expect(response.length).not.toEqual([]);
  });
});

describe('#fetchReportByImageDigest', () => {
  test('should return info on image with vulnerabilities', async () => {
    recording = setupProjectRecording({
      directory: __dirname,
      name: 'fetchReportByImageDigestValid',
    });

    const client = new Client(integrationConfig, createMockIntegrationLogger());
    const response = await client.fetchReportByImageDigest(
      'sha256:5887b9b394294f66c2f8ef1b4bdddbdd7fcc4512df5ee470c5e74f6e8ed603c6',
    );
    expect(response).not.toEqual({});
  });
});

describe('#exportVulnerabilities', () => {
  test('should return an id of an export job it started', async () => {
    recording = setupProjectRecording({
      directory: __dirname,
      name: 'exportVulnerabilitiesValid',
    });

    const client = new Client(integrationConfig, createMockIntegrationLogger());
    const options: ExportVulnerabilitiesOptions = {
      num_assets: 50,
      filters: {
        first_found: 1009861200,
        state: [
          VulnerabilityState.Open,
          VulnerabilityState.Reopened,
          VulnerabilityState.Fixed,
        ],
      },
    };
    const response = await client.exportVulnerabilities(options);
    expect(response).not.toEqual({});
  });
});

describe('#fetchVulnerabilitiesExportStatus', () => {
  test('should return the status of an export job', async () => {
    recording = setupProjectRecording({
      directory: __dirname,
      name: 'fetchVulnerabilitiesExportStatusValid',
    });

    const client = new Client(integrationConfig, createMockIntegrationLogger());
    const response = await client.fetchVulnerabilitiesExportStatus(
      '7f50d16f-f125-47c6-901d-152586f4e23d',
    );
    expect(response).not.toEqual({});
  });
});

describe('#fetchVulnerabilitiesExportChunk', () => {
  test('should return the chunk of an export job given', async () => {
    recording = setupProjectRecording({
      directory: __dirname,
      name: 'fetchVulnerabilitiesExportChunkValid',
    });

    const client = new Client(integrationConfig, createMockIntegrationLogger());
    const response = await client.fetchVulnerabilitiesExportChunk(
      '7f50d16f-f125-47c6-901d-152586f4e23d',
      1,
    );
    expect(response).not.toEqual({});
  });
});

describe('#exportAssets', () => {
  test('should return an id of an export job it started', async () => {
    recording = setupProjectRecording({
      directory: __dirname,
      name: 'exportAssetsValid',
    });

    const client = new Client(integrationConfig, createMockIntegrationLogger());
    const options: ExportAssetsOptions = {
      chunk_size: 100,
    };
    const response = await client.exportAssets(options);
    expect(response).not.toEqual({});
  });
});

describe('#fetchAssetsExportStatus', () => {
  test('should return the status of an export job', async () => {
    recording = setupProjectRecording({
      directory: __dirname,
      name: 'fetchAssetsExportStatusValid',
    });

    const client = new Client(integrationConfig, createMockIntegrationLogger());
    const response = await client.fetchAssetsExportStatus(
      '5f565ebe-6055-411a-8985-2a07f8ae8549',
    );
    expect(response).not.toEqual({});
  });
});

describe('#fetchAssetsExportChunk', () => {
  test('should return the chunk of an export job given', async () => {
    recording = setupProjectRecording({
      directory: __dirname,
      name: 'fetchAssetsExportChunkValid',
    });

    const client = new Client(integrationConfig, createMockIntegrationLogger());
    const response = await client.fetchAssetsExportChunk(
      '5f565ebe-6055-411a-8985-2a07f8ae8549',
      1,
    );
    expect(response).not.toEqual({});
  });
});

describe('#fetchTenableData', () => {
  test('should return a full listing of container related findings', async () => {
    recording = setupProjectRecording({
      directory: __dirname,
      name: 'fetchTenableDataValid',
    });

    const client = new Client(integrationConfig, createMockIntegrationLogger());
    const response = await fetchTenableData(client);
    expect(response).not.toEqual({});
  }, 10000);
});

//   test('fetchScanHostVulnerabilities unknown error', async () => {
//     const scope = nock(`https://${TENABLE_COM}`)
//       .get('/scans/6/hosts/2')
//       .times(RETRY_MAX_ATTEMPTS - 1)
//       .reply(500);
//     const client = getClient();
//     await expect(client.fetchScanHostVulnerabilities(6, 2)).rejects.toThrow(
//       /500/,
//     );
//     scope.done();
//   });

//   test('fetchScanDetail unknown error', async () => {
//     const scope = nock(`https://${TENABLE_COM}`)
//       .get(
//         '/workbenches/assets/2aa49a6b-f17b-4b43-8953-58e2012f2fb3/vulnerabilities/10386/info',
//       )
//       .reply(401);
//     const client = getClient();
//     await expect(
//       client.fetchAssetVulnerabilityInfo(
//         '2aa49a6b-f17b-4b43-8953-58e2012f2fb3',
//         { plugin_id: 10386 } as ScanHostVulnerability,
//       ),
//     ).rejects.toThrow(/401/);
//     scope.done();
//   });

// describe('TenableClient data fetch', () => {
//   let client: TenableClient;

//   beforeAll(() => {
//     nock.back.fixtures = `${__dirname}/../../test/fixtures/`;
//     process.env.CI
//       ? nock.back.setMode('lockdown')
//       : nock.back.setMode('record');
//   });

//   beforeEach(() => {
//     client = getClient();
//   });

//   test('fetchScanDetail never executed', async () => {
//     const { nockDone } = await nock.back('scan-never-executed.json', {
//       before: prepareScope,
//     });

//     const scan = await client.fetchScanDetail({ id: 14 } as RecentScanSummary);
//     expect(scan).toMatchObject({
//       info: expect.any(Object),
//       hosts: undefined,
//       vulnerabilities: undefined,
//     } as RecentScanDetail);
//     nockDone();
//   });

//   test('fetchScanDetail forbidden', async () => {
//     const { nockDone } = await nock.back('scan-forbidden.json', {
//       before: prepareScope,
//     });

//     const scan = await client.fetchScanDetail({ id: 12 } as RecentScanSummary);
//     expect(scan).toBeUndefined();
//     nockDone();
//   });

//   test('fetchScanHostVulnerabilities 404', async () => {
//     const { nockDone } = await nock.back('vulnerabilities-not-found.json', {
//       before: prepareScope,
//     });

//     const vulnerabilities = await client.fetchScanHostVulnerabilities(19, 2000);
//     expect(vulnerabilities.length).toEqual(0);
//     nockDone();
//   });

//   test('fetchAssetVulnerabilityInfo 404', async () => {
//     const { nockDone } = await nock.back(
//       'asset-vulnerability-info-not-found.json',
//       {
//         before: prepareScope,
//       },
//     );

//     const info = await client.fetchAssetVulnerabilityInfo(
//       '2aa49a6b-f17b-4b43-8953-58e2012f2fb3',
//       { plugin_id: 11111 } as ScanHostVulnerability,
//     );
//     expect(info).toBeUndefined();
//     nockDone();
//   });

//   test('fetchReportByImageDigest image with no vulnerabilities', async () => {
//     const { nockDone } = await nock.back('container-report-no-vulns.json', {
//       before: prepareScope,
//     });

//     const response = await client.fetchReportByImageDigest(
//       'sha256:1edb77942782fc99d6b1ad53c78dd602ae5ee4f26e49edb49555faf749574ae9',
//     );
//     expect(response).not.toEqual({});
//     nockDone();
//   });

//   afterAll(() => {
//     nock.restore();
//   });
// });
