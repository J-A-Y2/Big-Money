import { Request } from 'express'
import * as useragent from 'useragent'

export interface DeviceInfo {
  browser: string
  platform: string
  version: string
}

export function getDeviceInfo(req: Request): DeviceInfo {
  const os = useragent.parse(req.headers['user-agent'])
  const browser = os.family
  const platform = os.os.family
  const version = `${os.major}.${os.minor}.${os.patch}`

  return { browser, platform, version }
}
