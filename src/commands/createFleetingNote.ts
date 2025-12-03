import type { CommandFactory } from '../base/command'
import { TFile } from 'obsidian'

/**
 * Command: Create Fleeting Note
 *
 * Creates a temporary/fleeting note for quick capture
 */
export const createFleetingNoteCommand: CommandFactory = (context) => {
  return {
    id: 'create-fleeting-note',
    name: 'Create Fleeting Note',
    icon: 'sticky-note',

    metadata: {
      category: 'note-creation',
      description: 'Create a temporary fleeting note for quick capture',
      canBeDisabled: true,
      enabledByDefault: true,
    },

    execute: async () => {
      if (!context.fleetingNote || !context.settingsManager || !context.fileService) {
        console.error('Required services not available')
        return
      }

      try {
        const settings = context.settingsManager.getFleeting()

        // Load template from file or use inline template
        const templateContent = await context.fileService.loadTemplate(
          settings.templatePath,
          settings.template
        )

        const result = await context.fleetingNote.createNote({
          folder: settings.folder,
          title: 'Quick Note',
          content: templateContent.replace('{{title}}', 'Quick Note'),
        })

        console.log('Created fleeting note:', result)

        // Open the newly created file in the editor if settings.openOnCreate is true
        if (settings.openOnCreate) {
          const file = context.app.vault.getAbstractFileByPath(result.path)
          if (file instanceof TFile) {
            await context.app.workspace.getLeaf().openFile(file)
          }
        }
      } catch (err) {
        console.error('Failed to create fleeting note:', err)
      }
    },
  }
}
