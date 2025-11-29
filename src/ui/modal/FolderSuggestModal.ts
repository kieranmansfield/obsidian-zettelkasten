import { FuzzySuggestModal, TFolder } from 'obsidian'
import type ZettelkastenPlugin from '../../main'

/**
 * Modal for selecting a folder from the vault
 */
export class FolderSuggestModal extends FuzzySuggestModal<TFolder> {
  constructor(
    private plugin: ZettelkastenPlugin,
    private onSelect: (folder: TFolder) => void
  ) {
    super(plugin.app)
    this.setPlaceholder('Select a folder to fix filenames...')
  }

  getItems(): TFolder[] {
    const folders: TFolder[] = []
    const rootFolder = this.plugin.app.vault.getRoot()

    // Add root folder
    folders.push(rootFolder)

    // Recursively collect all folders
    const collectFolders = (folder: TFolder) => {
      for (const child of folder.children) {
        if (child instanceof TFolder) {
          folders.push(child)
          collectFolders(child)
        }
      }
    }

    collectFolders(rootFolder)
    return folders
  }

  getItemText(folder: TFolder): string {
    return folder.path === '/' ? '/ (Root)' : folder.path
  }

  onChooseItem(folder: TFolder): void {
    this.onSelect(folder)
  }
}
