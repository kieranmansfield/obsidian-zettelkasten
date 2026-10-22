import type { CommandFactory } from '../base/command'
import { activeZettel, openZettel } from '../base/sequenceEdit'

/**
 * Command: Next Child
 *
 * Opens the next child of the active zettel's parent (next sibling, but never across roots)
 */
export const nextChildCommand: CommandFactory = (context) => {
  return {
    id: 'next-child',
    name: 'Next Child',
    icon: 'chevron-right',

    metadata: {
      category: 'note-sequences',
      description: 'Navigate to next child in parent (same as next sibling)',
    },

    execute: async () => {
      const active = activeZettel(context)
      if (!active) return
      const sequences = context.noteSequenceService
      const next = sequences.parent(active.file) && sequences.adjacent(active.file, 1)
      await openZettel(context, next, 'Navigated to next child', 'Already at last child')
    },
  }
}
