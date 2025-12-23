import { App, Modal, TFile } from 'obsidian'
import type NoteSequenceService from '../service/noteSequence.service'

/**
 * Navigation option for the modal
 */
interface NavigationOption {
  direction: string
  label: string
  file: TFile | null
  disabled: boolean
}

/**
 * SequenceNavigatorModal
 *
 * Modal for quick keyboard-based navigation through note sequences.
 * Provides arrow key shortcuts for navigating parent, child, sibling, and sequence relationships.
 */
export class SequenceNavigatorModal extends Modal {
  private sequenceService: NoteSequenceService
  private currentFile: TFile
  private options: NavigationOption[]
  private buttons: Map<string, HTMLButtonElement> = new Map()

  constructor(app: App, sequenceService: NoteSequenceService, currentFile: TFile) {
    super(app)
    this.sequenceService = sequenceService
    this.currentFile = currentFile
    this.options = this.buildOptions()
  }

  /**
   * Build navigation options based on current file's relationships
   */
  private buildOptions(): NavigationOption[] {
    const core = this.sequenceService.getCore()
    const options: NavigationOption[] = []

    // Up: Parent
    const parentResult = this.sequenceService.navigateToParent(this.currentFile)
    const parent = parentResult.success && parentResult.node ? parentResult.node.file : null
    options.push({
      direction: 'up',
      label: parent ? parent.basename : 'No parent',
      file: parent,
      disabled: !parent,
    })

    // Down: First child
    const childrenResults = this.sequenceService.navigateToChildren(this.currentFile)
    const firstChild =
      childrenResults.length > 0 && childrenResults[0].success && childrenResults[0].node
        ? childrenResults[0].node.file
        : null
    options.push({
      direction: 'down',
      label: firstChild ? firstChild.basename : 'No children',
      file: firstChild,
      disabled: !firstChild,
    })

    // Left & Right: Previous/Next Sibling
    let prevSibling: TFile | null = null
    let nextSibling: TFile | null = null

    // Get siblings through parent
    if (parentResult.success && parentResult.node) {
      const siblings = this.sequenceService
        .navigateToChildren(parentResult.node.file)
        .filter((r) => r.success && r.node)
        .map((r) => r.node!.file)
        .sort((a, b) => a.basename.localeCompare(b.basename))

      const currentIndex = siblings.findIndex((f) => f.path === this.currentFile.path)
      if (currentIndex > 0) {
        prevSibling = siblings[currentIndex - 1]
      }
      if (currentIndex >= 0 && currentIndex < siblings.length - 1) {
        nextSibling = siblings[currentIndex + 1]
      }
    } else {
      // No parent, so look at root siblings
      const allRoots = this.sequenceService
        .getRootsInFolder(this.currentFile.parent?.path || '')
        .sort((a, b) => a.basename.localeCompare(b.basename))

      const currentIndex = allRoots.findIndex((f) => f.path === this.currentFile.path)
      if (currentIndex > 0) {
        prevSibling = allRoots[currentIndex - 1]
      }
      if (currentIndex >= 0 && currentIndex < allRoots.length - 1) {
        nextSibling = allRoots[currentIndex + 1]
      }
    }

    options.push({
      direction: 'left',
      label: prevSibling ? prevSibling.basename : 'No previous sibling',
      file: prevSibling,
      disabled: !prevSibling,
    })

    options.push({
      direction: 'right',
      label: nextSibling ? nextSibling.basename : 'No next sibling',
      file: nextSibling,
      disabled: !nextSibling,
    })

    // Prev/Next Sequence: Previous/Next root sequence
    const allFiles = this.app.vault.getMarkdownFiles()
    const roots = core.findAllRoots(allFiles).sort((a, b) => a.basename.localeCompare(b.basename))
    const currentRoot = core.findRootFile(this.currentFile, allFiles)
    const currentRootIndex = currentRoot ? roots.findIndex((r) => r.path === currentRoot.path) : -1

    const prevRoot = currentRootIndex > 0 ? roots[currentRootIndex - 1] : null
    const nextRoot =
      currentRootIndex >= 0 && currentRootIndex < roots.length - 1
        ? roots[currentRootIndex + 1]
        : null

    options.push({
      direction: 'prev-sequence',
      label: prevRoot ? prevRoot.basename : 'No previous sequence',
      file: prevRoot,
      disabled: !prevRoot,
    })

    options.push({
      direction: 'next-sequence',
      label: nextRoot ? nextRoot.basename : 'No next sequence',
      file: nextRoot,
      disabled: !nextRoot,
    })

    return options
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

  private createNavigationButton(parent: HTMLElement, direction: string, label: string) {
    const option = this.options.find((o) => o.direction === direction)
    if (!option) return

    const button = parent.createEl('button', {
      text: label,
      cls: 'navigator-button',
    })

    // Store button reference for keyboard shortcuts
    this.buttons.set(direction, button)

    if (option.disabled || !option.file) {
      button.addClass('navigator-button-disabled')
      button.disabled = true
      if (option.label) {
        button.setAttribute('title', option.label)
      }
    } else {
      button.setAttribute('title', option.label)
      button.addEventListener('click', () => {
        if (option.file) {
          void this.app.workspace.getLeaf().openFile(option.file)
          this.close()
        }
      })
    }
  }

  private registerKeyboardShortcuts() {
    // Arrow Up - Parent
    this.scope.register([], 'ArrowUp', (evt) => {
      evt.preventDefault()
      const button = this.buttons.get('up')
      if (button && !button.disabled) {
        button.click()
      }
      return false
    })

    // Arrow Down - Child
    this.scope.register([], 'ArrowDown', (evt) => {
      evt.preventDefault()
      const button = this.buttons.get('down')
      if (button && !button.disabled) {
        button.click()
      }
      return false
    })

    // Arrow Left - Prev Sibling
    this.scope.register([], 'ArrowLeft', (evt) => {
      evt.preventDefault()
      const button = this.buttons.get('left')
      if (button && !button.disabled) {
        button.click()
      }
      return false
    })

    // Arrow Right - Next Sibling
    this.scope.register([], 'ArrowRight', (evt) => {
      evt.preventDefault()
      const button = this.buttons.get('right')
      if (button && !button.disabled) {
        button.click()
      }
      return false
    })

    // Cmd+Arrow Left - Prev Sequence
    this.scope.register(['Mod'], 'ArrowLeft', (evt) => {
      evt.preventDefault()
      const button = this.buttons.get('prev-sequence')
      if (button && !button.disabled) {
        button.click()
      }
      return false
    })

    // Cmd+Arrow Right - Next Sequence
    this.scope.register(['Mod'], 'ArrowRight', (evt) => {
      evt.preventDefault()
      const button = this.buttons.get('next-sequence')
      if (button && !button.disabled) {
        button.click()
      }
      return false
    })
  }

  onClose() {
    const { contentEl } = this
    contentEl.empty()
  }
}
