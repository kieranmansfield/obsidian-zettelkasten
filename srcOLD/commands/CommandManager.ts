import { Plugin, Command } from 'obsidian'
import { CommandConfig } from './types'

export class CommandManager {
  private plugin: Plugin
  private registeredCommands: string[] = []

  constructor(plugin: Plugin) {
    this.plugin = plugin
  }

  registerCommand(cmd: CommandConfig) {
    this.plugin.addCommand({
      id: cmd.id,
      name: cmd.name,
      callback: cmd.callback,
    })
    this.registeredCommands.push(cmd.id)
  }

  unregisterAll() {
    this.registeredCommands = []
  }
}
