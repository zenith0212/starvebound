import { Player } from '../entity/Player.js'
import { Utils } from '../utils/Utils.js'
import serverSettings from '../settings/serverconfig.json' assert { type: 'json' }
export class BuildingManager {
  public sourcePlayer: Player
  public buildings: number[] // id array for builds xd
  public emeraldMachineId: number = -1
  constructor(sourcePlayer: Player) {
    this.sourcePlayer = sourcePlayer

    this.buildings = []
  }

  addEmeraldMachine(id: number) {
    this.emeraldMachineId = id
  }

  isLimited() {
    return this.buildings.length >= serverSettings.server.buildingLimit - 1
  }
  addBuilding(id: number) {
    this.buildings.push(id)
  }
  removeBuilding(id: number) {
    this.buildings = this.buildings.filter((b) => b != id)
  }
  clearBuildings(forceDelete: boolean = false) {
    this.buildings = []
  }
  hasBuilding(id: number) {
    return this.buildings.includes(id)
  }
  getBuildingTail(id: number): any {
    if (!this.hasBuilding(id)) return null

    for (const entity of this.sourcePlayer.gameServer.entities) {
      if (entity.id == id && Utils.isBuilding(entity)) return entity
    }

    return null
  }
}
