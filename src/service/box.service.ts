import { Vault, TFolder } from 'obsidian'
import { Box } from '../base/box'

export default class BoxService {
  private vault: Vault
  private rootFolder: string
  private defaultFolder: string

  constructor(vault: Vault, defaultFolder?: string, rootFolder?: string) {
    this.vault = vault
    this.rootFolder = rootFolder ?? 'zettels'
    this.defaultFolder = defaultFolder ?? ''
  }

  /** Returns the default folder path for boxes */
  public getDefaultFolder(): string {
    return this.defaultFolder || this.rootFolder
  }

  /** Normalize folder paths */
  private normalizeFolder(folder: string): string {
    return folder.trim().replace(/^\/+|\/+$/g, '')
  }

  /** Ensure the root folder exists */
  private async ensureRoot(): Promise<void> {
    if (!(this.vault.getAbstractFileByPath(this.rootFolder) instanceof TFolder)) {
      await this.vault.createFolder(this.rootFolder)
    }
  }

  /** Returns the path for a folder box */
  public getFolderPath(value: string): string {
    const folder = this.normalizeFolder(value)
    // If value is empty, return just the root folder
    if (!folder) {
      return this.rootFolder
    }
    return `${this.rootFolder}/${folder}`
  }

  /** Create a box (folder only) */
  public async createBox(box: Box): Promise<Box> {
    if (box.type === 'folder') {
      const path = this.getFolderPath(box.value)

      // Create the folder if it doesn't exist
      if (!(this.vault.getAbstractFileByPath(path) instanceof TFolder)) {
        await this.vault.createFolder(path)
      }

      return { ...box, value: path }
    }

    // For tag boxes, normalize the tag name
    if (box.type === 'tag') {
      const normalizedTag = box.value.startsWith('#') ? box.value : `#${box.value}`
      return { ...box, value: normalizedTag }
    }

    return box
  }

  /** List all folder boxes under zettels */
  public async listBoxes(): Promise<Box[]> {
    await this.ensureRoot()
    const root = this.vault.getAbstractFileByPath(this.rootFolder)
    if (!(root instanceof TFolder)) return []

    const boxes: Box[] = []

    for (const child of root.children) {
      if (child instanceof TFolder) {
        boxes.push({
          type: 'folder',
          value: `${this.rootFolder}/${child.name}`,
          name: child.name,
        })
      }
    }

    return boxes
  }
}
