import { ScanClient } from './client';
import { integrationConfig } from '../../../test/config';
import { createMockIntegrationLogger } from '@jupiterone/integration-sdk-testing';
import { setupProjectRecording, Recording } from '../../../test/recording';
import { RecentScanSummary } from '../../tenable/types';
import { TENABLE_COM } from '../../../test/constants';

let recording: Recording;
afterEach(async () => {
  if (recording) {
    await recording.stop();
  }
});

describe('#fetchScans', () => {
  test('should return a list of scans', async () => {
    recording = setupProjectRecording({
      directory: __dirname,
      name: 'fetchScansValid',
    });

    const client = new ScanClient(
      integrationConfig,
      createMockIntegrationLogger(),
    );
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

describe('#fetchScanDetail', () => {
  test('should return a list of scans', async () => {
    recording = setupProjectRecording({
      directory: __dirname,
      name: 'fetchScanDetailValid',
    });

    const client = new ScanClient(
      integrationConfig,
      createMockIntegrationLogger(),
    );
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
    const client = new ScanClient(
      integrationConfig,
      createMockIntegrationLogger(),
    );
    await expect(
      client.fetchScanDetail({ id: 199 } as RecentScanSummary),
    ).rejects.toThrow(/401/);
  });
});
