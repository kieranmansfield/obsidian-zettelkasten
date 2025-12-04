import { TFile, Notice, App } from 'obsidian'
import ZettelId from '../zettels/ZettelId'
import { generateTimeStampId } from '../zettels/id-helpers'

export async function createZettelFile(
  app: App,
  zettelId: ZettelId,
  title?: string,
  folder?: string,
  addTypeTag: boolean = true
): Promise<TFile | null> {
  const filename = `${folder ? folder + '/' : ''}${zettelId.toString()}${title ? ' ' + title : ''}.md`
  const content = `---
title: ${title ?? ''}
tags:
- type/zettels
---

# ${title ?? ''}`

  try {
    const file = await app.vault.create(filename, content)
    new Notice(`Created Zettel: ${zettelId.toString()}`)
    return file
  } catch (err) {
    console.error('Error creating Zettel:', err)
    new Notice(`failed to create Zettel: ${zettelId.toString()}`)
    return null
  }
}

export async function createBasicZettel(
  app: App,
  title?: string,
  folder?: string
): Promise<TFile | null> {
  const zettelId = new ZettelId(generateTimeStampId(), [])
  return await createZettelFile(app, zettelId, title, folder, true)
}

export async function fixZettelFileName(app: App, file: TFile): Promise<TFile | null> {
  const folder = file.path.substring(0, file.path.lastIndexOf('/'))
  const extension = file.extension
  const content = await app.vault.read(file)
  const lines = content.split('\n')
  let title = ''
  for (const line of lines) {
    if (line.startsWith('# ')) {
      title = line.substring(2).trim()
      break
    }
  }
  const zettelId = new ZettelId(file.basename, [])
  const newFilename = `${folder ? folder + '/' : ''}${zettelId.toString()}${title ? ' ' + title : ''}.${extension}`

  if (file.path === newFilename) {
    return file
  }

  try {
    await app.vault.rename(file, newFilename)
    const newFile = app.vault.getAbstractFileByPath(newFilename)
    if (newFile instanceof TFile) {
      new Notice(`Renamed file to ${newFilename}`)
      return newFile
    }
    return null
  } catch (err) {
    console.error('Error renaming file:', err)
    new Notice(`Failed to rename file: ${file.name}`)
    return null
  }
}
