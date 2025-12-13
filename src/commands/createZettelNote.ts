import type { CommandFactory } from '../base/command'
import { CreateNoteWithSuggestModal } from '../ui/CreateNoteWithSuggestModal'
import { Notice, TFile, App } from 'obsidian'

/**
 * Command: Create Zettel
 *
 * Creates a new atomic zettel with a unique ZettelId
 * Ported from master branch - DO NOT MODIFY FUNCTIONALITY
 */
export const createZettelNoteCommand: CommandFactory = (context) => {
  return {
    id: 'create-new-note',
    name: 'Create Zettel',
    icon: 'file-plus',

    metadata: {
      category: 'note-creation',
      description: 'Create a new atomic zettel with a unique ZettelId',
      canBeDisabled: true,
      enabledByDefault: true,
    },

    execute: () => {
      if (!context.zettelNote || !context.settingsManager || !context.fileService) {
        console.error('Required services not available')
        return
      }

      const settings = context.settingsManager.getZettel()

      // Get existing zettel notes for autocomplete
      const zettels = getZettelFiles(context.app)

      new CreateNoteWithSuggestModal(context.app, zettels, (title: string) => {
        void (async () => {
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

            new Notice(`Created zettel: ${result.filename}`)

            // Open the newly created file in the editor
            if (settings.openOnCreate) {
              const file = context.app.vault.getAbstractFileByPath(result.path)
              if (file instanceof TFile) {
                await context.app.workspace.getLeaf().openFile(file)
              }
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            new Notice(`Error creating zettel: ${errorMessage}`)
            console.error('Failed to create zettel:', error)
          }
        })()
      }).open()
    },
  }
}

/**
 * Get all zettel files
 * Adapted from master's getNoteTitlesByTag to work with folder-based detection
 */
function getZettelFiles(app: App): TFile[] {
  const files = app.vault.getMarkdownFiles()
  const zettels: TFile[] = []

  for (const file of files) {
    // Check if file has a zettel ID (17 digits at start of filename)
    const zettelIdPattern = /^\d{17}/
    if (!zettelIdPattern.test(file.basename)) {
      continue
    }

    zettels.push(file)
  }

  return zettels
}
