import { App, TAbstractFile, TFile, TFolder } from 'obsidian'

export function getAllFilesInFolder(app: App, folderPath: string): TFile[] {
  const folder = app.vault.getAbstractFileByPath(folderPath)
  if (!folder || !(folder instanceof TFolder)) return []

  const result: TFile[] = []

  function scan(f: TAbstractFile) {
    if (f instanceof TFolder) {
      for (const child of f.children) {
        scan(child)
      }
    }
  }

  scan(folder)
  return result
}
