import type { CommandFactory } from '../base/command'
import { openNoteSequencesView } from '../ui/NoteSequencesView'

/**
 * Command: Open Note Sequences View
 *
 * Opens the Note Sequences view as a tab showing all sequences
 */
export const openNoteSequencesViewCommand: CommandFactory = (context) => {
  return {
    id: 'open-note-sequences-view',
    name: 'Open Note Sequences View',
    icon: 'layers',

    metadata: {
      category: 'note-sequences',
      description: 'Open tab view showing all note sequences',
    },

    execute: () => openNoteSequencesView(context.app.workspace),
  }
}
