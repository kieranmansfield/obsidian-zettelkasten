import type { CommandFactory } from '../base/command'
import { finishNote } from '../base/fileHelpers'

/**
 * Command: Create Literature Note
 *
 * Creates a literature note for referencing external sources
 */
export const createLiteratureNoteCommand: CommandFactory = (context) => {
  return {
    id: 'create-literature-note',
    name: 'Create Literature Note',
    icon: 'book-open',

    metadata: {
      category: 'note-creation',
      description: 'Create a literature note for referencing external sources',
      canBeDisabled: true,
      enabledByDefault: true,
    },

    execute: async () => {
      if (!context.literatureNote || !context.settingsManager || !context.fileService) {
        console.error('Required services not available')
        return
      }

      try {
        const settings = context.settingsManager.getLiterature()

        // Load template from file or use inline template
        const templateContent = await context.fileService.loadTemplate(
          settings.templatePath,
          settings.template
        )

        const result = await context.literatureNote.createNote({
          folder: settings.folder,
          title: 'New Source',
          content: templateContent.replace('{{title}}', 'New Source'),
        })

        console.log('Created literature note:', result)

        await finishNote(
          context.app,
          result.path,
          settings.detectionMode,
          settings.tag,
          settings.openOnCreate
        )
      } catch (err) {
        console.error('Failed to create literature note:', err)
      }
    },
  }
}
