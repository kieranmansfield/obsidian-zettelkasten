import type { CommandFactory } from '../base/command'
import { activeZettel } from '../base/sequenceEdit'
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
    },

    execute: () => {
      const active = activeZettel(context)
      if (!active) return
      new SequenceNavigatorModal(context.app, context.noteSequenceService, active.file).open()
    },
  }
}
