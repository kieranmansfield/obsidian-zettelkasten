import type { CommandFactory } from '../base/command'

/**
 * Command: Create Fleeting Note
 *
 * Creates a temporary/fleeting note for quick capture
 */
export const createFleetingNoteCommand: CommandFactory = (context) => {
  return {
    id: 'create-fleeting-note',
    name: 'Create Fleeting Note',
    icon: 'sticky-note',

    metadata: {
      category: 'note-creation',
      description: 'Create a temporary fleeting note for quick capture',
    },

    execute: () => context.fleetingNote.create('Quick Note'),
  }
}
