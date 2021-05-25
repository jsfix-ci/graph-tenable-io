import { Client } from './client';
import { integrationConfig } from '../../test/config';
import { createMockIntegrationLogger } from '@jupiterone/integration-sdk-testing';
import { setupProjectRecording, Recording } from '../../test/recording';

let recording: Recording;
afterEach(async () => {
  if (recording) {
    await recording.stop();
  }
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
