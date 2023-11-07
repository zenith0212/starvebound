import { GameServer } from '../GameServer.js'
import fs from 'fs'
import { getNodeParams } from './EventUtils.js'
import { Loggers } from '../logs/Logger.js'
import { EventErrors, constructError } from './EventErrorLogger.js'
import { Event, EventType } from './Event.js'
import { Player } from '../entity/Player.js'
export class EventManager {
  gameServer: GameServer
  events: Event[]
  dirStat: string

  constructor(gameServer: GameServer, dirStat: string) {
    this.gameServer = gameServer
    this.events = []
    this.dirStat = dirStat

    this.updateConfig()
  }
  loop() {
    const date = +new Date()

    for (const event of this.events) {
      if (event.type == EventType.INTERVAL) event.update(date)
    }
  }
  onKill(thatDead: Player, thatKilled: Player) {
    const now = +new Date()

    const eventsFiltered = this.events.filter((e) => e.type == EventType.KILL)

    for (const event of eventsFiltered) {
      event.update(now, {
        killer: thatDead,
        killed: thatKilled,
      })
    }
  }
  updateConfig() {
    const fsstat = fs.readFileSync(new URL('./settings/events.json', this.dirStat), 'utf8')

    const data = JSON.parse(fsstat)

    for (const eventData of data) {
      const nodeName = eventData.name
      const nodeType = (EventType as any)[eventData.type.toUpperCase()]

      if (!nodeType) {
        constructError(EventErrors.NODE_NOT_FOUND, nodeName, `EventType with ${eventData.type} not Found`)
        return
      }

      const nodeParams = getNodeParams(eventData.params)

      const eventParams = []
      for (let i = 0; i < nodeParams.length; i++) {
        const [firstOne, secondOne] = nodeParams[i]!.split(' ')

        if (!firstOne || !secondOne) {
          constructError(
            EventErrors.PARAMS_PARSE_FAIL,
            nodeName,
            `Params Iterate Error at ${i}`,
            `Your params has invalid index`,
          )
          return
        }
        eventParams.push([firstOne, secondOne])
      }

      const condition = eventData.condition
      const commands = eventData.commands

      Loggers.game.info(`--------------`)
      Loggers.game.warn(`Event ${eventData.name} is Initialized!`)
      Loggers.game.info(`--------------`)

      this.events.push(new Event(nodeName, nodeType, eventParams, condition, commands, this))
    }
  }
}
