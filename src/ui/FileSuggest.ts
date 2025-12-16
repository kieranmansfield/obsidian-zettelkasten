import { AbstractInputSuggest, App, TFile } from 'obsidian'

/**
 * FileSuggest
 *
 * Provides file autocomplete suggestions for text inputs
 */
export class FileSuggest extends AbstractInputSuggest<TFile> {
  private onSelectCallback: (value: string) => void
  private input: HTMLInputElement

  constructor(app: App, inputEl: HTMLInputElement, onSelect: (value: string) => void) {
    super(app, inputEl)
    this.input = inputEl
    this.onSelectCallback = onSelect
  }

  getSuggestions(inputStr: string): TFile[] {
    const allFiles = this.app.vault.getMarkdownFiles()
    const lowerCaseInputStr = inputStr.toLowerCase()

    const matchingFiles = allFiles.filter((file) =>
      file.path.toLowerCase().contains(lowerCaseInputStr)
    )

    return matchingFiles.slice(0, 10)
  }

  renderSuggestion(file: TFile, el: HTMLElement): void {
    el.setText(file.path)
  }

  selectSuggestion(file: TFile): void {
    this.input.value = file.path
    this.input.trigger('input')
    this.onSelectCallback(file.path)
    this.close()
  }
}
