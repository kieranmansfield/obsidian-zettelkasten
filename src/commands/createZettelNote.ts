import type { CommandFactory } from '../base/command'
import { CreateNoteWithSuggestModal } from '../ui/CreateNoteWithSuggestModal'
import { Notice, TFile, App } from 'obsidian'
import { parseZettelId } from '../base/zettelIdOrder'

/**
 * Command: Create Zettel
 *
 * Creates a new atomic zettel with a unique ZettelId
 */
export const createZettelNoteCommand: CommandFactory = (context) => {
  return {
    id: 'create-new-note',
    name: 'Create Zettel',
    icon: 'file-plus',

    metadata: {
      category: 'note-creation',
      description: 'Create a new atomic zettel with a unique ZettelId',
    },

    execute: () => {
      const create = (title: string) => {
        context.zettelNote.create(title).then(
          (file) => new Notice(`Created zettel: ${file.basename}`),
          (error: unknown) => {
            new Notice(
              `Error creating zettel: ${error instanceof Error ? error.message : String(error)}`
            )
            console.error('Failed to create zettel:', error)
          }
        )
      }
      const open = (file: TFile) => void context.app.workspace.getLeaf().openFile(file)
      new CreateNoteWithSuggestModal(context.app, zettelFiles(context.app), create, open).open()
    },
  }
}

/** Every note with a zettel ID */
function zettelFiles(app: App): TFile[] {
  return app.vault.getMarkdownFiles().filter((file) => parseZettelId(file.basename))
}
