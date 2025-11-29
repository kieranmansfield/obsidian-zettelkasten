import { App, FuzzySuggestModal } from 'obsidian'

import type { BoxCommand } from '../../types/interfaces'

export class BoxCommandPaletteModal extends FuzzySuggestModal<BoxCommand> {
  constructor(
    app: App,
    private readonly boxName: string,
    private readonly commands: readonly BoxCommand[]
  ) {
    super(app)
    this.setPlaceholder(`${boxName}: Type to search commands…`)
  }

  /** Return available commands */
  getItems(): BoxCommand[] {
    return [...this.commands]
  }

  /** Display text for each command */
  getItemText(item: BoxCommand): string {
    return item.name
  }

  /** Execute the chosen command */
  onChooseItem(item: BoxCommand): void {
    // UI layer should not contain business logic — only trigger the callback
    item.callback()
  }
}
