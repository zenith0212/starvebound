import assert from 'assert'
import { Server } from 'http'
import { WebSocketServer } from 'ws'

type GameServer = {
  name: string
  players: number
}

export function setupGameServerConnection(server: Server) {
  const gameServers = new Set<GameServer>()

  const wss = new WebSocketServer({ server })

  server.on('upgrade', (req, socket, head) => {
    socket.on('error', console.error)

    // ToDo: Implement auth with game server
    if (req.headers['x-starvebound-auth'] === '') {
      wss.handleUpgrade(req, socket, head, (websocket) => {
        // ToDo: server/ServerAPI.ts should connect to this
        const gameServer: GameServer = {
          name: 'ToDo',
          players: 0,
        }
        gameServers.add(gameServer)
        websocket.on('message', (data) => {
          try {
            assert(typeof data === 'string')
            const packet = JSON.parse(data)

            if (packet[0] === 'update-player-count') {
              gameServer.players = packet[1] as number
            }
          } catch (error) {
            console.error(error)
          }
        })
        websocket.on('close', () => gameServers.delete(gameServer))
      })
    } else {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
    }
  })

  return gameServers
}
