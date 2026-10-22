import type { App, TFile } from 'obsidian'
import { ZettelSuggester } from './ZettelSuggester'

/**
 * Zettel picker that also creates: Enter on a zettel picked with the arrow keys opens it,
 * otherwise Enter creates a note titled with the typed text.
 */
export class CreateNoteWithSuggestModal extends ZettelSuggester {
  constructor(
    app: App,
    files: TFile[],
    onCreate: (title: string) => void,
    onOpenExisting: (file: TFile) => void
  ) {
    super(app, files, undefined, onOpenExisting)
    this.setPlaceholder('Enter note title...')
    this.setInstructions([
      { command: '↵', purpose: 'create or open note' },
      { command: 'esc', purpose: 'cancel' },
    ])

    // Replace the default Enter handler
    const scope = this.scope as unknown as { keys?: Array<{ key: string }> }
    if (scope.keys) scope.keys = scope.keys.filter((k) => k.key !== 'Enter')

    let done = false
    this.scope.register([], 'Enter', (evt) => {
      evt.preventDefault()
      const title = this.inputEl.value.trim()
      const picked = this.hasInteracted ? this.selectedItem() : undefined
      if (done || (!title && !picked)) return false
      done = true
      this.close()
      // Let the modal close before creating or opening the note
      activeWindow.setTimeout(() => (picked ? onOpenExisting(picked.file) : onCreate(title)), 50)
      return false
    })
  }

  private selectedItem() {
    const text = this.modalEl.querySelector('.suggestion-item.is-selected .suggestion-title')
    return this.items.find((item) => item.displayText === text?.textContent)
  }
}
