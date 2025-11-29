import { AbstractInputSuggest, App } from 'obsidian'

export class SearchQuerySuggest extends AbstractInputSuggest<string> {
  private onSelectCallback: (value: string) => void

  constructor(app: App, inputEl: HTMLInputElement, onSelect: (value: string) => void) {
    super(app, inputEl)
    this.onSelectCallback = onSelect
  }

  getSuggestions(inputStr: string): string[] {
    const suggestions: Set<string> = new Set()

    // Common search operators
    const operators = [
      'tag:',
      'file:',
      'path:',
      'content:',
      'line:',
      'section:',
      'task:',
      'task-todo:',
      'task-done:',
    ]

    // Add operators if input is empty or typing an operator
    if (!inputStr || inputStr.endsWith(' ')) {
      operators.forEach((op) => suggestions.add(op))
    }

    // Get all tags from vault
    const metadataCache = this.app.metadataCache as {
      getTags?: () => Record<string, number>
    }
    const tags = metadataCache.getTags ? Object.keys(metadataCache.getTags()) : []
    tags.forEach((tag) => {
      // Add tag suggestions
      if (tag.toLowerCase().includes(inputStr.toLowerCase())) {
        suggestions.add(tag)
        suggestions.add(`tag:${tag}`)
      }
    })

    // Get recent search queries from search view if available
    const searchLeaves = this.app.workspace.getLeavesOfType('search')
    if (searchLeaves.length > 0) {
      const searchLeaf = searchLeaves[0]
      // @ts-ignore - accessing internal API
      const recentSearches = searchLeaf.view?.getRecentSearches?.() || []
      recentSearches.forEach((query: string) => {
        if (query.toLowerCase().includes(inputStr.toLowerCase())) {
          suggestions.add(query)
        }
      })
    }

    // Get file paths for path: operator
    if (inputStr.startsWith('path:') || inputStr.includes(' path:')) {
      const files = this.app.vault.getMarkdownFiles()
      files.forEach((file) => {
        const pathSuggestion = `path:${file.path}`
        if (pathSuggestion.toLowerCase().includes(inputStr.toLowerCase())) {
          suggestions.add(pathSuggestion)
        }
      })
    }

    // Get file names for file: operator
    if (inputStr.startsWith('file:') || inputStr.includes(' file:')) {
      const files = this.app.vault.getMarkdownFiles()
      files.forEach((file) => {
        const fileSuggestion = `file:${file.basename}`
        if (fileSuggestion.toLowerCase().includes(inputStr.toLowerCase())) {
          suggestions.add(fileSuggestion)
        }
      })
    }

    const suggestionArray = Array.from(suggestions)
    return suggestionArray
      .filter((s) => s.toLowerCase().contains(inputStr.toLowerCase()))
      .slice(0, 20) // Limit to 20 suggestions
  }

  renderSuggestion(suggestion: string, el: HTMLElement): void {
    el.setText(suggestion)
  }

  selectSuggestion(suggestion: string): void {
    this.onSelectCallback(suggestion)
    this.close()
  }
}
