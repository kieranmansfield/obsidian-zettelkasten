import { App, FuzzySuggestModal, TFile } from 'obsidian'

export class ZettelSuggester extends FuzzySuggestModal<string> {
  private titles: Map<string, TFile>
  private completion: (file: TFile) => void
  private initialQuery: string

  constructor(
    app: App,
    titles: Map<string, TFile>,
    search: string | undefined,
    completion: (file: TFile) => void
  ) {
    super(app)
    this.initialQuery = search ?? ''
    this.titles = titles
    this.completion = completion
    this.setPlaceholder('Search for a zettel...')
  }

  onOpen() {
    super.onOpen()
    this.inputEl.value = this.initialQuery
    const event = new Event('input')
    this.inputEl.dispatchEvent(event)
  }

  getItems(): string[] {
    return Array.from(this.titles.keys()).sort()
  }

  getItemText(item: string): string {
    return item
  }

  onChooseItem(item: string, _evt: MouseEvent | KeyboardEvent) {
    this.completion(this.titles.get(item)!)
  }
}
