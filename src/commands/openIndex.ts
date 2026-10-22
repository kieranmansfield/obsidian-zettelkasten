import { normalizePath, type App } from 'obsidian'
import type { CommandFactory } from '../base/command'
import type FileService from '../service/file.service'
import { INDEX_NOTE, INDEX_TEMPLATE } from '../settings/DefaultSettings'

/** Open the Index note in the slip-box, creating it from the index template on first use */
async function openIndexNote(app: App, fileService: FileService, folder: string): Promise<void> {
  const file =
    app.vault.getFileByPath(normalizePath(`${folder}/${INDEX_NOTE}.md`)) ??
    (await fileService.create(folder, INDEX_NOTE, INDEX_TEMPLATE))
  await app.workspace.getLeaf().openFile(file)
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
    },

    execute: () =>
      openIndexNote(
        context.app,
        context.fileService,
        context.settingsManager.get('zettel').defaultFolder
      ),
  }
}
