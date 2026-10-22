import { App, FuzzySuggestModal, FuzzyMatch, TFile } from 'obsidian'

import { frontmatterTitle } from '../base/fileHelpers'

interface ZettelItem {
  file: TFile
  displayText: string
  isAlias: boolean
}

/** One item per file (frontmatter title, else filename), plus one per alias */
function zettelItems(app: App, files: TFile[]): ZettelItem[] {
  return files.flatMap((file) => {
    const cache = app.metadataCache.getFileCache(file)
    const aliases: unknown = cache?.frontmatter?.aliases
    return [
      { file, displayText: frontmatterTitle(cache) ?? file.basename, isAlias: false },
      ...(Array.isArray(aliases) ? aliases : [])
        .filter((alias): alias is string => typeof alias === 'string')
        .map((alias) => ({ file, displayText: alias, isAlias: true })),
    ]
  })
}

/** Title with the first match in bold; below it the filename, or "alias of <title>" */
function renderZettelSuggestion(app: App, value: FuzzyMatch<ZettelItem>, el: HTMLElement): void {
  const { item } = value
  const title = frontmatterTitle(app.metadataCache.getFileCache(item.file))

  const titleEl = el.createDiv({ cls: 'suggestion-title' })
  titleEl.setText(item.displayText)
  if (item.isAlias || title) {
    el.createDiv({
      cls: 'suggestion-note-filename',
      text: item.isAlias ? `alias of ${title ?? item.file.basename}` : item.file.basename,
    })
  }

  const [first] = value.match.matches
  const text = titleEl.firstChild
  if (first && text) {
    const range = new Range()
    range.setStart(text, first[0])
    range.setEnd(text, first[1])
    range.surroundContents(activeDocument.createEl('b'))
  }
}

/**
 * Modal for suggesting and selecting Zettel notes
 * Enhanced to work like quick switcher:
 * - Uses title from frontmatter first, then filename
 * - Shows aliases as additional entries
 * - Doesn't auto-select until arrow key pressed
 */
export class ZettelSuggester extends FuzzySuggestModal<ZettelItem> {
  protected items: ZettelItem[]
  private completion: (file: TFile) => void
  private initialQuery: string
  protected hasInteracted = false

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

    this.items = zettelItems(app, files)

    // Note arrow-key use; the suggester's own handler still moves the selection
    for (const key of ['ArrowDown', 'ArrowUp']) {
      this.scope.register([], key, () => {
        this.hasInteracted = true
        return false
      })
    }
  }

  onOpen(): void {
    void super.onOpen()
    this.inputEl.value = this.initialQuery
    const event = new Event('input')
    this.inputEl.dispatchEvent(event)

    // Like the quick switcher, nothing is selected until an arrow key is pressed
    activeWindow.setTimeout(() => {
      if (!this.hasInteracted) {
        this.modalEl.querySelector('.suggestion-item.is-selected')?.removeClass('is-selected')
      }
    }, 10)
  }

  getItems(): ZettelItem[] {
    return this.items
  }

  getItemText(item: ZettelItem): string {
    return item.displayText
  }

  renderSuggestion(value: FuzzyMatch<ZettelItem>, el: HTMLElement): void {
    renderZettelSuggestion(this.app, value, el)
  }

  onChooseItem(item: ZettelItem): void {
    this.completion(item.file)
  }
}
