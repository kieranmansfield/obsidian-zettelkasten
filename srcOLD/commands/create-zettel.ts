// File: src/commands/create-zettel.ts
import { App } from 'obsidian'
import ZettelId from '../core/zettels/ZettelId'

export function createZettel(app: App) {
  // Stub logic for creating a plain zettel
  console.log('Creating new plain zettel')
}

this.addCommand({
  id: 'reveal-parent-zettel',
  name: 'Reveal Parent Zettel',
  checkCallback: (checking: boolean) => {
    const file = this.app.workspace.getActiveFile()
    if (file && file instanceof TFile && file.extension === 'md') {
      if (!checking) {
        revealParentZettel(this.app, file)
      }
      return true
    }
    return false
  },
})

this.addCommand({
  id: 'create-zettel',
  name: 'Create Zettel',
  callback: () => {
    createZettel(this.app)
  },
})

this.addCommand({
  id: 'create-plain-zettel',
  name: 'Create Plain Zettel',
  callback: () => {
    createZettel(this.app)
  },
})

this.addCommand({
  id: 'fix-single-zettel-filename',
  name: 'Fix Zettel Filename',
  checkCallback: (checking: boolean) => {
    const file = this.app.workspace.getActiveFile()
    if (file && file instanceof TFile && file.extension === 'md') {
      if (!checking) {
        fixZettelFilename(this.app, file, { openFile: true })
      }
      return true
    }
    return false
  },
})


