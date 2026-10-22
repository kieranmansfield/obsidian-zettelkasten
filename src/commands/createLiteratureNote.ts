import type { CommandFactory } from '../base/command'

/**
 * Command: Create Literature Note
 *
 * Creates a literature note for referencing external sources
 */
export const createLiteratureNoteCommand: CommandFactory = (context) => {
  return {
    id: 'create-literature-note',
    name: 'Create Literature Note',
    icon: 'book-open',

    metadata: {
      category: 'note-creation',
      description: 'Create a literature note for referencing external sources',
    },

    execute: () => context.literatureNote.create('New Source'),
  }
}
