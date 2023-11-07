import fs from 'fs';
import { GameServer } from '../GameServer.js';
import { Loggers } from '../logs/Logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

export class GlobalDataAnalyzer {
  blackListedData: any;
  gameServer: GameServer;
  hashedIpsList: any[];
  tempBlockList: any[];
  banIdCounter: number;

  constructor(gameServer: GameServer) {
    this.blackListedData = {};
    this.gameServer = gameServer;
    this.hashedIpsList = [];
    this.tempBlockList = [];
    this.banIdCounter = 0;
    this.getListData();
  }

  addToBlackList(ip: string) {
    this.banIdCounter++;
    const banData = {
      ip: ip,
      ban_id: this.banIdCounter,
    };
    console.log(this.blackListedData)
    this.blackListedData[banData.ban_id] = banData.ip;
    this.updateListData();
  }

  getListData() {
    const currentFilePath = fileURLToPath(import.meta.url);
    const currentDirectory = path.dirname(currentFilePath);
    const blacklistPath = path.join(currentDirectory, 'data', 'blacklist.json');

    try {
      const data = fs.readFileSync(blacklistPath, 'utf8');
      let jsonData = null;

      if (data) jsonData = JSON.parse(data);

      this.blackListedData = jsonData;
      this.updateBanIdCounter();
      Loggers.game.info(`Loaded IP-BlackList within ${Object.keys(jsonData).length} blocked IPs`);
    } catch (err) {
      fs.writeFileSync(blacklistPath, JSON.stringify([]));
      this.getListData();
    }
  }


  updateListData() {
    const currentFilePath = fileURLToPath(import.meta.url);
    const currentDirectory = path.dirname(currentFilePath);
    const blacklistPath = path.join(currentDirectory, 'data', 'blacklist.json');

    fs.writeFileSync(blacklistPath, JSON.stringify(this.blackListedData));
  }

  updateBanIdCounter() {
    if (this.blackListedData.length > 0) {
      const lastBan = this.blackListedData[this.blackListedData.length - 1];
      this.banIdCounter = lastBan.ban_id;
    } else {
      this.banIdCounter = 0;
    }
  }

  removeBlackList(id: string) {
    if (this.blackListedData.hasOwnProperty(id)) {
      delete this.blackListedData[id];
    }
    this.updateListData();
  }
  
  isBlackListed(ip: string) {
    return this.tempBlockList.hasOwnProperty(ip) || Object.values(this.blackListedData).includes(ip);
  }
  
}
