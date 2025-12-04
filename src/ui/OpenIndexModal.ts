import { App, FuzzySuggestModal, TFile } from 'obsidian'
import type SettingsManager from '../settings/SettingsManager'

/**
 * OpenIndexModal
 *
 * Fuzzy search modal for finding and opening index notes
 */
export class OpenIndexModal extends FuzzySuggestModal<TFile> {
  private settingsManager: SettingsManager
  private indexFiles: TFile[] = []

  constructor(app: App, settingsManager: SettingsManager) {
    super(app)
    this.settingsManager = settingsManager
    this.setPlaceholder('Search index notes...')
    this.setInstructions([
      { command: '↑↓', purpose: 'to navigate' },
      { command: '↵', purpose: 'to open' },
      { command: 'esc', purpose: 'to dismiss' },
    ])
  }

  async onOpen() {
    super.onOpen()
    // Load index files when modal opens
    this.indexFiles = await this.getIndexFiles()
  }

  private async getIndexFiles(): Promise<TFile[]> {
    const allFiles = this.app.vault.getMarkdownFiles()
    const settings = this.settingsManager.getIndex()

    // Filter files that are in the index folder
    if (!settings.folder) {
      return []
    }

    return allFiles.filter((file) => {
      return (
        file.path.startsWith(settings.folder + '/') || file.path === settings.folder
      )
    })
  }

  getItems(): TFile[] {
    return this.indexFiles
  }

  getItemText(file: TFile): string {
    // Get the title from frontmatter if available, otherwise use basename
    const cache = this.app.metadataCache.getFileCache(file)
    return cache?.frontmatter?.title || file.basename
  }

  renderSuggestion(match: { item: TFile }, el: HTMLElement) {
    const file = match.item
    const cache = this.app.metadataCache.getFileCache(file)
    const title = cache?.frontmatter?.title || file.basename

    el.createDiv({ cls: 'suggestion-title', text: title })
    el.createDiv({ cls: 'suggestion-note', text: file.path })
  }

  onChooseItem(file: TFile) {
    // Open the selected file in the active leaf
    this.app.workspace.getLeaf().openFile(file)
  }
}
