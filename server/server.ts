import * as http from 'http'
import express from 'express'
import cors from 'cors'

import devConfig from './staticSettings/devconfig.json' assert { type: 'json' }
import { Loggers } from './logs/Logger.js'
import { GameServer } from './GameServer.js'
import { MODES } from './types/env.mode.js'
//import { LeaderboardL } from './leaderboard/LeaderboardL.js';

const MODE = (MODES as any)[devConfig.env_mode]
export const ENV_MODE = MODE
class WebServer {
  public readonly app: express.Express
  public readonly server: http.Server
  gameServer: GameServer
  //client:any;
  public constructor() {
    this.app = express()

    this.server = http.createServer(this.app)

    /** Init HTTP Server */
    this.listen(devConfig.http_port)

    this.setupRoutes()

    try {
    } catch (err) {
    } finally {
      this.gameServer = new GameServer(this)
    }
  }

  private setupRoutes() {
    this.app.use(cors())

    this.app.get('/leaderboard', (req, res) => {
      const range = req.query['range'] || ''
      const mode = req.query['mode'] || ''
      const sort = req.query['sort'] || ''
      const season = req.query['season'] || ''

      switch (mode) {
        case 'total': {
          res.json(this.gameServer.leaderboard.leaderboard[0])
          res.status(200)
          break
        }
        default: {
          res.json([])
          res.status(200)
        }
      }
    })
  }

  private listen(port: number) {
    this.server.listen(port, () => Loggers.app.info(`Running http on basehead::{0}`, devConfig.http_port))
  }
}

new WebServer()

//

/*
process.on('error', (error) => {
    fs.writeFileSync('dump-' + performance.now() + ".log", require('util').inspect(error, { depth: 5 }), { encoding: 'utf8'});
});
process.on('unhandledRejection', (error: any) => {
    fs.writeFileSync('dump-' + performance.now() + ".log", require('util').inspect(error, { depth: 5 }), { encoding: 'utf8'});
});
process.on('uncaughtException', (error) => {
    fs.writeFileSync('dump-' + performance.now() + ".log", require('util').inspect(error, { depth: 5 }), { encoding: 'utf8'});
})
process.on('uncaughtExceptionMonitor', (error) => {
    fs.writeFileSync('dump-' + performance.now() + ".log", require('util').inspect(error, { depth: 5 }), { encoding: 'utf8'});
})
process.on('SIGINT', (error) => {
    fs.writeFileSync('dump-' + performance.now() + ".log", require('util').inspect(error, { depth: 5 }), { encoding: 'utf8'});
})*/
