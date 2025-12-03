import type { CommandFactory } from '../base/command'
import { CreateZettelFuzzyModal } from '../ui/CreateZettelFuzzyModal'
import { TFile } from 'obsidian'

/**
 * Command: Create New Zettel Note
 *
 * Creates a new atomic zettel with a unique ZettelId
 * Uses fuzzy search to find existing zettels or create new ones
 */
export const createZettelNoteCommand: CommandFactory = (context) => {
  return {
    id: 'create-zettel-note',
    name: 'Create Zettel Note',
    icon: 'file-plus',

    metadata: {
      category: 'note-creation',
      description: 'Create a new atomic zettel with a unique ZettelId',
      canBeDisabled: true,
      enabledByDefault: true,
    },

    execute: async () => {
      if (!context.zettelNote || !context.settingsManager || !context.fileService || !context.boxManager) {
        console.error('Required services not available')
        return
      }

      const settings = context.settingsManager.getZettel()

      // Show fuzzy modal for finding or creating zettels
      new CreateZettelFuzzyModal(
        context.app,
        context.settingsManager,
        context.boxManager,
        async (title: string) => {
          try {
            // Load template from file or use inline template
            const templateContent = await context.fileService!.loadTemplate(
              settings.templatePath,
              settings.template
            )

            const result = await context.zettelNote!.createNew({
              title,
              folder: settings.defaultFolder || undefined,
              content: templateContent.replace('{{title}}', title),
            })

            console.log('Created zettel:', result)

            // Open the newly created file in the editor if settings.openOnCreate is true
            if (settings.openOnCreate) {
              const file = context.app.vault.getAbstractFileByPath(result.path)
              if (file instanceof TFile) {
                await context.app.workspace.getLeaf().openFile(file)
              }
            }
          } catch (err) {
            console.error('Failed to create zettel:', err)
          }
        }
      ).open()
    },
  }
}
