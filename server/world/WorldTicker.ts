import { GameServer } from '../GameServer.js'
import { WorldEvents } from './WorldEvents.js'

export class WorldTicker {
  public gameServer: GameServer
  public lastSurvivalUpdate: number = +new Date()
  public lastActionChange: number = +new Date()

  public constructor(gameServer: GameServer) {
    this.gameServer = gameServer
  }

  // public preCollisionUpdate() {
  //     for(let entity of this.gameServer.players.values()) {
  //         if(entity.direction > 0)
  //             CollisionUtils.scheduleCollision(entity);
  //     }

  // }
  public gameUpdate() {
    this.gameServer.eventManager.loop()
    /**
     * Updating entities then sending entityUpdate
     */
    this.gameServer.worldDeleter.queryDelete()

    for (const entity of this.gameServer.livingEntities) entity.update()
    for (const player of this.gameServer.players.values()) player.syncUpdate()
    for (const entity of this.gameServer.livingEntities) entity.updateBefore()
  }
  public fixedUpdate() {
    const now = +new Date()

    if (now - this.lastSurvivalUpdate >= 4999) {
      for (const player of this.gameServer.players.values()) player.survivalUpdate()

      WorldEvents.sendLeaderboardUpdate(this.gameServer)
      this.lastSurvivalUpdate = now
    }

    for (const entity of this.gameServer.staticEntities) entity.update()

    this.gameServer.worldSpawner.spawnEntities()
    this.gameServer.worldCycle.update()
  }
}
