import type { Plugin, Command } from 'obsidian'
import type { BaseCommand, CommandContext, CommandFactory } from '../base/command'

/**
 * Registered command tracking
 */
interface RegisteredCommand {
  command: BaseCommand
  factory: CommandFactory
  obsidianCommand: Command | null
  enabled: boolean
}

/**
 * CommandRegistry
 *
 * Centralized registry for all plugin commands.
 * Handles registration, initialization, and lifecycle management.
 * Supports dynamic enable/disable based on settings.
 *
 * Usage:
 * 1. Create command factory functions in separate files
 * 2. Import and register them in CommandRegistry
 * 3. Call registry.registerAll() in main.ts
 * 4. Use enable/disable methods to dynamically manage commands
 */
export default class CommandRegistry {
  private plugin: Plugin
  private context: CommandContext
  private registeredCommands: Map<string, RegisteredCommand> = new Map()
  private commandFactories: CommandFactory[] = []

  constructor(plugin: Plugin, context: CommandContext) {
    this.plugin = plugin
    this.context = context
  }

  /**
   * Add a command factory to the registry
   */
  add(factory: CommandFactory): this {
    this.commandFactories.push(factory)
    return this
  }

  /**
   * Register all commands with Obsidian
   * Call this once during plugin initialization
   *
   * @param enabledCommands - Optional map of command IDs to enabled state
   */
  registerAll(enabledCommands?: Map<string, boolean>): void {
    for (const factory of this.commandFactories) {
      const command = factory(this.context)
      const isEnabledByDefault = command.metadata?.enabledByDefault !== false

      // Check if command should be enabled based on settings
      const shouldEnable = enabledCommands
        ? (enabledCommands.get(command.id) ?? isEnabledByDefault)
        : isEnabledByDefault

      // Store command metadata
      this.registeredCommands.set(command.id, {
        command,
        factory,
        obsidianCommand: null,
        enabled: false,
      })

      // Register if enabled
      if (shouldEnable) {
        this.enableCommand(command.id)
      }
    }

    const enabledCount = Array.from(this.registeredCommands.values()).filter(
      (r) => r.enabled
    ).length

    console.log(`Registered ${enabledCount}/${this.registeredCommands.size} commands`)
  }

  /**
   * Enable a specific command
   */
  enableCommand(commandId: string): boolean {
    const registered = this.registeredCommands.get(commandId)
    if (!registered) {
      console.warn(`Command "${commandId}" not found in registry`)
      return false
    }

    // Already enabled
    if (registered.enabled) {
      return true
    }

    // Check if command can be disabled
    if (registered.command.metadata?.canBeDisabled === false && !registered.enabled) {
      // This shouldn't happen, but safety check
      console.warn(`Command "${commandId}" cannot be disabled`)
    }

    // Register with Obsidian
    const obsidianCommand = this.plugin.addCommand({
      id: registered.command.id,
      name: registered.command.name,
      icon: registered.command.icon,
      hotkeys: registered.command.hotkeys,
      checkCallback: registered.command.checkCallback,
      editorCallback: registered.command.editorCallback,
      editorCheckCallback: registered.command.editorCheckCallback,
      callback: () => {
        const result = registered.command.execute()

        if (result instanceof Promise) {
          result.catch((err) => {
            console.error(`Command "${registered.command.id}" failed:`, err)
          })
        }
      },
    })

    // Update tracking
    registered.obsidianCommand = obsidianCommand
    registered.enabled = true

    return true
  }

  /**
   * Disable a specific command
   * Note: Obsidian doesn't provide a way to unregister commands,
   * so we work around this by removing the command from the internal registry
   */
  disableCommand(commandId: string): boolean {
    const registered = this.registeredCommands.get(commandId)
    if (!registered) {
      console.warn(`Command "${commandId}" not found in registry`)
      return false
    }

    // Check if command can be disabled
    if (registered.command.metadata?.canBeDisabled === false) {
      console.warn(`Command "${commandId}" cannot be disabled`)
      return false
    }

    // Already disabled
    if (!registered.enabled) {
      return true
    }

    // Obsidian doesn't provide removeCommand(), so we need to reload the plugin
    // For now, just mark as disabled and log a warning
    registered.enabled = false
    console.warn(
      `Command "${commandId}" marked as disabled. Plugin reload required to take effect.`
    )

    return true
  }

  /**
   * Update context (useful when services are reloaded)
   */
  updateContext(context: CommandContext): void {
    this.context = context
  }

  /**
   * Reload all commands with new enabled state
   * This requires plugin reload in Obsidian
   */
  reloadAll(enabledCommands: Map<string, boolean>): void {
    console.log('Command reload requested. Plugin reload required.')
    // Store for next load
    // In a real implementation, this would save to plugin settings
  }

  /**
   * Get all registered commands
   */
  getCommands(): BaseCommand[] {
    return Array.from(this.registeredCommands.values()).map((r) => r.command)
  }

  /**
   * Get all registered commands with their IDs
   */
  getAllCommands(): Map<string, BaseCommand> {
    const commands = new Map<string, BaseCommand>()
    for (const [id, registered] of this.registeredCommands.entries()) {
      commands.set(id, registered.command)
    }
    return commands
  }

  /**
   * Get enabled commands
   */
  getEnabledCommands(): BaseCommand[] {
    return Array.from(this.registeredCommands.values())
      .filter((r) => r.enabled)
      .map((r) => r.command)
  }

  /**
   * Check if a command is enabled
   */
  isCommandEnabled(commandId: string): boolean {
    return this.registeredCommands.get(commandId)?.enabled ?? false
  }

  /**
   * Get command metadata
   */
  getCommandMetadata(commandId: string) {
    return this.registeredCommands.get(commandId)?.command.metadata
  }

  /**
   * Get all commands grouped by category
   */
  getCommandsByCategory(): Map<string, BaseCommand[]> {
    const categories = new Map<string, BaseCommand[]>()

    for (const { command } of this.registeredCommands.values()) {
      const category = command.metadata?.category ?? 'uncategorized'
      if (!categories.has(category)) {
        categories.set(category, [])
      }
      categories.get(category)!.push(command)
    }

    return categories
  }
}
