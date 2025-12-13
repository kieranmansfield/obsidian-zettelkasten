import type { CommandFactory } from '../base/command'
import { SequenceCommandPaletteModal } from '../ui/SequenceCommandPaletteModal'

/**
 * Command: Open Sequence Command Palette
 *
 * Opens a fuzzy search modal with all note sequence commands
 */
export const openSequenceCommandPaletteCommand: CommandFactory = (context) => {
  return {
    id: 'open-sequence-command-palette',
    name: 'Open Sequence Command Palette',
    icon: 'command',

    metadata: {
      category: 'note-sequences',
      description: 'Quick access to all note sequence commands',
      canBeDisabled: true,
      enabledByDefault: true,
    },

    execute: () => {
      const modal = new SequenceCommandPaletteModal(context.app, context)
      modal.open()
    },
  }
}
