import express from 'express'
import { setupGameServerConnection } from './game-server-connection.js'

const web = express()

// ToDo: Use this in client
web.get('/api/servers', (_, res) => {
  res.json(Array.from(gameServers))
})

web.get('/api/accounts/me', () => {
  // ToDo: Check Auth
  // ToDo: Return info about me
})

const httpServer = web.listen(8080)
const gameServers = setupGameServerConnection(httpServer)
