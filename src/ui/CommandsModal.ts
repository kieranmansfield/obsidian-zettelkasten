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
      text: 'Enable or disable individual commands.',
      cls: 'setting-item-description',
    })

    const byCategory = new Map<string, BaseCommand[]>()
    for (const command of this.plugin.getCommandRegistry().getAllCommands()) {
      const category = command.metadata?.category || 'Other'
      byCategory.set(category, [...(byCategory.get(category) ?? []), command])
    }
    for (const [category, commands] of byCategory) {
      this.renderCategorySection(contentEl, category, commands)
    }
  }

  private renderCategorySection(
    container: HTMLElement,
    category: string,
    commands: BaseCommand[]
  ): void {
    const section = container.createDiv({ cls: 'commands-category-section' })

    // Category header
    section.createEl('h3', { text: this.formatCategoryName(category) })

    // Render each command
    const enabled = this.plugin.getSettingsManager().getEnabledCommandsMap()
    commands.forEach(({ id, name, metadata }) => {
      const isEnabled = enabled.get(id) !== false

      new Setting(section)
        .setName(name)
        .setDesc(metadata?.description || '')
        .addToggle((toggle) => {
          toggle.setValue(isEnabled).onChange(async (value) => {
            if (value) {
              await this.plugin.enableCommand(id)
              new Notice(`Enabled: ${name}`)
            } else {
              await this.plugin.disableCommand(id)
              new Notice(`Disabled: ${name}`)
            }
          })
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
}
