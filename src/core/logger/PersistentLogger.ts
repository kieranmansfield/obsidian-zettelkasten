import type { Plugin } from 'obsidian'
import { LogType, ZkLogEntry } from '../../types/interfaces'
import { ZettelLogManager } from '../zettel/ZettelLogManager'

/**
 * Persistent Logger Service
 * - Delegates pure logging to ZettelLogManager
 * - Handles plugin data persistence
 */
export class PersistentLoggerService {
  private logManager = new ZettelLogManager()

  constructor(private plugin: Plugin) {}

  async load(): Promise<void> {
    const raw = await this.plugin.loadData()
    const entries: ZkLogEntry[] = raw?.zklogs?.entries ?? []
    entries.forEach((e) => this.logManager.log(e.msg))
  }

  async save(): Promise<void> {
    const raw = (await this.plugin.loadData()) ?? {}
    raw.zklogs = {
      entries: this.logManager.getLogs().map((msg, i) => ({
        id: `log-${i}-${Date.now()}`,
        type: 'info' as LogType,
        ts: Date.now(),
        msg,
      })),
    }
    await this.plugin.saveData(raw)
  }

  getAll() {
    return this.logManager.getLogs()
  }

  add(type: LogType, msg: string, data?: Record<string, unknown>) {
    this.logManager.log(`[${type}] ${msg}${data ? ' ' + JSON.stringify(data) : ''}`)
  }

  clear() {
    this.logManager.clear()
  }
}

export default PersistentLoggerService
