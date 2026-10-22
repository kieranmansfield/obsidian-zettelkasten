import type { Plugin } from 'obsidian'
import type { BaseCommand, CommandContext, CommandFactory } from '../base/command'

/** The plugin's commands, each switchable on and off in the command palette at runtime */
export default class CommandRegistry {
  private plugin: Plugin
  private commands = new Map<string, { command: BaseCommand; enabled: boolean }>()

  constructor(plugin: Plugin) {
    this.plugin = plugin
  }

  /** Build every command and add those not switched off in `enabled` (commands default to on) */
  registerAll(
    factories: CommandFactory[],
    context: CommandContext,
    enabled: Map<string, boolean>
  ): void {
    for (const factory of factories) {
      const command = factory(context)
      this.commands.set(command.id, { command, enabled: false })
      if (enabled.get(command.id) ?? true) this.enableCommand(command.id)
    }
  }

  enableCommand(id: string): void {
    const entry = this.commands.get(id)
    if (!entry || entry.enabled) return
    const { command } = entry
    this.plugin.addCommand({
      id: command.id,
      name: command.name,
      icon: command.icon,
      callback: () => {
        Promise.resolve(command.execute()).catch((err) =>
          console.error(`Command "${command.id}" failed:`, err)
        )
      },
    })
    entry.enabled = true
  }

  disableCommand(id: string): void {
    const entry = this.commands.get(id)
    if (!entry?.enabled) return
    this.plugin.removeCommand(id)
    entry.enabled = false
  }

  // fallow-ignore-next-line unused-class-member
  getAllCommands(): BaseCommand[] {
    return [...this.commands.values()].map((e) => e.command)
  }
}
