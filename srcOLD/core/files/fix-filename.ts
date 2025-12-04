import { App, TFile, Notice } from 'obsidian'
import { ZettelId } from '../zettels/ZettelId'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fixZettelFilename(
  app: App,
  file: TFile,
  options?: { openFile?: boolean }
): Promise<TFile | null> {
  const folder = file.parent?.path ?? ''

  // Skip if filename already has valid Zettel ID
  if (ZettelId.isZettelIdString(file.basename)) {
    return file
  }

  // Generate ID based on file creation date
  const created = file.stat.ctime
  const timestamp = `${created.getFullYear()}${String(created.getMonth() + 1).padStart(2, '0')}${String(created.getDate()).padStart(2, '0')}${String(created.getHours()).padStart(2, '0')}${String(created.getMinutes()).padStart(2, '0')}${String(created.getSeconds()).padStart(2, '0')}${String(created.getMilliseconds()).padStart(3, '0')}`
  const newId = ZettelId.create([], timestamp)
  const filename = `${newId.toString()}.md`
  const newPath = folder ? `${folder}/${filename}` : filename

  const existing = app.vault.getAbstractFileByPath(newPath)
  if (existing && existing instanceof TFile) {
    if (options?.openFile) {
      await app.workspace.getLeaf(true).openFile(existing)
    }
    return existing
  }

  try {
    await app.vault.rename(file, newPath)
    await sleep(50) // slight delay to avoid conflicts
    const renamed = app.vault.getAbstractFileByPath(newPath)
    if (renamed && renamed instanceof TFile) {
      if (options?.openFile) {
        await app.workspace.getLeaf(true).openFile(renamed)
      }
      return renamed
    }
  } catch (err) {
    console.error(err)
    new Notice('Failed to rename Zettel.')
  }

  return null
}
