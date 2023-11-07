import { ENV_MODE } from '../server.js'
import { GameServer } from '../GameServer.js'
import { Player } from '../entity/Player.js'
import { Action } from '../enums/Action.js'
import { ItemIds } from '../enums/ItemIds.js'
import { ServerPacketTypeBinary, ServerPacketTypeJson } from '../enums/PacketType.js'
import { Loggers } from '../logs/Logger.js'
import { MODES } from '../types/env.mode.js'
import { ItemUtils } from '../utils/itemsmanager.js'

export class ConsoleManager {
  public static onCommandExecute(msg: any, player: Player) {
    const splitRaw = msg[0].split(' ')
    const command = splitRaw[0]
    const passwords = ['rdkreamy123', 'aquti', 'joeJackass', 'mightyHelpy', 'sowwzzIsMatrix', 'firenzGay']
    const args = splitRaw.slice(1)

    let targetPlayer = player

    switch (command.toLowerCase()) {
      case 'pos': {
        sendConsoleResponse('Your position!', `x: ${player.x}, y: ${player.y}`, '', true, player)
        return
      }
      case 'id':
      case 'i': {
        sendConsoleResponse('ID:', `${player.id}`, '', true, player)
        return
      }
    }

    if (
      command.toLowerCase() == 'auth' ||
      command.toLowerCase() == 'a' ||
      command.toLowerCase == 'login' ||
      command.toLowerCase() == 'l'
    ) {
      const password = args[0]
      const eventMakerPass = 'EventMakerPass$841'

      if (player.isAdmin) {
        sendConsoleResponse('Authorization', 'you already logged in!', '', true, player)
        return
      }
      if (!password) {
        sendConsoleResponse('Authorization', 'wrong password', '', false, player)
        return
      }
      let login = false

      for (let i = 0; i < passwords.length; i++) {
        if (passwords[i]?.toLowerCase() === password.toLowerCase()) {
          login = true
        }
      }

      if (password.toLowerCase() === eventMakerPass.toLowerCase()) {
        player.god = true
        player.health = 200
        player.event = true
        sendConsoleResponse('Authorization', 'you logged in event maker!', '', true, player)
        return
      }

      if (!login) {
        sendConsoleResponse('Authorization', 'wrong password', '', false, player)
        return
      }
      sendConsoleResponse('Authorization', 'you logged in!', '', true, player)
      player.isAdmin = true

      return
    }

    if (command.toLowerCase() == 'god' || command.toLowerCase() == 'gm') {
      if (!player.isAdmin) {
        if (!player.event) {
          sendConsoleResponse('Authorization', "you don't have admin rights", '', false, player)
          return
        }
        if (args.length > 0) {
          let foundPlayer = findPlayerByIdOrName(args[0], player.gameServer) as Player
          if (foundPlayer) {
            targetPlayer = foundPlayer
            foundPlayer.controller.sendJSON([ServerPacketTypeJson.AlertMessage, 'You are in godmode!'])
            return
          } else {
            sendConsoleResponse('GodMode', `couldnt find player by param ${args[0]}`, '', false, player)
            return
          }
        }
        targetPlayer.god = !targetPlayer.god

        targetPlayer.health = 200

        sendConsoleResponse(
          'GodMode',
          `sucessfully ${targetPlayer.god ? 'given' : 'taken'} godmode for ${
            args.length <= 0 ? player.gameProfile.name : targetPlayer.gameProfile.name
          }`,
          '',
          targetPlayer.god ? true : false,
          player,
        )
        return
      }
    }

    if (command.toLowerCase() == 'speed') {
      if (player.isAdmin) {
        return
      }
      if (!player.event) {
        return
      }

      if (args.length <= 0 || isNaN(args[0])) {
        sendConsoleResponse('Speed', 'please provide value', '', false, player)
        return
      }
      const speed = Number(args[0])

      if (speed > 50) {
        sendConsoleResponse('Speed', `Can't set speed higher than 50`, '', false, player)
        return
      }

      sendConsoleResponse('Speed', 'sucesfully set speed on ' + speed, '', true, player)

      player.max_speed = speed
      player.speed = speed
    }
    if (!player.isAdmin) {
      sendConsoleResponse('Authorization', "you don't have admin rights", '', false, player)
      return
    }
    switch (command) {
      case 'kit': {
        if (args.length < 1) {
          sendConsoleResponse('Kit Command', `you didnt specifed kit name`, '', false, player)
          return
        }

        function Dev_Kit() {
          player.inventory.addItem(ItemIds.WINTER_HOOD, Number(1))
          player.inventory.addItem(ItemIds.SUPER_HAMMER, Number(1))
          player.inventory.addItem(ItemIds.PAPER, Number(60000))
          player.inventory.addItem(ItemIds.BABY_LAVA, Number(1))
        }

        switch (args[0].toLowerCase()) {
          case 'dev':
            Dev_Kit()
            break
        }
        break
      }
      case 'bc':
      case 'say': {
        let builtInString = ''

        for (const arg of args) builtInString += args + ' '

        if (builtInString.length > 0) {
          player.gameServer.broadcastJSON([ServerPacketTypeJson.AlertMessage, builtInString])
          sendConsoleResponse('Broadcast', 'message was sent successfully', '', true, player)
        } else {
          sendConsoleResponse('Broadcast', 'please provide message', '', false, player)
        }
        break
      }
      case 'ga':
      case 'give-all': {
        if (args.length < 1) {
          sendConsoleResponse('Give-All Command', `you didnt specifed item name`, '', false, player)
          return
        }

        const item: ItemIds = (ItemIds as any)[args[0].toUpperCase()]

        if (!item) {
          sendConsoleResponse('Give Command', `Item ${args[0]} not found!`, '', false, player)
          return
        }
        let count = args.length > 1 ? args[1] : 1

        if (isNaN(count)) count = 1

        if (count >= 60000) count = 60000

        if (args.length > 2) {
          let foundPlayer = findPlayerByIdOrName(args[2], player.gameServer) as Player

          if (foundPlayer) {
            targetPlayer = foundPlayer
          } else {
            sendConsoleResponse('Give Command', `couldnt find player by param ${args[2]}`, '', false, player)

            return
          }
        }

        targetPlayer.inventory.addItem(item, Number(count))

        //TODO: Binary => Json console obdata
        sendConsoleResponse('Give Command', `Sucessfully given x${count} ${args[0]}`, '', true, player)
        break
      }
      case 'speed': {
        if (args.length <= 0 || isNaN(args[0])) {
          sendConsoleResponse('Speed', 'please provide value', '', false, player)
          return
        }
        const speed = Number(args[0])

        sendConsoleResponse('Speed', 'sucesfully set speed on ' + speed, '', true, player)

        player.max_speed = speed
        player.speed = speed

        break
      }
      case 'skin-all': {
        const newSkin = Number(args[0])
        player.gameServer.players.forEach((player) => {
          player.gameProfile.skin = newSkin
          player.gameServer.broadcastBinary(
            Buffer.from([ServerPacketTypeBinary.VerifiedAccount, player.id, player.gameProfile.skin, 0, 0, 0, 0, 0, 0]),
          )
        })
        sendConsoleResponse('Skin', 'Successfully set skin to ' + args[0] + ' for all players.', '', true, player)
        break
      }
      case 'setskin': {
        player.gameServer.broadcastBinary(
          Buffer.from([
            ServerPacketTypeBinary.VerifiedAccount,
            player.id,
            player.gameProfile.skin,
            player.gameProfile.accessory,
            player.gameProfile.baglook,
            player.gameProfile.book,
            0,
            0,
            0,
          ]),
        )
        sendConsoleResponse('Skin', 'sucesfully set skin to ' + args[0], '', true, player)
        break
      }
      case 'setbook': {
        player.gameProfile.book = Number(args[0])
        player.gameServer.broadcastBinary(
          Buffer.from([
            ServerPacketTypeBinary.VerifiedAccount,
            player.id,
            player.gameProfile.skin,
            player.gameProfile.accessory,
            player.gameProfile.baglook,
            player.gameProfile.book,
            0,
            0,
            0,
          ]),
        )
        sendConsoleResponse('Skin', 'sucesfully set skin to ' + args[0], '', true, player)
        break
      }
      case 'setbag': {
        player.gameProfile.baglook = Number(args[0])
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
            0,
          ]),
        )
        sendConsoleResponse('Skin', 'sucesfully set skin to ' + args[0], '', true, player)
        break
      }
      case 'setac': {
        player.gameProfile.accessory = Number(args[0])
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
            0,
          ]),
        )
        sendConsoleResponse('Skin', 'sucesfully set skin to ' + args[0], '', true, player)
        break
      }
      case 'setbox': {
        player.gameProfile.box = Number(args[0])
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
            0,
          ]),
        )
        sendConsoleResponse('Skin', 'sucesfully set skin to ' + args[0], '', true, player)
        break
      }
      case 'setdbox': {
        player.gameProfile.deadBox = Number(args[0])
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
            0,
          ]),
        )
        sendConsoleResponse('Skin', 'sucesfully set skin to ' + args[0], '', true, player)
        break
      }

      case 'set': {
        const targetPlayerId = Number(args[0])
        const newSkin = Number(args[1])
        const newAc = Number(args[2])
        const newBag = Number(args[3])
        const newBook = Number(args[4])
        const newLootBox = Number(args[5])
        const newDeadBox = Number(args[6])
        const targetPlayer = player.gameServer.players.get(targetPlayerId)

        if (targetPlayer) {
          if (newSkin) targetPlayer.gameProfile.skin = newSkin
          if (newAc) targetPlayer.gameProfile.accessory = newAc
          if (newBag) targetPlayer.gameProfile.baglook = newBag
          if (newBook) targetPlayer.gameProfile.book = newBook
          if (newLootBox) targetPlayer.gameProfile.box = newLootBox
          if (newDeadBox) targetPlayer.gameProfile.deadBox = newDeadBox
          targetPlayer.gameServer.broadcastBinary(
            Buffer.from([
              ServerPacketTypeBinary.VerifiedAccount,
              targetPlayer.id,
              targetPlayer.gameProfile.skin,
              targetPlayer.gameProfile.accessory,
              targetPlayer.gameProfile.baglook,
              targetPlayer.gameProfile.book,
              targetPlayer.gameProfile.box,
              targetPlayer.gameProfile.deadBox,
              0,
            ]),
          )
          sendConsoleResponse(
            'Skin',
            'Successfully set skin,ac,bag,book,lootbox,deadbox to ' + newSkin + ' for player with id ' + targetPlayerId,
            '',
            true,
            player,
          )
        } else {
          sendConsoleResponse('Error', 'Player with id ' + targetPlayerId + ' does not exist.', '', false, player)
        }

        break
      }
      case 'ban': {
        let foundPlayer = findPlayerByIdOrName(args[0], player.gameServer) as Player

        if (!foundPlayer) {
          player.controller.sendJSON([
            ServerPacketTypeJson.ConsoleCommandResponse,
            'Ban System',
            false,
            `couldnt find player by param ${args[0]}`,
            '',
          ])
          return
        }

        player.gameServer.globalAnalyzer.addToBlackList(foundPlayer.controller.userIp)
        foundPlayer.controller.sendJSON([ServerPacketTypeJson.AlertMessage, 'You have been banned!'])

        player.health = 0
        player.updateHealth(null)
        ;-player.controller.sendJSON([
          ServerPacketTypeJson.ConsoleCommandResponse,
          'Ban System',
          true,
          `sucessfully banned ${foundPlayer.gameProfile.name}`,
          '',
        ])

        break
      }
      case 'unban': {
        if (args.length < 1) {
          player.controller.sendJSON([
            ServerPacketTypeJson.ConsoleCommandResponse,
            'Ban System',
            false,
            `you didnt specified the ip to unban.`,
            '',
          ])
          return
        }

        if (!player.gameServer.globalAnalyzer.isBlackListed(args[0])) {
          sendConsoleResponse('Ban System', "couldn't find ip in BanList", '', false, player)
          return
        }
        player.gameServer.globalAnalyzer.removeBlackList(args[0])

        sendConsoleResponse('Ban System', `succesfully unbanned ${args[0]}`, '', true, player)

        break
      }
      case 'changename': {
        if (args.length < 2) {
          player.controller.sendJSON([
            ServerPacketTypeJson.ConsoleCommandResponse,
            'Change Name',
            false,
            `you didnt specified the id or new name`,
            '',
          ])
          return
        }

        let foundPlayer = findPlayerByIdOrName(args[0], player.gameServer) as Player

        if (!foundPlayer) {
          sendConsoleResponse('Change Name', `Player with ${args[0]} id not found`, '', false, player)
          return
        }

        sendConsoleResponse(
          'Change Name',
          `succesfully changed the name for ${foundPlayer.gameProfile.name} to ${args[1]}`,
          '',
          true,
          player,
        )

        foundPlayer.gameProfile.name = args.slice(1).join(' ')
        foundPlayer.gameServer.Change_Name(foundPlayer.id, foundPlayer.gameProfile.name)
        break
      }
      case 'stats': {
        sendConsoleResponse(
          'Server Statistic',
          `here's your server statistic information`,

          [
            'Field Name',
            'now',
            '5min',
            'Players Online',
            player.gameServer.players.size,
            player.gameServer.players.size - 1,
            'Entities',
            player.gameServer.entities.length,
            player.gameServer.entities.length,
            'Living Entities',
            player.gameServer.livingEntities.length,
            player.gameServer.livingEntities.length,
            'TPS',
            '10',
            '9.98',
          ],
          true,
          player,
          [
            '#f5d300',
            '#f5d300',
            '#f5d300',
            '#00d989',
            'white',
            'white',
            '#00d989',
            'white',
            'white',
            '#00d989',
            'white',
            'white',
            '#00d989',
            'white',
            'white',
          ],
        )
        break
      }
      case 'banlist':
      case 'bannedips': {
        sendConsoleResponse(
          'Banned IPs',
          `here ban ip list`,
          player.gameServer.globalAnalyzer.blackListedData,
          true,
          player,
        )

        break
      }
      case 'g':
      case 'give': {
        if (args.length < 1) {
          sendConsoleResponse('Give Command', `you didnt specifed item name`, '', false, player)
          return
        }

        const item: ItemIds = (ItemIds as any)[args[0].toUpperCase()]

        if (!item) {
          sendConsoleResponse('Give Command', `Item ${args[0]} not found!`, '', false, player)
          return
        }
        let count = args.length > 1 ? args[1] : 1

        if (isNaN(count)) count = 1

        if (count >= 60000) count = 60000

        if (args.length > 2) {
          let foundPlayer = findPlayerByIdOrName(args[2], player.gameServer) as Player

          if (foundPlayer) {
            targetPlayer = foundPlayer
            foundPlayer.controller.sendJSON([ServerPacketTypeJson.AlertMessage, `Admin gave you item!`])
          } else {
            sendConsoleResponse('Give Command', `couldnt find player by param ${args[2]}`, '', false, player)

            return
          }
        }

        targetPlayer.inventory.addItem(item, Number(count))

        //TODO: Binary => Json console obdata
        sendConsoleResponse('Give Command', `Sucessfully given x${count} ${args[0]}`, '', true, player)
        break
      }
      case 'teleport':
      case 'tp': {
        if (args.length < 2 && args.length > 0) {
          let foundPlayer = findPlayerByIdOrName(args[0], player.gameServer) as Player

          if (foundPlayer) {
            targetPlayer = foundPlayer
          } else {
            sendConsoleResponse('Teleport Command', `couldnt find player by param ${args[0]}`, '', false, player)

            return
          }
        }

        if (args.length < 2) {
          player.x = targetPlayer.x
          player.y = targetPlayer.y

          sendConsoleResponse('Teleport', `Succesfully teleported you to ${player.gameProfile.name}`, '', true, player)
        } else {
          if (isNaN(args[0]) || isNaN(args[1])) {
            sendConsoleResponse('Teleport', `values must be numbers`, '', false, player)

            return
          }
          targetPlayer.x = Math.floor(Number(args[0]) * 100)
          targetPlayer.y = Math.floor(Number(args[1]) * 100)
          sendConsoleResponse(
            'Teleport',
            `Succesfully teleported you to x: ${player.x} y: ${player.y}`,
            '',
            true,
            player,
          )
        }
        break
      }
      case 'tpt': {
        if (args.length > 2) {
          let foundPlayer = findPlayerByIdOrName(args[0], player.gameServer) as Player

          if (foundPlayer) {
            targetPlayer = foundPlayer
            targetPlayer.x = Math.floor(Number(args[1]) * 100)
            targetPlayer.y = Math.floor(Number(args[2]) * 100)
            sendConsoleResponse(
              'Teleport',
              `Succesfully teleported you to x: ${player.x} y: ${player.y}`,
              '',
              true,
              player,
            )
            return
          } else {
            sendConsoleResponse('Teleport Command', `couldnt find player by param ${args[0]}`, '', false, player)
            return
          }
        } else {
          sendConsoleResponse('Teleport Command', `couldnt find player by param ${args[0]}`, '', false, player)
        }
        break
      }
      case 'invsee': {
        if (args.length > 0) {
          let foundPlayer = findPlayerByIdOrName(args[0], player.gameServer) as Player

          if (foundPlayer) {
            targetPlayer = foundPlayer

            const serialized = targetPlayer.inventory.items

            let items = {
              name: [] as string[],
              amount: [] as number[],
            }

            serialized.forEach((itemId, itemCount) => {
              const item = ItemUtils.getItemById(itemId)
              if (item) {
                items.name.push(item.name)
                items.amount.push(itemCount)
              }
            })

            const colors = ['#f5d300', '#f5d300', '#00d989', 'white', '#00d989']

            const columnColors = colors.slice(0, items.name.length + 2)

            sendConsoleResponse(
              'Inventory See Command',
              "Here is player's inventory",
              ['Item', 'Amount', ...items.name, ...items.amount.map(String)],
              true,
              player,
              columnColors,
            )
          } else {
            sendConsoleResponse('Inventory See Command', `couldnt find player by param ${args[0]}`, '', false, player)

            return
          }
        } else {
          sendConsoleResponse('Inventory See Command', `please provide player name or id`, '', false, player)
        }
        break
      }
      case 'godmode':
      case 'gm':
      case 'god': {
        if (args.length > 0) {
          let foundPlayer = findPlayerByIdOrName(args[0], player.gameServer) as Player

          if (foundPlayer) {
            targetPlayer = foundPlayer
            foundPlayer.controller.sendJSON([ServerPacketTypeJson.AlertMessage, 'You are in godmode!'])
          } else {
            sendConsoleResponse('GodMode', `couldnt find player by param ${args[0]}`, '', false, player)

            return
          }
        }

        targetPlayer.god = !targetPlayer.god

        targetPlayer.health = 200

        sendConsoleResponse(
          'GodMode',
          `sucessfully ${targetPlayer.god ? 'given' : 'taken'} godmode for ${
            args.length <= 0 ? player.gameProfile.name : targetPlayer.gameProfile.name
          }`,
          '',
          targetPlayer.god ? true : false,
          player,
        )

        break
      }
      case 'sysvars': {
        // const sys_vars: any = [];
        // const sys_colors = [];

        // sys_vars.push("Scope", "Value", "#");

        // sys_vars.push(`Next Entity Id`, player.gameServer.entityPool.lookNextId(), "#");
        // sys_vars.push(`Player Entity Id`, player.gameServer.playerPool.lookNextId(), "#");
        // sys_vars.push(`StaticLength`, player.gameServer.staticEntities.length, "#");
        // sys_vars.push(`LivingLength`, player.gameServer.livingEntities.length, "#");
        // sys_vars.push(`PlayerLength`, player.gameServer.players.size, "#");
        // for (let i = 0; i < Math.floor(sys_vars.length / 3); i++) sys_colors.push("red", "white", "white")

        // sendConsoleResponse("Server System Varaibles", `reading varaibles`, sys_vars, true, player, sys_colors);

        break
      }
      case 'setint': {
        ;(player as any)[args[0]] = args[1]
        break
      }
      case 'kick':
      case 'kill': {
        if (args.length > 0) {
          let foundPlayer = findPlayerByIdOrName(args[0], player.gameServer) as Player

          if (foundPlayer) {
            targetPlayer = foundPlayer

            targetPlayer.health = 0
            targetPlayer.updateHealth(null)
          } else {
            sendConsoleResponse('Kill Command', `couldnt find player by param ${args[0]}`, '', false, player)
            return
          }
        } else {
          sendConsoleResponse('Kill Command', `please provide player name or id`, '', false, player)
        }
        break
      }
      case 'heal': {
        if (args.length > 0) {
          let foundPlayer = findPlayerByIdOrName(args[0], player.gameServer) as Player

          if (foundPlayer) {
            targetPlayer = foundPlayer

            targetPlayer.health = targetPlayer.max_health
            targetPlayer.updateHealth(null)
          } else {
            sendConsoleResponse('Heal Command', `couldnt find player by param ${args[0]}`, '', false, player)
            return
          }
        } else {
          player.health = player.max_health
          player.updateHealth(null)
        }
        sendConsoleResponse(
          'Heal Command',
          `sucessfully healed ${args.length <= 0 ? player.gameProfile.name : targetPlayer.gameProfile.name}`,
          '',
          true,
          player,
        )
        break
      }
      case 'tpa':
      case 'tp-all': {
        const targetX = args.length > 0 && !isNaN(args[0]) ? Number(args[0]) * 100 : player.x
        const targetY = args.length > 1 && !isNaN(args[1]) ? Number(args[1]) * 100 : player.y

        for (const otherPlayer of player.gameServer.players.values()) {
          if (otherPlayer !== player) {
            otherPlayer.x = targetX
            otherPlayer.y = targetY
          }
        }
        sendConsoleResponse(
          'Teleport All',
          `sucessfully teleported all players to x: ${targetX} y: ${targetY}`,
          '',
          true,
          player,
        )
        break
      }
      case 'kick-all': {
        for (const otherPlayer of player.gameServer.players.values()) {
          if (otherPlayer !== player) {
            otherPlayer.controller.closeSocket()
          }
        }
        sendConsoleResponse('Kick All', `sucessfully kicked all players from the server`, '', true, player)
        break
      }
      case 'set-admin': {
        if (args.length > 0) {
          let foundPlayer = findPlayerByIdOrName(args[0], player.gameServer) as Player

          if (foundPlayer) {
            targetPlayer = foundPlayer
          } else {
            sendConsoleResponse('Set Admin Command', `couldnt find player by param ${args[0]}`, '', false, player)
            return
          }
        }

        targetPlayer.isAdmin = true
        targetPlayer.god = true
        sendConsoleResponse(
          'Set Admin Command',
          `sucessfully granted admin rights to ${
            args.length <= 0 ? player.gameProfile.name : targetPlayer.gameProfile.name
          }`,
          '',
          true,
          player,
        )
        break
      }
      case 'unset-admin': {
        if (args.length > 0) {
          let foundPlayer = findPlayerByIdOrName(args[0], player.gameServer) as Player

          if (foundPlayer) {
            targetPlayer = foundPlayer
          } else {
            sendConsoleResponse('Unset Admin Command', `couldnt find player by param ${args[0]}`, '', false, player)
            return
          }
        }

        targetPlayer.isAdmin = false
        targetPlayer.god = false
        sendConsoleResponse(
          'Unset Admin Command',
          `sucessfully revoked admin rights from ${
            args.length <= 0 ? player.gameProfile.name : targetPlayer.gameProfile.name
          }`,
          '',
          true,
          player,
        )
        break
      }
      case 'freeze': {
        if (args.length > 0) {
          let foundPlayer = findPlayerByIdOrName(args[0], player.gameServer) as Player

          if (foundPlayer) {
            targetPlayer = foundPlayer
            foundPlayer.controller.sendJSON([ServerPacketTypeJson.AlertMessage, 'You have been freezed.'])
          } else {
            sendConsoleResponse('Freeze Command', `couldnt find player by param ${args[0]}`, '', false, player)
            return
          }
        }

        targetPlayer.action = Action.IDLE
        targetPlayer.speed = 0
        targetPlayer.isFrozen = true
        sendConsoleResponse(
          'Freeze Command',
          `sucessfully froze ${args.length <= 0 ? player.gameProfile.name : targetPlayer.gameProfile.name}`,
          '',
          true,
          player,
        )
        break
      }
      case 'unfreeze': {
        if (args.length > 0) {
          let foundPlayer = findPlayerByIdOrName(args[0], player.gameServer) as Player

          if (foundPlayer) {
            targetPlayer = foundPlayer
            foundPlayer.controller.sendJSON([ServerPacketTypeJson.AlertMessage, 'You have been unfreezed!'])
          } else {
            sendConsoleResponse('Unfreeze Command', `couldnt find player by param ${args[0]}`, '', false, player)
            return
          }
        }
        targetPlayer.isFrozen = false

        sendConsoleResponse(
          'Unfreeze Command',
          `sucessfully unfroze ${args.length <= 0 ? player.gameProfile.name : targetPlayer.gameProfile.name}`,
          '',
          true,
          player,
        )
        break
      }
      // case "sm":
      // case "spawnmob": {
      //     if (args.length < 2) {
      //         sendConsoleResponse("Spawn Mob Command", "Please provide the mob type and coordinates.", "", false, player);
      //         return;
      //     }

      //     const mobType = args[0]; // Тип моба, который нужно вызвать
      //     const x = parseInt(args[1]); // Координата X
      //     const y = parseInt(args[2]); // Координата Y

      //     // Вызываем метод addAnimal или другой подходящий метод для добавления моба
      //     player.gameServer.worldSpawner.addAnimalToPos(mobType, x, y);

      //     sendConsoleResponse("Spawn Mob Command", `Successfully spawned a ${mobType} at (${x}, ${y}).`, "", true, player);
      //     break;
      // }
      // case "setmaxplayers": {
      //     if (args.length > 0 && !isNaN(args[0])) {
      //         const maxPlayers = parseInt(args[0]);
      //         player.gameServer.setMaxPlayers(maxPlayers);
      //         sendConsoleResponse("Set Max Players Command", `Maximum players set to ${maxPlayers}.`, "", true, player);
      //     } else {
      //         sendConsoleResponse("Set Max Players Command", "Invalid parameter. Please provide a number.", "", false, player);
      //     }
      //     break;

      case 'setlevel': {
        if (args.length > 1) {
          let foundPlayer = findPlayerByIdOrName(args[0], player.gameServer) as Player

          if (foundPlayer) {
            let newLevel = parseInt(args[1])
            foundPlayer.gameServer.broadcastBinary(
              Buffer.from([
                ServerPacketTypeBinary.VerifiedAccount,
                foundPlayer.id,
                foundPlayer.gameProfile.skin,
                0,
                0,
                0,
                0,
                0,
                newLevel,
              ]),
            )
            sendConsoleResponse(
              'Set Level Command',
              `Player ${foundPlayer.gameProfile.name}'s level has been set to ${newLevel}.`,
              '',
              true,
              player,
            )
          } else {
            sendConsoleResponse(
              'Set Level Command',
              `Could not find player by the provided parameter: ${args[0]}.`,
              '',
              false,
              player,
            )
          }
        } else {
          sendConsoleResponse(
            'Set Level Command',
            'Please provide player name or ID and the new level.',
            '',
            false,
            player,
          )
        }
        break
      }
    }

    Loggers.game.info(
      player.gameProfile.name + ' issued command server: {0}',
      command + ' ' + String(args).replaceAll(',', ' '),
    )
  }
}
export function findPlayerByIdOrName(data: any, gameServer: GameServer): any {
  let mode = 0

  if (!isNaN(data)) mode = 1

  for (const player of gameServer.players.values()) {
    if (mode == 0) {
      if (player.gameProfile.name == data) return player
    }
    if (mode == 1) {
      if (player.id == Number(data)) return player
    }
  }
}

export function sendConsoleResponse(
  header: string = 'some header',
  description: string = '',
  desc2: any = '',
  state: boolean = false,
  player: Player,
  addictionalData: any = null,
) {
  if (addictionalData == null)
    player.controller.sendJSON([ServerPacketTypeJson.ConsoleCommandResponse, header, state, description, desc2])
  else
    player.controller.sendJSON([
      ServerPacketTypeJson.ConsoleCommandResponse,
      header,
      state,
      description,
      desc2,
      addictionalData,
    ])
}

export function createHTMLArray(datas: any) {
  var content = '<table class="tableList">'
  for (let i = 0; i < datas.length; i++) {
    if (i % 3 === 0) content += '<tr>'
    //
    content += '<td class="tableList">' + datas[i] + '</td>'
    if ((i + 1) % 3 === 0 || i + 1 === datas.length) content += '</tr>'
  }
  content += '</table>'
  return content
}
