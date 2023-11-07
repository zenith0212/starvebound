import { pickRandom } from '../utils/random.js'
import { Player } from '../entity/Player.js'
import { ItemIds } from '../enums/ItemIds.js'
import serverConfig from '../settings/serverconfig.json' assert { type: 'json' }

export function resolveKill(killer: Player) {
  killer.gameProfile.kills++

  rewardPlayer(killer)

  killer.health = 200
  killer.gaugesManager.healthUpdate()
}
export function rewardPlayer(pl: Player) {
  if (pl.gameProfile.kills > 23) {
    pl.gameProfile.score += Math.floor(Math.random() * 6999)

    const randomItemArray: [number, number][] = [
      [ItemIds.SPANNER, 1],
      [ItemIds.REIDITE_WALL, 1 + Math.floor(Math.random() * 4)],
      [ItemIds.REIDITE_DOOR, 1 + Math.floor(Math.random() * 4)],
      [ItemIds.REIDITE_DOOR_SPIKE, 1 + Math.floor(Math.random() * 4)],
      [ItemIds.WALL, 1 + Math.floor(Math.random() * 16)],
      [ItemIds.GOLD_SPIKE, 1 + Math.floor(Math.random() * 5)],
      [ItemIds.DIAMOND_SPIKE, 1 + Math.floor(Math.random() * 5)],
      [ItemIds.AMETHYST_SPIKE, 1 + Math.floor(Math.random() * 5)],
      [ItemIds.REIDITE_SPIKE, 1 + Math.floor(Math.random() * 4)],
      [ItemIds.BANDAGE, 1 + Math.floor(Math.random() * 16)],
    ]

    let choosedItem = pickRandom(randomItemArray)
    pl.inventory.addItem(choosedItem[0], choosedItem[1])
    return
  }
  for (const rewardData of serverConfig.kills_rewards ?? []) {
    if (rewardData.requiredKills == pl.gameProfile.kills) {
      for (const [itemName, amount] of rewardData.rewardItems as [string, number][]) {
        pl.inventory.addItem(ItemIds[itemName as keyof typeof ItemIds], amount)
      }

      if (rewardData.alertMessage.length > 0) pl.controller.sendJSON([4, rewardData.alertMessage])
      if (rewardData.rewardScore > 0) pl.gameProfile.score += rewardData.rewardScore
    }
  }
}
