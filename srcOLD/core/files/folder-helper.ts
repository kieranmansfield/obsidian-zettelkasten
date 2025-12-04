import { App } from 'obsidian'

export  function getAllFolders(app: App): string[] {
  const files = app.vault.getFiles()
  const folderSet = new Set<string>()

  files.forEach((f) => {
    const folderPath = f.parent?.path
    if (folderPath) folderSet.add(folderPath)
  })

  return Array.from(folderSet).sort()
}


