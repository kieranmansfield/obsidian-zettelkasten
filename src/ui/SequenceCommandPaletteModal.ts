import { App, FuzzySuggestModal, Notice, setIcon } from 'obsidian'
import type { BaseCommand } from '../base/command'

/**
 * SequenceCommandPaletteModal
 *
 * Modal for quickly accessing note sequence commands
 */
export class SequenceCommandPaletteModal extends FuzzySuggestModal<BaseCommand> {
  private commandItems: BaseCommand[]

  constructor(app: App, commands: BaseCommand[]) {
    super(app)
    this.commandItems = commands
    this.setPlaceholder('Select a note sequence command...')
    this.setInstructions([
      { command: '↑↓', purpose: 'to navigate' },
      { command: '↵', purpose: 'to execute' },
      { command: 'esc', purpose: 'to dismiss' },
    ])
  }

  getItems(): BaseCommand[] {
    return this.commandItems
  }

  getItemText(item: BaseCommand): string {
    return item.name
  }

  renderSuggestion(match: { item: BaseCommand }, el: HTMLElement) {
    const container = el.createDiv({ cls: 'sequence-command-item' })

    // Icon and title
    const titleContainer = container.createDiv({ cls: 'suggestion-title' })
    if (match.item.icon) {
      setIcon(titleContainer.createSpan({ cls: 'suggestion-icon' }), match.item.icon)
    }
    titleContainer.createSpan({ text: match.item.name })

    // Description
    const description = match.item.metadata?.description
    if (description) {
      container.createDiv({ cls: 'suggestion-note', text: description })
    }
  }

  onChooseItem(item: BaseCommand): void {
    void (async () => {
      try {
        await item.execute()
      } catch (error) {
        console.error(`Error executing command ${item.id}:`, error)
        new Notice(
          `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    })()
  }
}
