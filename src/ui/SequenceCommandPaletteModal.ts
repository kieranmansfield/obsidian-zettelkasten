import { App, FuzzySuggestModal, Notice } from 'obsidian'
import type { CommandContext } from '../base/command'
import * as commands from '../commands'

/**
 * Command item for the palette
 */
interface SequenceCommandItem {
  id: string
  name: string
  description: string
  icon?: string
  execute: () => void | Promise<void>
}

/**
 * SequenceCommandPaletteModal
 *
 * Modal for quickly accessing note sequence commands
 */
export class SequenceCommandPaletteModal extends FuzzySuggestModal<SequenceCommandItem> {
  private context: CommandContext
  private commandItems: SequenceCommandItem[]

  constructor(app: App, context: CommandContext) {
    super(app)
    this.context = context
    this.commandItems = []
    this.setPlaceholder('Select a note sequence command...')
    this.setInstructions([
      { command: '↑↓', purpose: 'to navigate' },
      { command: '↵', purpose: 'to execute' },
      { command: 'esc', purpose: 'to dismiss' },
    ])
  }

  onOpen() {
    super.onOpen()
    this.buildCommandItems()
  }

  private buildCommandItems() {
    // Navigation commands
    const navCommands = [
      commands.openParentZettelCommand,
      commands.openChildZettelCommand,
      commands.nextSiblingCommand,
      commands.nextChildCommand,
      commands.nextSequenceCommand,
    ]

    // Manipulation commands
    const manipCommands = [
      commands.indentZettelCommand,
      commands.outdentZettelCommand,
      commands.assignParentCommand,
      commands.assignChildCommand,
    ]

    // View commands
    const viewCommands = [
      commands.openNoteSequencesViewCommand,
      commands.openSequenceNavigatorViewCommand,
    ]

    // Build items from commands
    const allCommands = [...navCommands, ...manipCommands, ...viewCommands]

    this.commandItems = allCommands.map((factory) => {
      const cmd = factory(this.context)
      return {
        id: cmd.id,
        name: cmd.name,
        description: cmd.metadata?.description || '',
        icon: cmd.icon,
        execute: cmd.execute,
      }
    })
  }

  getItems(): SequenceCommandItem[] {
    return this.commandItems
  }

  getItemText(item: SequenceCommandItem): string {
    return item.name
  }

  renderSuggestion(match: { item: SequenceCommandItem }, el: HTMLElement) {
    const container = el.createDiv({ cls: 'sequence-command-item' })

    // Icon and title
    const titleContainer = container.createDiv({ cls: 'suggestion-title' })
    if (match.item.icon) {
      titleContainer.createSpan({ cls: 'suggestion-icon', text: match.item.icon })
    }
    titleContainer.createSpan({ text: match.item.name })

    // Description
    if (match.item.description) {
      container.createDiv({ cls: 'suggestion-note', text: match.item.description })
    }
  }

  async onChooseItem(item: SequenceCommandItem) {
    try {
      await item.execute()
    } catch (error) {
      console.error(`Error executing command ${item.id}:`, error)
      new Notice(`Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
