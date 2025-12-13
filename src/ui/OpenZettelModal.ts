import { App, FuzzySuggestModal, TFile } from 'obsidian'
import type SettingsManager from '../settings/SettingsManager'

/**
 * OpenZettelModal
 *
 * Fuzzy search modal for finding and opening zettel notes
 */
export class OpenZettelModal extends FuzzySuggestModal<TFile> {
  private settingsManager: SettingsManager
  private zettelFiles: TFile[] = []

  constructor(app: App, settingsManager: SettingsManager) {
    super(app)
    this.settingsManager = settingsManager
    this.setPlaceholder('Search zettel notes...')
    this.setInstructions([
      { command: '↑↓', purpose: 'to navigate' },
      { command: '↵', purpose: 'to open' },
      { command: 'esc', purpose: 'to dismiss' },
    ])
  }

  override onOpen(): void {
    const superResult = super.onOpen()
    // Handle case where super.onOpen() returns a promise
    if (superResult instanceof Promise) {
      void superResult.catch((error) => {
        console.error('Error in super.onOpen():', error)
      })
    }
    // Load zettel files when modal opens
    void this.getZettelFiles()
      .then((files) => {
        this.zettelFiles = files
      })
      .catch((error) => {
        console.error('Error loading zettel files:', error)
      })
  }

  private getZettelFiles(): Promise<TFile[]> {
    const allFiles = this.app.vault.getMarkdownFiles()
    const settings = this.settingsManager.getZettel()
    const boxSettings = this.settingsManager.getBoxes()

    // Filter files that are in zettel folders
    // This is a simple approach - looking for files in the default zettel folder
    // or the boxes root folder if boxes are enabled
    const zettelFolders: string[] = []

    if (boxSettings.enabled && boxSettings.rootFolder) {
      zettelFolders.push(boxSettings.rootFolder)
    } else if (settings.defaultFolder) {
      zettelFolders.push(settings.defaultFolder)
    }

    // If no specific folders, return all markdown files
    if (zettelFolders.length === 0) {
      return Promise.resolve(allFiles)
    }

    // Filter files in zettel folders
    const filtered = allFiles.filter((file) => {
      return zettelFolders.some(
        (folder) => file.path.startsWith(folder + '/') || file.path === folder
      )
    })

    return Promise.resolve(filtered)
  }

  getItems(): TFile[] {
    return this.zettelFiles
  }

  getItemText(file: TFile): string {
    // Get the title from frontmatter if available, otherwise use basename
    const cache = this.app.metadataCache.getFileCache(file)
    return (cache?.frontmatter?.title as string | undefined) || file.basename
  }

  renderSuggestion(match: { item: TFile }, el: HTMLElement): void {
    const file = match.item
    const cache = this.app.metadataCache.getFileCache(file)
    const title = (cache?.frontmatter?.title as string | undefined) || file.basename

    el.createDiv({ cls: 'suggestion-title', text: title })
    el.createDiv({ cls: 'suggestion-note', text: file.path })
  }

  onChooseItem(file: TFile): void {
    // Open the selected file in the active leaf
    void this.app.workspace.getLeaf().openFile(file)
  }
}
