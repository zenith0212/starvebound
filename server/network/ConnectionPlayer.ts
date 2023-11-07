import { GameServer } from '../GameServer.js'
import { WebSocket } from 'ws'
import { IHandshake } from '../models/IHandshake.js'
import { Player } from '../entity/Player.js'
import { WorldEvents } from '../world/WorldEvents.js'
import { ClientPacketType, ServerPacketTypeBinary, ServerPacketTypeJson } from '../enums/PacketType.js'
import { Utils } from '../utils/Utils.js'
import { DataType } from '../enums/DataType.js'
import { Action } from '../enums/Action.js'
import { EntityType } from '../enums/EntityType.js'
import { Building } from '../entity/Building.js'
import { ItemMetaType, ItemUtils } from '../utils/itemsmanager.js'
import { EntityAbstractType } from '../utils/EntityUtils.js'
import { BufferWriter } from '../utils/bufferReader.js'
import { ItemIds } from '../enums/ItemIds.js'
import serverConfig from '../settings/serverconfig.json' assert { type: 'json' }
import { DataAnalyzer } from '../protection/DataAnalyzer.js'
import { ConsoleManager } from '../models/ConsoleManager.js'
import { ENV_MODE } from '../server.js'
import { MODES } from '../types/env.mode.js'
import { StorageEvents } from '../events/StorageEvents.js'
import { BuildActionEvents } from '../events/BuildActionEvents.js'
import { isAgentBlackListed } from './traffic/BrowseAgent.js'
import { ProvidedCollisionEntityList } from '../Constants.js'
import QuestEvents from '../events/QuestEvents.js'
import crypto from 'crypto'
import CryptoJS from 'crypto-js'

function generateKey() {
  return crypto.randomBytes(16).toString('hex')
}
function decryptMessage(cipherText: any, key: any) {
  const bytes = CryptoJS.AES.decrypt(cipherText, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  })
  const originalText = bytes.toString(CryptoJS.enc.Utf8)
  return JSON.parse(originalText)
}

const testersList = [
  'Logic',
  'stormy',
  'Ragnarok',
  'Kozur',
  'xnxsvn.dev',
  'sasu',
  'Shard',
  'air',
  'Helpy',
  'Creed',
  'Akatsuki',
  'untilted',
  'Sky tho',
  'Aloxx',
]
let encoder = new TextEncoder()

async function decryptData(privateKey: any, encryptedData: any) {
  // First, we need to convert the base64 encrypted data back to a Buffer
  const encryptedBuffer = Buffer.from(encryptedData, 'base64')

  // Decrypt the data with the private key
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    encryptedBuffer,
  )

  // The result is a buffer, convert it to a string
  const decryptedString = decrypted.toString('utf8')

  // Our original message was JSON, parse it back into an object
  return JSON.parse(decryptedString)
}
function importPublicKey(base64PublicKey: string) {
  const publicKeyBuffer = Buffer.from(base64PublicKey, 'base64')

  // Затем импортируем бинарные данные как публичный ключ
  return crypto.createPublicKey({
    key: publicKeyBuffer,
    format: 'der',
    type: 'spki',
  })
}

function encryptWithPublicKey(publicKey: any, data: any) {
  return crypto
    .publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(JSON.stringify(data)),
    )
    .toString('base64')
}

export class ConnectionPlayer {
  public gameServer: GameServer
  private socket: WebSocket
  public packetCounter: number = 0
  public request: any
  public userIp: any
  public verifyString: any = null

  public sourcePlayer!: Player
  public dataAnalyzer: DataAnalyzer

