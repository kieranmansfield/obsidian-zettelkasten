import { App, FuzzySuggestModal, Notice, type TFile } from 'obsidian'
import { getFileTitle } from '../base/fileHelpers'
import { parseZettelId } from '../base/zettelIdOrder'

/**
 * Fuzzy modal for picking a zettel, e.g. a parent or child
 */
class ZettelSelectorModal extends FuzzySuggestModal<TFile> {
  private zettels: TFile[]
  private onChoose: (file: TFile) => void

  constructor(app: App, zettels: TFile[], placeholder: string, onChoose: (file: TFile) => void) {
    super(app)
    this.zettels = zettels
    this.onChoose = onChoose
    this.setPlaceholder(placeholder)
  }

  getItems(): TFile[] {
    return this.zettels
  }

  getItemText(file: TFile): string {
    return getFileTitle(this.app, file)
  }

  renderSuggestion(value: { item: TFile }, el: HTMLElement): void {
    el.createDiv({ cls: 'suggestion-title', text: this.getItemText(value.item) })
  }

  onChooseItem(file: TFile): void {
    this.onChoose(file)
  }
}

/** Pick another zettel from the active file's folder */
export function pickZettelInFolder(
  app: App,
  activeFile: TFile,
  placeholder: string,
  onChoose: (file: TFile) => Promise<void>
): void {
  const zettels = app.vault
    .getMarkdownFiles()
    .filter(
      (f) =>
        f.parent?.path === activeFile.parent?.path &&
        f.path !== activeFile.path &&
        parseZettelId(f.basename)
    )

  if (zettels.length === 0) {
    new Notice('No other zettels found in this folder')
    return
  }

  new ZettelSelectorModal(app, zettels, placeholder, (file) => {
    void onChoose(file)
  }).open()
}
