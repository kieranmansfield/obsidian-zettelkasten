// import type { TFile, Vault } from 'obsidian'
import { FileCreateInput, FileRenameInput, FileResult } from '../base/file'

/**
 * Domain-level File abstraction.
 * Contains *no* Obsidian-specific logic.
 * All real filesystem operations must be handled by FileService.
 */

export default abstract class FileCore {
  /**
   * Validate filename and return the full path.
   * Implementation shared by all note types (zettel, fleeting, index).
   */
  protected buildPath(input: FileCreateInput): string {
    const ext = input.extension ?? 'md'
    const safeName = this.sanitizeName(input.filename)
    return `${input.folder.replace(/\/$/, '')}/${safeName}.${ext}`
  }

  /**
   * Remove characters not allowed in filenames.
   */
  protected sanitizeName(name: string): string {
    return name.replace(/[\\/:*?"<>|]/g, '').trim()
  }

  /**
   * Abstract: must be implemented by the service layer.
   * Responsible for *actual* FS creation.
   */
  public abstract create(input: FileCreateInput): Promise<FileResult>

  /**
   * Abstract: must be implemented by the service layer.
   * Responsible for renaming files.
   */
  public abstract rename(input: FileRenameInput): Promise<FileResult>
}
