import { App, Modal, TFile, type Modifier } from 'obsidian'
import type NoteSequenceService from '../service/noteSequence.service'

type Direction = 'up' | 'down' | 'left' | 'right' | 'prev-sequence' | 'next-sequence'

/**
 * SequenceNavigatorModal
 *
 * Modal for quick keyboard-based navigation through note sequences.
 * Provides arrow key shortcuts for navigating parent, child, sibling, and sequence relationships.
 */
export class SequenceNavigatorModal extends Modal {
  private currentFile: TFile
  private targets: Record<Direction, TFile | null>
  private buttons = new Map<Direction, HTMLButtonElement>()

  constructor(app: App, sequences: NoteSequenceService, currentFile: TFile) {
    super(app)
    this.currentFile = currentFile
    this.targets = {
      up: sequences.parent(currentFile),
      down: sequences.children(currentFile)[0] ?? null,
      left: sequences.adjacent(currentFile, -1),
      right: sequences.adjacent(currentFile, 1),
      'prev-sequence': sequences.adjacentSequence(currentFile, -1),
      'next-sequence': sequences.adjacentSequence(currentFile, 1),
    }
  }

  onOpen() {
    const { contentEl } = this
    contentEl.empty()
    contentEl.addClass('zettelkasten-navigator')

    // Title
    contentEl.createEl('h3', {
      text: this.currentFile.basename,
      cls: 'navigator-title',
    })

    // Navigation grid
    const gridEl = contentEl.createDiv({ cls: 'navigator-grid' })

    // Row 1: Up (Parent)
    const row1 = gridEl.createDiv({ cls: 'navigator-row' })
    row1.createDiv({ cls: 'navigator-spacer' })
    this.createNavigationButton(row1, 'up', '↑ Parent')
    row1.createDiv({ cls: 'navigator-spacer' })

    // Row 2: Left (Prev Sibling), Center, Right (Next Sibling)
    const row2 = gridEl.createDiv({ cls: 'navigator-row' })
    this.createNavigationButton(row2, 'left', '← Prev Sibling')
    row2.createDiv({ cls: 'navigator-center' }).setText('Current')
    this.createNavigationButton(row2, 'right', 'Next Sibling →')

    // Row 3: Down (First Child)
    const row3 = gridEl.createDiv({ cls: 'navigator-row' })
    row3.createDiv({ cls: 'navigator-spacer' })
    this.createNavigationButton(row3, 'down', '↓ Child')
    row3.createDiv({ cls: 'navigator-spacer' })

    // Row 4: Sequence Navigation
    const row4 = gridEl.createDiv({
      cls: 'navigator-row navigator-sequence-row',
    })
    this.createNavigationButton(row4, 'prev-sequence', '⇐ Prev Sequence')
    this.createNavigationButton(row4, 'next-sequence', '⇒ Next Sequence')

    // Instructions
    const instructions = contentEl.createDiv({ cls: 'navigator-instructions' })
    instructions.createEl('p', { text: 'Keyboard shortcuts:' })
    const list = instructions.createEl('ul')
    list.createEl('li', { text: 'Arrow keys: Navigate parent/child/siblings' })
    list.createEl('li', { text: 'Cmd/Ctrl + Left/Right: Switch sequences' })
    list.createEl('li', { text: 'Esc: Close' })

    // Register keyboard shortcuts
    this.registerKeyboardShortcuts()
  }

  /** A button that opens the target in `direction`; disabled when there is none */
  private createNavigationButton(parent: HTMLElement, direction: Direction, label: string) {
    const target = this.targets[direction]
    const button = parent.createEl('button', { text: label, cls: 'navigator-button' })
    if (target) button.setAttribute('title', target.basename)
    button.disabled = !target
    button.toggleClass('navigator-button-disabled', !target)
    button.addEventListener('click', () => {
      if (!target) return
      void this.app.workspace.getLeaf().openFile(target)
      this.close()
    })
    this.buttons.set(direction, button)
  }

  private registerKeyboardShortcuts() {
    const keys: Array<[Modifier[], string, Direction]> = [
      [[], 'ArrowUp', 'up'],
      [[], 'ArrowDown', 'down'],
      [[], 'ArrowLeft', 'left'],
      [[], 'ArrowRight', 'right'],
      [['Mod'], 'ArrowLeft', 'prev-sequence'],
      [['Mod'], 'ArrowRight', 'next-sequence'],
    ]
    for (const [modifiers, key, direction] of keys) {
      this.scope.register(modifiers, key, (evt) => {
        evt.preventDefault()
        this.buttons.get(direction)?.click()
        return false
      })
    }
  }
}
