import type { CommandFactory } from '../base/command'
import { VIEW_TYPE_SEQUENCE_NAVIGATOR } from '../ui/SequenceNavigatorView'

/**
 * Command: Open Sequence Navigator Sidebar
 *
 * Opens the Sequence Navigator sidebar view showing current note's sequence
 */
export const openSequenceNavigatorViewCommand: CommandFactory = (context) => {
  return {
    id: 'open-sequence-navigator-view',
    name: 'Open Sequence Navigator Sidebar',
    icon: 'layers',

    metadata: {
      category: 'note-sequences',
      description: "Open sidebar showing current note's sequence tree",
    },

    execute: async () => {
      await context.app.workspace.ensureSideLeaf(VIEW_TYPE_SEQUENCE_NAVIGATOR, 'right', {
        active: true,
      })
    },
  }
}
