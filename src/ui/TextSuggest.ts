import { AbstractInputSuggest, TFolder, getAllTags, type App } from 'obsidian'

/** Autocomplete for a text input; `source` gets the lower-cased query */
export class TextSuggest extends AbstractInputSuggest<string> {
  private source: (query: string) => string[]
  private onPick: (value: string) => void

  constructor(
    app: App,
    inputEl: HTMLInputElement,
    source: (query: string) => string[],
    onPick: (value: string) => void
  ) {
    super(app, inputEl)
    this.source = source
    this.onPick = onPick
  }

  getSuggestions(query: string): string[] {
    return this.source(query.toLowerCase())
  }

  renderSuggestion(value: string, el: HTMLElement): void {
    el.setText(value)
  }

  selectSuggestion(value: string): void {
    this.setValue(value)
    this.onPick(value)
    this.close()
  }
}

const matching = (values: Iterable<string>, query: string, limit: number): string[] =>
  [...values].filter((v) => v.toLowerCase().includes(query)).slice(0, limit)

/** Every tag in the vault, with its leading # */
function vaultTags(app: App): Set<string> {
  return new Set(
    app.vault
      .getMarkdownFiles()
      .flatMap((file) => getAllTags(app.metadataCache.getFileCache(file) ?? {}) ?? [])
  )
}

export const filePaths = (app: App) => (query: string) =>
  matching(
    app.vault.getMarkdownFiles().map((f) => f.path),
    query,
    10
  )

export const folderPaths = (app: App) => (query: string) =>
  matching(
    app.vault
      .getAllLoadedFiles()
      .filter((f) => f instanceof TFolder)
      .map((f) => f.path),
    query,
    10
  )

export const tagNames = (app: App) => (query: string) =>
  matching([...vaultTags(app)].map((t) => t.slice(1)).sort(), query, 10)

const SEARCH_OPERATORS = [
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

/** Operators (at the start or after a space), tags, recent searches, and paths or names after path:/file: */
export const searchQueries = (app: App) => (query: string) => {
  const out = new Set<string>()
  if (!query || query.endsWith(' ')) SEARCH_OPERATORS.forEach((op) => out.add(op))
  for (const tag of vaultTags(app)) out.add(tag).add(`tag:${tag}`)

  const searchView = app.workspace.getLeavesOfType('search')[0]?.view as
    { getRecentSearches?: () => string[] } | undefined
  searchView?.getRecentSearches?.().forEach((q) => out.add(q))

  const files = app.vault.getMarkdownFiles()
  if (/(^| )path:/.test(query)) files.forEach((f) => out.add(`path:${f.path}`))
  if (/(^| )file:/.test(query)) files.forEach((f) => out.add(`file:${f.basename}`))
  return matching(out, query, 20)
}
