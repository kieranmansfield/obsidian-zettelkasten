import type { CommandFactory } from '../base/command'
import { Notice } from 'obsidian'
import { pickZettelInFolder } from '../ui/ZettelSelectorModal'
import ZettelId from '../core/zettelId.class'
import { nextChildId, renameZettelToId } from '../base/sequenceEdit'

/**
 * Command: Assign Child
 *
 * Opens a modal to select a zettel to become a child of the active note
 */
export const assignChildCommand: CommandFactory = (context) => {
  return {
    id: 'assign-child',
    name: 'Assign Child',
    icon: 'link',

    metadata: {
      category: 'note-sequences',
      description: 'Assign a child zettel to the active note',
      canBeDisabled: true,
      enabledByDefault: true,
    },

    execute: () => {
      const activeFile = context.app.workspace.getActiveFile()
      if (!activeFile) {
        new Notice('No active file')
        return
      }

      if (!context.noteSequenceService || !context.fileService) {
        new Notice('Required services not available')
        return
      }

      const core = context.noteSequenceService.getCore()
      const currentIdString = core.extractZettelId(activeFile.basename)

      if (!currentIdString) {
        new Notice('Current file is not a zettel note')
        return
      }

      const currentId = ZettelId.parse(currentIdString)

      pickZettelInFolder(
        context.app,
        core,
        activeFile,
        'Select child zettel...',
        (childFile, allFiles) =>
          renameZettelToId(
            context,
            childFile,
            nextChildId(core, activeFile, currentId, allFiles),
            `Assigned ${childFile.basename} as child`,
            'Failed to assign child'
          )
      )
    },
  }
}
