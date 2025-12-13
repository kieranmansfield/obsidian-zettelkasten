import type { CommandFactory } from '../base/command'
import { VIEW_TYPE_NOTE_SEQUENCES } from '../ui/NoteSequencesView'

/**
 * Command: Open Note Sequences View
 *
 * Opens the Note Sequences view as a tab showing all sequences
 */
export const openNoteSequencesViewCommand: CommandFactory = (context) => {
  return {
    id: 'open-note-sequences-view',
    name: 'Open Note Sequences View',
    icon: 'layers',

    metadata: {
      category: 'note-sequences',
      description: 'Open tab view showing all note sequences',
      canBeDisabled: true,
      enabledByDefault: true,
    },

    execute: () => {
      void (async () => {
        const { workspace } = context.app

        // Check if view is already open
        const existing = workspace.getLeavesOfType(VIEW_TYPE_NOTE_SEQUENCES)
        if (existing.length > 0) {
          // Focus existing view
          void workspace.revealLeaf(existing[0])
          return
        }

        // Open new view as a tab in main workspace
        const leaf = workspace.getLeaf('tab')
        if (leaf) {
          await leaf.setViewState({
            type: VIEW_TYPE_NOTE_SEQUENCES,
            active: true,
          })
          void workspace.revealLeaf(leaf)
        }
      })()
    },
  }
}
