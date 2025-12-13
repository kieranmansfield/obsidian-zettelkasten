import { App, FuzzySuggestModal, TFile, Notice } from 'obsidian'
import type BoxManager from '../core/boxManager.class'
import type SettingsManager from '../settings/SettingsManager'

/**
 * Item for fuzzy search - either existing file or create new option
 */
interface ZettelItem {
  type: 'existing' | 'create-new'
  file?: TFile
  title: string
  description?: string
}

/**
 * CreateZettelFuzzyModal
 *
 * Fuzzy search modal for finding existing zettels or creating new ones
 */
export class CreateZettelFuzzyModal extends FuzzySuggestModal<ZettelItem> {
  private settingsManager: SettingsManager
  private boxManager: BoxManager
  private existingFiles: TFile[] = []
  private currentQuery: string = ''
  private onCreate: (title: string) => Promise<void>

  constructor(
    app: App,
    settingsManager: SettingsManager,
    boxManager: BoxManager,
    onCreate: (title: string) => Promise<void>
  ) {
    super(app)
    this.settingsManager = settingsManager
    this.boxManager = boxManager
    this.onCreate = onCreate
    this.setPlaceholder('Search for zettel or type to create new...')
    this.setInstructions([
      { command: '↑↓', purpose: 'to navigate' },
      { command: '↵', purpose: 'to open or create' },
      { command: 'esc', purpose: 'to dismiss' },
    ])
  }

  onOpen(): void {
    void (async () => {
      await this.loadExistingFiles()
      await super.onOpen()
    })()
  }

  private loadExistingFiles(): Promise<void> {
    const allFiles = this.app.vault.getMarkdownFiles()
    const boxSettings = this.settingsManager.getBoxes()
    const zettelSettings = this.settingsManager.getZettel()

    // Filter files that are in zettel folders
    const zettelFolders: string[] = []

    if (boxSettings.enabled && boxSettings.rootFolder) {
      zettelFolders.push(boxSettings.rootFolder)
    } else if (zettelSettings.defaultFolder) {
      zettelFolders.push(zettelSettings.defaultFolder)
    }

    // If no specific folders, use all markdown files
    if (zettelFolders.length === 0) {
      this.existingFiles = allFiles
    } else {
      this.existingFiles = allFiles.filter((file) => {
        return zettelFolders.some(
          (folder) => file.path.startsWith(folder + '/') || file.path === folder
        )
      })
    }

    return Promise.resolve()
  }

  getItems(): ZettelItem[] {
    const items: ZettelItem[] = []

    // Get current query from input element (safely)
    const query = (this.inputEl && this.inputEl.value) || this.currentQuery || ''
    this.currentQuery = query

    // Add "Create new" option if there's a query
    if (query && query.trim()) {
      items.push({
        type: 'create-new',
        title: query.trim(),
        description: `Create new zettel: "${query.trim()}"`,
      })
    }

    // Add existing files
    for (const file of this.existingFiles) {
      const cache = this.app.metadataCache.getFileCache(file)
      const title = (cache?.frontmatter?.title as string | undefined) ?? file.basename

      items.push({
        type: 'existing',
        file,
        title,
        description: file.path,
      })
    }

    return items
  }

  getItemText(item: ZettelItem): string {
    return item.title
  }

  renderSuggestion(match: { item: ZettelItem }, el: HTMLElement) {
    const container = el.createDiv({ cls: 'zettel-suggestion-item' })

    if (match.item.type === 'create-new') {
      // Special styling for create new option
      container.addClass('create-new-suggestion')
      container.createDiv({ cls: 'suggestion-title', text: `+ ${match.item.title}` })
      container.createDiv({ cls: 'suggestion-note', text: 'Create new zettel' })
    } else {
      // Regular file
      container.createDiv({ cls: 'suggestion-title', text: match.item.title })
      if (match.item.description) {
        container.createDiv({ cls: 'suggestion-note', text: match.item.description })
      }
    }
  }

  onChooseItem(item: ZettelItem): void {
    console.log('CreateZettelFuzzyModal: onChooseItem called', item)

    void (async () => {
      try {
        if (item.type === 'create-new') {
          console.log('Creating new zettel with title:', item.title)
          await this.onCreate(item.title)
          new Notice(`Created zettel: ${item.title}`)
        } else if (item.file) {
          console.log('Opening existing file:', item.file.basename)
          const leaf = this.app.workspace.getLeaf(false)
          await leaf.openFile(item.file)
          new Notice(`Opened: ${item.file.basename}`)
        }
      } catch (error) {
        console.error('Error in onChooseItem:', error)
        if (error instanceof Error) {
          new Notice(`Error: ${error.message}`)
        }
      }
    })()
  }
}
