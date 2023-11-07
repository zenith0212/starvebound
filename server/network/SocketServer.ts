import { WebSocketServer } from 'ws'
import { GameServer } from '../GameServer.js'
import { Loggers } from '../logs/Logger.js'
import devConfig from '../staticSettings/devconfig.json' assert { type: 'json' }
import { ConnectionPlayer } from './ConnectionPlayer.js'
import serverConfig from '../settings/serverconfig.json' assert { type: 'json' }
import { ServerPacketTypeJson } from '../enums/PacketType.js'

let logsCoung = 0
let logLast = +new Date() //
export class SocketServer {
  public gameServer: GameServer
  public server: WebSocketServer
  public lastConnectionLoopReset: number = -1
  public connectionAmount: number = 0
  public activeWebSockets: number = 0
  public serverElapsedAt: number = +new Date()
  public ipAdress: any = []

  public constructor(gameServer: GameServer) {
    this.gameServer = gameServer

    this.server = new WebSocketServer({
      port: devConfig.websocket_port,
      host: '0.0.0.0',
    })

    this.server.addListener('connection', (_socket, request) => {
      let otherIp = request.headers['x-forwarded-for']?.toString() || request.connection.localAddress || ''
      let ip: string = request.headers['cf-connecting-ip']?.toString() || otherIp

      _socket.binaryType = 'arraybuffer'


      const now = +new Date()

      if (now - this.lastConnectionLoopReset > serverConfig.protection.throttleDelay) {
        this.lastConnectionLoopReset = now
        this.connectionAmount = 0
      }

      if (this.isNodeConnection(request.headers, request.rawHeaders)) return _socket.close(1000)
      if (this.gameServer.globalAnalyzer.isBlackListed(ip)){
        _socket.send(JSON.stringify(([ServerPacketTypeJson.AlertMessage, 'You are banned from this server!'])))
        return _socket.close(1000)
      }
      const connectionPlayer = new ConnectionPlayer(this.gameServer, _socket, request)

      this.connectionAmount++
      this.activeWebSockets += 1

      _socket.on('message', (msg: any) => {
        try {
          if (typeof msg === 'object' || typeof msg === 'string') {
            const data = JSON.parse(msg)

            if (connectionPlayer.packetCounter < 1) {
              connectionPlayer.receiveOurBinary(data)
            } else {
              connectionPlayer.onPacketReceived(data)
            }
            /*
                        if(devConfig.env_mode == "TEST") {
                            const packetData = JSON.parse(msg);
                            if(connectionPlayer.packetCounter < 1) {
                                connectionPlayer.receiveOurBinary(packetData);
                            }else {
                                connectionPlayer.onPacketReceived(packetData);
                            }
                        }else {
                            const buffer = Buffer.from(msg);
                            const uint16Array = new Uint16Array(buffer.length / 2);
    
                            for (let i = 0; i < buffer.length; i += 2) {
                                const value = buffer.readUInt16LE(i);
                                uint16Array[i / 2] = value;
                            }
                            const packetData = JSON.parse(convertToString(decode(uint16Array)));
                        
                            if(connectionPlayer.packetCounter < 1) {
                                connectionPlayer.receiveOurBinary(packetData);
                            }else {
                                connectionPlayer.onPacketReceived(packetData);
                            }
                        }*/
          }
        } catch (e) {
          if (+new Date() - logLast > 1000) {
            logsCoung = 0
          }
          if (logsCoung <= 5) {
            logsCoung += 1
            if (connectionPlayer.sourcePlayer != null) {
              Loggers.game.info(
                `Error parsing message from ${connectionPlayer.sourcePlayer.gameProfile.name} with {0}`,
                e,
              )
            } else {
              Loggers.game.info('Error parsing message {0}', e)

              //if(ENV_MODE != MODES.DEV) this.gameServer.globalAnalyzer.addToBlackList(otherIp);
            }
          }
        }
      })
      _socket.on('close', () => {
        this.activeWebSockets -= 1
      })
      _socket.on('error', () => {
        this.activeWebSockets -= 1
      })
    })
    Loggers.app.info('Running socket cheap on::{0}', devConfig.websocket_port)
  }
  isNodeConnection(headers: any, rawHeaders: any) {
    if (!headers.origin || !headers['user-agent'] || !rawHeaders[13]) return true

    if (
      rawHeaders[13] == 'http://famishs.io' ||
      rawHeaders[13] == 'http://mirror.famishs.io' ||
      rawHeaders[13] == 'https://famishs.io' ||
      rawHeaders[13] == 'https://famishs.io/' ||
      rawHeaders[13] == 'http://famishs.io/' ||
      rawHeaders[13] == 'http://localhost' ||
      rawHeaders[13] == 'https://localhost:80'
    )
      return false
    return false
  }
}
