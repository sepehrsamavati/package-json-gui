import os from 'node:os'
import { OsInfo } from '../types.js'

export type OsService = {
  getOsInfo: () => OsInfo
}

export const createOsService = (): OsService => {
  return {
    getOsInfo: (): OsInfo => {
      return {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        uptime: os.uptime(),
      }
    },
  }
}
