import type { CommandFactory } from '../base/command'
import { activeZettel, openZettel } from '../base/sequenceEdit'

/**
 * Command: Next Sequence
 *
 * Opens the root of the next note sequence, wrapping to the first after the last
 */
export const nextSequenceCommand: CommandFactory = (context) => {
  return {
    id: 'next-sequence',
    name: 'Next Sequence',
    icon: 'skip-forward',

    metadata: {
      category: 'note-sequences',
      description: 'Navigate to next note sequence',
    },

    execute: async () => {
      const active = activeZettel(context)
      if (!active) return
      const sequences = context.noteSequenceService
      const next = sequences.adjacentSequence(active.file, 1)
      await openZettel(
        context,
        next ?? sequences.firstSequence(active.file),
        next ? 'Navigated to next sequence' : 'Navigated to first sequence',
        'Could not find root of current sequence'
      )
    },
  }
}
