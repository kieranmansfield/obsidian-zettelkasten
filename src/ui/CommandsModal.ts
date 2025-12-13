import { App, Modal, Setting, Notice } from 'obsidian'
import type ZettelkastenPlugin from '../main'
import type { BaseCommand } from '../base/command'

/**
 * CommandsModal
 *
 * Modal for managing plugin commands (enable/disable)
 */
export class CommandsModal extends Modal {
  private plugin: ZettelkastenPlugin

  constructor(app: App, plugin: ZettelkastenPlugin) {
    super(app)
    this.plugin = plugin
  }

  onOpen() {
    const { contentEl } = this

    contentEl.empty()
    contentEl.addClass('commands-modal')

    // Header
    contentEl.createEl('h2', { text: 'Manage commands' })
    contentEl.createEl('p', {
      text: 'Enable or disable individual commands. Changes require a plugin reload.',
      cls: 'setting-item-description',
    })

    // Get all commands from registry
    const commandRegistry = this.plugin.getCommandRegistry()
    const commands = commandRegistry.getAllCommands()

    // Group commands by category
    const commandsByCategory = this.groupCommandsByCategory(commands)

    // Render each category
    for (const [category, categoryCommands] of Object.entries(commandsByCategory)) {
      this.renderCategorySection(contentEl, category, categoryCommands)
    }

    // Close button
    // new Setting(contentEl).addButton((button) => {
    //   button
    //     .setButtonText('Close')
    //     .setCta()
    //     .onClick(() => {
    //       this.close()
    //     })
    // })
  }

  private groupCommandsByCategory(
    commands: Map<string, BaseCommand>
  ): Record<string, Array<{ id: string; command: BaseCommand }>> {
    const grouped: Record<string, Array<{ id: string; command: BaseCommand }>> = {}

    for (const [id, command] of commands.entries()) {
      const category = command.metadata?.category || 'Other'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push({ id, command })
    }

    return grouped
  }

  private renderCategorySection(
    container: HTMLElement,
    category: string,
    commands: Array<{ id: string; command: BaseCommand }>
  ): void {
    const section = container.createDiv({ cls: 'commands-category-section' })

    // Category header
    section.createEl('h3', { text: this.formatCategoryName(category) })

    // Render each command
    commands.forEach(({ id, command }) => {
      const settingsManager = this.plugin.getSettingsManager()
      const enabledCommands = settingsManager.getEnabledCommandsMap()
      const isEnabled = enabledCommands.get(id) !== false

      new Setting(section)
        .setName(command.name)
        .setDesc(command.metadata?.description || '')
        .addToggle((toggle) => {
          toggle.setValue(isEnabled).onChange(async (value) => {
            if (value) {
              await this.plugin.enableCommand(id)
              new Notice(`Enabled: ${command.name}. Reload plugin to apply.`)
            } else {
              await this.plugin.disableCommand(id)
              new Notice(`Disabled: ${command.name}. Reload plugin to apply.`)
            }
          })

          // Disable toggle if command can't be disabled
          if (command.metadata?.canBeDisabled === false) {
            toggle.setDisabled(true)
          }
        })
    })
  }

  private formatCategoryName(category: string): string {
    // Convert "note-creation" to "Note Creation"
    return category
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  onClose() {
    const { contentEl } = this
    contentEl.empty()
  }
}
