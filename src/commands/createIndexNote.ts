import type { CommandFactory } from '../base/command'

/**
 * Command: Create Structure Note
 *
 * Creates a structure note (`type: structure`) in the slip-box.
 * The command ID stays 'create-index-note' for compatibility.
 */
export const createIndexNoteCommand: CommandFactory = (context) => {
  return {
    id: 'create-index-note',
    name: 'Create Structure Note',
    icon: 'list',

    metadata: {
      category: 'note-creation',
      description: 'Create a structure note in the slip-box that orders and annotates zettels',
    },

    execute: () => context.indexNote.create('New Structure Note'),
  }
}
