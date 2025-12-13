import { App, FuzzySuggestModal, Modal, Setting, Notice, TFile } from 'obsidian'
import type { Box } from '../base/box'
import type BoxManager from '../core/boxManager.class'
import { BoxMode } from '../base/settings'
import type SettingsManager from '../settings/SettingsManager'
import { getFileTitle } from '../base/fileHelpers'

/**
 * Box item for the palette (includes boxes and create action)
 */
interface BoxPaletteItem {
  type: 'box' | 'create-new'
  box?: Box
  name: string
  description?: string
}

/**
 * BoxPaletteModal
 *
 * Modal for selecting boxes to view their notes
 */
export class BoxPaletteModal extends FuzzySuggestModal<BoxPaletteItem> {
  private boxManager: BoxManager
  private settingsManager: SettingsManager
  private boxes: Box[]

  constructor(app: App, boxManager: BoxManager, settingsManager: SettingsManager) {
    super(app)
    this.boxManager = boxManager
    this.settingsManager = settingsManager
    this.boxes = []
    this.setPlaceholder('Select a box to view its notes')
  }

  onOpen(): void {
    void (async () => {
      await super.onOpen()
      // Load boxes when modal opens
      this.boxes = await this.boxManager.listBoxes()
    })()
  }

  getItems(): BoxPaletteItem[] {
    const items: BoxPaletteItem[] = []

    // Add "Create New Box" option at the top
    items.push({
      type: 'create-new',
      name: '+ Create New Box',
      description: 'Create a new box for organizing zettels',
    })

    // Add existing boxes
    for (const box of this.boxes) {
      items.push({
        type: 'box',
        box,
        name: box.name,
        description: `${box.type}: ${box.value}${box.default ? ' (default)' : ''}`,
      })
    }

    return items
  }

  getItemText(item: BoxPaletteItem): string {
    return item.name
  }

  renderSuggestion(match: { item: BoxPaletteItem }, el: HTMLElement) {
    el.createDiv({ cls: 'suggestion-title', text: match.item.name })
    if (match.item.description) {
      el.createDiv({ cls: 'suggestion-note', text: match.item.description })
    }
  }

  onChooseItem(item: BoxPaletteItem) {
    if (item.type === 'create-new') {
      // Open create box modal
      new CreateBoxModal(this.app, this.boxManager, this.settingsManager).open()
    } else if (item.box) {
      // Open quick switcher for notes in this box
      const boxSettings = this.settingsManager.getBoxes()
      new NotesInBoxModal(this.app, item.box, boxSettings.rootFolder).open()
    }
  }
}

/**
 * NotesInBoxModal
 *
 * Fuzzy search modal for notes within a specific box
 */
class NotesInBoxModal extends FuzzySuggestModal<TFile> {
  private box: Box
  private rootFolder: string
  private files: TFile[] = []

  constructor(app: App, box: Box, rootFolder: string) {
    super(app)
    this.box = box
    this.rootFolder = rootFolder
    this.setPlaceholder(`Search notes in ${box.name}`)
    this.setInstructions([
      { command: '↑↓', purpose: 'to navigate' },
      { command: '↵', purpose: 'to open' },
      { command: 'esc', purpose: 'to dismiss' },
    ])
  }

  onOpen(): void {
    void (async () => {
      await super.onOpen()
      // Load files from the box
      this.files = this.getFilesInBox()
    })()
  }

  private getFilesInBox(): TFile[] {
    const allFiles = this.app.vault.getMarkdownFiles()

    if (this.box.type === 'folder') {
      // For folder boxes, the box.value is already the full path from createBox
      // But we need to handle both cases: full path or relative path
      const boxPath = this.box.value || this.rootFolder

      // Filter files that are in this box's folder
      return allFiles.filter((file) => {
        return file.path.startsWith(boxPath + '/') || file.path === boxPath
      })
    } else if (this.box.type === 'tag') {
      // Filter files that have this tag
      const tagName = this.box.value.startsWith('#') ? this.box.value : `#${this.box.value}`
      return allFiles.filter((file) => {
        const cache = this.app.metadataCache.getFileCache(file)
        if (!cache || !cache.tags) return false
        return cache.tags.some((tag) => tag.tag === tagName)
      })
    }

    return []
  }

