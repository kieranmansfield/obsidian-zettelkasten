import { App, Notice, TFile } from 'obsidian'

import { getAllFilesInFolder } from './get-files-in-folder'
import { fixZettelFilename } from './fix-filename'

export async function batchFixZettelFileName(
  app: App,
  folderPath: string,
  isZettel: (file: TFile) => boolean
) {
  const allFiles = getAllFilesInFolder(app, folderPath)

  let fixed = 0
  let skipped = 0
  let failed = 0

  for (const file of allFiles) {
    try {
      if (!isZettel(file)) {
        skipped++
        continue
      }

      const result = await fixZettelFilename(app, file)
      if (result) fixed++
      else failed++
    } catch (err) {
      console.error(err)
      failed++
    }
  }

  new Notice(`Batch Complete. Fixed ${fixed}, skipped: ${skipped}, failed: ${failed}`)
}
