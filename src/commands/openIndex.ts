import { TFile, type App } from 'obsidian'
import type { CommandFactory } from '../base/command'
import type FileService from '../service/file.service'
import { INDEX_NOTE, INDEX_TEMPLATE } from '../settings/DefaultSettings'

/** Open the Index note in the slip-box, creating it from the index template on first use */
async function openIndexNote(app: App, fileService: FileService, folder: string): Promise<void> {
  const path = `${folder}/${INDEX_NOTE}.md`
  if (!app.vault.getAbstractFileByPath(path)) {
    await fileService.create({ folder, filename: INDEX_NOTE, content: INDEX_TEMPLATE })
  }
  const file = app.vault.getAbstractFileByPath(path)
  if (file instanceof TFile) await app.workspace.getLeaf().openFile(file)
}

/**
 * Command: Open Index
 *
 * Opens the single Index note in the slip-box, creating it on first use
 */
export const openIndexCommand: CommandFactory = (context) => {
  return {
    id: 'open-index',
    name: 'Open Index',
    icon: 'search',

    metadata: {
      category: 'navigation',
      description: 'Open the Index (keywords → entry notes) in the slip-box',
      canBeDisabled: true,
      enabledByDefault: true,
    },

    execute: async () => {
      if (!context.settingsManager || !context.fileService) {
        console.error('Required services not available')
        return
      }

      try {
        const folder = context.settingsManager.getZettel().defaultFolder
        await openIndexNote(context.app, context.fileService, folder)
      } catch (err) {
        console.error('Failed to open index:', err)
      }
    },
  }
}
