import { Animal } from '../entity/Animal.js'
import { Entity } from '../entity/Entity.js'
import { MapObject } from '../entity/MapObject.js'
import { Player } from '../entity/Player.js'
import { GameServer } from '../GameServer.js'
import { Utils } from './Utils.js'

import { Building } from '../entity/Building.js'

export class QueryManager {
  public gameServer: GameServer

  constructor(gameServer: GameServer) {
    this.gameServer = gameServer
  }
  public pointInRect(x: number, y: number, x1: number, x2: number, y1: number, y2: number): boolean {
    return x > x1 && x < x2 && y > y1 && y < y2
  }
  public queryRectLiving(x: number, y: number, width: number, height: number): Entity[] {
    const arrayWithObjects: Entity[] = []
    const px = x - width / 2
    const py = y - height / 2
    for (const entity of this.gameServer.updatableEntities) {
      if (entity.x >= px && entity.x <= px + width && entity.y >= py && entity.y <= py + height)
        arrayWithObjects.push(entity)
    }

    return arrayWithObjects
  }
  public queryRectPlayers(x: number, y: number, width: number, height: number): Player[] {
    const arrayWithObjects: Player[] = []
    const px = x - width / 2
    const py = y - height / 2
    for (const entity of this.gameServer.players.values()) {
      if (entity.x >= px && entity.x <= px + width && entity.y >= py && entity.y <= py + height)
        arrayWithObjects.push(entity)
    }

    return arrayWithObjects
  }
  public queryRect(x: number, y: number, width: number, height: number): (Entity | MapObject | Animal)[] {
    const arrayWithObjects: (Entity | MapObject)[] = []
    const px = x - width / 2
    const py = y - height / 2

    for (const entity of this.gameServer.entities) {
      if (entity.x >= px && entity.x <= px + width && entity.y >= py && entity.y <= py + height)
        arrayWithObjects.push(entity)
    }

    return arrayWithObjects
  }

  public queryCircle(x: number, y: number, radius: number): (Entity | MapObject | Animal)[] {
    const arr = []

    for (const obj of this.gameServer.entities) {
      const dx = Math.abs(x - obj.x)
      const dy = Math.abs(y - obj.y)
      if (Math.hypot(dx, dy) <= radius + obj.radius) arr.push(obj)
    }

    return arr
  }

  public queryBuildings(x: number, y: number, radius: number): Building[] {
    const arr: Building[] = []

    for (const obj of this.gameServer.entities) {
      if (!Utils.isBuilding(obj)) continue

      const dx = Math.abs(x - obj.x)
      const dy = Math.abs(y - obj.y)

      if (Math.hypot(dx, dy) <= radius + obj.radius) arr.push(obj)
    }

    return arr
  }

  public queryPlayers(x: number, y: number, radius: number): Player[] {
    const playersArr: Player[] = []

    for (const obj of this.gameServer.players.values()) {
      const dx = Math.abs(x - obj.x)
      const dy = Math.abs(y - obj.y)
      if (Math.hypot(dx, dy) <= radius + obj.radius) playersArr.push(obj)
    }

    return playersArr
  }
}
