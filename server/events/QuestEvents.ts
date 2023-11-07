import { QuestType, QuestStateType } from '../enums/QuestType.js'
import { Player } from '../entity/Player.js'
import { Utils } from '../utils/Utils.js'
import { BufferWriter } from '../utils/bufferReader.js'
import { ServerPacketTypeBinary } from '../enums/PacketType.js'

export default class QuestEvents {
  static onClaimQuestReward(type: QuestType, player: Player) {
    const CompleteQuest = player.completeQuests[type]
    if (CompleteQuest !== QuestStateType.SUCCED) {
      return
    }

    const QuestReward = Utils.getQuestRewardByQuestType(type)
    if (QuestReward === null || player.inventory.isInventoryFull(QuestReward[1])) {
      return
    }

    const writer = new BufferWriter(2)
    writer.writeUInt8(ServerPacketTypeBinary.Claimed)
    writer.writeUInt8(type)

    player.controller.sendBinary(writer.toBuffer())

    player.inventory.addItem(QuestReward[1], 1)
    player.gameProfile.score += QuestReward[0]

    player.completeQuests[type] = QuestStateType.CLAIMED
  }
}
