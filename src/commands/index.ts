import type { CommandFactory } from '../base/command'
import { createZettelNoteCommand } from './createZettelNote'
import { createFleetingNoteCommand } from './createFleetingNote'
import { createIndexNoteCommand } from './createIndexNote'
import { createLiteratureNoteCommand } from './createLiteratureNote'
import { openZettelCommand } from './openZettel'
import { openIndexCommand } from './openIndex'
import { openNoteSequencesViewCommand } from './openNoteSequencesView'
import { openSequenceNavigatorViewCommand } from './openSequenceNavigatorView'
import { openSequenceNavigatorModalCommand } from './openSequenceNavigatorModal'
import { openSequenceCommandPaletteCommand } from './openSequenceCommandPalette'
import { openZettelkastenSidebarCommand } from './openZettelkastenSidebar'
import { indentZettelCommand } from './indentZettel'
import { outdentZettelCommand } from './outdentZettel'
import { assignParentCommand } from './assignParent'
import { assignChildCommand } from './assignChild'
import { openParentZettelCommand } from './openParentZettel'
import { openChildZettelCommand } from './openChildZettel'
import { nextSiblingCommand } from './nextSibling'
import { nextChildCommand } from './nextChild'
import { nextSequenceCommand } from './nextSequence'
import { addBookmarkCommand, removeBookmarkCommand } from './manageBookmarks'

/** Every command, in registration order */
export const allCommands: CommandFactory[] = [
  createZettelNoteCommand,
  createFleetingNoteCommand,
  createIndexNoteCommand,
  createLiteratureNoteCommand,
  openZettelCommand,
  openIndexCommand,
  openNoteSequencesViewCommand,
  openSequenceNavigatorViewCommand,
  openSequenceNavigatorModalCommand,
  openSequenceCommandPaletteCommand,
  openZettelkastenSidebarCommand,
  indentZettelCommand,
  outdentZettelCommand,
  assignParentCommand,
  assignChildCommand,
  openParentZettelCommand,
  openChildZettelCommand,
  nextSiblingCommand,
  nextChildCommand,
  nextSequenceCommand,
  addBookmarkCommand,
  removeBookmarkCommand,
]
