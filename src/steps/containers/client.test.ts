import { createMockIntegrationLogger } from '@jupiterone/integration-sdk-testing';
import { integrationConfig } from '../../../test/config';
import { Recording, setupProjectRecording } from '../../../test/recording';
import { ContainerClient } from './client';

let recording: Recording;
afterEach(async () => {
  if (recording) {
    await recording.stop();
  }
});

describe('#fetchContainers', () => {
  test('should return info on containers', async () => {
    recording = setupProjectRecording({
      directory: __dirname,
      name: 'fetchContainersValid',
    });

    const client = new ContainerClient(
      integrationConfig,
      createMockIntegrationLogger(),
    );
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

    const client = new ContainerClient(
      integrationConfig,
      createMockIntegrationLogger(),
    );
    const response = await client.fetchReportByImageDigest(
      'sha256:5887b9b394294f66c2f8ef1b4bdddbdd7fcc4512df5ee470c5e74f6e8ed603c6',
    );
    expect(response).not.toEqual({});
  });
});
