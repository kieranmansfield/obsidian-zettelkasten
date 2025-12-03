import { App, Modal, Setting, Notice } from 'obsidian'
import type SettingsManager from '../settings/SettingsManager'

/**
 * ImportExportModal
 *
 * Modal for importing and exporting plugin settings as JSON
 */
export class ImportExportModal extends Modal {
  private settingsManager: SettingsManager
  private onComplete: () => void
  private exportedJson: string = ''
  private importJson: string = ''

  constructor(app: App, settingsManager: SettingsManager, onComplete: () => void) {
    super(app)
    this.settingsManager = settingsManager
    this.onComplete = onComplete
  }

  onOpen() {
    const { contentEl } = this

    contentEl.empty()
    contentEl.createEl('h2', { text: 'Import/Export Settings' })

    // Export Section
    contentEl.createEl('h3', { text: 'Export Settings' })

    new Setting(contentEl)
      .setName('Export')
      .setDesc('Export all settings as JSON to clipboard or view below')
      .addButton((button) => {
        button
          .setButtonText('Export to Clipboard')
          .setCta()
          .onClick(() => {
            this.exportedJson = this.settingsManager.export()
            navigator.clipboard.writeText(this.exportedJson)
            new Notice('Settings exported to clipboard')
          })
      })
      .addButton((button) => {
        button.setButtonText('Show JSON').onClick(() => {
          this.exportedJson = this.settingsManager.export()
          this.onOpen() // Refresh to show JSON
        })
      })

    // Show exported JSON if available
    if (this.exportedJson) {
      const exportContainer = contentEl.createDiv({ cls: 'import-export-json-container' })
      const exportTextArea = exportContainer.createEl('textarea', {
        cls: 'import-export-json-textarea',
      })
      exportTextArea.value = this.exportedJson
      exportTextArea.rows = 10
      exportTextArea.readOnly = true
    }

    // Import Section
    contentEl.createEl('h3', { text: 'Import Settings' })

    new Setting(contentEl)
      .setName('Import')
      .setDesc('Paste JSON settings below and click Import to restore settings')

    const importContainer = contentEl.createDiv({ cls: 'import-export-json-container' })
    const importTextArea = importContainer.createEl('textarea', {
      cls: 'import-export-json-textarea',
      attr: { placeholder: 'Paste JSON here...' },
    })
    importTextArea.value = this.importJson
    importTextArea.rows = 10
    importTextArea.addEventListener('input', () => {
      this.importJson = importTextArea.value
    })

    new Setting(contentEl).addButton((button) => {
      button
        .setButtonText('Import')
        .setWarning()
        .onClick(async () => {
          if (!this.importJson.trim()) {
            new Notice('Please paste JSON settings to import')
            return
          }

          try {
            await this.settingsManager.import(this.importJson)
            new Notice('Settings imported successfully')
            this.onComplete()
            this.close()
          } catch (err) {
            new Notice('Failed to import settings: Invalid JSON')
            console.error(err)
          }
        })
    })

    // Close button
    // new Setting(contentEl).addButton((button) => {
    //   button.setButtonText('Close').onClick(() => {
    //     this.close()
    //   })
    // })
  }

  onClose() {
    const { contentEl } = this
    contentEl.empty()
  }
}
