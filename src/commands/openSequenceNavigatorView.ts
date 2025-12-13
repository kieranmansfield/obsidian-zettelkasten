import type { CommandFactory } from '../base/command'
import { VIEW_TYPE_SEQUENCE_NAVIGATOR } from '../ui/SequenceNavigatorView'

/**
 * Command: Open Sequence Navigator View
 *
 * Opens the Sequence Navigator sidebar view showing current note's sequence
 */
export const openSequenceNavigatorViewCommand: CommandFactory = (context) => {
  return {
    id: 'open-sequence-navigator-view',
    name: 'Open Sequence Navigator View',
    icon: 'layers',

    metadata: {
      category: 'note-sequences',
      description: "Open sidebar view showing current note's sequence tree",
      canBeDisabled: true,
      enabledByDefault: true,
    },

    execute: () => {
      void (async () => {
        const { workspace } = context.app

        // Check if view is already open
        const existing = workspace.getLeavesOfType(VIEW_TYPE_SEQUENCE_NAVIGATOR)
        if (existing.length > 0) {
          // Focus existing view
          void workspace.revealLeaf(existing[0])
          return
        }

        // Open new view in right sidebar
        const leaf = workspace.getRightLeaf(false)
        if (leaf) {
          await leaf.setViewState({
            type: VIEW_TYPE_SEQUENCE_NAVIGATOR,
            active: true,
          })
          void workspace.revealLeaf(leaf)
        }
      })()
    },
  }
}
