import type { CommandFactory } from '../base/command'
import { activeZettel, openZettel } from '../base/sequenceEdit'

/**
 * Command: Open Parent Zettel / Up a Level
 */
export const openParentZettelCommand: CommandFactory = (context) => {
  return {
    id: 'open-parent-zettel',
    name: 'Open Parent Zettel (Up a Level)',
    icon: 'arrow-up',

    metadata: {
      category: 'note-sequences',
      description: 'Navigate to parent zettel',
    },

    execute: async () => {
      const active = activeZettel(context)
      if (!active) return
      const sequences = context.noteSequenceService
      await openZettel(
        context,
        sequences.parent(active.file),
        'Navigated to parent',
        'No parent zettel found'
      )
    },
  }
}
