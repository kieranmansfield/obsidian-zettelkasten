// File: src/commands/create-sibling-zettel.ts
import { App, TFile } from 'obsidian'
import ZettelId from '../core/zettels/ZettelId'

export async function createSiblingZettel(app: App, file: TFile) {
  // Stub logic for creating a sibling zettel
  console.log('Creating sibling zettel for', file.path)
}


this.addCommand({
  id: 'create-sibling-zettel',
  name: 'Create Sibling Zettel',
  checkCallback: (checking: boolean) => {
    const file = this.app.workspace.getActiveFile()
    if (file && file instanceof TFile && file.extension === 'md') {
      if (!checking) {
        createSiblingZettel(this.app, file)
      }
      return true
    }
    return false
  },
})

