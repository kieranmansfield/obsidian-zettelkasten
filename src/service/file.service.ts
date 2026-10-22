import { App, normalizePath, type TFile } from 'obsidian'

export default class FileService {
  private app: App

  constructor(app: App) {
    this.app = app
  }

  /** Create `folder/filename.md`, making the folder if needed. Throws if the file exists (never overwrites). */
  async create(folder: string, filename: string, content: string): Promise<TFile> {
    const dir = folder.trim().replace(/^\/+|\/+$/g, '')
    if (dir && !this.app.vault.getAbstractFileByPath(dir)) await this.app.vault.createFolder(dir)
    return this.app.vault.create(normalizePath(`${dir}/${filename}.md`), content)
  }

  /** Rename a file in its folder; `newName` may include the extension. Links to it are updated. */
  async rename(file: TFile, newName: string): Promise<void> {
    // ponytail: suffix check, not a regex: titles can contain dots
    const name = newName.endsWith(`.${file.extension}`) ? newName : `${newName}.${file.extension}`
    // fileManager (not vault) rewrites links to the file, per the user's link settings
    await this.app.fileManager.renameFile(file, normalizePath(`${file.parent?.path ?? ''}/${name}`))
  }

  /** The template file's content, or `fallback` when no path is set or the file is missing */
  async loadTemplate(templatePath: string, fallback: string): Promise<string> {
    if (!templatePath.trim()) return fallback
    const file = this.app.vault.getFileByPath(templatePath)
    if (file) return this.app.vault.cachedRead(file)
    console.warn(`Template file not found: ${templatePath}, using fallback template`)
    return fallback
  }
}
