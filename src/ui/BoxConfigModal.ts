import { App, Modal, Setting } from 'obsidian'
import type { BoxConfig } from '../base/settings'
import { FilenameFormat } from '../base/settings'
import { FileSuggest } from './FileSuggest'

/**
 * BoxConfigModal
 *
 * Modal for editing box configuration including all note type settings
 */
export class BoxConfigModal extends Modal {
  private boxConfig: BoxConfig
  private onSave: (config: BoxConfig) => void
  private isDefault: boolean

  constructor(app: App, boxConfig: BoxConfig, onSave: (config: BoxConfig) => void) {
    super(app)
    this.boxConfig = { ...boxConfig }
    this.onSave = onSave
    this.isDefault = boxConfig.isDefault
  }

  onOpen() {
    const { contentEl } = this

    contentEl.empty()
    contentEl.createEl('h2', { text: this.isDefault ? 'Default Box Settings' : 'Box Settings' })

    // Box Name (not editable for default box)
    if (!this.isDefault) {
      new Setting(contentEl)
        .setName('Box Name')
        .setDesc('Name of this box')
        .addText((text) => {
          text.setValue(this.boxConfig.name).onChange((value) => {
            this.boxConfig.name = value
          })
        })

      new Setting(contentEl)
        .setName('Box Value')
        .setDesc('Folder path or tag name for this box')
        .addText((text) => {
          text.setValue(this.boxConfig.value).onChange((value) => {
            this.boxConfig.value = value
          })
        })
    }

    // Zettel Settings
    contentEl.createEl('h3', { text: 'Zettel Notes' })

    new Setting(contentEl)
      .setName('Enable Zettel Notes')
      .setDesc('Allow creating zettel notes in this box')
      .addToggle((toggle) => {
        toggle.setValue(this.boxConfig.zettel.enabled).onChange((value) => {
          this.boxConfig.zettel.enabled = value
          this.onOpen() // Refresh to show/hide settings
        })
      })

    if (this.boxConfig.zettel.enabled) {
      new Setting(contentEl)
        .setName('Default Folder')
        .setDesc('Folder for zettel notes (relative to box)')
        .addText((text) => {
          text.setValue(this.boxConfig.zettel.defaultFolder).onChange((value) => {
            this.boxConfig.zettel.defaultFolder = value
          })
        })

      new Setting(contentEl)
        .setName('Filename Format')
        .setDesc('How zettel filenames should be formatted')
        .addDropdown((dropdown) => {
          dropdown
            .addOption(FilenameFormat.ID_ONLY, 'ID Only')
            .addOption(FilenameFormat.ID_TITLE, 'ID + Title')
            .setValue(this.boxConfig.zettel.filenameFormat)
            .onChange((value) => {
              this.boxConfig.zettel.filenameFormat = value as FilenameFormat
              this.onOpen() // Refresh to show/hide separator
            })
        })

      if (this.boxConfig.zettel.filenameFormat === FilenameFormat.ID_TITLE) {
        new Setting(contentEl)
          .setName('Separator')
          .setDesc('Character(s) between ID and title')
          .addText((text) => {
            text.setValue(this.boxConfig.zettel.separator).onChange((value) => {
              this.boxConfig.zettel.separator = value || '⁝'
            })
          })
      }

      new Setting(contentEl)
        .setName('Template File')
        .setDesc('Path to template file (leave empty for default)')
        .addText((text) => {
          new FileSuggest(this.app, text.inputEl, (value) => {
            text.setValue(value)
            this.boxConfig.zettel.templatePath = value
          })

          text.setValue(this.boxConfig.zettel.templatePath || '').onChange((value) => {
            this.boxConfig.zettel.templatePath = value
          })
        })
    }

    // Fleeting Settings
    contentEl.createEl('h3', { text: 'Fleeting Notes' })

    new Setting(contentEl).setName('Enable Fleeting Notes').addToggle((toggle) => {
      toggle.setValue(this.boxConfig.fleeting.enabled).onChange((value) => {
        this.boxConfig.fleeting.enabled = value
        this.onOpen()
      })
    })

    if (this.boxConfig.fleeting.enabled) {
      new Setting(contentEl).setName('Folder').addText((text) => {
        text.setValue(this.boxConfig.fleeting.folder).onChange((value) => {
          this.boxConfig.fleeting.folder = value
        })
      })

      new Setting(contentEl).setName('Template File').addText((text) => {
        new FileSuggest(this.app, text.inputEl, (value) => {
          text.setValue(value)
          this.boxConfig.fleeting.templatePath = value
        })

        text.setValue(this.boxConfig.fleeting.templatePath || '').onChange((value) => {
          this.boxConfig.fleeting.templatePath = value
        })
      })
    }

    // Index Settings
    contentEl.createEl('h3', { text: 'Index Notes' })

    new Setting(contentEl).setName('Enable Index Notes').addToggle((toggle) => {
      toggle.setValue(this.boxConfig.index.enabled).onChange((value) => {
        this.boxConfig.index.enabled = value
        this.onOpen()
      })
    })

    if (this.boxConfig.index.enabled) {
      new Setting(contentEl).setName('Folder').addText((text) => {
        text.setValue(this.boxConfig.index.folder).onChange((value) => {
          this.boxConfig.index.folder = value
        })
      })

      new Setting(contentEl).setName('Template File').addText((text) => {
        new FileSuggest(this.app, text.inputEl, (value) => {
          text.setValue(value)
          this.boxConfig.index.templatePath = value
        })

        text.setValue(this.boxConfig.index.templatePath || '').onChange((value) => {
          this.boxConfig.index.templatePath = value
        })
      })
    }

    // Literature Settings
    contentEl.createEl('h3', { text: 'Literature Notes' })

    new Setting(contentEl).setName('Enable Literature Notes').addToggle((toggle) => {
      toggle.setValue(this.boxConfig.literature.enabled).onChange((value) => {
        this.boxConfig.literature.enabled = value
        this.onOpen()
      })
    })

    if (this.boxConfig.literature.enabled) {
      new Setting(contentEl).setName('Folder').addText((text) => {
        text.setValue(this.boxConfig.literature.folder).onChange((value) => {
          this.boxConfig.literature.folder = value
        })
      })

      new Setting(contentEl).setName('Template File').addText((text) => {
        new FileSuggest(this.app, text.inputEl, (value) => {
          text.setValue(value)
          this.boxConfig.literature.templatePath = value
        })

        text.setValue(this.boxConfig.literature.templatePath || '').onChange((value) => {
          this.boxConfig.literature.templatePath = value
        })
      })
    }

    // Save button
    new Setting(contentEl).addButton((button) => {
      button
        .setButtonText('Save')
        .setCta()
        .onClick(() => {
          this.onSave(this.boxConfig)
          this.close()
        })
    })
  }

  onClose() {
    const { contentEl } = this
    contentEl.empty()
  }
}
