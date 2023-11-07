import { Building } from '../entity/Building.js'

export class TotemFactory {
  public sourceEntity: Building

  constructor(sourceEntity: Building) {
    this.sourceEntity = sourceEntity
  }

  public isTeammate(id: number) {
    return this.sourceEntity.data.find((e: any) => e.id == id)
  }
}
