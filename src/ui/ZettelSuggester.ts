import { App, FuzzySuggestModal, FuzzyMatch, TFile } from 'obsidian'

interface ZettelItem {
  file: TFile
  displayText: string
  isAlias: boolean
}

/**
 * Modal for suggesting and selecting Zettel notes
 * Enhanced to work like quick switcher:
 * - Uses title from frontmatter first, then filename
 * - Shows aliases as additional entries
 * - Doesn't auto-select until arrow key pressed
 */
export class ZettelSuggester extends FuzzySuggestModal<ZettelItem> {
  private items: ZettelItem[] = []
  private completion: (file: TFile) => void
  private initialQuery: string
  private hasInteracted: boolean = false

  constructor(
    app: App,
    files: TFile[],
    search: string | undefined,
    completion: (file: TFile) => void
  ) {
    super(app)
    this.initialQuery = search ?? ''
    this.completion = completion
    this.emptyStateText = 'No zettels found'
    this.setPlaceholder('Search for a zettel...')

    // Build items list with title, filename, and aliases
    files.forEach((file) => {
      const cache = this.app.metadataCache.getFileCache(file)
      const title = cache?.frontmatter?.title

      // Add main entry (using title if available, otherwise filename)
      this.items.push({
        file,
        displayText: title || file.basename,
        isAlias: false,
      })

      // Add aliases as additional entries
      const aliases = cache?.frontmatter?.aliases
      if (aliases && Array.isArray(aliases)) {
        aliases.forEach((alias: string) => {
          this.items.push({
            file,
            displayText: alias,
            isAlias: true,
          })
        })
      }
    })

    // Override the default key handler to track interaction
    this.scope.register([], 'ArrowDown', (evt: KeyboardEvent) => {
      this.hasInteracted = true
      return false // Let the default handler run
    })

    this.scope.register([], 'ArrowUp', (evt: KeyboardEvent) => {
      this.hasInteracted = true
      return false // Let the default handler run
    })
  }

  onOpen() {
    super.onOpen()
    this.inputEl.value = this.initialQuery
    const event = new Event('input')
    this.inputEl.dispatchEvent(event)

    // Remove initial selection
    setTimeout(() => {
      const selectedEl = this.modalEl.querySelector('.suggestion-item.is-selected')
      if (selectedEl && !this.hasInteracted) {
        selectedEl.removeClass('is-selected')
      }
    }, 10)
  }

  getItems(): ZettelItem[] {
    return this.items
  }

  getItemText(item: ZettelItem): string {
    return item.displayText
  }

  renderSuggestion(value: FuzzyMatch<ZettelItem>, el: HTMLElement) {
    const item = value.item
    const cache = this.app.metadataCache.getFileCache(item.file)
    const title = cache?.frontmatter?.title || item.file.basename

    // Main title
    const titleEl = el.createDiv({ cls: 'suggestion-title' })
    titleEl.setText(item.displayText)

    // Show "alias of [title]" if this is an alias
    if (item.isAlias) {
      const aliasEl = el.createDiv({ cls: 'suggestion-note-filename' })
      aliasEl.setText(`alias of ${title}`)
    } else if (cache?.frontmatter?.title) {
      // Show filename if we're displaying a title
      const filenameEl = el.createDiv({ cls: 'suggestion-note-filename' })
      filenameEl.setText(item.file.basename)
    }

    // Highlight matches
    const matches = value.match.matches
    if (matches && matches.length > 0) {
      const start = matches[0][0]
      const end = matches[0][1]
      const range = new Range()
      const text = titleEl.firstChild

      if (text) {
        range.setStart(text, start)
        range.setEnd(text, end)
        range.surroundContents(document.createElement('b'))
      }
    }
  }

  onChooseItem(item: ZettelItem, _evt: MouseEvent | KeyboardEvent) {
    this.completion(item.file)
  }
}
