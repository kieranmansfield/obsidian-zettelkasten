import type { CommandFactory } from '../base/command'
import { SequenceCommandPaletteModal } from '../ui/SequenceCommandPaletteModal'
import { openParentZettelCommand } from './openParentZettel'
import { openChildZettelCommand } from './openChildZettel'
import { nextSiblingCommand } from './nextSibling'
import { nextChildCommand } from './nextChild'
import { nextSequenceCommand } from './nextSequence'
import { indentZettelCommand } from './indentZettel'
import { outdentZettelCommand } from './outdentZettel'
import { assignParentCommand } from './assignParent'
import { assignChildCommand } from './assignChild'
import { openNoteSequencesViewCommand } from './openNoteSequencesView'
import { openSequenceNavigatorViewCommand } from './openSequenceNavigatorView'

/** Navigation, then editing, then view commands */
const paletteCommands: CommandFactory[] = [
  openParentZettelCommand,
  openChildZettelCommand,
  nextSiblingCommand,
  nextChildCommand,
  nextSequenceCommand,
  indentZettelCommand,
  outdentZettelCommand,
  assignParentCommand,
  assignChildCommand,
  openNoteSequencesViewCommand,
  openSequenceNavigatorViewCommand,
]

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
    },

    execute: () => {
      const commands = paletteCommands.map((factory) => factory(context))
      new SequenceCommandPaletteModal(context.app, commands).open()
    },
  }
}
