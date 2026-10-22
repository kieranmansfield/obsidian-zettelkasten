import type { CommandFactory } from '../base/command'
import { fillTemplate, finishNote } from '../base/fileHelpers'
import { ZettelDetectionMode } from '../base/settings'
import { STRUCTURE_MARKER } from '../settings/DefaultSettings'

/**
 * Command: Create Structure Note
 *
 * Creates a structure note (`type: structure`) in the slip-box.
 * The command ID stays 'create-index-note' for compatibility.
 */
export const createIndexNoteCommand: CommandFactory = (context) => {
  return {
    id: 'create-index-note',
    name: 'Create Structure Note',
    icon: 'list',

    metadata: {
      category: 'note-creation',
      description: 'Create a structure note in the slip-box that orders and annotates zettels',
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
          folder: context.settingsManager.getZettel().defaultFolder,
          title: 'New Structure Note',
          content: fillTemplate(templateContent, 'New Structure Note'),
        })

        // A custom template may lack the marker: stamp `type: structure` so the note is detected
        await finishNote(
          context.app,
          result.path,
          ZettelDetectionMode.PROPERTY,
          STRUCTURE_MARKER,
          settings.openOnCreate
        )
      } catch (err) {
        console.error('Failed to create structure note:', err)
      }
    },
  }
}
