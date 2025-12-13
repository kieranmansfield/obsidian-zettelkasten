import { App, Modal, Setting } from 'obsidian'
import { FolderSuggest } from './FolderSuggest'

/**
 * CreateZettelModal
 *
 * Modal for creating a new zettel with title and optional folder
 */
export class CreateZettelModal extends Modal {
  private title: string = ''
  private folder: string = ''
  private onSubmit: (title: string, folder?: string) => void

  constructor(app: App, defaultFolder: string, onSubmit: (title: string, folder?: string) => void) {
    super(app)
    this.folder = defaultFolder
    this.onSubmit = onSubmit
  }

  onOpen() {
    const { contentEl } = this

    contentEl.empty()
    contentEl.createEl('h2', { text: 'Create zettel note' })

    // Title input
    new Setting(contentEl)
      .setName('Title')
      .setDesc('Enter the title for your new zettel')
      .addText((text) => {
        text.setPlaceholder('Note title').onChange((value) => {
          this.title = value
        })
        // Focus the title input
        text.inputEl.focus()

        // Submit on Enter key
        text.inputEl.addEventListener('keydown', (evt: KeyboardEvent) => {
          if (evt.key === 'Enter' && !evt.shiftKey) {
            evt.preventDefault()
            this.submit()
          }
        })
      })

    // Folder input with autocomplete
    new Setting(contentEl)
      .setName('Folder')
      .setDesc('Optional: specify a different folder for this zettel')
      .addText((text) => {
        text.setPlaceholder('Leave empty for default').setValue(this.folder)

        // Add folder autocomplete
        new FolderSuggest(this.app, text.inputEl, (value) => {
          this.folder = value
          text.setValue(value)
        })

        text.onChange((value) => {
          this.folder = value
        })

        // Submit on Enter key
        text.inputEl.addEventListener('keydown', (evt: KeyboardEvent) => {
          if (evt.key === 'Enter' && !evt.shiftKey) {
            evt.preventDefault()
            this.submit()
          }
        })
      })

    // Buttons
    new Setting(contentEl)
      .addButton((button) => {
        button
          .setButtonText('Create')
          .setCta()
          .onClick(() => {
            this.submit()
          })
      })
      .addButton((button) => {
        button.setButtonText('Cancel').onClick(() => {
          this.close()
        })
      })
  }

  private submit() {
    if (!this.title.trim()) {
      // Could add a notice here, but for now just don't submit
      return
    }

    this.close()
    this.onSubmit(this.title.trim(), this.folder.trim() || undefined)
  }

  onClose() {
    const { contentEl } = this
    contentEl.empty()
  }
}
