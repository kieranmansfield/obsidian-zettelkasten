import type { CommandFactory } from '../base/command'
import { SequenceNavigatorModal } from '../ui/SequenceNavigatorModal'

/**
 * Command: Quick Note Sequence Navigator
 *
 * Opens a modal with keyboard shortcuts for quick navigation through note sequences
 */
export const openSequenceNavigatorModalCommand: CommandFactory = (context) => {
  return {
    id: 'open-sequence-navigator-modal',
    name: 'Quick Note Sequence Navigator',
    icon: 'compass',

    metadata: {
      category: 'note-sequences',
      description: 'Open modal with arrow key shortcuts for sequence navigation',
      canBeDisabled: true,
      enabledByDefault: true,
    },

    execute: () => {
      const activeFile = context.app.workspace.getActiveFile()

      if (!activeFile) {
        return
      }

      if (!context.noteSequenceService) {
        return
      }

      // Check if this file is a zettel
      const isZettel = context.noteSequenceService.getCore().isZettelNote(activeFile)
      if (!isZettel) {
        return
      }

      // Open the modal
      new SequenceNavigatorModal(context.app, context.noteSequenceService, activeFile).open()
    },
  }
}
