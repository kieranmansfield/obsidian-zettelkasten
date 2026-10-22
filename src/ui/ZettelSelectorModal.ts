import { App, FuzzySuggestModal, Notice, type TFile } from 'obsidian'
import type NoteSequenceCore from '../core/noteSequence.class'
import { getFileTitle } from '../base/fileHelpers'

/**
 * Fuzzy modal for picking a zettel, e.g. a parent or child
 */
class ZettelSelectorModal extends FuzzySuggestModal<TFile> {
  private zettels: TFile[]
  private onChoose: (file: TFile) => void

  constructor(
    app: App,
    zettels: TFile[],
    placeholder: string,
    onChoose: (file: TFile) => void
  ) {
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

/**
 * Pick another zettel from the active file's folder.
 * `onChoose` also gets every file in that folder (for finding free child IDs).
 */
export function pickZettelInFolder(
  app: App,
  core: NoteSequenceCore,
  activeFile: TFile,
  placeholder: string,
  onChoose: (file: TFile, folderFiles: TFile[]) => Promise<void>
): void {
  const folderFiles = app.vault
    .getMarkdownFiles()
    .filter((f) => f.parent?.path === activeFile.parent?.path)
  const zettels = folderFiles.filter(
    (f) => f.path !== activeFile.path && core.extractZettelId(f.basename) !== null
  )

  if (zettels.length === 0) {
    new Notice('No other zettels found in this folder')
    return
  }

  new ZettelSelectorModal(app, zettels, placeholder, (file) => {
    void onChoose(file, folderFiles)
  }).open()
}
