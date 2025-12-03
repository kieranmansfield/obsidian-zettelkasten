// File: src/commands/reveal-parent-zettel.ts
import { App, TFile } from 'obsidian'
import ZettelId from '../core/zettels/ZettelId'

export async function revealParentZettel(app: App, file: TFile) {
  // Stub logic for revealing parent zettel
  console.log('Revealing parent zettel for', file.path)
}

this.addCommand({
  id: 'fix-all-zettel-filenames',
  name: 'Fix All Zettel Filenames',
  callback: async () => {
    const files = this.app.vault.getMarkdownFiles()
    const filesToFix = files.filter((f) => !ZettelId.isZettelIdString(f.basename))

    const notice = new Notice(`Fixing ${filesToFix.length} filenames...`, 0)
    for (let i = 0; i < filesToFix.length; i++) {
      const file = filesToFix[i]
      await fixZettelFilename(this.app, file, { openFile: false })
      notice.setMessage(`Fixing filenames: ${i + 1} / ${filesToFix.length}`)
    }
    notice.hide()
    new Notice(`Finished fixing ${filesToFix.length} filenames.`)
  },
})
