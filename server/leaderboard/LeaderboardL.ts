import fs from 'fs'
import LeaderboardData from './leaderboard.json' assert { type: 'json' }

export class LeaderboardL {
  public leaderboard: any[]
  public gameServer: any

  constructor(gameServer: any) {
    this.gameServer = gameServer
    this.leaderboard = []
    this.init()
  }

  private init() {
    this.leaderboard = LeaderboardData
  }
  public writeLb(data: any, range: number = 0) {
    this.leaderboard[range].push(data)

    this.sortLb(range)

    let leaderboard = this.leaderboard[range]
    if (leaderboard.length > 200) {
      this.leaderboard[range].splice(leaderboard.length - 1, 1)
    }

    fs.writeFileSync(new URL('./leaderboard.json', import.meta.url), JSON.stringify(this.leaderboard))
  }

  public sortLb(range: number) {
    this.leaderboard[range].sort((p1: any, p2: any) => p2.score - p1.score)
  }

  public toJson(range: number = 0) {
    return JSON.stringify(this.leaderboard[range])
  }
}
