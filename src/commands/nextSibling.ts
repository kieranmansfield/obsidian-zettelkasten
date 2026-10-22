import type { CommandFactory } from '../base/command'
import { activeZettel, openZettel } from '../base/sequenceEdit'

/**
 * Command: Next Sibling
 *
 * Opens the next sibling zettel; for a root, the next root in its folder
 */
export const nextSiblingCommand: CommandFactory = (context) => {
  return {
    id: 'next-sibling',
    name: 'Next Sibling',
    icon: 'arrow-right',

    metadata: {
      category: 'note-sequences',
      description: 'Navigate to next sibling zettel',
    },

    execute: async () => {
      const active = activeZettel(context)
      if (!active) return
      const sequences = context.noteSequenceService
      const next = sequences.adjacent(active.file, 1)
      await openZettel(context, next, 'Navigated to next sibling', 'Already at last sibling')
    },
  }
}
