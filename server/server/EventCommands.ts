import { GameServer } from '../GameServer.js'
import { ItemIds } from '../enums/ItemIds.js'
import { ServerPacketTypeJson } from '../enums/PacketType.js'
import { Loggers } from '../logs/Logger.js'
import { findPlayerByIdOrName } from '../models/ConsoleManager.js'

export function executeCommand(data: any, gameServer: GameServer) {
  data = data.split(' ')

  const cmdName = data[0].toLowerCase()

  const args = data.slice(1)
  let targetPlayer: any = null

  switch (cmdName) {
    case 'say':
    case 'bc': {
      let builtInString = ''

      for (const arg of args) builtInString += arg + ' '

      if (builtInString.length > 0) gameServer.broadcastJSON([ServerPacketTypeJson.AlertMessage, builtInString])

      break
    }
    case 'give':
    case 'g': {
      const item: ItemIds = (ItemIds as any)[args[0].toUpperCase()]

      if (!item) {
        Loggers.game.info(`Kill Resolve Event, item not found with name ${args[0]}`)
        return
      }

      let count = args.length > 1 ? args[1] : 1

      if (isNaN(count)) count = 1
      if (count >= 60000) count = 60000

      if (args.length > 2) {
        let foundPlayer = findPlayerByIdOrName(args[2], gameServer)

        if (foundPlayer) {
          targetPlayer = foundPlayer
        } else return
      }

      targetPlayer.inventory.addItem(item, count)

      break
    }
  }
}
