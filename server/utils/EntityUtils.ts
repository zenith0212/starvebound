import serverSettings from '../settings/serverconfig.json' assert { type: 'json' }
import { EntityType } from '../enums/EntityType.js'

const entityList = serverSettings.entities

export enum EntityAbstractType {
  LIVING,
  STATIC,
  UPDATABLE,
  DEFAULT,
}

export function getEntity(type: number) {
  let currentEntity = null

  for (const entity in entityList) {
    if (EntityType[entity.toUpperCase() as keyof typeof EntityType] === type) {
      currentEntity = (entityList as any)[entity as string]
    }
  }

  return currentEntity
}
