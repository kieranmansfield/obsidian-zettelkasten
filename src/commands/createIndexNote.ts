import type { CommandFactory } from '../base/command'
import { finishNote } from '../base/fileHelpers'

/**
 * Command: Create Index Note
 *
 * Creates an index/MOC (Map of Content) note for organizing zettels
 */
export const createIndexNoteCommand: CommandFactory = (context) => {
  return {
    id: 'create-index-note',
    name: 'Create Index Note',
    icon: 'list',

    metadata: {
      category: 'note-creation',
      description: 'Create an index/MOC note for organizing zettels',
      canBeDisabled: true,
      enabledByDefault: true,
    },

    execute: async () => {
      if (!context.indexNote || !context.settingsManager || !context.fileService) {
        console.error('Required services not available')
        return
      }

      try {
        const settings = context.settingsManager.getIndex()

        // Load template from file or use inline template
        const templateContent = await context.fileService.loadTemplate(
          settings.templatePath,
          settings.template
        )

        const result = await context.indexNote.createNote({
          folder: settings.folder,
          title: 'New Index',
          content: templateContent.replace('{{title}}', 'New Index'),
        })


        await finishNote(
          context.app,
          result.path,
          settings.detectionMode,
          settings.tag,
          settings.openOnCreate
        )
      } catch (err) {
        console.error('Failed to create index note:', err)
      }
    },
  }
}
