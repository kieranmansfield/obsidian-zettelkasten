import { TFile, Vault } from 'obsidian'
import type { FileCreateInput, FileRenameInput, FileResult } from '../base/file'

export default class FileService {
  private vault: Vault

  constructor(vault: Vault) {
    this.vault = vault
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
   * Ensures a folder exists before writing a file.
   */

  private async ensureFolder(folder: string): Promise<void> {
    const normalized = this.normalizeFolder(folder)

    // Obsidian stores folder paths WITHOUT trailing slash
    const folderObj = this.vault.getAbstractFileByPath(normalized)
    if (folderObj) return

    await this.vault.createFolder(normalized)
  }

  /**
   * Creates a file in the vault.
   */
  public async create(input: FileCreateInput): Promise<FileResult> {
    const folder = this.normalizeFolder(input.folder)
    const folderPath = folder // no slash
    const ext = input.extension ?? 'md'
    const filePath = `${folder}/${input.filename}.${ext}`

    await this.ensureFolder(folderPath)

    // Ensure folder exists
    await this.ensureFolder(folder)

    // Actually write file via adapter
    await this.vault.adapter.write(filePath, input.content ?? '')

    // Retrieve TFile reference
    const file = this.vault.getAbstractFileByPath(filePath)
    if (!file || !(file instanceof TFile)) {
      throw new Error(`Failed to create file at path: ${filePath}`)
    }

    return {
      path: file.path,
      filename: file.basename, // consistent with TFile API
    }
  }

  /**
   * Rename a file in the vault.
   */
  public async rename(input: FileRenameInput): Promise<FileResult> {
    const { file, newName } = input

    const newPath = file.path.replace(/[^/]+$/, newName)

    // Let Obsidian rename
    await this.vault.rename(file, newPath)

    const renamed = this.vault.getAbstractFileByPath(newPath)
    if (!renamed || !(renamed instanceof TFile)) {
      throw new Error(`Failed to rename file to ${newName}`)
    }

    return {
      path: renamed.path,
      filename: renamed.basename,
    }
  }

  /**
   * Read file content.
   */
  public async read(file: TFile): Promise<string> {
    return await this.vault.adapter.read(file.path)
  }

  /**
   * Write file content.
   */
  public async write(file: TFile, content: string): Promise<void> {
    await this.vault.adapter.write(file.path, content)
  }

  /**
   * Delete a file.
   */
  public async delete(file: TFile): Promise<void> {
    await this.vault.delete(file)
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
