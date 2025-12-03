import type { CommandFactory } from '../base/command'
import { VIEW_TYPE_NOTE_SEQUENCES_BASES } from '../ui/NoteSequencesBasesView'

/**
 * Command: Open Note Sequences Bases View
 *
 * Opens the Note Sequences Bases view showing all root (base) sequences
 */
export const openNoteSequencesBasesViewCommand: CommandFactory = (context) => {
  return {
    id: 'open-note-sequences-bases-view',
    name: 'Open Note Sequences Bases View',
    icon: 'network',

    metadata: {
      category: 'note-sequences',
      description: 'Open view showing all base (root) note sequences',
      canBeDisabled: true,
      enabledByDefault: true,
    },

    execute: async () => {
      const { workspace } = context.app

      // Check if view is already open
      const existing = workspace.getLeavesOfType(VIEW_TYPE_NOTE_SEQUENCES_BASES)
      if (existing.length > 0) {
        // Focus existing view
        workspace.revealLeaf(existing[0])
        return
      }

      // Open new view as a tab in main workspace
      const leaf = workspace.getLeaf('tab')
      if (leaf) {
        await leaf.setViewState({
          type: VIEW_TYPE_NOTE_SEQUENCES_BASES,
          active: true,
        })
        workspace.revealLeaf(leaf)
      }
    },
  }
}
