import {
  Entity,
  parseTimePropertyValue,
} from '@jupiterone/integration-sdk-core';
import { RecentScanSummary } from '../../tenable/types';
import { generateEntityKey } from '../../utils/generateKey';
import { entities } from './constants';

export function createScanEntity(data: RecentScanSummary): Entity {
  return {
    _key: generateEntityKey(entities.SCAN._type, data.id),
    _type: entities.SCAN._type,
    _class: entities.SCAN._class,
    _rawData: [{ name: 'default', rawData: data }],
    id: data.id.toString(),
    legacy: data.legacy,
    permissions: data.permissions,
    type: data.type,
    read: data.read,
    lastModificationDate: parseTimePropertyValue(data.last_modification_date),
    creationDate: parseTimePropertyValue(data.creation_date),
    status: data.status,
    uuid: data.uuid,
    shared: data.shared,
    userPermissions: data.user_permissions,
    owner: data.owner,
    scheduleUuid: data.schedule_uuid,
    timezone: data.timezone,
    rrules: data.rrules,
    starttime: data.starttime,
    enabled: data.enabled,
    control: data.control,
    name: data.name,
  };
}
