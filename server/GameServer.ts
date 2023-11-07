import * as http from 'http'
import { Loggers } from './logs/Logger.js'
import { SocketServer } from './network/SocketServer.js'
import os from 'os'
import { WorldTicker } from './world/WorldTicker.js'
import NanoTimer from 'nanotimer'
import { Player } from './entity/Player.js'
import { IdPool } from './utils/idPool.js'
import { Entity } from './entity/Entity.js'
import { MapObject } from './entity/MapObject.js'
import { WorldGenerator } from './world/WorldGenerator.js'
import { QueryManager } from './utils/queryManager.js'
import { TokenManager } from './utils/tokenManager.js'
import { ItemUtils } from './utils/itemsmanager.js'
import { Animal } from './entity/Animal.js'
import { WorldSpawner } from './world/WorldSpawner.js'
import { ServerPacketTypeJson } from './enums/PacketType.js'
import { WorldDeleter } from './world/WorldDeleter.js'
import craftData from './settings/crafts.json' assert { type: 'json' }
import { Craft } from './craft/CraftManager.js'
import { GlobalDataAnalyzer } from './protection/GlobalDataAnalyzer.js'
import { LeaderboardL } from './leaderboard/LeaderboardL.js'
import { WorldCycle } from './world/WorldCycle.js'
import { EventManager } from './server/EventManager.js'
import fs from 'fs'
import { ItemIds } from './enums/ItemIds.js'
import GameConfig from './settings/serverconfig.json' assert { type: 'json' }
import { PacketObscure } from './network/PacketObscure.js'

export class GameServer {
  public readonly httpServer: http.Server
  public socketServer: SocketServer
  public worldTicker: WorldTicker
  public worldGenerator: WorldGenerator
  public worldDeleter: WorldDeleter
  public worldCycle: WorldCycle
  public queryManager: QueryManager
  public tokenManager: TokenManager

  public client: any

  public players: Map<number, Player>
  public entityPool: IdPool
  public playerPool: IdPool
  public mobPool: IdPool
  public worldSpawner: WorldSpawner
  public leaderboard: LeaderboardL

  public entities: (MapObject | Entity | Animal)[]
  public livingEntities: Entity[]
  public updatableEntities: Entity[]
  public staticEntities: (MapObject | Entity | Animal)[]

  public crafts: Craft[]
  public Boosters: any
  public globalAnalyzer: GlobalDataAnalyzer
  public eventManager: EventManager
  public gameConfiguration: any
  public static SERVER_TPS = 10
  public tokens_allowed: any
  controller: any
  inventory: any

  public constructor(httpServer: any = null) {
    this.leaderboard = new LeaderboardL(this)
    this.loadConfiguration()

    Loggers.app.info(`Preparing GameInstance on ({0} / {1} {2})`, os.platform(), os.type(), os.release())

    this.tokens_allowed = []

    /**
     * Do base constructors
     */
    this.players = new Map()
    this.entityPool = new IdPool(175)
    this.playerPool = new IdPool(1)

    this.mobPool = new IdPool(
      this.gameConfiguration.server.playerLimit * this.gameConfiguration.server.buildingLimit + 1000,
    )

    /**
     * Entities initializer
     */
    this.entities = []
    this.livingEntities = []
    this.staticEntities = []
    this.updatableEntities = []
    this.Boosters = []

    /**
     * Setting http server , should be used for queries / api
     */
    this.httpServer = httpServer

    /**
     * Setting socket server
     */
    this.socketServer = new SocketServer(this)

    /**
     * Creating ticker for gameUpdates
     */
    this.worldTicker = new WorldTicker(this)

    /**
     * Creating generation stuff.
     */
    this.worldGenerator = new WorldGenerator(this)
    this.worldGenerator.generateWorld(this.gameConfiguration.world.map)
    this.worldCycle = new WorldCycle(this)

    this.worldSpawner = new WorldSpawner(this)

    this.eventManager = new EventManager(this, import.meta.url)
    /**
     * World Deleter stuff
     */
    this.worldDeleter = new WorldDeleter(this)

    /**
     * Creatin QueryManager for Entity stuff
     */
    this.queryManager = new QueryManager(this)

    /**
     * Creating TokenManager for Player score stuff
     */
    this.tokenManager = new TokenManager(this)

    this.crafts = []
    /**
     * Creating crafts inst
     */
    for (const craftInst of craftData) {
      this.crafts.push(new Craft(craftInst))
    }

    /**
     * Implementing nanoTimer intervals
     */
    this.setTicker()

    const asItem = ItemUtils.getItemById(ItemIds.REIDITE_SPIKE)

    this.globalAnalyzer = new GlobalDataAnalyzer(this)
  }