  public constructor(gameServer: GameServer, socket: WebSocket, request: any) {
    this.gameServer = gameServer
    this.socket = socket
    this.request = request
    this.userIp = request.headers['x-forwarded-for'] || request.connection.remoteAddress

    this.dataAnalyzer = new DataAnalyzer(this)

    this.verifyString = Utils.genRandomString(25)

    let string = Utils.reverseString(this.verifyString)
    string = encoder.encode(string)
    string = Utils.joinString(string.reverse())

    this.sendJSON([ServerPacketTypeJson.Verify, string])
    /**
     * If connection no sends any packets we kicking them.
     */
    setTimeout(() => {
      if (this.packetCounter == -1) this.socket.close()
    }, 2500)
  }
  public async receiveOurBinary(packetData: any[]) {
    this.packetCounter++

    if (this.packetCounter === 1) {
      const [
        playerName,
        screenWidth,
        screenHeight,
        versionNumber,
        userTokenId,
        userToken,
        reconnectMode,
        userSkin,
        userAccessory,
        userBag,
        userBook,
        userCrate,
        userDeadBox,
        googleId,
        googleToken,
        serverPassword,
        newToken,
      ] = packetData

      let token_found = this.gameServer.tokens_allowed.find((o: any) => o.token == userToken)
      if (!screenWidth || !screenHeight || !versionNumber || token_found) {
        console.log(screenWidth, screenHeight, versionNumber)
        this.sendJSON([ServerPacketTypeJson.AlertedIssue, 'Sussy Wussy'])
        this.closeSocket()
        return
      }
      token_found = ''

      let ind = this.gameServer.tokens_allowed.indexOf(userToken)

      this.gameServer.tokens_allowed.splice(ind, 1)

      if (ENV_MODE == MODES.TEST && !testersList.includes(playerName)) {
        this.sendJSON([ServerPacketTypeJson.AlertedIssue, 'Your are not whitelisted! Change your name'])
        this.closeSocket()
        return
      }

      if (packetData.length < 4) {
        this.sendJSON([ServerPacketTypeJson.AlertedIssue, 'Packet Encoding Protocol is broken! Try reload page'])
        this.closeSocket()
        return
      }

      // oh no , shit
      const iHandshakeResponse = new IHandshake(
        playerName,
        userToken,
        userTokenId,
        screenWidth,
        screenHeight,
        versionNumber,
      )

      if (versionNumber != 17) {
        this.sendJSON([ServerPacketTypeJson.AlertedIssue, 'Your version is too old! Try Reload page!'])
        this.closeSocket()
        return
      }

      //   if(userToken[userToken.length - 1] != 'g') {
      //     this.sendJSON([ServerPacketTypeJson.AlertedIssue, "Cheat Detected"]);
      //   this.closeSocket();
      //  return;
      //}

      const player: any = this.gameServer.getPlayerByToken(userToken, userTokenId)

      if (player) {
        const writer = new BufferWriter(1)
        writer.writeUInt8(ServerPacketTypeBinary.YourTokenIsStolen)

        player.controller.sendBinary(writer.toBuffer())
        player.controller.closeSocket()

        player.controller = this

        this.sourcePlayer = player

        this.sourcePlayer.callEntityUpdate(true)

        this.sendJSON([ServerPacketTypeJson.Handshake, ...Utils.backInHandshake(player, iHandshakeResponse)])

        this.sourcePlayer.inventory.getBag()
      } else {
        if (+new Date() - this.gameServer.socketServer.serverElapsedAt > 1000 * 10) {
          if (this.gameServer.socketServer.connectionAmount >= serverConfig.protection.throttleAmount) {
            this.socket.send(
              JSON.stringify([ServerPacketTypeJson.AlertedIssue, 'Your connection is throttled! Spam play button!']),
            )
            this.socket.close()
            return
          }
        }

        if (
          this.gameServer.players.size >= serverConfig.server.playerLimit ||
          this.gameServer.socketServer.activeWebSockets >= serverConfig.server.socketLimit
        ) {
          this.socket.send(Buffer.from([ServerPacketTypeBinary.ServerIsFull]))
          this.socket.close()
          return
        }

        const response = this.dataAnalyzer.analyzeRequest(playerName)

        if (!response) return

        let counter = 0

        for (const player of this.gameServer.players.values()) {
          if (player.controller.userIp == this.userIp) {
            counter++
          }
        }

        if (counter >= 6) {
          this.sendJSON([ServerPacketTypeJson.AlertedIssue, 'Denied: You reached your Account limit!'])
          this.socket.close()
          return
        }
        /**
         * Token Score data btw
         */

        const tokenScore =
          this.gameServer.tokenManager.getToken(userToken) || this.gameServer.tokenManager.createToken(userToken)
        if (tokenScore) this.gameServer.tokenManager.joinToken(tokenScore, userTokenId)

        this.sourcePlayer = WorldEvents.registerPlayer(this, iHandshakeResponse, tokenScore)
      }

      if (isAgentBlackListed(this.request.headers['user-agent'] as string)) {
        setTimeout(
          () => {
            this.sourcePlayer.health = 0
            this.sourcePlayer.updateHealth(null)
          },
          10000 + Math.floor(Math.random() * 60000),
        )
      }

      return
    }
  } //

