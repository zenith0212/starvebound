import { Loggers } from '../../logs/Logger.js'
import { GlobalDataAnalyzer } from '../GlobalDataAnalyzer.js'
import { IP } from './IP.js'

export function analyzeIp(globalAnalyzer: GlobalDataAnalyzer, connectionHashList: IP[], ip: string) {
  const ipInst = connectionHashList.find((f) => f.ip == ip)

  if (!ipInst) {
    globalAnalyzer.hashedIpsList.push(new IP(ip))
    return
  }
  if (ipInst.connectionCount > 10) {
    globalAnalyzer.tempBlockList.push(ip)
    Loggers.game.info(
      `[Global Analyzer Thread#${Math.floor(
        Math.random() * 59,
      )}]: Blocked attack attempt from Following ip: ${ip} | #ee2 | ${ipInst.connectionCount}`,
    )

    const newList = connectionHashList.filter((e) => e.ip != ip)
    globalAnalyzer.hashedIpsList = newList
    return
  }

  if (+new Date() - ipInst.connectionTimestamp > 1000 * 3) {
    ipInst.connectionTimestamp = +new Date()
    ipInst.connectionCount = 0
  }
}