  public loadConfiguration() {
    this.gameConfiguration = GameConfig
  }

  public setTicker() {
    /**
     * GameWorld fixedUpdate , leaderboard/survival etc shit here
     */

    new NanoTimer(false).setInterval(
      () => {
        this.worldTicker.fixedUpdate()
      },
      '',
      1000 + 'm',
    )
    // setInterval(() => {this.worldTicker.fixedUpdate()},10);
    /**
     * GameWorld update , tps / collision updates here
     */

    new NanoTimer(false).setInterval(
      () => {
        this.worldTicker.gameUpdate()
      },
      '',
      Math.floor(1000 / GameServer.SERVER_TPS) * 1000 * 1000 + 'n',
    )
  }

  /**
   * Setting LivingEntity inst
   */
  public initLivingEntity(entity: Entity) {
    this.livingEntities.push(entity)
    this.initEntityInst(entity)
    this.initUpdatableEntity(entity)
  }
  /**
   * Remove LivingEntity inst
   */
  public removeLivingEntity(entity: Entity, isPlayer: boolean = false) {
    const newList = this.livingEntities.filter((e) => e.id != entity.id)
    this.livingEntities = newList

    this.removeUpdatableEntity(entity)
    this.removeEntity(entity, isPlayer)
  }
  /**
   * Remove Entity inst
   */
  public removeEntity(entity: Entity, isPlayer: boolean = false) {
    const newList = this.entities.filter((e) => e.id != entity.id)
    this.entities = newList
    if (!isPlayer) this.entityPool.dispose(entity.id)
  }

  public getPlayer(id: number): Player | undefined {
    return this.players.get(id)
  }

  public getPlayerByToken(token: string, token_id: string) {
    return [...this.players.values()].find((e) => e.gameProfile.token == token && e.gameProfile.token_id == token_id)
  }

  public getEntity(id: number): any {
    return this.entities.find((ent) => ent.id == id)
  }
  /**
   * Remove Entity inst
   */
  public removeUpdatableEntity(entity: Entity) {
    const newList = this.updatableEntities.filter((e) => e.id != entity.id)
    this.updatableEntities = newList
  }
  /**
   * Setting Entity inst
   */
  public initEntityInst(entity: MapObject | Entity) {
    this.entities.push(entity)
  }
  /**
   * Setting StaticEntity Inst
   */
  public initStaticEntity(entity: MapObject | Entity) {
    this.staticEntities.push(entity)
    this.initEntityInst(entity)
  }
  /**
   * Setting UpdatableEntity inst
   */
  public initUpdatableEntity(entity: Entity) {
    this.updatableEntities.push(entity)
  }
  /**
   * Sending messages to all players as Json
   */

  public broadcastJSON(packet: any[], filterId: number = -1) {
    for (const player of this.players.values()) if (player.playerId != filterId) player.controller.sendJSON(packet)
  }
  public broadcastConsoleStaff(message: string) {
    for (const player of this.players.values())
      player.controller.sendJSON([ServerPacketTypeJson.ConsoleCommandResponse, message])
  }
  public broadcastBinary(packet: any, filterId: number = -1) {
    for (const player of this.players.values()) if (player.playerId != filterId) player.controller.sendBinary(packet)
  }
  public Change_Name(id: number, name: string) {
    for (const player of this.players.values()) player.controller.sendJSON([ServerPacketTypeJson.CHANGE_NAME, id, name])
  }
}
