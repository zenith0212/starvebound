import { Player } from '../entity/Player.js'
import { EntityType } from '../enums/EntityType.js'
import { ServerPacketTypeBinary, ServerPacketTypeJson } from '../enums/PacketType.js'
import { GameServer } from '../GameServer.js'
import { IHandshake } from '../models/IHandshake.js'
import { ConnectionPlayer } from '../network/ConnectionPlayer.js'
import { Utils } from '../utils/Utils.js'
import { Entity } from '../entity/Entity.js'
import { EntityAbstractType } from '../utils/EntityUtils.js'
import { DieReason } from '../enums/DieReason.js'
import { BufferWriter } from '../utils/bufferReader.js'
import { Box } from '../entity/Box.js'
import { Loggers } from '../logs/Logger.js'
import { Building } from '../entity/Building.js'
import { TokenScore } from '../utils/tokenManager.js'
import serverConfig from '../settings/serverconfig.json' assert { type: 'json' }
import { ItemIds } from '../enums/ItemIds.js'

export class WorldEvents {
  /**
   * Calls when socket verified and joined
   */
  public static registerPlayer(controller: ConnectionPlayer, handshake: IHandshake, tokenScore: TokenScore): Player {
    const gameServer: GameServer = controller.gameServer

    const id = gameServer.playerPool.nextId()

    const player = new Player(controller, id, gameServer, tokenScore, handshake.token, handshake.token_id)

    player.radius = controller.gameServer.gameConfiguration.entities.player.hitbox_size
    player.max_speed = controller.gameServer.gameConfiguration.entities.player.speed_forest_default
    player.speed = controller.gameServer.gameConfiguration.entities.player.speed_forest_default

    const pos = gameServer.worldSpawner.findFirstLocation()

    let x = pos != null ? pos[0] : 2500,
      y = pos != null ? pos[1] : 2500,
      angle = 0

    //cy = 1250 + Math.floor(Math.random() * (this.gameServer.gameConfiguration.world.Height - 2500));
    //let x = 2500 + Math.floor(Math.random() * 10000 - 2500), y =2500 + Math.floor(Math.random() * 10000 - 2500) , angle = 0;

    /**
     * Adding player to gameServer
     */
    gameServer.players.set(id, player)
    gameServer.initLivingEntity(player)

    player.initOwner(player)
    player.gameProfile.name = handshake.name
    player.abstractType = EntityAbstractType.LIVING
    //player.isAdmin = true;
    //  if (serverConfig.viplist.price2.has(player.controller.userIp)) player.isAdmin = true, player.ism = true;

    //player.isAdmin = true;
    // if(ENV_MODE == MODES.TEST || ENV_MODE == MODES.DEV) {
    //     x = 8300;
    //     y = 5300;
    //     player.isAdmin = true;
    // }w
    // x = 9600;
    // y = 9800;

    //

    /**
     * Init entity stuff
     */
    player.initEntityData(x, y, angle, EntityType.PLAYERS, false)

    /**
     * Sending to socket handshake response
     */

    player.controller.sendJSON([
      ServerPacketTypeJson.Handshake,
      ...Utils.backInHandshake(player, handshake, tokenScore),
    ])

    /**
         * We sends everyone that player Joinedand after you add this, can you add underneath kills=fireflies

#FF69B4: DM: goozrr ON DISCORD FOR REFUND OR PROBLEMS
then make kit booster hammer 1 instead of 9999
         */
    player.controller.sendJSON([
      ServerPacketTypeJson.ServerDescription,
      `#FBDA2C ====================\n#ff0000 Welcome to StarveBound\n#ff0000 Owner Firenz Developer Aquti, Octo, RD, Holmes, SoowZz,Helpy, Joyiaq\n#00ffaf Kills = Items\n#3454FB Our Discord: discord.gg/https://discord.gg/starvebound ENJOY\n#FBDA2C ====================`,
    ])

    const Starter_Kit = (serverConfig.starting_kit as [string, number][]) || []
    for (const [item, amount] of Starter_Kit) {
      player.inventory.addItem(ItemIds[item as keyof typeof ItemIds], amount)
    }

    gameServer.broadcastJSON(
      [
        ServerPacketTypeJson.NewPlayer,
        player.playerId,
        player.gameProfile.name,
        player.gameProfile.skin,
        player.gameProfile.accessory,
        player.gameProfile.baglook,
        player.gameProfile.book,
        player.gameProfile.box,
        player.gameProfile.deadBox,
        player.gameProfile.kills,
      ],
      player.playerId,
    )

    if (player.bag) player.inventory.getBag()

    Loggers.game.info(
      `Player with Id ${player.id} joined as ${player.gameProfile.name} with ${player.controller.userIp}`,
    )
    return player
  }

