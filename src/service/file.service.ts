import { TFile, Vault, App, normalizePath } from 'obsidian'
import type { FileCreateInput, FileRenameInput, FileResult } from '../base/file'

export default class FileService {
  private vault: Vault
  private app: App

  constructor(app: App) {
    this.app = app
    this.vault = app.vault
  }

  /**
   * Normalizes a folder path by removing trailing slashes.
   */

  private normalizeFolder(folder: string): string {
    // clean leading/trailing slashes
    const cleaned = folder.trim().replace(/^\/+|\/+$/g, '')
    return cleaned
  }

  /**
   * Ensures a folder exists before writing a file. The vault root ('') always exists.
   */

  private async ensureFolder(folder: string): Promise<void> {
    if (!folder || this.vault.getAbstractFileByPath(folder)) return
    await this.vault.createFolder(folder)
  }

  /**
   * Creates a file in the vault. Throws if the path already exists (never overwrites).
   */
  public async create(input: FileCreateInput): Promise<FileResult> {
    const folder = this.normalizeFolder(input.folder)
    await this.ensureFolder(folder)

    const ext = input.extension ?? 'md'
    const file = await this.vault.create(
      normalizePath(`${folder}/${input.filename}.${ext}`),
      input.content ?? ''
    )

    return {
      path: file.path,
      filename: file.basename, // consistent with TFile API
    }
  }

  /**
   * Rename a file in its folder. `newName` may include the extension; it is added when missing.
   */
  public async rename(input: FileRenameInput): Promise<FileResult> {
    const { file, newName } = input

    // ponytail: suffix check, not a regex: titles can contain dots
    const name = newName.endsWith(`.${file.extension}`) ? newName : `${newName}.${file.extension}`
    const newPath = normalizePath(`${file.parent?.path ?? ''}/${name}`)

    // fileManager (not vault) rewrites links to the file, per the user's link settings
    await this.app.fileManager.renameFile(file, newPath)

    return {
      path: file.path,
      filename: file.basename,
    }
  }

  /**
   * Read file content.
   */
  public async read(file: TFile): Promise<string> {
    return await this.vault.cachedRead(file)
  }

  /**
   * Delete a file.
   */
  public async delete(file: TFile): Promise<void> {
    await this.app.fileManager.trashFile(file)
  }

  /**
   * Load template content from a file path, or return fallback inline template.
   * @param templatePath - Path to template file (relative to vault root)
   * @param fallbackTemplate - Inline template to use if path is empty or file not found
   * @returns Template content
   */
  public async loadTemplate(templatePath: string, fallbackTemplate: string): Promise<string> {
    // If no template path specified, use fallback
    if (!templatePath || templatePath.trim() === '') {
      return fallbackTemplate
    }

    try {
      // Get the template file
      const file = this.vault.getAbstractFileByPath(templatePath)

      if (!file || !(file instanceof TFile)) {
        console.warn(`Template file not found: ${templatePath}, using fallback template`)
        return fallbackTemplate
      }

      // Read and return template content
      return await this.read(file)
    } catch (err) {
      console.error(`Error loading template from ${templatePath}:`, err)
      return fallbackTemplate
    }
  }
}