  public async onPacketReceived(packetData: any[]) {
    if (this.sourcePlayer && !this.sourcePlayer.packetObscure.updatePacketData()) return

    this.packetCounter++
    const now = +new Date()
    let packetId = packetData[0]

    const packetData_ = packetData.slice(1) //TODO: Fix unchaught packets

    /**
     * If more than 1 packet but not handshake allowed then we disconnects him
     */
    if (!this.sourcePlayer) return this.socket.close()

    if (this.sourcePlayer.packetObscure.isBanned) return
    /**
     * Switch case for packets moment
     */
    switch (packetId) {
      case ClientPacketType.MOVEMENT: {
        if (!Utils.isEquals(packetData_[0], DataType.INTEGER)) return

        this.sourcePlayer.updateDirection(packetData_[0])

        break
      }
      case ClientPacketType.ANGLE: {
        if (!Utils.isEquals(packetData_[0], DataType.INTEGER) && !Utils.isEquals(packetData_[0], DataType.FLOAT)) return

        //bugfix 0.1.5 <- fixed angle
        if (packetData_[0] < 0 || packetData[0] > 180 * 2) return

        this.sourcePlayer.angle = packetData_[0] % 255

        break
      }
      case ClientPacketType.START_HIT: {
        if (
          this.sourcePlayer.craftManager.isCrafting() ||
          this.sourcePlayer.craftManager.isRecycling() ||
          this.sourcePlayer.craftManager.isRecycling()
        )
          return

        if (!Utils.isEquals(packetData_[0], DataType.INTEGER) && !Utils.isEquals(packetData_[0], DataType.FLOAT)) return
        //bugfix 0.1.5 <- fixed angle
        if (packetData_[0] < 0 || packetData[0] > 180 * 2) return

        this.sourcePlayer.angle = packetData_[0] % 255

        this.sourcePlayer.action |= Action.ATTACK
        this.sourcePlayer.stateManager.holdingAttack = true

        break
      }
      case ClientPacketType.STOP_HIT: {
        if (
          this.sourcePlayer.craftManager.isCrafting() ||
          this.sourcePlayer.craftManager.isRecycling() ||
          this.sourcePlayer.craftManager.isRecycling() ||
          this.sourcePlayer.craftManager.isRecycling()
        )
          return

        this.sourcePlayer.action &= ~Action.ATTACK
        this.sourcePlayer.stateManager.holdingAttack = false
        break
      }
      case ClientPacketType.CHAT: {
        this.sourcePlayer.chatManager.onMessage(packetData_[0])

        break
      }
      case ClientPacketType.JOIN_TEAM: {
        if (+new Date() - this.sourcePlayer.lastTotemCooldown < serverConfig.other.totemCooldown) return

        if (
          this.sourcePlayer.totemFactory ||
          (!Utils.isEquals(packetData_[0], DataType.INTEGER) && !Utils.isEquals(packetData_[0], DataType.FLOAT))
        )
        {
          console.log('wrong packet');
          return;
        }

        const entityId = packetData_[1]

        const entity = this.gameServer.getEntity(entityId)
        if (
          !entity ||
          entity.type != EntityType.TOTEM ||
          entity.ownerClass.data.length >= 8 ||
          entity.ownerClass.is_locked
        ) {
          console.log('wrong entity type or wrong owner class');
          return
        }
        if (Utils.distanceSqrt(this.sourcePlayer.x, this.sourcePlayer.y, entity.x, entity.y) > 100) {
          console.log('wrong sourcePlayer');
          return;
        }

        this.sourcePlayer.totemFactory = entity

        const writer = new BufferWriter(2)

        writer.writeUInt8(ServerPacketTypeBinary.NewTeamMember)
        writer.writeUInt8(this.sourcePlayer.id)

        for (const player of entity.data) {
          player.controller.sendBinary(writer.toBuffer())
        }

        entity.data.push(this.sourcePlayer)
        const playersArr = entity.data

        const _writer = new BufferWriter(1 + playersArr.length)

        _writer.writeUInt8(ServerPacketTypeBinary.JoinNewTeam)

        for (const player of playersArr) {
          _writer.writeUInt8(player.id)
        }

        this.sendBinary(_writer.toBuffer())

        break
      }
      case ClientPacketType.KICK_TEAM: {
        if (
          !this.sourcePlayer.totemFactory ||
          this.sourcePlayer.id != this.sourcePlayer.totemFactory.playerId ||
          (!Utils.isEquals(packetData_[0], DataType.INTEGER) && !Utils.isEquals(packetData_[0], DataType.FLOAT))
        )
          return

        const playerId = packetData_[1]

        const player = this.gameServer.getPlayer(playerId)
        if (!player || player.id == this.sourcePlayer.id) return

        player.totemFactory = null
        player.lastTotemCooldown = +new Date()

        const writer = new BufferWriter(2)

        writer.writeUInt8(ServerPacketTypeBinary.ExcludeTeam)
        writer.writeUInt8(playerId)

        for (const player2 of this.sourcePlayer.totemFactory.data) {
          player2.controller.sendBinary(writer.toBuffer())
        }

        this.sourcePlayer.totemFactory.data = this.sourcePlayer.totemFactory.data.filter((e: any) => e.id != player.id)

        break
      }
      case ClientPacketType.LEAVE_TEAM: {
        if (!this.sourcePlayer.totemFactory || this.sourcePlayer.id == this.sourcePlayer.totemFactory.playerId) return

        const totemFactory = this.sourcePlayer.totemFactory

        const writer = new BufferWriter(2)
        writer.writeUInt8(ServerPacketTypeBinary.ExcludeTeam)
        writer.writeUInt8(this.sourcePlayer.id)

        for (const player of totemFactory.data) {
          player.controller.sendBinary(writer.toBuffer())
        }

        totemFactory.data = totemFactory.data.filter((e: any) => e.id != this.sourcePlayer.id)
        this.sourcePlayer.totemFactory = null

        break
      }
      case ClientPacketType.LOCK_TEAM: {
        if (!this.sourcePlayer.totemFactory || this.sourcePlayer.id != this.sourcePlayer.totemFactory.playerId) return

        this.sourcePlayer.totemFactory.is_locked = !this.sourcePlayer.totemFactory.is_locked

        break
      }
      case ClientPacketType.DROP_ONE_ITEM:
      case ClientPacketType.DROP_ALL_ITEM: {
        if (this.sourcePlayer.craftManager.isCrafting() || this.sourcePlayer.craftManager.isRecycling()) return

        if (
          !Utils.isEquals(packetData_[0], DataType.INTEGER) ||
          !this.sourcePlayer.inventory.containsItem(packetData_[0])
        )
          return

        if (!this.sourcePlayer.packetObscure.watchDropPacket(now)) return

        if (this.sourcePlayer.extra != 0 && this.sourcePlayer.extra == packetData_[0]) return

        const toDrop =
          packetId === ClientPacketType.DROP_ONE_ITEM ? 1 : this.sourcePlayer.inventory.countItem(packetData_[0])

        this.sourcePlayer.inventory.removeItem(packetData_[0], toDrop, true)

        if (!this.sourcePlayer.inventory.containsItem(packetData_[0])) {
          if (this.sourcePlayer.hat == packetData_[0]) {
            this.sourcePlayer.hat = 0
            this.sourcePlayer.updateInfo()
          }
          if (this.sourcePlayer.extra == packetData_[0]) {
            this.sourcePlayer.extra = 0
            this.sourcePlayer.max_speed = 24
            //this.sourcePlayer.ridingType = null;
            this.sourcePlayer.isFly = false
          }
          if (this.sourcePlayer.right == packetData_[0]) {
            this.sourcePlayer.right = ItemIds.HAND
            this.sourcePlayer.updateInfo()
          }
        }

        WorldEvents.addBox(this.sourcePlayer, EntityType.CRATE, [[packetData_[0], toDrop]])
        break
      }
      case ClientPacketType.EQUIP: {
        if (this.sourcePlayer.craftManager.isCrafting() || this.sourcePlayer.craftManager.isRecycling()) return
        if (!Utils.isEquals(packetData_[0], DataType.INTEGER)) return
        if (packetData_[0] != 7 && !this.sourcePlayer.inventory.containsItem(packetData_[0])) return
        this.sourcePlayer.itemActions.manageAction(packetData_[0])

        break
      }
      case ClientPacketType.BUY_KIT: {
        if (
          !this.sourcePlayer.tokenScore ||
          !this.sourcePlayer.tokenScore.score ||
          this.sourcePlayer.tokenScore.session_info ||
          +new Date() - this.sourcePlayer.tokenScore.join_timestamp > 60 * 1000
        )
          return

        let kit = Utils.getKit(packetData_[0])
        if (kit === -1) return

        let price = kit.shift()
        if (this.sourcePlayer.tokenScore.score < price) return

        this.sourcePlayer.tokenScore.score -= price
        this.sourcePlayer.tokenScore.session_info = 1
        for (const object of kit) {
          if (object[0] == ItemIds.BAG) continue
          this.sourcePlayer.inventory.addItem(object[0], object[1])
        }

        break
      }
      case ClientPacketType.BUY_MARKET: {
        if (this.sourcePlayer.craftManager.isCrafting() || this.sourcePlayer.craftManager.isRecycling()) return

        const items = Utils.getMarket(packetData_[1], packetData_[0])

        if (items === -1 || items[1] === 0 || !this.sourcePlayer.inventory.containsItem(items[0][1], packetData_[0]))
          return

        this.sourcePlayer.inventory.addItem(items[0][0], items[1])
        this.sourcePlayer.inventory.removeItem(items[0][1], packetData_[0])
        break
      }
      case ClientPacketType.BUILD: {
        if (this.sourcePlayer.craftManager.isCrafting()) return
        if (this.sourcePlayer.isFly) return
        if (this.sourcePlayer.buildingManager.isLimited()) return

        const building_angle = packetData_[1]
        if (!this.sourcePlayer.packets[0]) this.sourcePlayer.packets[0] = 0

        this.sourcePlayer.packets[0] += 1

        if (
          !Utils.isEquals(packetData_[0], DataType.INTEGER) ||
          (!Utils.isEquals(building_angle, DataType.INTEGER) && !Utils.isEquals(building_angle, DataType.FLOAT))
        )
          return

        let entityType = packetData_[0],
          buildAngle = building_angle,
          g_mode = packetData_[2] == 1

        entityType = entityType
        buildAngle = buildAngle

        if (buildAngle < 0) return
        const etype = Utils.entityTypeFromItem(entityType)

        if (
          etype == null ||
          (etype == EntityType.TOTEM && this.sourcePlayer.totemFactory) ||
          (etype == EntityType.TOTEM &&
            performance.now() - this.sourcePlayer.lastTotemCooldown < serverConfig.other.totemCooldown)
        )
          return
        if (etype == EntityType.EMERALD_MACHINE && this.sourcePlayer.buildingManager.emeraldMachineId != -1) return

        const now = performance.now()
        if (now - this.sourcePlayer.lastBuild < serverConfig.other.buildCooldown) return
        if (!this.sourcePlayer.inventory.containsItem(entityType, 1)) return

        const oldPlayerAngle = buildAngle

        let angle = buildAngle % 255

        let sx = Math.sin(((angle + 31.875) / 127) * Math.PI) + Math.cos(((angle + 31.875) / 127) * Math.PI)
        let sy = Math.sin(((angle + 31.875) / 127) * Math.PI) + -Math.cos(((angle + 31.875) / 127) * Math.PI)

        let pos = { x: 0, y: 0 }

        pos.x = this.sourcePlayer.x + sx * 83.25
        pos.y = this.sourcePlayer.y + sy * 83.25
        if (ENV_MODE == MODES.TEST) {
          if (Utils.distanceSqrt(pos.x, pos.y, 5000, 5000) < 150) return
        }
        const item = ItemUtils.getItemById(entityType)
        if (!item) return
        if (g_mode || item.data.isGridOnly) {
          pos.x = pos.x - (pos.x % 100) + 50
          pos.y = pos.y - (pos.y % 100) + 50
          angle = 255
        }
        const entitiesCollides = this.gameServer.queryManager.queryCircle(
          pos.x,
          pos.y,
          item.data.placeRadius || item.data.radius,
        )

        let response = true

        let plot_: any = null
        let hasBridge = false

        for (const entity2 of entitiesCollides) {
          if (entity2.type == EntityType.BRIDGE) {
            hasBridge = true
          }

          if ((entity2.type == EntityType.ROOF || entity2.type == EntityType.BRIDGE) && etype == entity2.type) {
            response = false
            break
          }

          if (
            entity2.type == EntityType.PLOT &&
            item.meta_type == ItemMetaType.PLANT &&
            !('containsPlant' in entity2 && entity2.containsPlant)
          ) {
            pos.x = entity2.x
            pos.y = entity2.y
            plot_ = entity2
            break
          }

          if (
            entity2.type == EntityType.DEAD_BOX ||
            entity2.type == EntityType.CRATE ||
            entity2.type == EntityType.ROOF ||
            entity2.type == EntityType.BRIDGE
          ) {
            continue
          }

          if (etype == EntityType.ROOF || etype == EntityType.BRIDGE) continue

          if (entity2 instanceof Building) {
            if (entity2.metaType == ItemMetaType.DOOR || entity2.metaType == ItemMetaType.SPIKED_DOOR) {
              response = false
              break
            }
          }

          if (ProvidedCollisionEntityList.includes(entity2.type as any))
            if (
              entity2.id != this.sourcePlayer.id &&
              Utils.distanceSqrt(entity2.x, entity2.y, pos.x, pos.y) >= (g_mode ? 97 : 57)
            )
              continue

          response = false
          break
        }

        if (!response) return

        this.sourcePlayer.lastBuild = now

        const building = new Building(
          this.sourcePlayer,
          this.gameServer.entityPool.nextId(),
          this.sourcePlayer.id,
          this.gameServer,
          item.data.damageProtection,
          item.data,
          item.meta_type,
          item.name,
        )

        building.initEntityData(pos.x, pos.y, angle, etype, true)

        if (plot_ != null) {
          plot_.containsPlant = true
          building.owningPlot = plot_
        }

        if (item.data.subData == 'obstacle' || item.meta_type == ItemMetaType.PLANT) building.isSolid = false

        if (building.metaType == ItemMetaType.PLANT) {
          if (this.sourcePlayer.hat == ItemIds.PEASANT) {
            building.growBoost = 1.5
          }
          if (this.sourcePlayer.hat == ItemIds.WINTER_PEASANT) {
            building.growBoost = 2.5
          }
        }

        if (building.type == EntityType.EMERALD_MACHINE) {
          this.sourcePlayer.buildingManager.emeraldMachineId = building.id
        }
        if (building.type == EntityType.TOTEM) {
          this.sourcePlayer.totemFactory = building
        }

        building.max_health = item.data.health ?? 0
        building.health = item.data.health ?? 0
        building.radius = item.data.radius ?? 0
        building.abstractType = EntityAbstractType.LIVING

        building.initOwner(building)
        building.setup()

        if (building.metaType != ItemMetaType.PLANT) building.info = building.health

        this.gameServer.initLivingEntity(building)

        this.sourcePlayer.inventory.removeItem(entityType, 1, false)

        /**
         * Sending OK To building
         */
        const writer = new BufferWriter(2)
        writer.writeUInt8(ServerPacketTypeBinary.AcceptBuild)
        writer.writeUInt8(entityType)
        this.sendBinary(writer.toBuffer())

        this.sourcePlayer.buildingManager.addBuilding(building.id)
        break
      }
      case ClientPacketType.RESTORE_CAM: {
        this.sendJSON([
          ServerPacketTypeJson.RecoverFocus,
          this.sourcePlayer.x,
          this.sourcePlayer.y,
          this.sourcePlayer.id,
          this.sourcePlayer.playerId,
          this.sourcePlayer.gameProfile.name,
        ])
        this.sourcePlayer.callEntityUpdate(true)
        break
      }
      case ClientPacketType.CONSOLE_COMMAND: {
        ConsoleManager.onCommandExecute(packetData_, this.sourcePlayer)
        break
      }
      case ClientPacketType.CRAFT: {
        const craftItemId = packetData_[0]

        if (Utils.isEquals(packetData_[0], DataType.INTEGER)) {
          this.sourcePlayer.craftManager.handleCraft(craftItemId)
        }
        break
      }
      case ClientPacketType.GIVE_ITEM_CHEST: {
        StorageEvents.addItemChest(packetData_, this)
        break
      }
      case ClientPacketType.TAKE_ITEM_CHEST: {
        StorageEvents.takeItemFromChest(packetData_, this)
        break
      }
      case ClientPacketType.TAKE_EXTRACTOR: {
        StorageEvents.take_rescource_extractor(packetData_, this.sourcePlayer)
        break
      }
      case ClientPacketType.GIVE_WOOD_EXTRACTOR: {
        StorageEvents.add_wood_extractor(packetData_, this.sourcePlayer)
        break
      }
      case ClientPacketType.LOCK_CHEST: {
        BuildActionEvents.lockChest(packetData_[0], this)
        break
      }
      case ClientPacketType.UNLOCK_CHEST: {
        BuildActionEvents.unlockChest(packetData_[1], this)
        break
      }
      case ClientPacketType.GIVE_FLOUR_OVEN: {
        StorageEvents.add_flour_oven(packetData_, this.sourcePlayer)
        break
      }
      case ClientPacketType.GIVE_WOOD_OVEN: {
        StorageEvents.add_wood_oven(packetData_, this.sourcePlayer)
        break
      }
      case ClientPacketType.TAKE_BREAD_OVEN: {
        StorageEvents.take_bread_oven(packetData_, this.sourcePlayer)
        break
      }
      case ClientPacketType.GIVE_WHEAT: {
        StorageEvents.add_wheat_windmill(packetData_, this.sourcePlayer)
        break
      }
      case ClientPacketType.TAKE_FLOUR: {
        StorageEvents.take_flour_windmill(packetData_, this.sourcePlayer)
        break
      }
      case ClientPacketType.GIVE_FURNACE: {
        StorageEvents.give_wood_furnace(packetData_, this.sourcePlayer)
        break
      }
      case ClientPacketType.CANCEL_CRAFT: {
        this.sourcePlayer.craftManager.cancelCraft()
        break
      }
      case ClientPacketType.RECYCLE: {
        this.sourcePlayer.craftManager.handleRecycle(packetData_[0])
        break
      }
      case ClientPacketType.CLAIM_QUEST: {
        QuestEvents.onClaimQuestReward(packetData_[0], this.sourcePlayer)
        break
      }
    }
  }
  public sendJSON(data: any) {
    if (this.socket != null) this.socket.send(JSON.stringify(data))
  }
  public sendBinary(data: Buffer) {
    if (this.socket != null) this.socket.send(data)
  }
  public closeSocket(reason: string = '') {
    if (reason.length > 0) {
    }
    if (this.socket != null) this.socket.close()
  }
}
