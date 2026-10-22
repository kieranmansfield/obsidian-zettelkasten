import type { CommandFactory } from '../base/command'
import { Notice } from 'obsidian'
import { pickZettelInFolder } from '../ui/ZettelSelectorModal'
import ZettelId from '../core/zettelId.class'
import { nextChildId, renameZettelToId } from '../base/sequenceEdit'

/**
 * Command: Assign Parent
 *
 * Opens a modal to select a parent zettel for the active note
 */
export const assignParentCommand: CommandFactory = (context) => {
  return {
    id: 'assign-parent',
    name: 'Assign Parent',
    icon: 'link',

    metadata: {
      category: 'note-sequences',
      description: 'Assign a parent zettel to the active note',
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

      pickZettelInFolder(
        context.app,
        core,
        activeFile,
        'Select parent zettel...',
        async (parentFile, allFiles) => {
          const parentIdString = core.extractZettelId(parentFile.basename)

          if (!parentIdString) {
            new Notice('Selected file is not a valid zettel')
            return
          }

          await renameZettelToId(
            context,
            activeFile,
            nextChildId(core, parentFile, ZettelId.parse(parentIdString), allFiles),
            `Assigned ${parentFile.basename} as parent`,
            'Failed to assign parent'
          )
        }
      )
    },
  }
}