  getItems(): TFile[] {
    return this.files
  }

  getItemText(file: TFile): string {
    return getFileTitle(this.app, file)
  }

  renderSuggestion(file: { item: TFile }, el: HTMLElement) {
    const title = getFileTitle(this.app, file.item)
    el.createDiv({ cls: 'suggestion-title', text: title })
    el.createDiv({ cls: 'suggestion-note', text: file.item.path })
  }

  onChooseItem(file: TFile): void {
    // Open the file in the active leaf
    void this.app.workspace.getLeaf().openFile(file)
  }
}

/**
 * CreateBoxModal
 *
 * Modal for creating a new box
 */
class CreateBoxModal extends Modal {
  private boxManager: BoxManager
  private settingsManager: SettingsManager
  private name: string = ''
  private value: string = ''

  constructor(app: App, boxManager: BoxManager, settingsManager: SettingsManager) {
    super(app)
    this.boxManager = boxManager
    this.settingsManager = settingsManager
  }

  onOpen() {
    const { contentEl } = this

    contentEl.empty()
    contentEl.createEl('h2', { text: 'Create new box' })

    const boxSettings = this.settingsManager.getBoxes()
    const boxType = boxSettings.mode === BoxMode.FOLDER ? 'folder' : 'tag'

    // Box name input
    new Setting(contentEl)
      .setName('Box name')
      .setDesc('Human-readable name for the box')
      .addText((text) => {
        text.setPlaceholder('My box').onChange((value) => {
          this.name = value
        })
        text.inputEl.focus()

        text.inputEl.addEventListener('keydown', (evt: KeyboardEvent) => {
          if (evt.key === 'Enter' && !evt.shiftKey) {
            evt.preventDefault()
            void this.submit()
          }
        })
      })

    // Box value input
    new Setting(contentEl)
      .setName(boxType === 'folder' ? 'Folder Path' : 'Tag Name')
      .setDesc(
        boxType === 'folder' ? 'Folder path relative to root folder' : 'Tag name (without #)'
      )
      .addText((text) => {
        text.setPlaceholder(boxType === 'folder' ? 'my-box' : 'my-box-tag').onChange((value) => {
          this.value = value
        })

        text.inputEl.addEventListener('keydown', (evt: KeyboardEvent) => {
          if (evt.key === 'Enter' && !evt.shiftKey) {
            evt.preventDefault()
            void this.submit()
          }
        })
      })

    // Info about current box mode
    contentEl.createDiv({
      cls: 'setting-item-description',
      text: `Current box mode: ${boxType.toUpperCase()}. Change this in plugin settings.`,
    })

    // Buttons
    new Setting(contentEl)
      .addButton((button) => {
        button
          .setButtonText('Create')
          .setCta()
          .onClick(() => {
            void this.submit()
          })
      })
      .addButton((button) => {
        button.setButtonText('Cancel').onClick(() => {
          this.close()
        })
      })
  }

  private async submit() {
    if (!this.name.trim() || !this.value.trim()) {
      new Notice('Please enter both name and value')
      return
    }

    try {
      const boxSettings = this.settingsManager.getBoxes()
      const boxType = boxSettings.mode === BoxMode.FOLDER ? 'folder' : 'tag'

      const newBox: Box = {
        type: boxType,
        name: this.name.trim(),
        value: this.value.trim(),
      }

      await this.boxManager.createBox(newBox)

      new Notice(`Created box: ${newBox.name}`)
      this.close()
    } catch (err) {
      console.error('Failed to create box:', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      new Notice(`Failed to create box: ${errorMessage}`)
    }
  }

  onClose() {
    const { contentEl } = this
    contentEl.empty()
  }
}
