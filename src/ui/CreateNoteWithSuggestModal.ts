import { App, FuzzySuggestModal, FuzzyMatch, TFile } from 'obsidian'

interface ZettelItem {
  file: TFile | null
  displayText: string
  isAlias: boolean
  isNew: boolean
}

/**
 * Modal for creating a new note with autocomplete to detect existing notes
 * Enhanced to work like quick switcher:
 * - Uses title from frontmatter first, then filename
 * - Shows aliases as additional entries
 * - Doesn't auto-select until arrow key pressed
 * - Can create new zettel if nothing matches
 */
export class CreateNoteWithSuggestModal extends FuzzySuggestModal<ZettelItem> {
  private items: ZettelItem[] = []
  private onSubmit: (title: string, existingFile?: TFile) => void
  private isProcessing = false
  private hasInteracted: boolean = false

  constructor(app: App, files: TFile[], onSubmit: (title: string, existingFile?: TFile) => void) {
    super(app)
    this.onSubmit = onSubmit
    this.setPlaceholder('Enter note title...')
    this.setInstructions([
      { command: '↵', purpose: 'create or open note' },
      { command: 'esc', purpose: 'cancel' },
    ])

    // Build items list with title, filename, and aliases
    files.forEach((file) => {
      const cache = this.app.metadataCache.getFileCache(file)
      const title = (cache?.frontmatter?.title as string | undefined) ?? undefined

      // Add main entry (using title if available, otherwise filename)
      this.items.push({
        file,
        displayText: title || file.basename,
        isAlias: false,
        isNew: false,
      })

      // Add aliases as additional entries
      const aliases = cache?.frontmatter?.aliases as unknown
      if (aliases && Array.isArray(aliases)) {
        aliases.forEach((alias: unknown) => {
          if (typeof alias === 'string') {
            this.items.push({
              file,
              displayText: alias,
              isAlias: true,
              isNew: false,
            })
          }
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

    // Unregister default Enter handler and add our own
    const scope = this.scope as { keys?: Array<{ key: string }> }
    if (scope.keys) {
      scope.keys = scope.keys.filter((k) => k.key !== 'Enter')
    }

    this.scope.register([], 'Enter', (evt: KeyboardEvent) => {
      evt.preventDefault()
      evt.stopPropagation()

      // Prevent multiple executions
      if (this.isProcessing) {
        return false
      }
      this.isProcessing = true

      const inputValue = this.inputEl.value.trim()

      // Check if there's a selected suggestion (highlighted item)
      const modalEl = this.modalEl as HTMLElement & {
        querySelector: (selector: string) => Element | null
      }
      const selectedEl = modalEl?.querySelector('.suggestion-item.is-selected')

      // If no input and no selection, do nothing
      if (!inputValue && !selectedEl) {
        this.isProcessing = false
        return false
      }

      let fileToOpen: TFile | undefined

      if (selectedEl && this.hasInteracted) {
        // User has selected an item with arrow keys
        const titleEl = selectedEl.querySelector('.suggestion-title')
        if (titleEl) {
          const selectedText = titleEl.textContent || ''
          const foundItem = this.items.find((item) => item.displayText === selectedText)
          if (foundItem && foundItem.file) {
            fileToOpen = foundItem.file
          }
        }
      }

      this.close()

      // Use setTimeout to ensure modal closes before creating/opening file
      setTimeout(() => {
        if (fileToOpen) {
          // Open existing file
          const cache = this.app.metadataCache.getFileCache(fileToOpen)
          const title = (cache?.frontmatter?.title as string | undefined) ?? fileToOpen.basename
          this.onSubmit(title, fileToOpen)
        } else if (inputValue) {
          // Create new zettel
          this.onSubmit(inputValue)
        }
      }, 50)

      return false
    })
  }

  onOpen() {
    void super.onOpen()

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
    if (!item.file) return

    const cache = this.app.metadataCache.getFileCache(item.file)
    const title = (cache?.frontmatter?.title as string | undefined) ?? item.file.basename

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

  onChooseItem(item: ZettelItem, evt: MouseEvent | KeyboardEvent) {
    if (item.file) {
      void this.app.workspace.getLeaf().openFile(item.file)
    }
  }
}
