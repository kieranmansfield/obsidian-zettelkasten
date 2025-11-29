import { App, TFile } from 'obsidian'

export class VaultUtils {
  static async readFile(app: App, path: string): Promise<string | null> {
    const file = app.vault.getAbstractFileByPath(path)
    return file instanceof TFile ? app.vault.read(file) : null
  }

  static createFile(app: App, path: string, content: string): Promise<TFile> {
    return app.vault.create(path, content)
  }
}
