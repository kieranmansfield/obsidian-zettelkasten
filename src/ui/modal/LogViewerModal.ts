import { Modal, Setting, ButtonComponent, App } from 'obsidian'
import { PersistentLoggerService } from '../../core/logger/PersistentLogger'

/**
 * UI Modal for viewing logs
 * - Only handles UI
 * - Delegates storage and persistence to PersistentLoggerService
 */
export default class LogViewerModal extends Modal {
  constructor(app: App, private loggerService: PersistentLoggerService) {
    super(app)
  }

  onOpen() {
    const { contentEl } = this
    contentEl.empty()
    contentEl.createEl('h2', { text: 'Zettel Plugin Log' })

    const entries = this.loggerService.getAll()
    const wrap = contentEl.createEl('div')
    wrap.style.maxHeight = '60vh'
    wrap.style.overflow = 'auto'

    for (const e of entries.slice().reverse()) {
      const row = wrap.createEl('div')
      row.createEl('div', { text: e })
    }

    new Setting(contentEl)
      .addButton((b: ButtonComponent) => b.setButtonText('Close').onClick(() => this.close()))
      .addButton((b: ButtonComponent) =>
        b.setButtonText('Clear').onClick(async () => {
          this.loggerService.clear()
          await this.loggerService.save()
          this.close()
        })
      )
  }

  onClose() {
    this.contentEl.empty()
  }
}
