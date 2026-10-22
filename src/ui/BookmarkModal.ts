import { App, Modal, Notice, Setting, type TextComponent } from 'obsidian'
import type { Bookmark } from '../base/settings'
import { TextSuggest, filePaths, folderPaths, searchQueries } from './TextSuggest'

export class BookmarkModal extends Modal {
  type: Bookmark['type'] = 'file'
  path?: string
  title = ''
  query?: string
  onSubmit: (bookmark: Bookmark) => void
  private titleInput?: TextComponent

  constructor(app: App, onSubmit: (bookmark: Bookmark) => void) {
    super(app)
    this.onSubmit = onSubmit
  }

  onOpen(): void {
    const { contentEl } = this

    contentEl.createEl('h2', { text: 'Add bookmark' })

    // Type selection
    new Setting(contentEl)
      .setName('Type')
      .setDesc('Select the type of bookmark')
      .addDropdown((dropdown) => {
        dropdown
          .addOption('file', 'File')
          .addOption('search', 'Search')
          .addOption('graph', 'Graph')
          .addOption('folder', 'Folder')
          .setValue(this.type)
          .onChange((value) => {
            this.type = value as Bookmark['type']
            this.updateInputFields()
          })
      })

    // Container for dynamic fields
    const fieldsContainer = contentEl.createDiv({ cls: 'bookmark-fields' })

    // Initial render of fields
    this.renderFields(fieldsContainer)

    // Buttons
    const buttonContainer = contentEl.createDiv({
      cls: 'modal-button-container',
    })

    const submitButton = buttonContainer.createEl('button', {
      text: 'Add bookmark',
      cls: 'mod-cta',
    })

    submitButton.addEventListener('click', () => {
      if (this.validateAndSubmit()) {
        this.close()
      }
    })

    const cancelButton = buttonContainer.createEl('button', {
      text: 'Cancel',
    })

    cancelButton.addEventListener('click', () => {
      this.close()
    })
  }

  private renderFields(container: HTMLElement): void {
    container.empty()

    // Path or query field depending on type
    if (this.type === 'file') {
      new Setting(container).setName('File path').addText((text) => {
        new TextSuggest(this.app, text.inputEl, filePaths(this.app), (value) => {
          text.setValue(value)
          this.setPath(value)
        })
        text
          .setPlaceholder('path/to/file.md')
          .setValue(this.path || '')
          .onChange((value) => this.setPath(value))
      })
    } else if (this.type === 'search') {
      new Setting(container).setName('Search query').addText((text) => {
        const onSelect = (value: string) => {
          text.setValue(value)
          this.query = value
        }
        new TextSuggest(this.app, text.inputEl, searchQueries(this.app), onSelect)
        text
          .setPlaceholder('Enter search query')
          .setValue(this.query || '')
          .onChange((value) => {
            this.query = value
          })
      })
    } else if (this.type === 'folder') {
      new Setting(container).setName('Folder path').addText((text) => {
        new TextSuggest(this.app, text.inputEl, folderPaths(this.app), (value) => {
          text.setValue(value)
          this.setPath(value)
        })
        text
          .setPlaceholder('Path to folder')
          .setValue(this.path || '')
          .onChange((value) => this.setPath(value))
      })
    }

    // Title field (for all types)
    new Setting(container).setName('Display name').addText((text) => {
      text
        .setPlaceholder('Enter display name')
        .setValue(this.title)
        .onChange((value) => {
          this.title = value
        })
      this.titleInput = text
    })
  }

  /** Set the path; an empty title takes the file or folder name */
  private setPath(value: string): void {
    this.path = value
    if (!this.title) {
      this.title = (value.split('/').pop() ?? '').replace(/\.md$/, '')
      this.titleInput?.setValue(this.title)
    }
  }

  private updateInputFields(): void {
    const fieldsContainer = this.contentEl.querySelector('.bookmark-fields') as HTMLElement
    if (fieldsContainer) {
      this.renderFields(fieldsContainer)
    }
  }

  private validateAndSubmit(): boolean {
    const target = { file: this.path, folder: this.path, search: this.query, graph: 'graph' }[
      this.type
    ]
    if (!target || !this.title) {
      new Notice(
        `Fill in the ${target ? 'display name' : this.type === 'search' ? 'search query' : 'path'}`
      )
      return false
    }
    this.onSubmit({ type: this.type, path: this.path, title: this.title, query: this.query })
    return true
  }
}
