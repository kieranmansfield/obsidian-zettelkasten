import { AbstractInputSuggest, App, TAbstractFile, TFolder } from 'obsidian'

/**
 * FolderSuggest
 *
 * Provides folder autocomplete suggestions for text inputs
 */
export class FolderSuggest extends AbstractInputSuggest<TFolder> {
  private onSelectCallback: (value: string) => void

  constructor(app: App, inputEl: HTMLInputElement, onSelect: (value: string) => void) {
    super(app, inputEl)
    this.onSelectCallback = onSelect
  }

  getSuggestions(inputStr: string): TFolder[] {
    const abstractFiles = this.app.vault.getAllLoadedFiles()
    const folders: TFolder[] = []
    const lowerCaseInputStr = inputStr.toLowerCase()

    abstractFiles.forEach((folder: TAbstractFile) => {
      if (folder instanceof TFolder && folder.path.toLowerCase().contains(lowerCaseInputStr)) {
        folders.push(folder)
      }
    })

    return folders.slice(0, 10)
  }

  renderSuggestion(folder: TFolder, el: HTMLElement): void {
    el.setText(folder.path)
  }

  selectSuggestion(folder: TFolder): void {
    this.onSelectCallback(folder.path)
    this.close()
  }
}