  /**
   * LeaderboardUpdate calls every 5secs
   */

  public static sendLeaderboardUpdate(gameServer: GameServer) {
    const playersArray: object[] = []

    for (const player of gameServer.players.values()) {
      playersArray.push([player.playerId, player.gameProfile.score])
      player.gameServer.broadcastBinary(
        Buffer.from([
          ServerPacketTypeBinary.VerifiedAccount,
          player.id,
          player.gameProfile.skin,
          player.gameProfile.accessory,
          player.gameProfile.baglook,
          player.gameProfile.book,
          player.gameProfile.box,
          player.gameProfile.deadBox,
          player.gameProfile.kills,
        ]),
      )
    }
    gameServer.broadcastJSON([ServerPacketTypeJson.LeaderboardUpdate, playersArray])
  }

  public static onTotemBreak(entity: Building) {
    const writer = new BufferWriter(1)

    writer.writeUInt8(ServerPacketTypeBinary.TeamIsDestroyed)

    for (const player of entity.data) {
      player.controller.sendBinary(writer.toBuffer())

      player.totemFactory = null
      player.lastTotemCooldown = performance.now()
    }
  }

  public static addBox(owner: Player | Entity, type: number, loot: any) {
    const gameServer: GameServer = owner.gameServer
    const id: number = gameServer.entityPool.nextId()

    const box = new Box(id, owner, gameServer)

    const info =
      owner instanceof Player
        ? type == EntityType.CRATE
          ? owner.gameProfile.box
          : owner.gameProfile.deadBox
        : Utils.getBoxSkin(owner.type)

    box.onSpawn(owner.x, owner.y, owner.angle, type, info)

    box.radius = 30
    for (const v of loot) box.setLoot(v[0], v[1])

    box.initOwner(box)

    gameServer.initLivingEntity(box)
  }

  /**
   * Player died event
   */

  public static playerDied(gameServer: GameServer, entity: Player) {
    if (!(!entity.ownerClass.totemFactory || entity.ownerClass.id == entity.ownerClass.totemFactory.playerId)) {
      const writer = new BufferWriter(2)
      writer.writeUInt8(ServerPacketTypeBinary.ExcludeTeam)
      writer.writeUInt8(entity.ownerClass.id)
      for (const player of entity.ownerClass.totemFactory.data) {
        player.controller.sendBinary(writer.toBuffer())
      }
      entity.ownerClass.totemFactory.data = entity.ownerClass.totemFactory.data.filter(
        (e: any) => e.id != entity.ownerClass.id,
      )
      entity.ownerClass.totemFactory = null
    }
    entity.controller.sendJSON([
      ServerPacketTypeJson.KillPlayer,
      DieReason.PLAYER_KILLED,
      entity.gameProfile.score,
      entity.gameProfile.kills,
    ])
    entity.controller.closeSocket()
    gameServer.worldDeleter.initEntity(entity, 'player')
    gameServer.players.delete(entity.id)
    WorldEvents.addBox(entity, EntityType.DEAD_BOX, entity.inventory.toArray())
    if (entity.tokenScore.session_id === entity.gameProfile.token_id) {
      entity.tokenScore.score += entity.gameProfile.score
      entity.tokenScore.session_id = 0
      gameServer.tokenManager.leaveToken(entity.tokenScore)
    }
    gameServer.leaderboard.writeLb({
      name: entity.gameProfile.name,
      score: Math.floor(entity.gameProfile.score),
      kills: Math.floor(entity.gameProfile.kills),
      days: Math.floor(entity.gameProfile.days),
    })
  }

  /**
   * Entity died event
   */

  public static entityDied(gameServer: GameServer, entity: Entity) {}
}
