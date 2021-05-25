import * as dotenv from 'dotenv';
import * as path from 'path';
import { IntegrationConfig } from '../src/types';

if (process.env.LOAD_ENV) {
  dotenv.config({
    path: path.join(__dirname, '../.env'),
  });
}
const DEFAULT_ACCESS_KEY = 'dummy-tenable-access-key';
const DEFAULT_SECRET_KEY = 'dummy-tenable-secret-key';

export const integrationConfig: IntegrationConfig = {
  accessKey: process.env.ACCESS_KEY || DEFAULT_ACCESS_KEY,
  secretKey: process.env.SECRET_KEY || DEFAULT_SECRET_KEY,
};
